"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

export const generateAIInsights = async (industry) => {
    const prompt = `
        Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
        {
            "salaryRanges": [
                { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
        }
        
        IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
        Include at least 5 common roles for salary ranges.
        Growth rate should be a percentage.
        Include at least 5 skills and trends.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        // Extract JSON - using more robust parsing
        let jsonData;
        try {
            // First attempt: Try to parse directly after removing markdown formatting
            const cleanResponse = textResponse.replace(/```(?:json)?|\s*\n/g, '').trim();
            jsonData = JSON.parse(cleanResponse);
        } catch (e) {
            console.log("First parsing attempt failed, trying JSON extraction...");
            
            try {
                // Second attempt: Try to extract JSON using regex
                const jsonRegex = /{[\s\S]*}/;
                const match = textResponse.match(jsonRegex);
                
                if (match) {
                    jsonData = JSON.parse(match[0]);
                } else {
                    throw new Error("Could not find a valid JSON object in the response");
                }
            } catch (innerError) {
                console.error("All JSON parsing attempts failed:", innerError);
                console.log("Raw response:", textResponse);
                throw new Error(`Could not parse the AI response as valid JSON. ${innerError.message}`);
            }
        }

        // Map market outlook to enum
        const marketOutlookEnum = {
            "Positive": "POSITIVE",
            "Neutral": "NEUTRAL",
            "Negative": "NEGATIVE"
        };

        // Map demand level to enum
        const demandLevelEnum = {
            "High": "High",
            "Medium": "MEDIUM",
            "Low": "LOW"
        };

        return {
            salaryRanges: jsonData.salaryRanges || [],
            growthRate: jsonData.growthRate || 5.0,
            demandLevel: demandLevelEnum[jsonData.demandLevel] || "MEDIUM",
            topSkills: jsonData.topSkills || [],
            marketOutlook: marketOutlookEnum[jsonData.marketOutlook] || "NEUTRAL",
            keyTrends: jsonData.keyTrends || [],
            recommendedSkills: jsonData.recommendedSkills || []
        };
    } catch (error) {
        console.error("Error generating AI insights:", error);
        
        // Return fallback data if AI generation fails
        return {
            salaryRanges: [
                { role: "Entry Level", min: 60000, max: 80000, median: 70000, location: "US" },
                { role: "Mid Level", min: 80000, max: 120000, median: 100000, location: "US" },
                { role: "Senior Level", min: 120000, max: 180000, median: 150000, location: "US" }
            ],
            growthRate: 10.0,
            demandLevel: "MEDIUM",
            topSkills: ["Communication", "Problem Solving", "Teamwork", "Adaptability", "Technical Skills"],
            marketOutlook: "NEUTRAL",
            keyTrends: ["Digital Transformation", "Remote Work", "Data-Driven Decisions", "Automation", "Sustainability"],
            recommendedSkills: ["Data Analytics", "Project Management", "Digital Literacy", "Communication", "Critical Thinking"]
        };
    }
};


//industry insight api
export async function getIndustryInsights(){
    //check user authorized or not
        const {userId} = await auth();
        if(!userId) throw new Error("Unauthorized");
    
        //exists in databse or not
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
            include: {
                industryInsight: true,
            }
        });
        if(!user) throw new Error("User not found");

        // Check if user has selected an industry
        if(!user.industry) {
            throw new Error("Please select an industry in your profile settings");
        }

        //if user industry insight not exist then generate using AI
        if(!user.industryInsight){
            const insights = await generateAIInsights(user.industry);
            const industryInsight = await db.industryInsight.create({
                data: {
                    industry: user.industry, // Ensure industry field is set
                    ...insights,
                    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                }
            });

            return industryInsight;
        }

        return user.industryInsight;
}
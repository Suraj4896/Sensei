"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Modified generateQuiz with topic and question count parameters
export async function generateQuiz(numQuestions = 5, topics = []) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
        select: { industry: true, skills: true }
    });
    if (!user) throw new Error("User not found");

    const prompt = `
        Generate ${numQuestions} technical interview questions focused on: 
        ${topics.join(", ") || user.industry + (user.skills?.length ? ` and ${user.skills.join(", ")}` : "")}.
        
        Requirements:
        - Multiple choice with 4 options each
        - Include difficulty level (Easy/Medium/Hard)
        - Add topic/category for each question
        - Format response as:
        {
            "questions": [{
                "question": "string",
                "options": ["string", "string", "string", "string"],
                "correctAnswer": "string",
                "explanation": "string",
                "topic": "string",
                "difficulty": "string"
            }]
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
        const quiz = JSON.parse(cleanedText);

        if (!quiz.questions || quiz.questions.length !== numQuestions) {
            throw new Error("Invalid question format or count");
        }

        return quiz.questions;
    } catch (error) {
        console.error("Quiz generation failed:", error);
        throw new Error("Failed to generate questions. Please try again.");
    }
}

// Updated saveQuizResult with new fields
export async function saveQuizResult(questions, answers, score, questionCount, topics) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    });
    if (!user) throw new Error("User not found");

    // Validation
    if (!questionCount || !Array.isArray(topics)) {
        throw new Error("Invalid quiz configuration");
    }
    const finalTopics = topics.length > 0 ? topics : ["General"];

    const questionResults = questions.map((q, index) => ({
        question: q.question,
        answer: q.correctAnswer,
        userAnswer: answers[index],
        isCorrect: q.correctAnswer === answers[index],
        explanation: q.explanation,
        topic: q.topic || "General",
        difficulty: q.difficulty || "Medium"
    }));

    // Improved improvement tip generation
    let improvementTip = "Great job! Keep practicing to maintain your skills.";
    try {
        const wrongAnswers = questionResults.filter(q => !q.isCorrect);
        if (wrongAnswers.length > 0) {
            const weakTopics = [...new Set(wrongAnswers.map(q => q.topic))];
            const improvementPrompt = `
                Based on mistakes in these topics: ${weakTopics.join(", ")}.
                Provide 1-2 concise, actionable learning recommendations.
                Format as a single paragraph without markdown.
                Focus on specific practice areas and resources.
                Example: "Practice implementing binary search tree operations and review time complexity analysis."
            `;
            
            const tipResult = await model.generateContent(improvementPrompt);
            const rawTip = tipResult.response.text().trim();
            
            // Clean up the tip for UI display
            improvementTip = rawTip
                .replace(/["\*]/g, '') // Remove quotes and asterisks
                .replace(/\n/g, ' ') // Remove newlines
                .substring(0, 280); // Truncate to tweet-like length
            
            // Fallback if empty after cleaning
            if (!improvementTip) throw new Error();
        }
    } catch (error) {
        console.error("Improvement tip generation failed:", error);
        improvementTip = "Focus on practicing the highlighted areas and review fundamental concepts.";
    }

    try {
        return await db.assessment.create({
            data: {
                userId: user.id,
                quizScore: score,
                questions: questionResults,
                questionCount: Number(questionCount),
                topics: { set: finalTopics },
                difficulty: questionResults[0]?.difficulty || "Medium",
                improvementTip
            }
        });
    } catch (error) {
        console.error("Database save error:", error);
        throw new Error(`Failed to save assessment: ${error.message}`);
    }
}

// Enhanced getAssessments with sorting
// actions/interview.js
export async function getAssessments() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  
    try {
      return await db.assessment.findMany({
        where: { user: { clerkUserId: userId } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          quizScore: true,
          questionCount: true,
          topics: true,
          difficulty: true,
          improvementTip: true,
          questions: true // Add this line
        }
      });
    } catch (error) {
      console.error("Assessment fetch error:", error);
      throw new Error("Failed to load history. Please refresh the page.");
    }
  }
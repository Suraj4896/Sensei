"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, KeyRound, ExternalLink, Bug } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClipLoader } from 'react-spinners';

const ResumeReview = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const fileInputRef = useRef(null);

  // Function to handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFileName(selectedFile.name);
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  // Function to handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFileName(droppedFile.name);
      setFile(droppedFile);
      setResult(null);
      setError(null);
    }
  };

  // Function to prevent default behavior on drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Function to handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Function to toggle section expansion
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  // Function to analyze the resume with Gemini AI
  const analyzeResume = async () => {
    if (!file) return;
    
    // Check if API key is available
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      setError("Missing Gemini API key. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Read the file as text
      const text = await readFileAsText(file);
      
      // Initialize Gemini AI (client-side only)
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Prepare the prompt for resume analysis
      const prompt = `
        Analyze this resume and provide a comprehensive ATS score and feedback in ONLY the following JSON format without any additional notes or explanations:
        {
          "atsScore": number (0-100),
          "overallFeedback": "string",
          "keywordMatch": {
            "score": number (0-100),
            "feedback": "string",
            "missingKeywords": ["string", "string"]
          },
          "formatAndStructure": {
            "score": number (0-100),
            "feedback": "string"
          },
          "contentQuality": {
            "score": number (0-100),
            "feedback": "string"
          },
          "actionableImprovements": ["string", "string", "string", "string", "string"]
        }
        
        Consider the following when analyzing:
        1. ATS compatibility (proper formatting, standard sections, no complex tables/graphics)
        2. Keyword optimization for job matching
        3. Clarity and conciseness of content
        4. Quantifiable achievements vs. generic descriptions
        5. Professional language and consistency
        
        IMPORTANT: Return ONLY valid JSON. No additional text, notes, or markdown formatting.
        
        Resume content:
        ${text}
      `;
      
      // Generate content with Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      
      // Extract JSON - more robust parsing
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
      
      // Validate the extracted JSON has required properties
      if (!jsonData.atsScore || !jsonData.overallFeedback) {
        throw new Error("The parsed JSON is missing required fields");
      }
      
      setResult(jsonData);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      if (error.message && error.message.includes('API key not valid')) {
        setError("Invalid Gemini API key. Please check your NEXT_PUBLIC_GEMINI_API_KEY in .env.local file.");
      } else {
        setError(`Error analyzing resume: ${error.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get progress color based on score
  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get icon based on score
  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  // Check if API key exists but hide most of it
  const getApiKeyStatus = () => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) return "Not set";
    if (key.length < 8) return "Set but too short (invalid)";
    
    // Only show first 4 and last 4 characters
    const firstFour = key.substring(0, 4);
    const lastFour = key.substring(key.length - 4);
    return `${firstFour}...${lastFour} (${key.length} chars)`;
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Resume ATS Review</h1>
        <p className="text-muted-foreground">
          Upload your resume to analyze its ATS compatibility and get personalized improvement tips.
        </p>
      </div>

      {/* Debug Section */}
      {showDebug && (
        <Card className="border-blue-500 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-1">
                <span className="font-semibold">API Key Status:</span>
                <span>{getApiKeyStatus()}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="font-semibold">Next Public Vars:</span>
                <span className="break-all">{Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ')}</span>
              </div>
              <p className="mt-2 text-muted-foreground">
                If you don't see NEXT_PUBLIC_GEMINI_API_KEY above, it's not being loaded correctly. Make sure:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your .env.local file is in the root directory (same level as package.json)</li>
                <li>You've restarted the development server after adding the API key</li>
                <li>The variable is spelled correctly as NEXT_PUBLIC_GEMINI_API_KEY</li>
                <li>There are no quotes around the API key value</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Key Setup Instructions if there's an error */}
      {error && (
        <Card className="border-yellow-500 bg-yellow-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-yellow-500" />
              API Key Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">{error}</p>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Get a Gemini API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="h-3 w-3" /></a></li>
              <li>Create or edit the <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file in the project root</li>
              <li>Add this line: <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here</code></li>
              <li>Restart your development server</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* File upload card */}
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>
            Upload your resume in PDF, DOCX, or TXT format to analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors ${
              file ? 'border-primary/50 bg-primary/5' : ''
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleUploadClick}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                {file ? (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">{fileName}</span>
                  </div>
                ) : (
                  <>
                    <p className="font-medium">
                      Drag and drop your resume or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports PDF, DOCX, and TXT formats
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={analyzeResume}
              disabled={!file || loading}
              className="gap-2"
            >
              {loading ? <ClipLoader size={16} color="#ffffff" /> : null}
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Overall Score Card */}
          <Card className="bg-background">
            <CardHeader className="pb-3">
              <CardTitle>ATS Compatibility Score</CardTitle>
              <CardDescription>
                How well your resume performs against Applicant Tracking Systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-6">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">Overall Score</div>
                  <div className={`font-bold text-2xl ${getScoreColor(result.atsScore)}`}>
                    {result.atsScore}/100
                  </div>
                </div>
                <Progress 
                  value={result.atsScore} 
                  className={getProgressColor(result.atsScore)} 
                />
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p>{result.overallFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Keyword Match */}
            <Card className="bg-background">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getScoreIcon(result.keywordMatch.score)}
                    Keyword Match
                  </CardTitle>
                  <Badge variant={result.keywordMatch.score >= 80 ? "default" : "outline"} className={getScoreColor(result.keywordMatch.score)}>
                    {result.keywordMatch.score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between" 
                  onClick={() => toggleSection('keywords')}
                >
                  <span>View Details</span>
                  {expandedSection === 'keywords' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {expandedSection === 'keywords' && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm">{result.keywordMatch.feedback}</p>
                    {result.keywordMatch.missingKeywords?.length > 0 && (
                      <div>
                        <div className="font-semibold text-sm mb-2">Consider Adding These Keywords:</div>
                        <div className="flex flex-wrap gap-1">
                          {result.keywordMatch.missingKeywords.map((keyword, i) => (
                            <Badge key={i} variant="outline">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Format And Structure */}
            <Card className="bg-background">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getScoreIcon(result.formatAndStructure.score)}
                    Format & Structure
                  </CardTitle>
                  <Badge variant={result.formatAndStructure.score >= 80 ? "default" : "outline"} className={getScoreColor(result.formatAndStructure.score)}>
                    {result.formatAndStructure.score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between"
                  onClick={() => toggleSection('format')}
                >
                  <span>View Details</span>
                  {expandedSection === 'format' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {expandedSection === 'format' && (
                  <div className="mt-4">
                    <p className="text-sm">{result.formatAndStructure.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Quality */}
            <Card className="bg-background">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getScoreIcon(result.contentQuality.score)}
                    Content Quality
                  </CardTitle>
                  <Badge variant={result.contentQuality.score >= 80 ? "default" : "outline"} className={getScoreColor(result.contentQuality.score)}>
                    {result.contentQuality.score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between"
                  onClick={() => toggleSection('content')}
                >
                  <span>View Details</span>
                  {expandedSection === 'content' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {expandedSection === 'content' && (
                  <div className="mt-4">
                    <p className="text-sm">{result.contentQuality.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Improvements Section */}
          <Card className="bg-background">
            <CardHeader>
              <CardTitle>Recommended Improvements</CardTitle>
              <CardDescription>
                Actionable steps to improve your resume's ATS compatibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {result.actionableImprovements.map((improvement, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResumeReview; 
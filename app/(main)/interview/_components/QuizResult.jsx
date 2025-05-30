import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Trophy, XCircle, Bookmark, BarChart } from 'lucide-react';
import React from 'react'

// components/QuizResult.jsx
const QuizResult = ({ result, hideStartNew, onStartNew }) => {
    if (!result) return null;
  
    // Safe data access
    const safeQuestions = result.questions || [];
    const safeScore = result.quizScore || 0;
    const safeTopics = result.topics || ['General'];
  
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="flex items-center text-3xl gradient-title gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Quiz Results
          </h1>
          <div className="text-sm text-muted-foreground">
            {new Date(result.createdAt).toLocaleDateString()}
          </div>
        </div>
  
        {/* Score Overview */}
        <Card className="bg-background">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{safeScore.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Overall Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{result.questionCount}</p>
                <p className="text-sm text-muted-foreground">Total Questions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold capitalize">{result.difficulty || 'medium'}</p>
                <p className="text-sm text-muted-foreground">Difficulty</p>
              </div>
            </div>
            <Progress value={safeScore} className="mt-4 h-2" />
          </CardContent>
        </Card>
  
        {/* Question Review */}
        <Card className="bg-background">
          <CardContent className="pt-6 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Detailed Breakdown
            </h2>
            
            {safeQuestions.map((q, index) => (
              <div key={index} className="space-y-4 border-b pb-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{q.question || "Question not available"}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-muted px-2 py-1 rounded-full">
                        {q.topic || 'General'}
                      </span>
                    </div>
                  </div>
                  {q.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-1" />
                  )}
                </div>
  
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#222222] p-3 rounded-lg">
                      <p className="font-medium">Your Answer</p>
                      <p className="text-muted-foreground">{q.userAnswer || 'Not answered'}</p>
                    </div>
                    <div className=" bg-[#222222] p-3 rounded-lg">
                      <p className="font-medium">Correct Answer</p>
                      <p className="text-muted-foreground">{q.answer || 'No answer recorded'}</p>
                    </div>
                  </div>
  
                  {q.explanation && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="font-medium">Explanation</p>
                      <p className="text-muted-foreground mt-1">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
  
        {/* Action Button */}
        {!hideStartNew && (
          <CardFooter className="bg-background">
            <Button
              className="w-full bg-gradient-to-r from-primary to-[#39bd93] hover:opacity-90"
              onClick={onStartNew}
            >
              Start New Quiz
            </Button>
          </CardFooter>
        )}
      </div>
    );
  };

  export default QuizResult;
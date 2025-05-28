// StatsCards.jsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, Target, Trophy } from "lucide-react";

const StatsCards = ({ assessments }) => {
  // Safe average score calculation
  const getAverageScore = () => {
    if (!assessments?.length) return 0;
    const total = assessments.reduce(
      (sum, assessment) => sum + (assessment.quizScore || 0),
      0
    );
    return (total / assessments.length).toFixed(1);
  };

  // Safe total questions calculation
  const getTotalQuestions = () => {
    if (!assessments?.length) return 0;
    return assessments.reduce((sum, assessment) => {
      return sum + (assessment.questions?.length || 0);
    }, 0);
  };

  // Latest assessment with fallback
  const getLatestAssessment = () => {
    if (!assessments?.length) return null;
    return assessments[0];
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getAverageScore()}%</div>
          <CardDescription>Across all assessments</CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Questions Practiced
          </CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getTotalQuestions()}</div>
          <CardDescription>Total questions attempted</CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {getLatestAssessment()?.quizScore?.toFixed(1) || 0}%
          </div>
          <CardDescription>Most recent attempt</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import QuizResult from "./QuizResult";

const QuizList = ({ assessments }) => {
  //for navigate
  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  return (
    <>
      <Card className="bg-background">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="gradient-title text-3xl md:text-4xl">
              Recent Quizes
            </CardTitle>
            <CardDescription>Review your past quiz performance</CardDescription>
          </div>
          {/* start new mock test */}
          <Button onClick={() => router.push("/interview/mock")}>
            
            Start New Quiz
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessments.map((assessment, i) => {
              return (
                <Card
                  key={assessment.id}
                  className="cursor-pointer bg-[#171616] hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedQuiz(assessment)}
                >
                  <CardHeader>
                    <CardTitle>Quiz {i + 1}</CardTitle>
                    <CardDescription className="flex justify-between w-full">
                      <div>Score: {assessment.quizScore.toFixed(1)}%</div>
                      <div>
                        {format(
                          new Date(assessment.createdAt),
                          "MMMM dd, yyyy HH:mm"
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {assessment.improvementTip}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* dialog */}

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)} >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <QuizResult
            result={selectedQuiz}
            onStartNew={() => router.push("/interview/mock")}
            hideStartNew
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuizList;

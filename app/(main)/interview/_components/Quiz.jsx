// Quiz.jsx
"use client";

import { generateQuiz, saveQuizResult } from "@/actions/interview";
import useFetch from "@/hooks/user-fetch";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarLoader } from "react-spinners";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

import QuizResult from "./QuizResult";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const router = useRouter();
  // Available topics
  const topics = [
    "Data Structures",
    "Algorithms",
    "System Design",
    "Behavioral",
    "Frontend Development",
    "Backend Development",
  ];

  // Custom hooks
  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch(generateQuiz);

  const {
  loading: savingResult,
  fn: saveQuizResultFn,
  data: resultData,
  setData: setResultData
} = useFetch(saveQuizResult);


  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
    }
  }, [quizData]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if(currentQuestion < quizData.length - 1){
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if(answer === quizData[index].correctAnswer){
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

// In your Quiz component
const finishQuiz = async () => {
  const score = calculateScore();
  try {
    await saveQuizResultFn(
      quizData,       // Array of questions
      answers,        // User's answers
      score,          // Calculated percentage
      quizData.length,// Question count from generated quiz
      selectedTopics  // Array of topics used for this quiz
    );
    toast.success("Quiz completed successfully!");
    router.push("/interview");
  } catch (error) {
    toast.error(error.message);
  }
};

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowExplanation(false);
    setResultData(null);
  };

  const handleTopicChange = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleGenerateQuiz = () => {
    if(selectedTopics.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }
    generateQuizFn(numberOfQuestions, selectedTopics);
  };

  if (generatingQuiz) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <BarLoader width={"100%"} color="#39bd93" />
        <p className="mt-4 text-center text-muted-foreground">
          Generating {numberOfQuestions} questions on {selectedTopics.join(", ")}
        </p>
      </div>
    );
  }

  if(resultData){
    return <QuizResult result={resultData} onStartNew={startNewQuiz} />;
  }

  if (!quizData) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-gradient-to-b from-background to-muted/50">
        <CardHeader>
          <CardTitle className="gradient-title text-3xl">
            Customize Your Quiz
          </CardTitle>
          <CardDescription>
            Select topics and number of questions to begin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="block text-lg font-medium">Number of Questions</Label>
            <select
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
              className="w-full p-2 rounded-lg border bg-background"
            >
              {[5, 10, 15, 20].map((num) => (
                <option key={num} value={num}>{num} Questions</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <Label className="block text-lg font-medium">Select Topics</Label>
            <div className="grid grid-cols-2 gap-4">
              {topics.map((topic) => (
                <div
                  key={topic}
                  className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  onClick={() => handleTopicChange(topic)}
                >
                  <Checkbox
                    checked={selectedTopics.includes(topic)}
                    onCheckedChange={() => handleTopicChange(topic)}
                  />
                  <Label className="text-sm font-medium">{topic}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-gradient-to-r from-primary to-[#39bd93] hover:opacity-90 transition-opacity"
            onClick={handleGenerateQuiz}
            disabled={selectedTopics.length === 0}
          >
            Start Custom Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = quizData[currentQuestion];

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-b from-background to-muted/50">
      <CardHeader>
        <CardTitle className="gradient-title text-2xl">
          Question {currentQuestion + 1} of {quizData.length}
          <span className="block text-sm font-normal text-muted-foreground mt-1">
            Topic: {question.topic}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg font-medium bg-muted p-4 rounded-lg">
          {question.question}
        </p>
        
        <RadioGroup
          className="space-y-2"
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
        >
          {question.options.map((option, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {showExplanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg border border-primary/20">
            <p className="font-medium text-primary">Explanation:</p>
            <p className="text-muted-foreground mt-2">{question.explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-4">
        {!showExplanation ? (
          <Button
            variant="outline"
            onClick={() => setShowExplanation(true)}
            disabled={!answers[currentQuestion]}
          >
            Show Explanation
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowExplanation(false)}
          >
            Hide Explanation
          </Button>
        )}
        
        <Button
          className="ml-auto bg-gradient-to-r from-primary to-[#39bd93] hover:opacity-90 transition-opacity"
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
        >
          {savingResult && <Loader2 className="mr-2 h-4 w-4 animate-spin text-foreground" />}
          {currentQuestion < quizData.length - 1 ? "Next Question" : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Quiz;
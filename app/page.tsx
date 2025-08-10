"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react'

interface Answer {
  value: number
  title: string
  correct: number
}

interface Question {
  id: number
  rank: number
  question: string
  img_url?: string | null
  img_width?: number | null
  img_height?: number | null
  favorite: boolean
  multiple: boolean
  correct: boolean
  explanation: string
  answers: Answer[]
}

const sampleQuestions: Question[] = [
  {
    id: 274,
    rank: 1,
    question: "Average items in the Product Backlog are usually…",
    img_url: null,
    img_width: null,
    img_height: null,
    favorite: false,
    multiple: false,
    correct: false,
    explanation: "Items of different sizes are added to the Product Backlog. Larger items are typically broken down into smaller, more manageable pieces during Sprint Planning, making Product Backlog items generally larger than Sprint Backlog items.",
    answers: [
      {
        value: 788,
        title: "The same size as the items in the Sprint Backlog",
        correct: 0
      },
      {
        value: 787,
        title: "Smaller than items in the Sprint Backlog",
        correct: 0
      },
      {
        value: 786,
        title: "Larger than items in the Sprint Backlog",
        correct: 1
      }
    ]
  },
  {
    id: 275,
    rank: 2,
    question: "What is the main purpose of a Sprint Review?",
    img_url: null,
    img_width: null,
    img_height: null,
    favorite: false,
    multiple: false,
    correct: false,
    explanation: "The Sprint Review is held at the end of the Sprint to inspect the Increment and adapt the Product Backlog if needed. It's an opportunity to demonstrate what was accomplished and gather feedback from stakeholders.",
    answers: [
      {
        value: 789,
        title: "To plan the next Sprint",
        correct: 0
      },
      {
        value: 790,
        title: "To inspect the Increment and adapt the Product Backlog",
        correct: 1
      },
      {
        value: 791,
        title: "To review team performance",
        correct: 0
      }
    ]
  },
  {
    id: 276,
    rank: 3,
    question: "Who is responsible for managing the Product Backlog?",
    img_url: null,
    img_width: null,
    img_height: null,
    favorite: false,
    multiple: false,
    correct: false,
    explanation: "The Product Owner is solely responsible for managing the Product Backlog. This includes ordering items, ensuring clarity of items, and ensuring the Development Team understands items to the level needed.",
    answers: [
      {
        value: 792,
        title: "Scrum Master",
        correct: 0
      },
      {
        value: 793,
        title: "Product Owner",
        correct: 1
      },
      {
        value: 794,
        title: "Development Team",
        correct: 0
      }
    ]
  }
]

export default function QuizApp() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [userAnswers, setUserAnswers] = useState<number[]>([])

  const currentQuestion = sampleQuestions[currentQuestionIndex]
  const totalQuestions = sampleQuestions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  const handleAnswerSelect = (answerValue: number) => {
    if (showFeedback) return
    
    setSelectedAnswer(answerValue)
    setShowFeedback(true)
    
    const correctAnswer = currentQuestion.answers.find(answer => answer.correct === 1)
    const isCorrect = answerValue === correctAnswer?.value
    
    if (isCorrect) {
      setScore(score + 1)
    }
    
    setUserAnswers([...userAnswers, answerValue])
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setScore(0)
    setQuizCompleted(false)
    setUserAnswers([])
  }

  const getAnswerStyle = (answer: Answer) => {
    if (!showFeedback) {
      return selectedAnswer === answer.value 
        ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
        : "border-gray-200 hover:border-gray-300"
    }
    
    const isCorrect = answer.correct === 1
    const isSelected = selectedAnswer === answer.value
    
    if (isCorrect) {
      return "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
    } else if (isSelected) {
      return "border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
    }
    
    return "border-gray-200 opacity-60"
  }

  const getAnswerIcon = (answer: Answer) => {
    if (!showFeedback) return null
    
    const isCorrect = answer.correct === 1
    const isSelected = selectedAnswer === answer.value
    
    if (isCorrect) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    } else if (isSelected) {
      return <XCircle className="w-5 h-5 text-red-600" />
    }
    
    return null
  }

  if (quizCompleted) {
    const percentage = Math.round((score / totalQuestions) * 100)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-3xl font-bold">Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">
                {percentage}%
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                You scored {score} out of {totalQuestions} questions correctly
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="text-lg font-semibold">Performance</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            
            <Button onClick={restartQuiz} size="lg" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Take Quiz Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Scrum Quiz
            </h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
            {currentQuestion.img_url && (
              <img 
                src={currentQuestion.img_url || "/placeholder.svg"} 
                alt="Question illustration"
                className="rounded-lg max-w-full h-auto"
                width={currentQuestion.img_width || undefined}
                height={currentQuestion.img_height || undefined}
              />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => (
                <button
                  key={answer.value}
                  onClick={() => handleAnswerSelect(answer.value)}
                  disabled={showFeedback}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 flex items-center justify-between ${getAnswerStyle(answer)} ${
                    showFeedback ? 'cursor-default' : 'cursor-pointer hover:shadow-md'
                  }`}
                >
                  <span className="font-medium">{answer.title}</span>
                  {getAnswerIcon(answer)}
                </button>
              ))}
            </div>

            {showFeedback && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center mb-2">
                  {selectedAnswer === currentQuestion.answers.find(a => a.correct === 1)?.value ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <span className="font-semibold">
                    {selectedAnswer === currentQuestion.answers.find(a => a.correct === 1)?.value 
                      ? "Correct!" 
                      : "Incorrect"
                    }
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {showFeedback && (
              <div className="flex justify-end mt-6">
                <Button onClick={handleNextQuestion} size="lg">
                  {currentQuestionIndex < totalQuestions - 1 ? "Next Question" : "View Results"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-gray-600 dark:text-gray-400">
          Current Score: {score}/{currentQuestionIndex + (showFeedback ? 1 : 0)}
        </div>
      </div>
    </div>
  )
}

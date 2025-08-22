"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, RotateCcw, Trophy, Loader2, Clock, Play, Hash } from "lucide-react"

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

const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .slider::-moz-range-thumb {
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .slider::-webkit-slider-track {
    height: 12px;
    border-radius: 6px;
  }

  .slider::-moz-range-track {
    height: 12px;
    border-radius: 6px;
    background: #e5e7eb;
  }

  .question-slider::-webkit-slider-thumb {
    appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #10b981;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .question-slider::-moz-range-thumb {
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #10b981;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`

export default function QuizApp() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [selectedTimeMinutes, setSelectedTimeMinutes] = useState<number>(10)
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(10)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [timeExpired, setTimeExpired] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const removeDuplicateQuestions = (questions: Question[]): Question[] => {
    const seen = new Set<string>()
    return questions.filter((q) => {
      const normalized = q.question.trim().toLowerCase()
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
  }

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const selectRandomQuestions = (questions: Question[], count: number): Question[] => {
    const shuffled = shuffleArray([...questions])
    return shuffled.slice(0, Math.min(count, questions.length))
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimeColor = (seconds: number, totalSeconds: number): string => {
    const percentage = (seconds / totalSeconds) * 100
    if (percentage > 50) return "text-green-600"
    if (percentage > 25) return "text-yellow-600"
    return "text-red-600"
  }

  const getTimeConstraints = (questionCount: number) => {
    const minTime = Math.ceil((questionCount * 0.5) / 5) * 5
    const maxTime = Math.ceil((questionCount * 3) / 5) * 5
    const suggestedTime = Math.ceil((questionCount * 1) / 5) * 5

    return {
      min: Math.max(5, minTime), 
      max: Math.min(180, maxTime),
      suggested: Math.max(5, Math.min(180, suggestedTime)),
    }
  }

  useEffect(() => {
    if (quizStarted && !quizCompleted && !showFeedback && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimeExpired(true)
            setQuizCompleted(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [quizStarted, quizCompleted, showFeedback, timeRemaining])

  useEffect(() => {
    if (allQuestions.length > 0) {
      const { suggested, min, max } = getTimeConstraints(selectedQuestionCount)

      if (selectedTimeMinutes < min) {
        setSelectedTimeMinutes(min)
      } else if (selectedTimeMinutes > max) {
        setSelectedTimeMinutes(max)
      } else if (selectedTimeMinutes === 10 && suggested !== 10) {
        setSelectedTimeMinutes(suggested)
      }
    }
  }, [selectedQuestionCount, allQuestions.length])

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch("/data/questions.json")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const responseText = await response.text()

        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          throw new Error(`Invalid JSON format: ${parseError.message}`)
        }

        if (!Array.isArray(data)) {
          throw new Error("Questions data must be an array")
        }

        if (data.length === 0) {
          throw new Error("No questions found in the file")
        }

        const cleanedData = removeDuplicateQuestions(data)
        setAllQuestions(cleanedData)

        const initialCount = Math.min(10, cleanedData.length)
        setSelectedQuestionCount(initialCount)

        setLoading(false)
      } catch (err) {
        setError(`Failed to load quiz questions: ${err.message || "Unknown error"}`)
        setLoading(false)
      }
    }

    loadQuestions()
  }, [])

  const startQuiz = () => {
    const selectedQuestions = selectRandomQuestions(allQuestions, selectedQuestionCount)
    setQuestions(selectedQuestions)
    setQuizStarted(true)
    setTimeRemaining(selectedTimeMinutes * 60)
  }

  useEffect(() => {
    const styleSheet = document.createElement("style")
    styleSheet.innerText = sliderStyles
    document.head.appendChild(styleSheet)

    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-lg font-medium">Loading Quiz...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    const handleRetry = () => {
      setError(null)
      setLoading(true)
      window.location.reload()
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <XCircle className="w-8 h-8 text-red-600 mb-4" />
            <p className="text-lg font-medium text-red-600 text-center mb-4">{error}</p>
            <div className="space-y-2 w-full">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const sampleQuestions = [
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
                      explanation:
                        "Items of different sizes are added to the Product Backlog. Larger items are typically broken down into smaller, more manageable pieces during Sprint Planning, making Product Backlog items generally larger than Sprint Backlog items.",
                      answers: [
                        {
                          value: 788,
                          title: "The same size as the items in the Sprint Backlog",
                          correct: 0,
                        },
                        {
                          value: 787,
                          title: "Smaller than items in the Sprint Backlog",
                          correct: 0,
                        },
                        {
                          value: 786,
                          title: "Larger than items in the Sprint Backlog",
                          correct: 1,
                        },
                      ],
                    },
                  ]
                  setAllQuestions(sampleQuestions)
                  setSelectedQuestionCount(1)
                  setError(null)
                  setLoading(false)
                }}
                className="w-full"
              >
                Use Sample Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!quizStarted) {
    const minQuestions = 1
    const maxQuestions = Math.min(50, allQuestions.length)
    const timeConstraints = getTimeConstraints(selectedQuestionCount)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-3xl font-bold">Quiz Setup</CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Customize your quiz experience</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                Available Questions: <span className="text-blue-600 dark:text-blue-400">{allQuestions.length}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select how many questions you want to answer</p>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Hash className="w-6 h-6 text-green-600" />
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">{selectedQuestionCount}</div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Questions to Answer</p>
              </div>

              <div className="space-y-4">
                <label className="text-lg font-medium block text-center">Number of Questions:</label>

                <div className="px-4">
                  <div className="relative">
                    <input
                      type="range"
                      min={minQuestions}
                      max={maxQuestions}
                      step="1"
                      value={selectedQuestionCount}
                      onChange={(e) => setSelectedQuestionCount(Number.parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer question-slider"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${((selectedQuestionCount - minQuestions) / (maxQuestions - minQuestions)) * 100}%, #e5e7eb ${((selectedQuestionCount - minQuestions) / (maxQuestions - minQuestions)) * 100}%, #e5e7eb 100%)`,
                      }}
                    />

                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>{minQuestions}</span>
                      <span>{Math.floor(maxQuestions * 0.25)}</span>
                      <span>{Math.floor(maxQuestions * 0.5)}</span>
                      <span>{Math.floor(maxQuestions * 0.75)}</span>
                      <span>{maxQuestions}</span>
                    </div>

                    <div className="flex justify-center space-x-2 mt-4">
                      {[5, 10, 15, 20, 30]
                        .filter((count) => count <= maxQuestions)
                        .map((count) => (
                          <button
                            key={count}
                            onClick={() => setSelectedQuestionCount(count)}
                            className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                              selectedQuestionCount === count
                                ? "bg-green-500 text-white border-green-500"
                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-green-300"
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {selectedTimeMinutes} minute{selectedTimeMinutes !== 1 ? "s" : ""}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quiz Duration
                  {selectedTimeMinutes !== timeConstraints.suggested && (
                    <span className="block text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      Suggested: {timeConstraints.suggested} minutes
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Range: {timeConstraints.min}-{timeConstraints.max} minutes
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-lg font-medium block text-center">Quiz Duration:</label>

                <div className="px-4">
                  <div className="relative">
                    <input
                      type="range"
                      min={timeConstraints.min}
                      max={timeConstraints.max}
                      step="5"
                      value={selectedTimeMinutes}
                      onChange={(e) => setSelectedTimeMinutes(Number.parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((selectedTimeMinutes - timeConstraints.min) / (timeConstraints.max - timeConstraints.min)) * 100}%, #e5e7eb ${((selectedTimeMinutes - timeConstraints.min) / (timeConstraints.max - timeConstraints.min)) * 100}%, #e5e7eb 100%)`,
                      }}
                    />

                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>{timeConstraints.min}m</span>
                      <span>{Math.floor((timeConstraints.min + timeConstraints.max) * 0.25)}m</span>
                      <span>{Math.floor((timeConstraints.min + timeConstraints.max) * 0.5)}m</span>
                      <span>{Math.floor((timeConstraints.min + timeConstraints.max) * 0.75)}m</span>
                      <span>{timeConstraints.max}m</span>
                    </div>

                    <div className="flex justify-center space-x-2 mt-4">
                      {[
                        timeConstraints.suggested,
                        Math.ceil((selectedQuestionCount * 0.75) / 5) * 5,
                        Math.ceil((selectedQuestionCount * 1.5) / 5) * 5,
                        Math.ceil((selectedQuestionCount * 2) / 5) * 5,
                      ]
                        .filter((time, index, arr) => arr.indexOf(time) === index)
                        .filter((time) => time >= timeConstraints.min && time <= timeConstraints.max)
                        .sort((a, b) => a - b)
                        .map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTimeMinutes(time)}
                            className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                              selectedTimeMinutes === time
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-blue-300"
                            } ${time === timeConstraints.suggested ? "ring-2 ring-yellow-300 dark:ring-yellow-600" : ""}`}
                          >
                            {time}m {time === timeConstraints.suggested ? "⭐" : ""}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Time per Question</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round((selectedTimeMinutes * 60) / selectedQuestionCount)}s
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Difficulty Level</div>
                  <div
                    className={`text-2xl font-bold ${
                      (selectedTimeMinutes * 60) / selectedQuestionCount >= 60
                        ? "text-green-600"
                        : (selectedTimeMinutes * 60) / selectedQuestionCount >= 45
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {(selectedTimeMinutes * 60) / selectedQuestionCount >= 60
                      ? "Easy"
                      : (selectedTimeMinutes * 60) / selectedQuestionCount >= 45
                        ? "Medium"
                        : "Hard"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {(selectedTimeMinutes * 60) / selectedQuestionCount >= 60
                      ? "1+ min per question"
                      : (selectedTimeMinutes * 60) / selectedQuestionCount >= 45
                        ? "45-59s per question"
                        : "Under 45s per question"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Questions Pool</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {selectedQuestionCount}/{allQuestions.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Random selection</div>
                </div>
              </div>
            </div>

            <Button onClick={startQuiz} size="lg" className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Start Quiz ({selectedQuestionCount} questions, {selectedTimeMinutes} minute
              {selectedTimeMinutes !== 1 ? "s" : ""})
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100
  const totalTimeSeconds = selectedTimeMinutes * 60

  const handleAnswerSelect = (answerValue: number) => {
    if (showFeedback) return

    if (currentQuestion.multiple) {
      setSelectedAnswers((prev) => {
        if (prev.includes(answerValue)) {
          return prev.filter((id) => id !== answerValue)
        } else {
          return [...prev, answerValue]
        }
      })
    } else {
      setSelectedAnswers([answerValue])
      setShowFeedback(true)

      const correctAnswer = currentQuestion.answers.find((answer) => answer.correct === 1)
      const isCorrect = answerValue === correctAnswer?.value

      if (isCorrect) {
        setScore(score + 1)
      }

      setUserAnswers([...userAnswers, answerValue])
    }
  }

  const handleSubmitMultiSelect = () => {
    setShowFeedback(true)

    const correctAnswers = currentQuestion.answers
      .filter((answer) => answer.correct === 1)
      .map((answer) => answer.value)

    const isCorrect =
      correctAnswers.length === selectedAnswers.length &&
      correctAnswers.every((answer) => selectedAnswers.includes(answer))

    if (isCorrect) {
      setScore(score + 1)
    }

    setUserAnswers([...userAnswers, ...selectedAnswers])
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswers([])
      setShowFeedback(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const restartQuiz = () => {
    setQuizStarted(false)
    setCurrentQuestionIndex(0)
    setSelectedAnswers([])
    setShowFeedback(false)
    setScore(0)
    setQuizCompleted(false)
    setUserAnswers([])
    setTimeExpired(false)
    setTimeRemaining(0)
    setQuestions([])
  }

  const getAnswerStyle = (answer: Answer) => {
    const isSelected = selectedAnswers.includes(answer.value)

    if (!showFeedback) {
      return isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-200 hover:border-gray-300"
    }

    const isCorrect = answer.correct === 1

    if (isCorrect && isSelected) {
      return "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
    } else if (isCorrect && !isSelected) {
      return "border-green-500 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 opacity-70"
    } else if (!isCorrect && isSelected) {
      return "border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
    }

    return "border-gray-200 opacity-60"
  }

  const getAnswerIcon = (answer: Answer) => {
    if (!showFeedback) {
      return selectedAnswers.includes(answer.value) ? (
        <div className="w-5 h-5 bg-blue-500 rounded border-2 border-blue-500 flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      ) : (
        <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
      )
    }

    const isCorrect = answer.correct === 1
    const isSelected = selectedAnswers.includes(answer.value)

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
            <CardTitle className="text-3xl font-bold">{timeExpired ? "Time's Up!" : "Quiz Completed!"}</CardTitle>
            {timeExpired && <p className="text-red-600 dark:text-red-400 mt-2">The quiz ended because time ran out</p>}
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">{percentage}%</div>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                You scored {score} out of {totalQuestions} questions correctly
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Questions answered: {currentQuestionIndex + (showFeedback ? 1 : 0)} of {totalQuestions}
                {timeExpired && ` (Selected from ${allQuestions.length} available)`}
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

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-semibold">Time Used</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {formatTime(totalTimeSeconds - timeRemaining)} / {formatTime(totalTimeSeconds)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-semibold">Avg. per Question</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {Math.round(
                    (totalTimeSeconds - timeRemaining) / Math.max(currentQuestionIndex + (showFeedback ? 1 : 0), 1),
                  )}
                  s
                </div>
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Scrum Quiz</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
              <div
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg bg-white dark:bg-gray-800 border ${
                  timeRemaining <= 60 ? "border-red-200 dark:border-red-800" : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <Clock className={`w-4 h-4 ${getTimeColor(timeRemaining, totalTimeSeconds)}`} />
                <span className={`font-mono font-bold ${getTimeColor(timeRemaining, totalTimeSeconds)}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
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
              {currentQuestion.multiple && !showFeedback && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select all correct answers:</p>
              )}
              {currentQuestion.answers.map((answer) => (
                <button
                  key={answer.value}
                  onClick={() => handleAnswerSelect(answer.value)}
                  disabled={showFeedback}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 flex items-center justify-between ${getAnswerStyle(answer)} ${
                    showFeedback ? "cursor-default" : "cursor-pointer hover:shadow-md"
                  }`}
                >
                  <span className="font-medium">{answer.title}</span>
                  {getAnswerIcon(answer)}
                </button>
              ))}
            </div>

            {currentQuestion.multiple && !showFeedback && selectedAnswers.length > 0 && (
              <div className="flex justify-center mt-4">
                <Button onClick={handleSubmitMultiSelect} size="lg">
                  Submit Answer{selectedAnswers.length > 1 ? "s" : ""}
                </Button>
              </div>
            )}

            {showFeedback && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center mb-2">
                  {(() => {
                    if (currentQuestion.multiple) {
                      const correctAnswers = currentQuestion.answers
                        .filter((answer) => answer.correct === 1)
                        .map((answer) => answer.value)
                      const isCorrect =
                        correctAnswers.length === selectedAnswers.length &&
                        correctAnswers.every((answer) => selectedAnswers.includes(answer))

                      return (
                        <>
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mr-2" />
                          )}
                          <span className="font-semibold">
                            {isCorrect ? "Correct!" : "Incorrect"}
                            {!isCorrect && (
                              <span className="text-sm font-normal ml-2">
                                ({selectedAnswers.length}/{correctAnswers.length} correct selections)
                              </span>
                            )}
                          </span>
                        </>
                      )
                    } else {
                      const isCorrect =
                        selectedAnswers[0] === currentQuestion.answers.find((a) => a.correct === 1)?.value
                      return (
                        <>
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mr-2" />
                          )}
                          <span className="font-semibold">{isCorrect ? "Correct!" : "Incorrect"}</span>
                        </>
                      )
                    }
                  })()}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{currentQuestion.explanation}</p>
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

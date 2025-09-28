import React, { useState, useEffect, useCallback } from 'react';
import type { TriviaQuestion, AnswerKey, Difficulty } from './types';
import { generateTriviaQuestion } from './services/geminiService';
import QuizCard from './components/QuizCard';
import Scoreboard from './components/Scoreboard';
import LoadingSpinner from './components/LoadingSpinner';
import DifficultySelector from './components/DifficultySelector';
import CategorySelector from './components/CategorySelector';

const TIME_LIMIT = 15; // seconds

const App: React.FC = () => {
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerKey | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [category, setCategory] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(TIME_LIMIT);

  const fetchNewQuestion = useCallback(async () => {
    if (!difficulty || !category) return;

    setIsLoading(true);
    setError(null);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setQuestion(null);
    try {
      const newQuestion = await generateTriviaQuestion(difficulty, category);
      setQuestion(newQuestion);
      setTimeLeft(TIME_LIMIT);
    } catch (err) {
      setError('Failed to generate a new question. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, category]);

  useEffect(() => {
    if (difficulty && category) {
      fetchNewQuestion();
    }
  }, [difficulty, category, fetchNewQuestion]);

  useEffect(() => {
    if (!question || isAnswered || isLoading) {
      return;
    }

    if (timeLeft <= 0) {
      setIsAnswered(true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, isAnswered, question, isLoading]);


  const handleAnswerSelect = (answer: AnswerKey) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (answer === question?.correctAnswer) {
      setScore(prevScore => prevScore + 1);
    }
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setDifficulty(null);
    setScore(0);
  };
  
  const handleDifficultySelect = (selectedDifficulty: Difficulty) => {
    setScore(0);
    setDifficulty(selectedDifficulty);
  };

  const resetCategory = () => {
    setCategory(null);
    setDifficulty(null);
    setQuestion(null);
    setScore(0);
  }

  const resetDifficulty = () => {
    setDifficulty(null);
    setQuestion(null);
    setScore(0);
  }


  const renderContent = () => {
    if (!category) {
      return <CategorySelector onSelectCategory={handleCategorySelect} />;
    }

    if (!difficulty) {
      return <DifficultySelector onSelectDifficulty={handleDifficultySelect} />;
    }
    
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return (
        <div className="text-center text-red-300 bg-red-900/50 p-4 rounded-lg">
          <p className="font-semibold">An Error Occurred</p>
          <p>{error}</p>
        </div>
      );
    }

    if (question) {
      return (
        <QuizCard
          key={question.question}
          question={question}
          onAnswerSelect={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          isAnswered={isAnswered}
          timeLeft={timeLeft}
          timeLimit={TIME_LIMIT}
        />
      );
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">AI Trivia Quiz</h1>
          <p className="text-indigo-200 mt-2 text-lg">Powered by Gemini AI</p>
        </header>

        <main className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 relative min-h-[450px] flex flex-col justify-between">
          {difficulty && <Scoreboard score={score} />}
          
          <div className="flex-grow flex flex-col justify-center">
            {renderContent()}
          </div>
          
          {difficulty && (
            <div className="mt-6 text-center">
              <button
                onClick={fetchNewQuestion}
                disabled={isLoading}
                className="w-full md:w-auto px-8 py-3 bg-white text-indigo-600 font-bold rounded-full shadow-lg hover:bg-indigo-100 transform transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isLoading ? 'Generating...' : isAnswered ? 'Next Question' : 'Skip Question'}
              </button>
            </div>
          )}
        </main>
        <footer className="text-center mt-8 text-indigo-200/80 text-sm">
          {category && (
            <p className="space-x-4">
              <button onClick={resetCategory} className="underline hover:text-white transition-colors">
                Change Category
              </button>
              {difficulty && (
                <button onClick={resetDifficulty} className="underline hover:text-white transition-colors">
                  Change Difficulty
                </button>
              )}
            </p>
          )}
          <p className="mt-2">&copy; {new Date().getFullYear()} AI Trivia Quiz. Endless fun, endless knowledge.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
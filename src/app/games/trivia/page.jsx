'use client';

import { useState, useEffect } from 'react';
import GameHeader from '@/components/GameHeader';
import Modal from '@/components/Modal';
import HowToPlay from '@/components/HowToPlay';
import Statistics from '@/components/Statistics';
import Confetti from '@/components/Confetti';
import Toast from '@/components/Toast';
import {
  getDailyTrivia,
  generateRandomTrivia,
  checkAnswer,
  calculateScore,
  getCategoryColor,
  getPerformanceMessage,
  formatTime,
  saveStats,
  loadStats,
  getDefaultStats
} from './triviaLogic';

export default function TriviaGame() {
  // Game state
  const [triviaSet, setTriviaSet] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // Timer
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
  // Modals
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  // Mode
  const [mode, setMode] = useState('daily');
  
  // Stats
  const [stats, setStats] = useState(getDefaultStats());

  const loadGame = () => {
    const newSet = mode === 'daily' ? getDailyTrivia() : generateRandomTrivia();
    setTriviaSet(newSet);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setCorrectCount(0);
    setGameComplete(false);
    setTimeElapsed(0);
    setTimerActive(true);
    setCurrentStreak(0);
  };

  // Initialize game
  useEffect(() => {
    loadGame();
    const savedStats = loadStats();
    if (savedStats) {
      setStats(savedStats);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerActive && !gameComplete) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameComplete]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const handleAnswerSelect = (answer) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answer);
    const currentQuestion = triviaSet.questions[currentQuestionIndex];
    const isCorrect = checkAnswer(answer, currentQuestion.answer);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);
      showToast('✓ Correct!', 'success');
    } else {
      setCurrentStreak(0);
      showToast(`✗ Wrong! Answer: ${currentQuestion.answer}`, 'error');
    }
    
    setAnswers([...answers, {
      question: currentQuestion.question,
      userAnswer: answer,
      correctAnswer: currentQuestion.answer,
      isCorrect
    }]);
    
    // Auto-advance after 1.5 seconds
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleNext = () => {
    if (currentQuestionIndex < triviaSet.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      handleGameComplete();
    }
  };

  const handleGameComplete = () => {
    setGameComplete(true);
    setTimerActive(false);
    
    const score = calculateScore(correctCount, triviaSet.questions.length);
    const percentage = (correctCount / triviaSet.questions.length) * 100;
    
    // Update stats
    const newStats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      totalCorrect: stats.totalCorrect + correctCount,
      totalQuestions: stats.totalQuestions + triviaSet.questions.length,
      bestScore: Math.max(stats.bestScore, score),
      currentStreak: percentage >= 70 ? stats.currentStreak + 1 : 0,
      maxStreak: Math.max(stats.maxStreak, percentage >= 70 ? stats.currentStreak + 1 : 0)
    };
    
    setStats(newStats);
    saveStats(newStats);
    
    if (percentage >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    
    showToast(getPerformanceMessage(correctCount, triviaSet.questions.length), 'success');
  };

  const handleRestart = () => {
    loadGame();
  };

  if (!triviaSet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-text-muted">Loading trivia...</div>
      </div>
    );
  }

  const currentQuestion = triviaSet.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / triviaSet.questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col animate-fade-in-up">
      <GameHeader
        title="Trivia"
        onHowToPlay={() => setShowHowToPlay(true)}
        onStats={() => setShowStats(true)}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-32">
        <div className="max-w-2xl w-full space-y-6">
          
          {!gameComplete ? (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Question {currentQuestionIndex + 1} of {triviaSet.questions.length}</span>
                  <span>⏱️ {formatTime(timeElapsed)}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-3 border border-card-border overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-wordle-correct to-connections-green transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Category Badge */}
              <div className="text-center">
                <span
                  className="inline-block px-4 py-1 rounded-full text-white text-sm font-semibold"
                  style={{ backgroundColor: getCategoryColor(currentQuestion.category) }}
                >
                  {currentQuestion.category}
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-card border-2 border-card-border rounded-2xl p-8 min-h-[200px] flex items-center justify-center">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Streak Indicator */}
              {currentStreak > 0 && (
                <div className="text-center">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-connections-yellow/20 text-connections-yellow border border-connections-yellow rounded-lg font-semibold">
                    🔥 {currentStreak} Streak!
                  </span>
                </div>
              )}

              {/* Answer Options */}
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.answer;
                  const showResult = selectedAnswer !== null;
                  
                  let bgColor = 'bg-card border-card-border';
                  let textColor = 'text-foreground';
                  
                  if (showResult) {
                    if (isCorrect) {
                      bgColor = 'bg-wordle-correct border-wordle-correct';
                      textColor = 'text-white';
                    } else if (isSelected && !isCorrect) {
                      bgColor = 'bg-wordle-absent border-wordle-absent';
                      textColor = 'text-white';
                    }
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={selectedAnswer !== null}
                      className={`
                        ${bgColor} ${textColor}
                        border-2 rounded-xl p-4 text-left font-semibold
                        transition-all duration-200
                        ${selectedAnswer === null ? 'hover:border-border-active hover:scale-[1.02] active:scale-[0.98]' : ''}
                        ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-surface flex items-center justify-center font-bold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {showResult && isCorrect && <span className="text-2xl">✓</span>}
                        {showResult && isSelected && !isCorrect && <span className="text-2xl">✗</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Score Display */}
              <div className="text-center">
                <div className="inline-flex items-center gap-6 px-6 py-3 bg-surface rounded-lg border border-card-border">
                  <div>
                    <div className="text-sm text-text-muted">Correct</div>
                    <div className="text-2xl font-bold text-wordle-correct">{correctCount}</div>
                  </div>
                  <div className="w-px h-10 bg-card-border" />
                  <div>
                    <div className="text-sm text-text-muted">Wrong</div>
                    <div className="text-2xl font-bold text-wordle-absent">
                      {currentQuestionIndex + 1 - correctCount - (selectedAnswer === null ? 1 : 0)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Results Screen */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-foreground mb-2">
                  Quiz Complete!
                </h2>
                <p className="text-xl text-text-muted">
                  {getPerformanceMessage(correctCount, triviaSet.questions.length)}
                </p>
              </div>

              {/* Score Card */}
              <div className="bg-card border-2 border-card-border rounded-2xl p-8 space-y-4">
                <div className="text-center">
                  <div className="text-6xl font-bold text-wordle-correct mb-2">
                    {correctCount}/{triviaSet.questions.length}
                  </div>
                  <div className="text-xl text-text-muted">
                    {Math.round((correctCount / triviaSet.questions.length) * 100)}% Correct
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-card-border">
                  <div className="text-center">
                    <div className="text-sm text-text-muted">Time</div>
                    <div className="text-xl font-bold text-foreground">
                      {formatTime(timeElapsed)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-text-muted">Score</div>
                    <div className="text-xl font-bold text-foreground">
                      {calculateScore(correctCount, triviaSet.questions.length)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-wordle-correct text-white py-4 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all"
                >
                  {mode === 'daily' ? 'Play Again' : 'New Quiz'}
                </button>
                <button
                  onClick={() => setShowStats(true)}
                  className="flex-1 bg-surface border-2 border-card-border text-foreground py-4 rounded-xl font-bold text-lg hover:border-border-active transition-all"
                >
                  View Stats
                </button>
              </div>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex gap-2 justify-center pt-4">
            <button
              onClick={() => setMode('daily')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                mode === 'daily'
                  ? 'bg-wordle-correct text-white'
                  : 'bg-surface text-text-muted border border-card-border'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setMode('practice')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                mode === 'practice'
                  ? 'bg-wordle-correct text-white'
                  : 'bg-surface text-text-muted border border-card-border'
              }`}
            >
              Practice
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showHowToPlay && (
        <Modal onClose={() => setShowHowToPlay(false)}>
          <HowToPlay
            title="How to Play Trivia"
            rules={[
              'Answer 10 questions across various categories',
              'Select the correct answer from the options',
              'Questions are timed - the faster, the better!',
              'Build a streak by answering correctly',
              'Get 70%+ to maintain your daily streak',
            ]}
            examples={[
              {
                title: 'Categories',
                content: 'Science • History • Geography • Math\nLiterature • Sports • Nature • Art'
              }
            ]}
          />
        </Modal>
      )}

      {showStats && (
        <Modal onClose={() => setShowStats(false)}>
          <Statistics
            title="Trivia Statistics"
            stats={[
              { label: 'Games Played', value: stats.gamesPlayed },
              { label: 'Win Rate', value: `${Math.round((stats.totalCorrect / Math.max(stats.totalQuestions, 1)) * 100)}%` },
              { label: 'Best Score', value: stats.bestScore },
              { label: 'Current Streak', value: stats.currentStreak },
              { label: 'Max Streak', value: stats.maxStreak },
            ]}
          />
        </Modal>
      )}

      {showConfetti && <Confetti />}
      
      <Toast
        message={toast.message}
        show={toast.show}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}

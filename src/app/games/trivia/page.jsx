'use client';

import { useState, useEffect, useRef } from 'react';
import GameHeader from '@/components/GameHeader';
// NOTE: Learning Log removed - Trivia is not a word-based game
import StatisticsModal from '@/components/StatisticsModal';
import ShareResults from '@/components/ShareResults';
import BadgeToastQueue from '@/components/BadgeToastQueue';
import BadgeDetailsSheet from '@/components/BadgeDetailsSheet';
import BadgeEarnedRecap from '@/components/BadgeEarnedRecap';
import BadgesProgressWidget from '@/components/BadgesProgressWidget';
import BadgesDrawer from '@/components/BadgesDrawer';
import DailyReminder from '@/components/DailyReminder';
import WinConfettiOverlay from '@/components/WinConfettiOverlay';
import Toast from '@/components/Toast';
import TutorialPanel from '@/components/tutorial/TutorialPanel';
import { GAME_TUTORIALS } from '@/data/tutorials';
import { useTutorial } from '@/hooks/useTutorial';
import { useGameContext } from '@/hooks/useGameContext';
import { recordGameResult, getGameStats, getTodayString } from '@/utils/profileManager';
import { submitResult } from '@/utils/resultsClient';
import {
  getDailyTrivia,
  generateRandomTrivia,
  checkAnswer,
  calculateScore,
  getCategoryColor,
  getPerformanceMessage,
  formatTime
} from './triviaLogic';

export default function TriviaGame() {
  const { returnUrl, returnLabel, isGroupGame, groupName } = useGameContext();

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
  const [showStats, setShowStats] = useState(false);
  // Learning Log state removed - not applicable for trivia
  
  // Toast
  const [toast, setToast] = useState(null);
  
  // Mode
  const [mode, setMode] = useState('daily');
  
  // Stats
  const [stats, setStats] = useState(null);
  const [badgeUnlocks, setBadgeUnlocks] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgesDrawer, setShowBadgesDrawer] = useState(false);
  const advanceTimeoutRef = useRef(null);

  const tutorial = GAME_TUTORIALS.trivia;
  const {
    isOpen: isTutorialOpen,
    openManual: openHowToPlay,
    close: closeTutorial,
    skip: skipTutorial,
    complete: completeTutorial,
    updateStep: updateTutorialStep,
    startMode,
    lastStep,
  } = useTutorial(tutorial.id);

  // Toast handler
  const handleToastExit = () => {
    setToast(null);
  };

  const loadGame = () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    const newSet = mode === 'daily' ? getDailyTrivia() : generateRandomTrivia();
    setTriviaSet(newSet);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setCorrectCount(0);
    setGameComplete(false);
    setTimeElapsed(0);
    setTimerActive(false);
    setCurrentStreak(0);
  };

  // Initialize game
  useEffect(() => {
    loadGame();
    const gameStats = getGameStats('trivia');
    setStats(gameStats);
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

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!triviaSet || gameComplete) return;
    if (isTutorialOpen) {
      if (timerActive) setTimerActive(false);
      return;
    }
    if (!timerActive) setTimerActive(true);
  }, [isTutorialOpen, triviaSet, gameComplete, timerActive]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
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
    
    const answerEntry = {
      question: currentQuestion.question,
      userAnswer: answer,
      correctAnswer: currentQuestion.answer,
      isCorrect
    };
    const nextAnswers = [...answers, answerEntry];
    const nextCorrectCount = correctCount + (isCorrect ? 1 : 0);

    setAnswers(nextAnswers);
    
    // Auto-advance after 1.5 seconds
    advanceTimeoutRef.current = setTimeout(() => {
      handleNext(nextAnswers, nextCorrectCount);
    }, 1500);
  };

  const handleNext = (nextAnswers = answers, nextCorrectCount = correctCount) => {
    if (currentQuestionIndex < triviaSet.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      handleGameComplete(nextAnswers, nextCorrectCount);
    }
  };

  const handleGameComplete = (finalAnswers = answers, finalCorrectCount = correctCount) => {
    setGameComplete(true);
    setTimerActive(false);

    const score = calculateScore(finalCorrectCount, triviaSet.questions.length, timeElapsed);
    const percentage = (finalCorrectCount / triviaSet.questions.length) * 100;
    
    // Update stats using profileManager
    const result = {
      date: getTodayString(),
      win: percentage >= 70,
      score,
      time: timeElapsed,
      puzzleId: mode === 'daily' ? `trivia-${getTodayString()}` : `practice-${Date.now()}`,
      totalQuestions: triviaSet.questions.length,
    };
    
    const achievements = recordGameResult('trivia', result);
    const updatedStats = getGameStats('trivia');
    setStats(updatedStats);
    setAnswers(finalAnswers);
    setCorrectCount(finalCorrectCount);

    submitResult({
      gameKey: 'trivia',
      mode,
      success: percentage >= 70,
      attempts: triviaSet.questions.length,
      durationMs: timeElapsed * 1000,
      metadata: {
        correct: finalCorrectCount,
        total: triviaSet.questions.length,
        puzzleDate: triviaSet.date,
      },
    }).catch(err => console.warn('[Trivia] Failed to submit to leaderboard:', err));
    
    setBadgeUnlocks(achievements || []);
    
    if (percentage >= 80) {
      setShowConfetti(true);
    }
    
    showToast(getPerformanceMessage(finalCorrectCount, triviaSet.questions.length), 'success');
  };

  const handleRestart = () => {
    loadGame();
  };

  if (!triviaSet) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-2xl text-text-muted">Loading trivia...</div>
      </div>
    );
  }

  const currentQuestion = triviaSet.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / triviaSet.questions.length) * 100;

  return (
  <div className="h-screen flex flex-col overflow-hidden animate-fade-in-up">
      <GameHeader
        title="Trivia"
        onHowToPlay={openHowToPlay}
        onStats={() => setShowStats(true)}
        onBadges={() => setShowBadgesDrawer(true)}
        // Learning Log removed - Trivia is not a word-based game
        gameComplete={gameComplete}
        returnUrl={returnUrl}
        returnLabel={returnLabel}
      />

      <BadgeToastQueue
        unlocks={badgeUnlocks}
        onView={(badge) => setSelectedBadge(badge)}
      />

    <div className="relative flex-1 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col items-center justify-center p-4 min-h-full">
        <WinConfettiOverlay
          active={showConfetti}
          gameName="trivia"
          onDone={() => setShowConfetti(false)}
        />
        <div className="max-w-2xl w-full space-y-6">
          
          {!gameComplete ? (
            <>
              {/* Progress Bar */}
              <div className="space-y-2" data-tutorial="trivia-timer">
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
                  className="inline-block px-4 py-1 rounded-full text-[hsl(var(--button-text))] text-sm font-semibold"
                  style={{ backgroundColor: getCategoryColor(currentQuestion.category) }}
                >
                  {currentQuestion.category}
                </span>
              </div>

              {/* Question Card */}
              <div
                className="bg-card border-2 border-card-border rounded-2xl p-8 min-h-[200px] flex items-center justify-center"
                data-tutorial="trivia-question"
              >
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
              <div className="grid grid-cols-1 gap-3" data-tutorial="trivia-options">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.answer;
                  const showResult = selectedAnswer !== null;
                  
                  let bgColor = 'bg-card border-card-border';
                  let textColor = 'text-foreground';
                  
                  if (showResult) {
                    if (isCorrect) {
                      bgColor = 'bg-wordle-correct border-wordle-correct';
                      textColor = 'text-[hsl(var(--button-text))]';
                    } else if (isSelected && !isCorrect) {
                      bgColor = 'bg-wordle-absent border-wordle-absent';
                      textColor = 'text-[hsl(var(--button-text))]';
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
              <div className="text-center" data-tutorial="trivia-score">
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
                      {calculateScore(correctCount, triviaSet.questions.length, timeElapsed)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Results */}
              <ShareResults
                gameName="trivia"
                result={{
                  score: calculateScore(correctCount, triviaSet.questions.length, timeElapsed),
                  win: (correctCount / triviaSet.questions.length) * 100 >= 70
                }}
                puzzleNumber={mode === 'daily' ? `#${getTodayString()}` : ''}
              />

              {/* Daily Reminder */}
              {mode === 'daily' && <DailyReminder gameName="trivia" />}

              <BadgeEarnedRecap badges={badgeUnlocks} />
              <div className="mt-3">
                <BadgesProgressWidget variant="compact" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-[hsl(var(--button-primary))] text-[hsl(var(--button-text))] py-4 rounded-xl font-bold text-lg hover:bg-[hsl(var(--button-primary-hover))] transition-all"
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
                  ? 'bg-[hsl(var(--button-primary))] text-[hsl(var(--button-text))]'
                  : 'bg-surface text-text-muted border border-card-border'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setMode('practice')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                mode === 'practice'
                  ? 'bg-[hsl(var(--button-primary))] text-[hsl(var(--button-text))]'
                  : 'bg-surface text-text-muted border border-card-border'
              }`}
            >
              Practice
            </button>
          </div>
        </div>
      </div>
      </div>

      <TutorialPanel
        isOpen={isTutorialOpen}
        tutorial={tutorial}
        startAt={startMode === 'resume' ? lastStep : 0}
        resumeStep={lastStep}
        onStepChange={updateTutorialStep}
        onClose={closeTutorial}
        onSkip={skipTutorial}
        onComplete={completeTutorial}
      />
      
      {/* Learning Log Modal removed - Trivia is not a word-based game */}

      {showStats && stats && (
        <StatisticsModal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          gameName="trivia"
          stats={stats}
        />
      )}

      <BadgesDrawer
        isOpen={showBadgesDrawer}
        onClose={() => setShowBadgesDrawer(false)}
      />

      <BadgeDetailsSheet
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onExited={handleToastExit}
        />
      )}
    </div>
  );
}

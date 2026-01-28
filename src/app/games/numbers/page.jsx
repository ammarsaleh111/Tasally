'use client';

import { useState, useEffect } from 'react';
import GameHeader from '@/components/GameHeader';
import Modal from '@/components/Modal';
import UnifiedHowToPlay from '@/components/UnifiedHowToPlay';
// NOTE: Learning Log removed - Numbers is not a word-based game
import StatisticsModal from '@/components/StatisticsModal';
import ShareResults from '@/components/ShareResults';
import AchievementNotification from '@/components/AchievementNotification';
import DailyReminder from '@/components/DailyReminder';
import WinConfettiOverlay, { CONFETTI_ORIGINS } from '@/components/WinConfettiOverlay';
import Toast from '@/components/Toast';
import { recordGameResult, getGameStats, getTodayString } from '@/utils/profileManager';
import {
  getDailyPuzzle,
  generateRandomPuzzle,
  calculate,
  checkSolution,
  getHint,
  OPERATORS
} from './numbersLogic';

export default function NumbersGame() {
  // Game state
  const [puzzle, setPuzzle] = useState(null);
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [currentExpression, setCurrentExpression] = useState('');
  const [expressionSteps, setExpressionSteps] = useState([]);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Modals
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showStats, setShowStats] = useState(false);
  // Learning Log state removed - not applicable for math puzzles
  
  // Toast
  const [toast, setToast] = useState(null);
  
  // Mode
  const [mode, setMode] = useState('daily'); // 'daily' or 'practice'
  
  // Stats
  const [stats, setStats] = useState(null);
  const [newAchievements, setNewAchievements] = useState([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  
  // Toast handler
  const handleToastExit = () => {
    setToast(null);
  };

  // Load stats on mount
  useEffect(() => {
    const gameStats = getGameStats('numbers');
    setStats(gameStats);
  }, []);

  const loadPuzzle = () => {
    const newPuzzle = mode === 'daily' ? getDailyPuzzle() : generateRandomPuzzle();
    setPuzzle(newPuzzle);
    setAvailableNumbers(newPuzzle.numbers);
    setSelectedNumbers([]);
    setCurrentExpression('');
    setExpressionSteps([]);
    setGameWon(false);
    setGameLost(false);
  };

  // Initialize puzzle
  useEffect(() => {
    loadPuzzle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const handleNumberClick = (number, index) => {
    if (gameWon || gameLost) return;
    
    if (selectedNumbers.length === 2) {
      showToast('Select an operator to combine the numbers', 'warning');
      return;
    }
    
    // Add to selected numbers
    setSelectedNumbers([...selectedNumbers, { value: number, index }]);
    
    // Build expression string
    const newExpr = currentExpression 
      ? `${currentExpression} ${number}`
      : `${number}`;
    setCurrentExpression(newExpr);
  };

  const handleOperatorClick = (operator) => {
    if (gameWon || gameLost) return;
    
    if (selectedNumbers.length !== 2) {
      showToast('Select two numbers first', 'warning');
      return;
    }
    
    const [first, second] = selectedNumbers;
    const result = calculate(first.value, second.value, operator);
    
    if (result === null) {
      showToast('Invalid operation (division by zero)', 'error');
      return;
    }
    
    // Create new expression step
    const operation = `${first.value} ${operator} ${second.value} = ${result}`;
    const newSteps = [...expressionSteps, { operation, result }];
    setExpressionSteps(newSteps);
    
    // Remove used numbers and add result
    const newAvailable = availableNumbers.filter((_, i) => 
      i !== first.index && i !== second.index
    );
    newAvailable.push(result);
    setAvailableNumbers(newAvailable);
    
    // Reset selection
    setSelectedNumbers([]);
    setCurrentExpression('');
    
    // Check if we hit the target
    if (Math.round(result) === puzzle.target) {
      handleWin();
    } else if (newAvailable.length === 1) {
      // Only one number left and it's not the target
      handleLoss(result);
    }
  };

  const handleWin = () => {
    setGameWon(true);
    setShowConfetti(true);
    showToast(`🎉 Perfect! You hit ${puzzle.target}!`, 'success');
    
    // Update stats using profileManager
    const result = {
      date: getTodayString(),
      win: true,
      attempts: expressionSteps.length,
      exact: true,
      difference: 0,
      puzzleId: mode === 'daily' ? `numbers-${getTodayString()}` : `practice-${Date.now()}`,
    };
    
    const achievements = recordGameResult('numbers', result);
    const updatedStats = getGameStats('numbers');
    setStats(updatedStats);
    
    if (achievements && achievements.length > 0) {
      setNewAchievements(achievements);
      setCurrentAchievementIndex(0);
    }
  };

  const handleLoss = (finalResult) => {
    setGameLost(true);
    const diff = Math.abs(finalResult - puzzle.target);
    showToast(`Close! You got ${finalResult} (off by ${diff})`, 'error');
    
    // Update stats using profileManager
    const result = {
      date: getTodayString(),
      win: false,
      attempts: expressionSteps.length,
      exact: false,
      difference: diff,
      puzzleId: mode === 'daily' ? `numbers-${getTodayString()}` : `practice-${Date.now()}`,
    };
    
    recordGameResult('numbers', result);
    const updatedStats = getGameStats('numbers');
    setStats(updatedStats);
  };

  const handleUndo = () => {
    if (expressionSteps.length === 0) {
      if (selectedNumbers.length > 0) {
        setSelectedNumbers([]);
        setCurrentExpression('');
      }
      return;
    }
    
    // Undo last operation
    const newSteps = expressionSteps.slice(0, -1);
    setExpressionSteps(newSteps);
    
    // Restore the puzzle to previous state
    // This is complex - for now, just restart
    loadPuzzle();
  };

  const handleReset = () => {
    loadPuzzle();
  };

  const handleShowHint = () => {
    const hint = getHint(puzzle);
    showToast(hint, 'info');
  };

  const handleCheckSolution = () => {
    if (availableNumbers.length !== 1) {
      showToast('Keep combining until you have one number left', 'warning');
      return;
    }
    
    const result = availableNumbers[0];
    if (Math.round(result) === puzzle.target) {
      handleWin();
    } else {
      handleLoss(result);
    }
  };

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-text-muted">Loading puzzle...</div>
      </div>
    );
  }

  const gameComplete = gameWon || gameLost;

  return (
    <div className="min-h-screen flex flex-col animate-fade-in-up">
      <GameHeader
        title="Numbers"
        onHowToPlay={() => setShowHowToPlay(true)}
        onStats={() => setShowStats(true)}
        // Learning Log removed - Numbers is not a word-based game
        gameComplete={gameComplete}
      />

      <div className="relative flex-1 flex flex-col items-center justify-center p-4 pb-32">
        <WinConfettiOverlay
          active={showConfetti}
          durationMs={2800}
          intensity={0.8}
          origin={CONFETTI_ORIGINS.top}
          palette={[
            'hsl(var(--wordle-correct))',
            'hsl(var(--warning))',
            'hsl(var(--info))'
          ]}
          onDone={() => setShowConfetti(false)}
        />
        <div className="max-w-2xl w-full space-y-6">
          {/* Target Display */}
          <div className="text-center">
            <div className="text-sm text-text-muted mb-2">Target Number</div>
            <div className="text-6xl font-bold text-wordle-correct mb-4">
              {puzzle.target}
            </div>
            <div className="text-sm text-text-muted">
              {mode === 'daily' ? '📅 Daily Challenge' : '🎲 Practice Mode'}
            </div>
          </div>

          {/* Expression Steps */}
          {expressionSteps.length > 0 && (
            <div className="bg-surface rounded-xl p-4 border-2 border-card-border">
              <div className="text-sm text-text-muted mb-2">Your Steps:</div>
              <div className="space-y-1">
                {expressionSteps.map((step, i) => (
                  <div key={i} className="text-foreground font-mono text-sm">
                    {i + 1}. {step.operation}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Selection */}
          {currentExpression && (
            <div className="bg-connections-yellow/20 rounded-xl p-4 border-2 border-connections-yellow">
              <div className="text-sm text-text-muted mb-1">Selected:</div>
              <div className="text-2xl font-bold text-foreground">
                {currentExpression}
              </div>
            </div>
          )}

          {/* Available Numbers */}
          <div>
            <div className="text-sm text-text-muted mb-3 text-center">
              Available Numbers ({availableNumbers.length})
            </div>
            <div className="grid grid-cols-3 gap-3">
              {availableNumbers.map((num, index) => (
                <button
                  key={`${num}-${index}`}
                  onClick={() => handleNumberClick(num, index)}
                  disabled={gameWon || gameLost}
                  className={`
                    h-16 rounded-xl text-2xl font-bold
                    transition-all duration-200
                    ${selectedNumbers.some(s => s.index === index)
                      ? 'bg-connections-yellow text-background scale-95'
                      : 'bg-card border-2 border-card-border text-foreground hover:border-border-active hover:scale-105'
                    }
                    ${(gameWon || gameLost) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                  `}
                >
                  {Number.isInteger(num) ? num : num.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Operators */}
          <div>
            <div className="text-sm text-text-muted mb-3 text-center">
              Choose Operation
            </div>
            <div className="grid grid-cols-4 gap-3">
              {OPERATORS.map((op) => (
                <button
                  key={op}
                  onClick={() => handleOperatorClick(op)}
                  disabled={selectedNumbers.length !== 2 || gameWon || gameLost}
                  className={`
                    h-14 rounded-xl text-3xl font-bold
                    bg-wordle-correct text-white
                    transition-all duration-200
                    hover:scale-105 active:scale-95
                    disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
                  `}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUndo}
              className="flex-1 bg-surface border-2 border-card-border text-foreground py-3 rounded-xl font-semibold hover:border-border-active transition-all"
            >
              ↶ Undo
            </button>
            <button
              onClick={handleShowHint}
              className="flex-1 bg-surface border-2 border-card-border text-foreground py-3 rounded-xl font-semibold hover:border-border-active transition-all"
            >
              💡 Hint
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-surface border-2 border-card-border text-foreground py-3 rounded-xl font-semibold hover:border-border-active transition-all"
            >
              🔄 Reset
            </button>
          </div>

          {/* Check Solution Button */}
          {availableNumbers.length === 1 && !gameWon && !gameLost && (
            <button
              onClick={handleCheckSolution}
              className="w-full bg-wordle-correct text-white py-4 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all"
            >
              Check Solution
            </button>
          )}

          {/* New Puzzle Button (after game ends) */}
          {(gameWon || gameLost) && (
            <div className="space-y-4">
              {/* Share Results */}
              {gameWon && (
                <ShareResults
                  gameName="numbers"
                  result={{
                    exact: true,
                    difference: 0,
                    win: true
                  }}
                  puzzleNumber={mode === 'daily' ? `#${getTodayString()}` : ''}
                />
              )}

              {/* Daily Reminder */}
              {mode === 'daily' && <DailyReminder gameName="numbers" />}

              {mode === 'practice' && (
                <button
                  onClick={loadPuzzle}
                  className="w-full bg-wordle-correct text-white py-4 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all"
                >
                  New Puzzle
                </button>
              )}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex gap-2 justify-center">
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
      <UnifiedHowToPlay 
        gameName="numbers" 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
      
      {/* Learning Log Modal removed - Numbers is not a word-based game */}

      {showStats && stats && (
        <StatisticsModal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          gameName="numbers"
          stats={stats}
        />
      )}

      {/* Achievement Notifications */}
      {newAchievements.length > 0 && currentAchievementIndex < newAchievements.length && (
        <AchievementNotification
          achievementId={newAchievements[currentAchievementIndex].id}
          onClose={() => {
            if (currentAchievementIndex < newAchievements.length - 1) {
              setCurrentAchievementIndex(currentAchievementIndex + 1);
            } else {
              setNewAchievements([]);
              setCurrentAchievementIndex(0);
            }
          }}
        />
      )}

      
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

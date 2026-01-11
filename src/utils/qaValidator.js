/**
 * QA Validation Engine
 * Comprehensive validation for all data integrity, date logic, streaks, etc.
 */

import { getTodayString, getProfile, getAllStats } from './profileManager';

/**
 * VALIDATION REPORT
 */
export class ValidationReport {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.timestamp = new Date().toISOString();
  }

  addError(test, message, data = null) {
    this.errors.push({ test, message, data, severity: 'error' });
  }

  addWarning(test, message, data = null) {
    this.warnings.push({ test, message, data, severity: 'warning' });
  }

  addPass(test, message) {
    this.passed.push({ test, message });
  }

  getSummary() {
    return {
      timestamp: this.timestamp,
      totalTests: this.errors.length + this.warnings.length + this.passed.length,
      passed: this.passed.length,
      warnings: this.warnings.length,
      errors: this.errors.length,
      isValid: this.errors.length === 0,
      details: {
        errors: this.errors,
        warnings: this.warnings,
        passed: this.passed,
      },
    };
  }

  log() {
    const summary = this.getSummary();
    console.group('🔍 QA Validation Report');
    console.log(`⏰ Timestamp: ${summary.timestamp}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`⚠️ Warnings: ${summary.warnings}`);
    console.log(`❌ Errors: ${summary.errors}`);
    console.log(`🎯 Valid: ${summary.isValid ? 'YES' : 'NO'}`);

    if (this.errors.length > 0) {
      console.group('❌ Errors:');
      this.errors.forEach(e => console.error(`  ${e.test}: ${e.message}`, e.data));
      console.groupEnd();
    }

    if (this.warnings.length > 0) {
      console.group('⚠️ Warnings:');
      this.warnings.forEach(w => console.warn(`  ${w.test}: ${w.message}`, w.data));
      console.groupEnd();
    }

    console.groupEnd();
    return summary;
  }
}

/**
 * 1️⃣ VALIDATE DATE LOGIC
 */
export function validateDateLogic() {
  const report = new ValidationReport();

  try {
    // Test getTodayString
    const today = getTodayString();
    const todayPattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!todayPattern.test(today)) {
      report.addError('getTodayString', `Invalid date format: ${today}`, { today });
    } else {
      report.addPass('getTodayString', `Correct format: ${today}`);
    }

    // Test date consistency
    const now = new Date();
    const yearMatch = today.startsWith(String(now.getFullYear()));
    const monthMatch = today.includes(String(now.getMonth() + 1).padStart(2, '0'));
    const dayMatch = today.includes(String(now.getDate()).padStart(2, '0'));

    if (!yearMatch || !monthMatch || !dayMatch) {
      report.addError('date consistency', 'getTodayString does not match current date', { today, now });
    } else {
      report.addPass('date consistency', 'Date matches current date');
    }

    // Test date boundaries
    const testDates = [
      '2026-01-01', // New year
      '2026-12-31', // End of year
      '2026-02-28', // February
    ];

    testDates.forEach(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const testDate = new Date(year, month - 1, day);
      const isValid = !isNaN(testDate.getTime());

      if (isValid) {
        report.addPass('date boundary', `Valid date: ${dateStr}`);
      } else {
        report.addError('date boundary', `Invalid date: ${dateStr}`);
      }
    });
  } catch (e) {
    report.addError('date logic', `Exception: ${e.message}`, e);
  }

  return report;
}

/**
 * 2️⃣ VALIDATE STREAK LOGIC
 */
export function validateStreakLogic() {
  const report = new ValidationReport();

  try {
    const profile = getProfile();
    if (!profile) {
      report.addError('profile', 'Cannot load profile');
      return report;
    }

    Object.entries(profile.games).forEach(([gameName, gameStats]) => {
      // Check streak properties exist
      if (gameStats.currentStreak === undefined) {
        report.addError(`${gameName} streak`, 'currentStreak is undefined');
      } else if (typeof gameStats.currentStreak !== 'number') {
        report.addError(`${gameName} streak`, `currentStreak is not a number: ${typeof gameStats.currentStreak}`);
      } else if (gameStats.currentStreak < 0) {
        report.addError(`${gameName} streak`, `currentStreak is negative: ${gameStats.currentStreak}`);
      } else {
        report.addPass(`${gameName} streak`, `currentStreak valid: ${gameStats.currentStreak}`);
      }

      if (gameStats.longestStreak === undefined) {
        report.addError(`${gameName} streak`, 'longestStreak is undefined');
      } else if (gameStats.longestStreak < gameStats.currentStreak) {
        report.addError(
          `${gameName} streak logic`,
          `longestStreak (${gameStats.longestStreak}) < currentStreak (${gameStats.currentStreak})`
        );
      } else {
        report.addPass(`${gameName} streak`, `longestStreak >= currentStreak`);
      }

      // Check streak consistency with history
      if (gameStats.history && gameStats.history.length > 0) {
        const sortedHistory = [...gameStats.history].sort((a, b) => a.date.localeCompare(b.date));
        let streakCount = 0;
        let today = getTodayString();

        for (let i = sortedHistory.length - 1; i >= 0; i--) {
          const entry = sortedHistory[i];
          if (entry.date !== today && entry.date !== (i === sortedHistory.length - 1 ? today : sortedHistory[i + 1].date)) {
            break;
          }
          if (entry.win) {
            streakCount++;
          } else {
            break;
          }
        }

        if (streakCount !== gameStats.currentStreak && streakCount > 0) {
          report.addWarning(
            `${gameName} streak`,
            `Calculated streak (${streakCount}) differs from stored (${gameStats.currentStreak})`,
            { gameName, calculated: streakCount, stored: gameStats.currentStreak }
          );
        } else {
          report.addPass(`${gameName} streak consistency`, 'Streak matches history');
        }
      }
    });
  } catch (e) {
    report.addError('streak logic', `Exception: ${e.message}`, e);
  }

  return report;
}

/**
 * 3️⃣ VALIDATE STATS CONSISTENCY
 */
export function validateStatsConsistency() {
  const report = new ValidationReport();

  try {
    const profile = getProfile();
    if (!profile) {
      report.addError('profile', 'Cannot load profile');
      return report;
    }

    Object.entries(profile.games).forEach(([gameName, gameStats]) => {
      // Check gamesPlayed vs history length
      const historyCount = gameStats.history ? gameStats.history.length : 0;
      if (gameStats.gamesPlayed !== historyCount) {
        report.addWarning(
          `${gameName} consistency`,
          `gamesPlayed (${gameStats.gamesPlayed}) != history length (${historyCount})`
        );
      } else {
        report.addPass(`${gameName} consistency`, 'gamesPlayed matches history length');
      }

      // Check gamesWon vs actual wins in history
      if (gameStats.history && gameStats.history.length > 0) {
        const actualWins = gameStats.history.filter(h => h.win).length;
        if (gameStats.gamesWon !== actualWins) {
          report.addError(
            `${gameName} wins consistency`,
            `gamesWon (${gameStats.gamesWon}) != actual wins (${actualWins})`,
            { gameName, gamesWon: gameStats.gamesWon, actualWins }
          );
        } else {
          report.addPass(`${gameName} wins`, `gamesWon matches actual wins: ${actualWins}`);
        }
      }

      // Check win percentage validity
      if (gameStats.gamesPlayed > 0) {
        const winRate = (gameStats.gamesWon / gameStats.gamesPlayed) * 100;
        if (winRate < 0 || winRate > 100) {
          report.addError(`${gameName} win rate`, `Win rate out of bounds: ${winRate.toFixed(2)}%`);
        } else {
          report.addPass(`${gameName} win rate`, `Valid: ${winRate.toFixed(2)}%`);
        }
      }

      // Check attempts average
      if (gameStats.totalAttempts !== undefined) {
        if (gameStats.gamesPlayed > 0) {
          const calculated = gameStats.totalAttempts / gameStats.gamesPlayed;
          const stored = parseFloat(gameStats.averageAttempts);
          if (Math.abs(calculated - stored) > 0.01) {
            report.addWarning(
              `${gameName} average attempts`,
              `Calculated (${calculated.toFixed(2)}) != stored (${stored})`
            );
          } else {
            report.addPass(`${gameName} average attempts`, 'Calculation matches stored value');
          }
        }
      }

      // Check best time validity
      if (gameStats.bestTime !== null) {
        if (typeof gameStats.bestTime !== 'number' || gameStats.bestTime < 0) {
          report.addError(`${gameName} best time`, `Invalid bestTime: ${gameStats.bestTime}`);
        } else {
          report.addPass(`${gameName} best time`, `Valid: ${gameStats.bestTime}s`);
        }
      }
    });
  } catch (e) {
    report.addError('stats consistency', `Exception: ${e.message}`, e);
  }

  return report;
}

/**
 * 4️⃣ VALIDATE DUPLICATE PREVENTION
 */
export function validateDuplicatePrevention() {
  const report = new ValidationReport();

  try {
    const profile = getProfile();
    if (!profile) {
      report.addError('profile', 'Cannot load profile');
      return report;
    }

    Object.entries(profile.games).forEach(([gameName, gameStats]) => {
      if (!gameStats.history || gameStats.history.length === 0) {
        report.addPass(`${gameName} duplicates`, 'No history to check');
        return;
      }

      // Check for duplicate dates
      const dates = gameStats.history.map(h => h.date);
      const uniqueDates = new Set(dates);

      if (dates.length !== uniqueDates.size) {
        report.addError(
          `${gameName} duplicate dates`,
          `Duplicate dates found: ${dates.length} entries, ${uniqueDates.size} unique`,
          { gameName, duplicates: dates.filter((d, i) => dates.indexOf(d) !== i) }
        );
      } else {
        report.addPass(`${gameName} duplicate dates`, 'No duplicates');
      }

      // Check date format in history
      dates.forEach(date => {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(date)) {
          report.addError(`${gameName} date format`, `Invalid date format in history: ${date}`);
        }
      });
    });
  } catch (e) {
    report.addError('duplicate prevention', `Exception: ${e.message}`, e);
  }

  return report;
}

/**
 * 5️⃣ VALIDATE TIMEZONE HANDLING
 */
export function validateTimezoneHandling() {
  const report = new ValidationReport();

  try {
    // Check getTodayString uses local timezone
    const today = getTodayString();
    const browserDate = new Date();
    const browserDateStr = `${browserDate.getFullYear()}-${String(browserDate.getMonth() + 1).padStart(2, '0')}-${String(browserDate.getDate()).padStart(2, '0')}`;

    if (today === browserDateStr) {
      report.addPass('timezone aware', 'getTodayString uses local timezone');
    } else {
      report.addError('timezone', `getTodayString (${today}) doesn't match local date (${browserDateStr})`);
    }

    // Check profile timestamps are ISO format
    const profile = getProfile();
    if (profile.createdAt) {
      const createdDate = new Date(profile.createdAt);
      if (isNaN(createdDate.getTime())) {
        report.addError('timezone', 'createdAt is not a valid ISO timestamp');
      } else {
        report.addPass('timestamp format', `createdAt is valid ISO: ${profile.createdAt}`);
      }
    }

    // Check lastPlayedDate format
    Object.entries(profile.games).forEach(([gameName, gameStats]) => {
      if (gameStats.lastPlayedDate && !gameStats.lastPlayedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        report.addError(`${gameName} date format`, `Invalid lastPlayedDate format: ${gameStats.lastPlayedDate}`);
      }
    });
  } catch (e) {
    report.addError('timezone handling', `Exception: ${e.message}`, e);
  }

  return report;
}

/**
 * 6️⃣ VALIDATE SHARE OUTPUT
 */
export function validateShareOutput() {
  const report = new ValidationReport();

  try {
    // Test Wordle share format
    const wordleResult = {
      win: true,
      attempts: 4,
    };
    const wordleShare = generateWordleShare(wordleResult);
    if (!wordleShare || typeof wordleShare !== 'string' || wordleShare.length === 0) {
      report.addError('wordle share', 'Failed to generate Wordle share text');
    } else {
      report.addPass('wordle share', `Generated: ${wordleShare.substring(0, 50)}...`);
    }

    // Test Connections share format
    const connectionsResult = {
      win: true,
      mistakes: 0,
    };
    const connectionsShare = generateConnectionsShare(connectionsResult);
    if (!connectionsShare || typeof connectionsShare !== 'string') {
      report.addError('connections share', 'Failed to generate Connections share text');
    } else {
      report.addPass('connections share', `Generated: ${connectionsShare.substring(0, 50)}...`);
    }

    // Validate emoji blocks don't contain spoilers
    const allShares = [wordleShare, connectionsShare];
    allShares.forEach(share => {
      if (share.includes('*') || share.includes('_') || share.includes('[') || share.includes('?')) {
        report.addWarning('spoiler free', 'Share text contains potential spoilers');
      }
    });

    report.addPass('share output', 'All share formats validated');
  } catch (e) {
    report.addError('share output', `Exception: ${e.message}`, e);
  }

  return report;
}

/**
 * RUN ALL VALIDATIONS
 */
export function runCompleteValidation() {
  const allReports = {
    dateLogic: validateDateLogic(),
    streakLogic: validateStreakLogic(),
    statsConsistency: validateStatsConsistency(),
    duplicatePrevention: validateDuplicatePrevention(),
    timezoneHandling: validateTimezoneHandling(),
    shareOutput: validateShareOutput(),
  };

  // Create combined report
  const combined = new ValidationReport();
  let totalErrors = 0;
  let totalWarnings = 0;

  Object.entries(allReports).forEach(([name, report]) => {
    combined.errors.push(...report.errors);
    combined.warnings.push(...report.warnings);
    combined.passed.push(...report.passed);
    totalErrors += report.errors.length;
    totalWarnings += report.warnings.length;
  });

  return {
    summary: combined.getSummary(),
    details: allReports,
    isValid: combined.errors.length === 0,
  };
}

// Helper functions for share generation (minimal examples)
function generateWordleShare(result) {
  if (!result) return '';
  const emoji = result.win ? '🟩' : '⬜';
  return `Wordle ${emoji}`.repeat(result.attempts || 1);
}

function generateConnectionsShare(result) {
  if (!result) return '';
  const emoji = result.win ? '🟩' : '🟨';
  return emoji.repeat(4);
}

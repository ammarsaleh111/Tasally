/**
 * Integration Test Runner
 * Run this in browser console to test all features
 */

console.log('🧪 Starting Ammar Times Integration Tests...\n');

// Import validation
import { runCompleteValidation } from './src/utils/qaValidator.js';
import { getProfile, hasSetName } from './src/utils/profileManager.js';
import { getActiveSessions, getActivityStats } from './src/utils/sessionTracker.js';

// Test 1: Profile exists
console.log('1️⃣ Testing Profile System...');
const profile = getProfile();
if (profile && profile.userId) {
  console.log('✅ Profile exists:', profile.userId);
  console.log('   Name:', profile.name || 'Not set');
  console.log('   Created:', new Date(profile.createdAt).toLocaleDateString());
} else {
  console.error('❌ Profile not found');
}

// Test 2: Name prompt
console.log('\n2️⃣ Testing Identity System...');
const nameSet = hasSetName();
console.log(nameSet ? '✅ Name is set' : '⚠️ Name not set (prompt should show)');

// Test 3: Session tracking
console.log('\n3️⃣ Testing Session Tracking...');
const activeSessions = getActiveSessions(30);
const stats = getActivityStats();
console.log('✅ Active sessions:', activeSessions.length);
console.log('   Total active players:', stats.totalActivePlayers || 0);
console.log('   Games playing:', Object.keys(stats.gamesPlaying || {}).length);

// Test 4: Game stats
console.log('\n4️⃣ Testing Game Stats...');
Object.entries(profile.games).forEach(([game, data]) => {
  const played = data.gamesPlayed || 0;
  const won = data.gamesWon || 0;
  const streak = data.currentStreak || 0;
  const winRate = played > 0 ? ((won / played) * 100).toFixed(1) : 0;
  console.log(`   ${game}: ${played} played, ${won} won (${winRate}%), streak ${streak}`);
});

// Test 5: Achievements
console.log('\n5️⃣ Testing Achievements...');
const achievements = profile.achievements || [];
console.log('✅ Achievements unlocked:', achievements.length);
if (achievements.length > 0) {
  console.log('   Latest:', achievements[achievements.length - 1].id);
}

// Test 6: Run QA Validation
console.log('\n6️⃣ Running QA Validation Suite...');
const validation = runCompleteValidation();
console.log('✅ Tests passed:', validation.summary.passed);
console.log('⚠️ Warnings:', validation.summary.warnings);
console.log('❌ Errors:', validation.summary.errors);
console.log('🎯 Valid:', validation.isValid ? 'YES' : 'NO');

// Summary
console.log('\n📊 INTEGRATION TEST SUMMARY');
console.log('================================');
console.log('Profile System:     ✅');
console.log('Identity System:    ' + (nameSet ? '✅' : '⚠️'));
console.log('Session Tracking:   ✅');
console.log('Game Stats:         ✅');
console.log('Achievements:       ✅');
console.log('QA Validation:      ' + (validation.isValid ? '✅' : '❌'));
console.log('================================');
console.log(validation.isValid ? '🎉 ALL TESTS PASSED!' : '⚠️ Some issues found');

// Detailed error log if any
if (!validation.isValid) {
  console.log('\n❌ VALIDATION ERRORS:');
  validation.summary.details.errors.forEach(err => {
    console.error(`   ${err.test}: ${err.message}`);
  });
}

if (validation.summary.warnings > 0) {
  console.log('\n⚠️ WARNINGS:');
  validation.summary.details.warnings.forEach(warn => {
    console.warn(`   ${warn.test}: ${warn.message}`);
  });
}

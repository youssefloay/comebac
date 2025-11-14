/**
 * Unit tests for the Fantasy Points System
 * Tests all point calculation scenarios according to Requirement 6
 */

import { calculatePlayerPointsSync } from '../points-system'
import type { MatchStats, Position } from '../../types/fantasy'

// Test utilities
let testsPassed = 0
let testsFailed = 0
const failedTests: string[] = []

function assertEquals(actual: number, expected: number, testName: string) {
  if (actual === expected) {
    testsPassed++
    console.log(`✅ PASS: ${testName}`)
  } else {
    testsFailed++
    failedTests.push(testName)
    console.log(`❌ FAIL: ${testName}`)
    console.log(`   Expected: ${expected}, Got: ${actual}`)
  }
}

function createBaseMatchStats(position: Position): MatchStats {
  return {
    playerId: 'test-player',
    position,
    minutesPlayed: 0,
    goals: 0,
    assists: 0,
    cleanSheet: false,
    teamWon: false,
    teamDraw: false,
    yellowCards: 0,
    redCards: 0,
    goalsConceded: 0,
    penaltySaved: false,
    penaltyMissed: false
  }
}

// Test Suite: Minutes Played
console.log('\n📋 Testing Minutes Played Points\n')

function testMinutesPlayed() {
  // Test 1: Player played 60+ minutes
  const stats1 = createBaseMatchStats('Attaquant')
  stats1.minutesPlayed = 90
  assertEquals(
    calculatePlayerPointsSync(stats1),
    2,
    'Player with 90 minutes should get +2 points'
  )

  // Test 2: Player played 60 minutes exactly
  const stats2 = createBaseMatchStats('Milieu')
  stats2.minutesPlayed = 60
  assertEquals(
    calculatePlayerPointsSync(stats2),
    2,
    'Player with 60 minutes should get +2 points'
  )

  // Test 3: Player played less than 60 minutes
  const stats3 = createBaseMatchStats('Défenseur')
  stats3.minutesPlayed = 45
  assertEquals(
    calculatePlayerPointsSync(stats3),
    1,
    'Player with 45 minutes should get +1 point'
  )

  // Test 4: Player played 1 minute
  const stats4 = createBaseMatchStats('Gardien')
  stats4.minutesPlayed = 1
  assertEquals(
    calculatePlayerPointsSync(stats4),
    1,
    'Player with 1 minute should get +1 point'
  )

  // Test 5: Player did not play
  const stats5 = createBaseMatchStats('Attaquant')
  stats5.minutesPlayed = 0
  assertEquals(
    calculatePlayerPointsSync(stats5),
    0,
    'Player with 0 minutes should get 0 points'
  )
}

testMinutesPlayed()

// Test Suite: Goals by Position
console.log('\n⚽ Testing Goal Points by Position\n')

function testGoalsByPosition() {
  // Test 6: Goalkeeper goal
  const statsGK = createBaseMatchStats('Gardien')
  statsGK.minutesPlayed = 90
  statsGK.goals = 1
  assertEquals(
    calculatePlayerPointsSync(statsGK),
    12,
    'Goalkeeper goal should give +10 points (plus +2 for playing)'
  )

  // Test 7: Defender goal
  const statsDEF = createBaseMatchStats('Défenseur')
  statsDEF.minutesPlayed = 90
  statsDEF.goals = 1
  assertEquals(
    calculatePlayerPointsSync(statsDEF),
    8,
    'Defender goal should give +6 points (plus +2 for playing)'
  )

  // Test 8: Midfielder goal
  const statsMID = createBaseMatchStats('Milieu')
  statsMID.minutesPlayed = 90
  statsMID.goals = 1
  assertEquals(
    calculatePlayerPointsSync(statsMID),
    7,
    'Midfielder goal should give +5 points (plus +2 for playing)'
  )

  // Test 9: Attacker goal
  const statsATT = createBaseMatchStats('Attaquant')
  statsATT.minutesPlayed = 90
  statsATT.goals = 1
  assertEquals(
    calculatePlayerPointsSync(statsATT),
    6,
    'Attacker goal should give +4 points (plus +2 for playing)'
  )

  // Test 10: Multiple goals (hat-trick)
  const statsHatTrick = createBaseMatchStats('Attaquant')
  statsHatTrick.minutesPlayed = 90
  statsHatTrick.goals = 3
  assertEquals(
    calculatePlayerPointsSync(statsHatTrick),
    14,
    'Attacker with 3 goals should get 3*4 + 2 = 14 points'
  )
}

testGoalsByPosition()

// Test Suite: Assists
console.log('\n🎯 Testing Assist Points\n')

function testAssists() {
  // Test 11: Single assist
  const stats1 = createBaseMatchStats('Milieu')
  stats1.minutesPlayed = 90
  stats1.assists = 1
  assertEquals(
    calculatePlayerPointsSync(stats1),
    5,
    'Player with 1 assist should get +3 points (plus +2 for playing)'
  )

  // Test 12: Multiple assists
  const stats2 = createBaseMatchStats('Milieu')
  stats2.minutesPlayed = 90
  stats2.assists = 2
  assertEquals(
    calculatePlayerPointsSync(stats2),
    8,
    'Player with 2 assists should get 2*3 + 2 = 8 points'
  )

  // Test 13: Goal and assist
  const stats3 = createBaseMatchStats('Attaquant')
  stats3.minutesPlayed = 90
  stats3.goals = 1
  stats3.assists = 1
  assertEquals(
    calculatePlayerPointsSync(stats3),
    9,
    'Attacker with 1 goal and 1 assist should get 4 + 3 + 2 = 9 points'
  )
}

testAssists()

// Test Suite: Clean Sheet
console.log('\n🛡️ Testing Clean Sheet Points\n')

function testCleanSheet() {
  // Test 14: Goalkeeper clean sheet
  const statsGK = createBaseMatchStats('Gardien')
  statsGK.minutesPlayed = 90
  statsGK.cleanSheet = true
  assertEquals(
    calculatePlayerPointsSync(statsGK),
    6,
    'Goalkeeper with clean sheet should get +4 points (plus +2 for playing)'
  )

  // Test 15: Defender clean sheet
  const statsDEF = createBaseMatchStats('Défenseur')
  statsDEF.minutesPlayed = 90
  statsDEF.cleanSheet = true
  assertEquals(
    calculatePlayerPointsSync(statsDEF),
    6,
    'Defender with clean sheet should get +4 points (plus +2 for playing)'
  )

  // Test 16: Midfielder clean sheet
  const statsMID = createBaseMatchStats('Milieu')
  statsMID.minutesPlayed = 90
  statsMID.cleanSheet = true
  assertEquals(
    calculatePlayerPointsSync(statsMID),
    3,
    'Midfielder with clean sheet should get +1 point (plus +2 for playing)'
  )

  // Test 17: Attacker clean sheet (no bonus)
  const statsATT = createBaseMatchStats('Attaquant')
  statsATT.minutesPlayed = 90
  statsATT.cleanSheet = true
  assertEquals(
    calculatePlayerPointsSync(statsATT),
    2,
    'Attacker with clean sheet should get only +2 for playing (no clean sheet bonus)'
  )
}

testCleanSheet()

// Test Suite: Team Result
console.log('\n🏆 Testing Team Result Points\n')

function testTeamResult() {
  // Test 18: Team won
  const statsWin = createBaseMatchStats('Milieu')
  statsWin.minutesPlayed = 90
  statsWin.teamWon = true
  assertEquals(
    calculatePlayerPointsSync(statsWin),
    4,
    'Player in winning team should get +2 points (plus +2 for playing)'
  )

  // Test 19: Team draw
  const statsDraw = createBaseMatchStats('Milieu')
  statsDraw.minutesPlayed = 90
  statsDraw.teamDraw = true
  assertEquals(
    calculatePlayerPointsSync(statsDraw),
    3,
    'Player in drawing team should get +1 point (plus +2 for playing)'
  )

  // Test 20: Team lost (no bonus)
  const statsLoss = createBaseMatchStats('Milieu')
  statsLoss.minutesPlayed = 90
  statsLoss.teamWon = false
  statsLoss.teamDraw = false
  assertEquals(
    calculatePlayerPointsSync(statsLoss),
    2,
    'Player in losing team should get only +2 for playing'
  )
}

testTeamResult()

// Test Suite: Cards
console.log('\n🟨🟥 Testing Card Penalties\n')

function testCards() {
  // Test 21: Yellow card
  const statsYellow = createBaseMatchStats('Défenseur')
  statsYellow.minutesPlayed = 90
  statsYellow.yellowCards = 1
  assertEquals(
    calculatePlayerPointsSync(statsYellow),
    1,
    'Player with yellow card should get -1 point (2 - 1 = 1)'
  )

  // Test 22: Red card
  const statsRed = createBaseMatchStats('Défenseur')
  statsRed.minutesPlayed = 90
  statsRed.redCards = 1
  assertEquals(
    calculatePlayerPointsSync(statsRed),
    -1,
    'Player with red card should get -3 points (2 - 3 = -1)'
  )

  // Test 23: Multiple yellow cards
  const statsMultiYellow = createBaseMatchStats('Milieu')
  statsMultiYellow.minutesPlayed = 90
  statsMultiYellow.yellowCards = 2
  assertEquals(
    calculatePlayerPointsSync(statsMultiYellow),
    0,
    'Player with 2 yellow cards should get -2 points (2 - 2 = 0)'
  )

  // Test 24: Yellow and red card
  const statsBoth = createBaseMatchStats('Attaquant')
  statsBoth.minutesPlayed = 45
  statsBoth.yellowCards = 1
  statsBoth.redCards = 1
  assertEquals(
    calculatePlayerPointsSync(statsBoth),
    -3,
    'Player with yellow and red card should get -4 points (1 - 1 - 3 = -3)'
  )
}

testCards()

// Test Suite: Goalkeeper Specific
console.log('\n🧤 Testing Goalkeeper Specific Points\n')

function testGoalkeeperSpecific() {
  // Test 25: Goalkeeper conceded 2 goals
  const stats2Goals = createBaseMatchStats('Gardien')
  stats2Goals.minutesPlayed = 90
  stats2Goals.goalsConceded = 2
  assertEquals(
    calculatePlayerPointsSync(stats2Goals),
    1,
    'Goalkeeper who conceded 2 goals should get -1 point (2 - 1 = 1)'
  )

  // Test 26: Goalkeeper conceded 3 goals
  const stats3Goals = createBaseMatchStats('Gardien')
  stats3Goals.minutesPlayed = 90
  stats3Goals.goalsConceded = 3
  assertEquals(
    calculatePlayerPointsSync(stats3Goals),
    1,
    'Goalkeeper who conceded 3 goals should get -1 point (2 - 1 = 1)'
  )

  // Test 27: Goalkeeper conceded 1 goal (no penalty)
  const stats1Goal = createBaseMatchStats('Gardien')
  stats1Goal.minutesPlayed = 90
  stats1Goal.goalsConceded = 1
  assertEquals(
    calculatePlayerPointsSync(stats1Goal),
    2,
    'Goalkeeper who conceded 1 goal should get no penalty (2 points)'
  )

  // Test 28: Goalkeeper saved penalty
  const statsPenaltySave = createBaseMatchStats('Gardien')
  statsPenaltySave.minutesPlayed = 90
  statsPenaltySave.penaltySaved = true
  assertEquals(
    calculatePlayerPointsSync(statsPenaltySave),
    7,
    'Goalkeeper who saved penalty should get +5 points (2 + 5 = 7)'
  )

  // Test 29: Non-goalkeeper conceded goals (no penalty)
  const statsDefender = createBaseMatchStats('Défenseur')
  statsDefender.minutesPlayed = 90
  statsDefender.goalsConceded = 3
  assertEquals(
    calculatePlayerPointsSync(statsDefender),
    2,
    'Defender should not be penalized for goals conceded'
  )
}

testGoalkeeperSpecific()

// Test Suite: Penalty Missed
console.log('\n⚽❌ Testing Penalty Missed\n')

function testPenaltyMissed() {
  // Test 30: Player missed penalty
  const stats = createBaseMatchStats('Attaquant')
  stats.minutesPlayed = 90
  stats.penaltyMissed = true
  assertEquals(
    calculatePlayerPointsSync(stats),
    0,
    'Player who missed penalty should get -2 points (2 - 2 = 0)'
  )

  // Test 31: Player scored but also missed penalty
  const statsScored = createBaseMatchStats('Attaquant')
  statsScored.minutesPlayed = 90
  statsScored.goals = 1
  statsScored.penaltyMissed = true
  assertEquals(
    calculatePlayerPointsSync(statsScored),
    4,
    'Player who scored and missed penalty should get 4 + 2 - 2 = 4 points'
  )
}

testPenaltyMissed()

// Test Suite: Complex Scenarios
console.log('\n🎭 Testing Complex Scenarios\n')

function testComplexScenarios() {
  // Test 32: Perfect attacker performance
  const perfectAttacker = createBaseMatchStats('Attaquant')
  perfectAttacker.minutesPlayed = 90
  perfectAttacker.goals = 2
  perfectAttacker.assists = 1
  perfectAttacker.teamWon = true
  assertEquals(
    calculatePlayerPointsSync(perfectAttacker),
    15,
    'Perfect attacker: 2 goals (8) + 1 assist (3) + win (2) + played (2) = 15'
  )

  // Test 33: Goalkeeper with clean sheet and win
  const perfectGK = createBaseMatchStats('Gardien')
  perfectGK.minutesPlayed = 90
  perfectGK.cleanSheet = true
  perfectGK.teamWon = true
  assertEquals(
    calculatePlayerPointsSync(perfectGK),
    8,
    'GK with clean sheet and win: played (2) + clean sheet (4) + win (2) = 8'
  )

  // Test 34: Defender with goal, clean sheet, and win
  const perfectDefender = createBaseMatchStats('Défenseur')
  perfectDefender.minutesPlayed = 90
  perfectDefender.goals = 1
  perfectDefender.cleanSheet = true
  perfectDefender.teamWon = true
  assertEquals(
    calculatePlayerPointsSync(perfectDefender),
    14,
    'Defender: played (2) + goal (6) + clean sheet (4) + win (2) = 14'
  )

  // Test 35: Midfielder with goal, assist, and draw
  const goodMidfielder = createBaseMatchStats('Milieu')
  goodMidfielder.minutesPlayed = 90
  goodMidfielder.goals = 1
  goodMidfielder.assists = 1
  goodMidfielder.teamDraw = true
  assertEquals(
    calculatePlayerPointsSync(goodMidfielder),
    11,
    'Midfielder: played (2) + goal (5) + assist (3) + draw (1) = 11'
  )

  // Test 36: Bad performance with cards
  const badPerformance = createBaseMatchStats('Milieu')
  badPerformance.minutesPlayed = 90
  badPerformance.yellowCards = 1
  badPerformance.redCards = 1
  assertEquals(
    calculatePlayerPointsSync(badPerformance),
    -2,
    'Player with yellow and red: played (2) - yellow (1) - red (3) = -2'
  )

  // Test 37: Goalkeeper nightmare scenario
  const nightmareGK = createBaseMatchStats('Gardien')
  nightmareGK.minutesPlayed = 90
  nightmareGK.goalsConceded = 5
  nightmareGK.yellowCards = 1
  nightmareGK.penaltyMissed = true
  assertEquals(
    calculatePlayerPointsSync(nightmareGK),
    -2,
    'GK nightmare: played (2) - conceded (1) - yellow (1) - penalty missed (2) = -2'
  )

  // Test 38: Attacker with everything
  const superAttacker = createBaseMatchStats('Attaquant')
  superAttacker.minutesPlayed = 90
  superAttacker.goals = 3
  superAttacker.assists = 2
  superAttacker.teamWon = true
  assertEquals(
    calculatePlayerPointsSync(superAttacker),
    22,
    'Super attacker: played (2) + 3 goals (12) + 2 assists (6) + win (2) = 22'
  )
}

testComplexScenarios()

// Test Suite: Captain Doubling (conceptual - tested in integration)
console.log('\n👑 Testing Captain Points Doubling Concept\n')

function testCaptainDoubling() {
  // Test 39: Captain points should be doubled
  const captainStats = createBaseMatchStats('Attaquant')
  captainStats.minutesPlayed = 90
  captainStats.goals = 2
  captainStats.assists = 1
  captainStats.teamWon = true
  
  const basePoints = calculatePlayerPointsSync(captainStats)
  const captainPoints = basePoints * 2
  
  assertEquals(
    captainPoints,
    30,
    'Captain with 15 base points should get 30 points when doubled'
  )

  // Test 40: Captain with low score
  const lowScoreCaptain = createBaseMatchStats('Défenseur')
  lowScoreCaptain.minutesPlayed = 45
  lowScoreCaptain.yellowCards = 1
  
  const lowBasePoints = calculatePlayerPointsSync(lowScoreCaptain)
  const lowCaptainPoints = lowBasePoints * 2
  
  assertEquals(
    lowCaptainPoints,
    0,
    'Captain with 0 base points (1 - 1) should get 0 points when doubled'
  )

  // Test 41: Captain with negative score
  const negativeCaptain = createBaseMatchStats('Milieu')
  negativeCaptain.minutesPlayed = 30
  negativeCaptain.redCards = 1
  
  const negativeBasePoints = calculatePlayerPointsSync(negativeCaptain)
  const negativeCaptainPoints = negativeBasePoints * 2
  
  assertEquals(
    negativeCaptainPoints,
    -4,
    'Captain with -2 base points (1 - 3) should get -4 points when doubled'
  )
}

testCaptainDoubling()

// Test Suite: Edge Cases
console.log('\n🔍 Testing Edge Cases\n')

function testEdgeCases() {
  // Test 42: All zeros
  const allZeros = createBaseMatchStats('Milieu')
  assertEquals(
    calculatePlayerPointsSync(allZeros),
    0,
    'Player with all zero stats should get 0 points'
  )

  // Test 43: Exactly 59 minutes
  const stats59 = createBaseMatchStats('Attaquant')
  stats59.minutesPlayed = 59
  assertEquals(
    calculatePlayerPointsSync(stats59),
    1,
    'Player with 59 minutes should get +1 point (not +2)'
  )

  // Test 44: Goalkeeper with penalty save and clean sheet
  const gkPerfect = createBaseMatchStats('Gardien')
  gkPerfect.minutesPlayed = 90
  gkPerfect.cleanSheet = true
  gkPerfect.penaltySaved = true
  gkPerfect.teamWon = true
  assertEquals(
    calculatePlayerPointsSync(gkPerfect),
    13,
    'GK with penalty save, clean sheet, and win: 2 + 4 + 5 + 2 = 13'
  )

  // Test 45: Player with goal but team lost
  const goalInLoss = createBaseMatchStats('Attaquant')
  goalInLoss.minutesPlayed = 90
  goalInLoss.goals = 1
  assertEquals(
    calculatePlayerPointsSync(goalInLoss),
    6,
    'Attacker with goal in losing team: 2 + 4 = 6 (no team bonus)'
  )
}

testEdgeCases()

// Print Summary
console.log('\n' + '='.repeat(50))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(50))
console.log(`✅ Tests Passed: ${testsPassed}`)
console.log(`❌ Tests Failed: ${testsFailed}`)
console.log(`📈 Total Tests: ${testsPassed + testsFailed}`)
console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`)

if (testsFailed > 0) {
  console.log('\n❌ Failed Tests:')
  failedTests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test}`)
  })
  console.log('\n')
  process.exit(1)
} else {
  console.log('\n🎉 All tests passed!\n')
  process.exit(0)
}

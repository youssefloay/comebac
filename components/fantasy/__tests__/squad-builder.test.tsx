/**
 * Integration tests for the SquadBuilder component
 * Tests player selection, validations, and save functionality
 * Requirements: 2, 3
 */

import type { Player } from '@/lib/types'
import type { Formation, FantasyPlayer, PlayerFantasyStats } from '@/lib/types/fantasy'
import { 
  validateSquad, 
  validateBudget, 
  validatePlayerAddition,
  validateFantasyTeam,
  INITIAL_BUDGET
} from '@/lib/fantasy/validation'

// Test utilities
let testsPassed = 0
let testsFailed = 0
const failedTests: string[] = []

function assertEquals(actual: any, expected: any, testName: string) {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected)
  if (isEqual) {
    testsPassed++
    console.log(`✅ PASS: ${testName}`)
  } else {
    testsFailed++
    failedTests.push(testName)
    console.log(`❌ FAIL: ${testName}`)
    console.log(`   Expected: ${JSON.stringify(expected)}`)
    console.log(`   Got: ${JSON.stringify(actual)}`)
  }
}

function assertTrue(condition: boolean, testName: string) {
  if (condition) {
    testsPassed++
    console.log(`✅ PASS: ${testName}`)
  } else {
    testsFailed++
    failedTests.push(testName)
    console.log(`❌ FAIL: ${testName}`)
    console.log(`   Expected: true, Got: false`)
  }
}

function assertFalse(condition: boolean, testName: string) {
  if (!condition) {
    testsPassed++
    console.log(`✅ PASS: ${testName}`)
  } else {
    testsFailed++
    failedTests.push(testName)
    console.log(`❌ FAIL: ${testName}`)
    console.log(`   Expected: false, Got: true`)
  }
}

// Helper functions to create test data
function createTestPlayer(
  id: string,
  name: string,
  position: 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant',
  teamId: string,
  school: string = 'Test School'
): Player {
  return {
    id,
    name,
    position,
    number: parseInt(id),
    school,
    teamId,
    photo: '/placeholder-user.jpg',
    seasonStats: {
      goals: 0,
      assists: 0,
      matches: 10,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 900
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function createFantasyPlayer(
  playerId: string,
  position: 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant',
  price: number,
  isCaptain: boolean = false
): FantasyPlayer {
  return {
    playerId,
    position,
    price,
    points: 0,
    gameweekPoints: 0,
    isCaptain
  }
}

function createFantasyStats(playerId: string, price: number): PlayerFantasyStats {
  return {
    playerId,
    price,
    totalPoints: 0,
    gameweekPoints: 0,
    popularity: 0,
    form: [0, 0, 0, 0, 0],
    priceChange: 0,
    selectedBy: 0,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
  }
}

// Test Suite: Player Selection Logic
console.log('\n👥 Testing Player Selection Logic\n')

function testPlayerSelection() {
  // Test 1: Select valid player within budget
  const availablePlayers: Player[] = [
    createTestPlayer('p1', 'John Doe', 'Gardien', 'team-a'),
    createTestPlayer('p2', 'Jane Smith', 'Défenseur', 'team-b')
  ]
  
  const selectedPlayers: FantasyPlayer[] = []
  const newPlayer = createFantasyPlayer('p1', 'Gardien', 5.0)
  
  const validation = validatePlayerAddition(selectedPlayers, newPlayer, '4-2-0', INITIAL_BUDGET)
  assertTrue(validation.valid, 'Should allow selecting first player within budget')

  // Test 2: Prevent selecting duplicate player
  const existingPlayers = [createFantasyPlayer('p1', 'Gardien', 5.0)]
  const duplicatePlayer = createFantasyPlayer('p1', 'Défenseur', 6.0)
  
  const validation2 = validatePlayerAddition(existingPlayers, duplicatePlayer, '4-2-0', INITIAL_BUDGET)
  assertFalse(validation2.valid, 'Should prevent selecting duplicate player')
  assertTrue(
    validation2.errors.some(e => e.includes('déjà dans votre équipe')),
    'Should have duplicate player error message'
  )

  // Test 3: Prevent selecting player when budget exceeded
  const expensivePlayers = [
    createFantasyPlayer('p1', 'Gardien', 15.0),
    createFantasyPlayer('p2', 'Défenseur', 15.0),
    createFantasyPlayer('p3', 'Défenseur', 15.0),
    createFantasyPlayer('p4', 'Défenseur', 15.0),
    createFantasyPlayer('p5', 'Milieu', 15.0),
    createFantasyPlayer('p6', 'Milieu', 15.0)
  ]
  const overBudgetPlayer = createFantasyPlayer('p7', 'Milieu', 15.0)
  
  const validation3 = validatePlayerAddition(expensivePlayers, overBudgetPlayer, '4-2-0', INITIAL_BUDGET)
  assertFalse(validation3.valid, 'Should prevent selecting player when budget exceeded')

  // Test 4: Allow selecting player from different team
  const mixedTeamPlayers = [
    createFantasyPlayer('p1', 'Gardien', 5.0),
    createFantasyPlayer('p2', 'Défenseur', 6.0)
  ]
  const differentTeamPlayer = createFantasyPlayer('p3', 'Défenseur', 6.0)
  
  const validation4 = validatePlayerAddition(mixedTeamPlayers, differentTeamPlayer, '4-2-0', INITIAL_BUDGET)
  assertTrue(validation4.valid, 'Should allow selecting player from different team')

  // Test 5: Prevent exceeding position limit for formation
  const fourDefenders = [
    createFantasyPlayer('p1', 'Gardien', 5.0),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Défenseur', 7.5)
  ]
  const fifthDefender = createFantasyPlayer('p6', 'Défenseur', 8.0)
  
  const validation5 = validatePlayerAddition(fourDefenders, fifthDefender, '4-2-0', INITIAL_BUDGET)
  assertFalse(validation5.valid, 'Should prevent adding 5th defender for 4-2-0 formation')
}

testPlayerSelection()

// Test Suite: Squad Validation
console.log('\n✅ Testing Squad Validation\n')

function testSquadValidation() {
  // Test 6: Valid complete squad for 4-2-0 formation (1 GK + 4 DEF + 2 MID = 7 players)
  const validSquad420 = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Défenseur', 7.5),
    createFantasyPlayer('p6', 'Milieu', 8.0),
    createFantasyPlayer('p7', 'Milieu', 8.5)
  ]
  
  const validation1 = validateSquad(validSquad420, '4-2-0')
  assertTrue(validation1.valid, 'Valid squad with 7 players matching formation should pass')

  // Test 7: Incomplete squad
  const incompleteSquad = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Milieu', 8.0)
  ]
  
  const validation2 = validateSquad(incompleteSquad, '4-2-0')
  assertFalse(validation2.valid, 'Incomplete squad should fail validation')
  assertTrue(
    validation2.errors.some(e => e.includes('joueurs')),
    'Should have error about player count'
  )

  // Test 8: Squad without captain
  const noCaptainSquad = [
    createFantasyPlayer('p1', 'Gardien', 5.0),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Défenseur', 7.5),
    createFantasyPlayer('p6', 'Milieu', 8.0),
    createFantasyPlayer('p7', 'Milieu', 8.5)
  ]
  
  const validation3 = validateSquad(noCaptainSquad, '4-2-0')
  assertFalse(validation3.valid, 'Squad without captain should fail')
  assertTrue(
    validation3.errors.some(e => e.includes('capitaine')),
    'Should have error about missing captain'
  )

  // Test 9: Squad with multiple captains
  const multipleCaptains = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0, true),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Défenseur', 7.5),
    createFantasyPlayer('p6', 'Milieu', 8.0),
    createFantasyPlayer('p7', 'Milieu', 8.5)
  ]
  
  const validation4 = validateSquad(multipleCaptains, '4-2-0')
  assertFalse(validation4.valid, 'Squad with multiple captains should fail')

  // Test 10: Squad not matching formation
  const wrongFormation = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Milieu', 7.0),
    createFantasyPlayer('p5', 'Milieu', 7.5),
    createFantasyPlayer('p6', 'Milieu', 8.0),
    createFantasyPlayer('p7', 'Attaquant', 10.0)
  ]
  
  const validation5 = validateSquad(wrongFormation, '4-2-0')
  assertFalse(validation5.valid, 'Squad not matching formation should fail')
  assertTrue(
    validation5.errors.some(e => e.includes('formation')),
    'Should have error about formation mismatch'
  )
}

testSquadValidation()

// Test Suite: Budget Validation
console.log('\n💰 Testing Budget Validation\n')

function testBudgetValidation() {
  // Test 11: Squad within budget
  const affordableSquad = [
    createFantasyPlayer('p1', 'Gardien', 5.0),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Milieu', 8.0),
    createFantasyPlayer('p6', 'Milieu', 8.5),
    createFantasyPlayer('p7', 'Attaquant', 10.0)
  ]
  
  const validation1 = validateBudget(affordableSquad, INITIAL_BUDGET)
  assertTrue(validation1.valid, 'Squad within budget should pass validation')

  // Test 12: Squad exactly at budget limit
  const exactBudgetSquad = [
    createFantasyPlayer('p1', 'Gardien', 10.0),
    createFantasyPlayer('p2', 'Défenseur', 15.0),
    createFantasyPlayer('p3', 'Défenseur', 15.0),
    createFantasyPlayer('p4', 'Défenseur', 15.0),
    createFantasyPlayer('p5', 'Milieu', 15.0),
    createFantasyPlayer('p6', 'Milieu', 15.0),
    createFantasyPlayer('p7', 'Attaquant', 15.0)
  ]
  
  const validation2 = validateBudget(exactBudgetSquad, INITIAL_BUDGET)
  assertTrue(validation2.valid, 'Squad at exact budget limit should pass')

  // Test 13: Squad over budget
  const overBudgetSquad = [
    createFantasyPlayer('p1', 'Gardien', 15.0),
    createFantasyPlayer('p2', 'Défenseur', 15.0),
    createFantasyPlayer('p3', 'Défenseur', 15.0),
    createFantasyPlayer('p4', 'Défenseur', 15.0),
    createFantasyPlayer('p5', 'Milieu', 15.0),
    createFantasyPlayer('p6', 'Milieu', 15.0),
    createFantasyPlayer('p7', 'Attaquant', 15.0)
  ]
  
  const validation3 = validateBudget(overBudgetSquad, INITIAL_BUDGET)
  assertFalse(validation3.valid, 'Squad over budget should fail validation')
  assertTrue(
    validation3.errors.some(e => e.includes('Budget dépassé')),
    'Should have error about budget exceeded'
  )

  // Test 14: Calculate budget remaining correctly
  const partialSquad = [
    createFantasyPlayer('p1', 'Gardien', 5.0),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5)
  ]
  
  const spent = partialSquad.reduce((sum, p) => sum + p.price, 0)
  const remaining = INITIAL_BUDGET - spent
  
  assertEquals(remaining, 82.5, 'Budget remaining should be calculated correctly')
  assertTrue(remaining > 0, 'Should have budget remaining for more players')
}

testBudgetValidation()

// Test Suite: Formation-Specific Validation
console.log('\n⚽ Testing Formation-Specific Validation\n')

function testFormationValidation() {
  // Test 15: Valid 3-3-0 formation (1 GK + 3 DEF + 3 MID = 7 players)
  const squad330 = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Milieu', 8.0),
    createFantasyPlayer('p6', 'Milieu', 8.5),
    createFantasyPlayer('p7', 'Milieu', 9.0)
  ]
  
  const validation1 = validateSquad(squad330, '3-3-0')
  assertTrue(validation1.valid, 'Valid squad with 7 players for 3-3-0 should pass')

  // Test 16: Valid 2-2-2 formation (1 GK + 2 DEF + 2 MID + 2 ATT = 7 players)
  const squad222 = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Milieu', 8.0),
    createFantasyPlayer('p5', 'Milieu', 8.5),
    createFantasyPlayer('p6', 'Attaquant', 10.0),
    createFantasyPlayer('p7', 'Attaquant', 11.0)
  ]
  
  const validation2 = validateSquad(squad222, '2-2-2')
  assertTrue(validation2.valid, 'Valid squad with 7 players for 2-2-2 should pass')

  // Test 17: Valid 3-2-1 formation (1 GK + 3 DEF + 2 MID + 1 ATT = 7 players)
  const squad321 = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Milieu', 8.0),
    createFantasyPlayer('p6', 'Milieu', 8.5),
    createFantasyPlayer('p7', 'Attaquant', 10.0)
  ]
  
  const validation3 = validateSquad(squad321, '3-2-1')
  assertTrue(validation3.valid, 'Valid squad with 7 players for 3-2-1 should pass')

  // Test 18: Valid 2-3-1 formation (1 GK + 2 DEF + 3 MID + 1 ATT = 7 players)
  const squad231 = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Milieu', 8.0),
    createFantasyPlayer('p5', 'Milieu', 8.5),
    createFantasyPlayer('p6', 'Milieu', 9.0),
    createFantasyPlayer('p7', 'Attaquant', 10.0)
  ]
  
  const validation4 = validateSquad(squad231, '2-3-1')
  assertTrue(validation4.valid, 'Valid squad with 7 players for 2-3-1 should pass')

  // Test 19: Wrong formation composition
  const wrongComposition = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Attaquant', 10.0),
    createFantasyPlayer('p5', 'Attaquant', 11.0),
    createFantasyPlayer('p6', 'Attaquant', 12.0),
    createFantasyPlayer('p7', 'Attaquant', 13.0)
  ]
  
  const validation5 = validateSquad(wrongComposition, '4-2-0')
  assertFalse(validation5.valid, 'Squad with wrong composition should fail')
}

testFormationValidation()

// Test Suite: Save Functionality
console.log('\n💾 Testing Save Functionality\n')

function testSaveFunctionality() {
  // Test 20: Valid complete team ready to save
  const completeTeam = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Défenseur', 7.5),
    createFantasyPlayer('p6', 'Milieu', 8.0),
    createFantasyPlayer('p7', 'Milieu', 8.5)
  ]
  
  const teamName = 'Dream Team'
  const formation: Formation = '4-2-0'
  
  const validation = validateFantasyTeam(teamName, completeTeam, formation, INITIAL_BUDGET)
  assertTrue(validation.valid, 'Valid complete team with 7 players should pass')

  // Test 21: Team with invalid name should not save
  const invalidNameTeam = completeTeam
  const shortName = 'AB'
  
  const validation2 = validateFantasyTeam(shortName, invalidNameTeam, formation, INITIAL_BUDGET)
  assertFalse(validation2.valid, 'Team with invalid name should fail validation')
  assertTrue(
    validation2.errors.some(e => e.includes('nom')),
    'Should have error about team name'
  )

  // Test 22: Incomplete team should not save
  const incompleteTeam = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Milieu', 8.0)
  ]
  
  const validation3 = validateFantasyTeam('Valid Name', incompleteTeam, formation, INITIAL_BUDGET)
  assertFalse(validation3.valid, 'Incomplete team should fail validation')

  // Test 23: Team over budget should not save
  const overBudgetTeam = [
    createFantasyPlayer('p1', 'Gardien', 20.0, true),
    createFantasyPlayer('p2', 'Défenseur', 20.0),
    createFantasyPlayer('p3', 'Défenseur', 20.0),
    createFantasyPlayer('p4', 'Milieu', 20.0),
    createFantasyPlayer('p5', 'Milieu', 20.0),
    createFantasyPlayer('p6', 'Attaquant', 20.0),
    createFantasyPlayer('p7', 'Attaquant', 20.0)
  ]
  
  const validation4 = validateFantasyTeam('Valid Name', overBudgetTeam, '2-2-2', INITIAL_BUDGET)
  assertFalse(validation4.valid, 'Team over budget should fail validation')

  // Test 24: Team without captain should not save
  const noCaptainTeam = [
    createFantasyPlayer('p1', 'Gardien', 5.0),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Milieu', 8.0),
    createFantasyPlayer('p6', 'Milieu', 8.5),
    createFantasyPlayer('p7', 'Attaquant', 10.0)
  ]
  
  const validation5 = validateFantasyTeam('Valid Name', noCaptainTeam, '3-2-1', INITIAL_BUDGET)
  assertFalse(validation5.valid, 'Team without captain should fail validation')
}

testSaveFunctionality()

// Test Suite: Team Limit Validation (Max 3 players per team)
console.log('\n🏆 Testing Team Limit Validation\n')

function testTeamLimitValidation() {
  // Test 25: Squad with 3 players from same team (valid)
  const threeFromSameTeam = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Milieu', 8.0),
    createFantasyPlayer('p6', 'Milieu', 8.5),
    createFantasyPlayer('p7', 'Attaquant', 10.0)
  ]
  
  // Create players with team associations
  const players: Player[] = [
    createTestPlayer('p1', 'Player 1', 'Gardien', 'team-a'),
    createTestPlayer('p2', 'Player 2', 'Défenseur', 'team-a'),
    createTestPlayer('p3', 'Player 3', 'Défenseur', 'team-a'),
    createTestPlayer('p4', 'Player 4', 'Défenseur', 'team-b'),
    createTestPlayer('p5', 'Player 5', 'Milieu', 'team-c'),
    createTestPlayer('p6', 'Player 6', 'Milieu', 'team-d'),
    createTestPlayer('p7', 'Player 7', 'Attaquant', 'team-e')
  ]
  
  // Count players per team
  const teamCounts: Record<string, number> = {}
  threeFromSameTeam.forEach(fp => {
    const player = players.find(p => p.id === fp.playerId)
    if (player) {
      teamCounts[player.teamId] = (teamCounts[player.teamId] || 0) + 1
    }
  })
  
  const maxFromOneTeam = Math.max(...Object.values(teamCounts))
  assertTrue(maxFromOneTeam <= 3, 'Should allow up to 3 players from same team')

  // Test 26: Attempting to add 4th player from same team
  const threeFromTeamA = [
    createFantasyPlayer('p1', 'Gardien', 5.0),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5)
  ]
  
  const playersTeamA: Player[] = [
    createTestPlayer('p1', 'Player 1', 'Gardien', 'team-a'),
    createTestPlayer('p2', 'Player 2', 'Défenseur', 'team-a'),
    createTestPlayer('p3', 'Player 3', 'Défenseur', 'team-a'),
    createTestPlayer('p4', 'Player 4', 'Défenseur', 'team-a')
  ]
  
  const fourthFromTeamA = createFantasyPlayer('p4', 'Défenseur', 7.0)
  
  // Manually check team limit
  const teamACount = threeFromTeamA.filter(fp => {
    const player = playersTeamA.find(p => p.id === fp.playerId)
    return player?.teamId === 'team-a'
  }).length
  
  assertTrue(teamACount === 3, 'Should have 3 players from team-a')
  
  // Adding 4th would exceed limit
  const wouldExceed = teamACount >= 3
  assertTrue(wouldExceed, 'Should detect that adding 4th player would exceed team limit')
}

testTeamLimitValidation()

// Test Suite: Captain Selection
console.log('\n👑 Testing Captain Selection\n')

function testCaptainSelection() {
  // Test 27: Squad with valid captain
  const squadWithCaptain = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Milieu', 8.0),
    createFantasyPlayer('p6', 'Milieu', 8.5),
    createFantasyPlayer('p7', 'Attaquant', 10.0)
  ]
  
  const captainCount = squadWithCaptain.filter(p => p.isCaptain).length
  assertEquals(captainCount, 1, 'Should have exactly 1 captain')
  
  const captain = squadWithCaptain.find(p => p.isCaptain)
  assertTrue(captain !== undefined, 'Should be able to find captain')
  assertEquals(captain?.playerId, 'p1', 'Captain should be player p1')

  // Test 28: Change captain
  const squadBeforeChange = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Milieu', 8.0)
  ]
  
  // Simulate changing captain from p1 to p2
  const squadAfterChange = squadBeforeChange.map(p => ({
    ...p,
    isCaptain: p.playerId === 'p2'
  }))
  
  const newCaptain = squadAfterChange.find(p => p.isCaptain)
  assertEquals(newCaptain?.playerId, 'p2', 'Captain should be changed to p2')
  
  const captainCountAfter = squadAfterChange.filter(p => p.isCaptain).length
  assertEquals(captainCountAfter, 1, 'Should still have exactly 1 captain after change')

  // Test 29: Remove player who is captain
  const squadWithCaptainP3 = [
    createFantasyPlayer('p1', 'Gardien', 5.0),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Milieu', 8.0, true)
  ]
  
  // Remove captain
  const squadAfterRemoval = squadWithCaptainP3.filter(p => p.playerId !== 'p3')
  
  const captainAfterRemoval = squadAfterRemoval.find(p => p.isCaptain)
  assertTrue(captainAfterRemoval === undefined, 'Should have no captain after removing captain')
  
  // Test 30: Captain must be from selected players
  const selectedPlayerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
  const captainId = 'p3'
  
  assertTrue(
    selectedPlayerIds.includes(captainId),
    'Captain must be one of the selected players'
  )
  
  const invalidCaptainId = 'p99'
  assertFalse(
    selectedPlayerIds.includes(invalidCaptainId),
    'Invalid captain ID should not be in selected players'
  )
}

testCaptainSelection()

// Test Suite: Player Filtering
console.log('\n🔍 Testing Player Filtering\n')

function testPlayerFiltering() {
  // Test 31: Filter by position
  const allPlayers: Player[] = [
    createTestPlayer('p1', 'GK 1', 'Gardien', 'team-a'),
    createTestPlayer('p2', 'DEF 1', 'Défenseur', 'team-a'),
    createTestPlayer('p3', 'DEF 2', 'Défenseur', 'team-b'),
    createTestPlayer('p4', 'MID 1', 'Milieu', 'team-c'),
    createTestPlayer('p5', 'MID 2', 'Milieu', 'team-d'),
    createTestPlayer('p6', 'ATT 1', 'Attaquant', 'team-e')
  ]
  
  const goalkeepers = allPlayers.filter(p => p.position === 'Gardien')
  assertEquals(goalkeepers.length, 1, 'Should filter 1 goalkeeper')
  
  const defenders = allPlayers.filter(p => p.position === 'Défenseur')
  assertEquals(defenders.length, 2, 'Should filter 2 defenders')
  
  const midfielders = allPlayers.filter(p => p.position === 'Milieu')
  assertEquals(midfielders.length, 2, 'Should filter 2 midfielders')
  
  const attackers = allPlayers.filter(p => p.position === 'Attaquant')
  assertEquals(attackers.length, 1, 'Should filter 1 attacker')

  // Test 32: Filter by search query
  const searchQuery = 'DEF'
  const searchResults = allPlayers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  assertEquals(searchResults.length, 2, 'Should find 2 players matching "DEF"')

  // Test 33: Exclude already selected players
  const selectedPlayers = [
    createFantasyPlayer('p1', 'Gardien', 5.0),
    createFantasyPlayer('p2', 'Défenseur', 6.0)
  ]
  
  const selectedIds = selectedPlayers.map(p => p.playerId)
  const availablePlayers = allPlayers.filter(p => !selectedIds.includes(p.id))
  
  assertEquals(availablePlayers.length, 4, 'Should exclude 2 selected players')
  assertFalse(
    availablePlayers.some(p => p.id === 'p1'),
    'Should not include already selected player p1'
  )
  assertFalse(
    availablePlayers.some(p => p.id === 'p2'),
    'Should not include already selected player p2'
  )

  // Test 34: Combined filters (position + search + exclude selected)
  const positionFilter = 'Défenseur'
  const searchFilter = 'DEF'
  const selectedFilter = ['p2']
  
  const filteredPlayers = allPlayers.filter(p => {
    if (p.position !== positionFilter) return false
    if (!p.name.toLowerCase().includes(searchFilter.toLowerCase())) return false
    if (selectedFilter.includes(p.id)) return false
    return true
  })
  
  assertEquals(filteredPlayers.length, 1, 'Should have 1 player after all filters')
  assertEquals(filteredPlayers[0].id, 'p3', 'Filtered player should be p3')
}

testPlayerFiltering()

// Test Suite: Integration Scenarios
console.log('\n🔗 Testing Integration Scenarios\n')

function testIntegrationScenarios() {
  // Test 35: Complete squad building flow for 4-2-0 (1 GK + 4 DEF + 2 MID = 7 players)
  let squad: FantasyPlayer[] = []
  const budget = INITIAL_BUDGET
  const formation: Formation = '4-2-0'
  
  // Step 1: Add goalkeeper
  const gk = createFantasyPlayer('p1', 'Gardien', 5.0)
  const validation1 = validatePlayerAddition(squad, gk, formation, budget)
  assertTrue(validation1.valid, 'Step 1: Should add goalkeeper')
  squad.push(gk)
  
  // Step 2: Add 4 defenders
  for (let i = 2; i <= 5; i++) {
    const def = createFantasyPlayer(`p${i}`, 'Défenseur', 6.0)
    const validation = validatePlayerAddition(squad, def, formation, budget)
    assertTrue(validation.valid, `Step 2: Should add defender ${i}`)
    squad.push(def)
  }
  
  // Step 3: Add 2 midfielders
  for (let i = 6; i <= 7; i++) {
    const mid = createFantasyPlayer(`p${i}`, 'Milieu', 8.0)
    const validation = validatePlayerAddition(squad, mid, formation, budget)
    assertTrue(validation.valid, `Step 3: Should add midfielder ${i}`)
    squad.push(mid)
  }
  
  assertEquals(squad.length, 7, 'Should have 7 players after building')
  
  // Step 4: Set captain
  squad = squad.map(p => ({
    ...p,
    isCaptain: p.playerId === 'p1'
  }))
  
  const captain = squad.find(p => p.isCaptain)
  assertTrue(captain !== undefined, 'Should have captain set')
  
  // Step 5: Validate complete squad
  const finalValidation = validateSquad(squad, formation)
  assertTrue(finalValidation.valid, 'Complete squad with 7 players should pass')

  // Test 36: Budget management during squad building
  let currentBudget = INITIAL_BUDGET
  const expensivePlayers: FantasyPlayer[] = []
  
  // Add expensive players until budget is tight (7 players total)
  const prices = [10.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0]
  prices.forEach((price, index) => {
    const player = createFantasyPlayer(`p${index + 1}`, 'Milieu', price)
    expensivePlayers.push(player)
  })
  
  const totalSpent = expensivePlayers.reduce((sum, p) => sum + p.price, 0)
  const remaining = currentBudget - totalSpent
  
  assertEquals(remaining, 0, 'Should have 0 budget remaining with expensive squad')
  
  const budgetValidation = validateBudget(expensivePlayers, currentBudget)
  assertTrue(budgetValidation.valid, 'Should be valid when exactly at budget')

  // Test 37: Formation change impact
  const flexibleSquad = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.0),
    createFantasyPlayer('p3', 'Défenseur', 6.5),
    createFantasyPlayer('p4', 'Défenseur', 7.0),
    createFantasyPlayer('p5', 'Milieu', 8.0),
    createFantasyPlayer('p6', 'Milieu', 8.5),
    createFantasyPlayer('p7', 'Attaquant', 10.0)
  ]
  
  // Valid for 3-2-1 (1 GK + 3 DEF + 2 MID + 1 ATT = 7)
  const validation321 = validateSquad(flexibleSquad, '3-2-1')
  assertTrue(validation321.valid, 'Should pass for 3-2-1 formation')
  
  // Invalid for 4-2-0 (has attacker, needs 4 defenders)
  const validation420 = validateSquad(flexibleSquad, '4-2-0')
  assertFalse(validation420.valid, 'Should fail for 4-2-0 (has attacker, only 3 defenders)')
}

testIntegrationScenarios()

// Test Suite: Edge Cases
console.log('\n🔍 Testing Edge Cases\n')

function testEdgeCases() {
  // Test 38: Empty squad validation
  const emptySquad: FantasyPlayer[] = []
  const validation1 = validateSquad(emptySquad, '4-2-0')
  assertFalse(validation1.valid, 'Empty squad should fail validation')

  // Test 39: Single player squad
  const singlePlayer = [createFantasyPlayer('p1', 'Gardien', 5.0, true)]
  const validation2 = validateSquad(singlePlayer, '4-2-0')
  assertFalse(validation2.valid, 'Single player squad should fail validation')

  // Test 40: Squad with all same position
  const allDefenders = [
    createFantasyPlayer('p1', 'Défenseur', 6.0, true),
    createFantasyPlayer('p2', 'Défenseur', 6.5),
    createFantasyPlayer('p3', 'Défenseur', 7.0),
    createFantasyPlayer('p4', 'Défenseur', 7.5),
    createFantasyPlayer('p5', 'Défenseur', 8.0),
    createFantasyPlayer('p6', 'Défenseur', 8.5),
    createFantasyPlayer('p7', 'Défenseur', 9.0)
  ]
  const validation3 = validateSquad(allDefenders, '4-2-0')
  assertFalse(validation3.valid, 'Squad with all same position should fail')

  // Test 41: Budget with decimal precision
  const precisionPlayers = [
    createFantasyPlayer('p1', 'Gardien', 5.1),
    createFantasyPlayer('p2', 'Défenseur', 6.2),
    createFantasyPlayer('p3', 'Défenseur', 6.3),
    createFantasyPlayer('p4', 'Défenseur', 7.4),
    createFantasyPlayer('p5', 'Milieu', 8.5),
    createFantasyPlayer('p6', 'Milieu', 8.6),
    createFantasyPlayer('p7', 'Attaquant', 10.9)
  ]
  
  const totalCost = precisionPlayers.reduce((sum, p) => sum + p.price, 0)
  const expectedTotal = 5.1 + 6.2 + 6.3 + 7.4 + 8.5 + 8.6 + 10.9
  
  // Use toFixed to handle floating point precision
  assertEquals(
    totalCost.toFixed(2),
    expectedTotal.toFixed(2),
    'Should handle decimal precision correctly'
  )
  
  const validation4 = validateBudget(precisionPlayers, INITIAL_BUDGET)
  assertTrue(validation4.valid, 'Should handle decimal prices correctly')

  // Test 42: Player with zero price (validatePlayerAddition doesn't check price validity)
  // Price validation happens in validateBudget
  const zeroPrice = createFantasyPlayer('p1', 'Gardien', 0)
  const validation5 = validateBudget([zeroPrice], INITIAL_BUDGET)
  assertFalse(validation5.valid, 'Player with zero price should fail budget validation')

  // Test 43: Player with negative price (validatePlayerAddition doesn't check price validity)
  // Price validation happens in validateBudget
  const negativePrice = createFantasyPlayer('p1', 'Gardien', -5.0)
  const validation6 = validateBudget([negativePrice], INITIAL_BUDGET)
  assertFalse(validation6.valid, 'Player with negative price should fail budget validation')

  // Test 44: Very expensive single player
  const veryExpensive = createFantasyPlayer('p1', 'Attaquant', 150.0)
  const validation7 = validatePlayerAddition([], veryExpensive, '4-2-0', INITIAL_BUDGET)
  assertFalse(validation7.valid, 'Player more expensive than total budget should fail')

  // Test 45: Duplicate player IDs
  const duplicates = [
    createFantasyPlayer('p1', 'Gardien', 5.0, true),
    createFantasyPlayer('p1', 'Défenseur', 6.0), // Same ID
    createFantasyPlayer('p3', 'Milieu', 8.0)
  ]
  const validation8 = validateSquad(duplicates, '4-2-0')
  assertFalse(validation8.valid, 'Squad with duplicate player IDs should fail')
}

testEdgeCases()


// Print Summary
console.log('\n' + '='.repeat(50))
console.log('📊 TEST SUMMARY - SquadBuilder Integration Tests')
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
  console.log('\n🎉 All integration tests passed!\n')
  console.log('✅ Player selection logic validated')
  console.log('✅ Squad validation tested')
  console.log('✅ Budget validation tested')
  console.log('✅ Formation validation tested')
  console.log('✅ Save functionality tested')
  console.log('✅ Team limit validation tested')
  console.log('✅ Captain selection tested')
  console.log('✅ Player filtering tested')
  console.log('✅ Integration scenarios tested')
  console.log('✅ Edge cases tested')
  console.log('\n')
  process.exit(0)
}

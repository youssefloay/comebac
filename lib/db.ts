import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Team, Player, Match, MatchResult, TeamStatistics } from "./types"

// Robust date parsing: handles Firestore Timestamp (.toDate()),
// raw { seconds, nanoseconds } objects, numeric seconds or ms, ISO strings, and Date objects.
function parseDateValue(value: any): Date | null {
  if (!value) return null
  // Firestore Timestamp
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate()
    } catch (e) {
      console.error("Error calling toDate on timestamp:", e)
    }
  }

  // Raw timestamp-like object
  if (typeof value === "object" && value.seconds != null) {
    const secs = Number(value.seconds)
    const nanos = Number(value.nanoseconds || 0)
    return new Date(secs * 1000 + Math.round(nanos / 1e6))
  }

  // Number: treat as seconds if small (< 1e12)
  if (typeof value === "number") {
    return value < 1e12 ? new Date(value * 1000) : new Date(value)
  }

  // String
  if (typeof value === "string") {
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d
  }

  if (value instanceof Date) return value

  try {
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d
  } catch (e) {}

  return null
}

// ============ TEAMS ============

export async function createTeam(teamData: Omit<Team, "id" | "createdAt" | "updatedAt">) {
  try {
    console.log("[v0] Creating team:", teamData)
    const docRef = await addDoc(collection(db, "teams"), {
      ...teamData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    console.log("[v0] Team created successfully with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error creating team:", error)
    throw error
  }
}

export async function getTeams(): Promise<Team[]> {
  try {
    console.log("[v0] Fetching teams from Firestore...")
    const querySnapshot = await getDocs(collection(db, "teams"))
    console.log("[v0] Teams fetched:", querySnapshot.docs.length)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Team[]
  } catch (error) {
    console.error("[v0] Error getting teams:", error)
    throw error
  }
}

export async function getTeam(teamId: string): Promise<Team | null> {
  try {
    const docSnap = await getDoc(doc(db, "teams", teamId))
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as Team
    }
    return null
  } catch (error) {
    console.error("Error getting team:", error)
    throw error
  }
}

export async function updateTeam(teamId: string, teamData: Partial<Omit<Team, "id" | "createdAt">>) {
  try {
    await updateDoc(doc(db, "teams", teamId), {
      ...teamData,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating team:", error)
    throw error
  }
}

export async function deleteTeam(teamId: string) {
  try {
    await deleteDoc(doc(db, "teams", teamId))
  } catch (error) {
    console.error("Error deleting team:", error)
    throw error
  }
}

// ============ PLAYERS ============

export async function createPlayer(playerData: Omit<Player, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = await addDoc(collection(db, "players"), {
      ...playerData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating player:", error)
    throw error
  }
}

export async function getPlayersByTeam(teamId: string): Promise<Player[]> {
  try {
    // Sorting is now done client-side after fetching
    const q = query(collection(db, "players"), where("teamId", "==", teamId))
    const querySnapshot = await getDocs(q)
    const players = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Player[]

    // Sort by player number client-side
    return players.sort((a, b) => (a.number || 0) - (b.number || 0))
  } catch (error) {
    console.error("Error getting players:", error)
    throw error
  }
}

export async function updatePlayer(playerId: string, playerData: Partial<Omit<Player, "id" | "createdAt">>) {
  try {
    await updateDoc(doc(db, "players", playerId), {
      ...playerData,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating player:", error)
    throw error
  }
}

export async function deletePlayer(playerId: string) {
  try {
    await deleteDoc(doc(db, "players", playerId))
  } catch (error) {
    console.error("Error deleting player:", error)
    throw error
  }
}

// ============ MATCHES ============

export async function createMatch(matchData: Omit<Match, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = await addDoc(collection(db, "matches"), {
      ...matchData,
      date: matchData.date instanceof Date ? Timestamp.fromDate(matchData.date) : matchData.date,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating match:", error)
    throw error
  }
}

export async function getMatches(): Promise<Match[]> {
  try {
    const q = query(collection(db, "matches"), orderBy("date", "asc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: parseDateValue(doc.data().date) || new Date(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : parseDateValue(doc.data().createdAt) || new Date(),
      updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : parseDateValue(doc.data().updatedAt) || new Date(),
    })) as Match[]
  } catch (error) {
    console.error("Error getting matches:", error)
    throw error
  }
}

export async function getMatchesByTeam(teamId: string): Promise<Match[]> {
  try {
    const q = query(collection(db, "matches"), where("homeTeamId", "==", teamId), orderBy("date", "asc"))
    const querySnapshot = await getDocs(q)
    const matches = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: parseDateValue(doc.data().date) || new Date(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : parseDateValue(doc.data().createdAt) || new Date(),
      updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : parseDateValue(doc.data().updatedAt) || new Date(),
    })) as Match[]

    // Also get away matches
    const q2 = query(collection(db, "matches"), where("awayTeamId", "==", teamId), orderBy("date", "asc"))
    const querySnapshot2 = await getDocs(q2)
    const awayMatches = querySnapshot2.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: parseDateValue(doc.data().date) || new Date(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : parseDateValue(doc.data().createdAt) || new Date(),
      updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : parseDateValue(doc.data().updatedAt) || new Date(),
    })) as Match[]

    return [...matches, ...awayMatches].sort((a, b) => a.date.getTime() - b.date.getTime())
  } catch (error) {
    console.error("Error getting team matches:", error)
    throw error
  }
}

export async function updateMatch(matchId: string, matchData: Partial<Omit<Match, "id" | "createdAt">>) {
  try {
    const updateData: any = { ...matchData, updatedAt: Timestamp.now() }
    if (matchData.date instanceof Date) {
      updateData.date = Timestamp.fromDate(matchData.date)
    }
    await updateDoc(doc(db, "matches", matchId), updateData)
  } catch (error) {
    console.error("Error updating match:", error)
    throw error
  }
}

// ============ MATCH RESULTS ============

export async function createMatchResult(resultData: Omit<MatchResult, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = await addDoc(collection(db, "matchResults"), {
      ...resultData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating match result:", error)
    throw error
  }
}

export async function getMatchResult(matchId: string): Promise<MatchResult | null> {
  try {
    const q = query(collection(db, "matchResults"), where("matchId", "==", matchId))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.docs.length > 0) {
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as MatchResult
    }
    return null
  } catch (error) {
    console.error("Error getting match result:", error)
    throw error
  }
}

export async function updateMatchResult(resultId: string, resultData: Partial<Omit<MatchResult, "id" | "createdAt">>) {
  try {
    await updateDoc(doc(db, "matchResults", resultId), {
      ...resultData,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating match result:", error)
    throw error
  }
}

export async function getAllMatchResults(): Promise<MatchResult[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "matchResults"))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as MatchResult[]
  } catch (error) {
    console.error("Error getting all match results:", error)
    throw error
  }
}

// ============ TEAM STATISTICS ============

export async function getTeamStatistics(teamId: string): Promise<TeamStatistics | null> {
  try {
    const q = query(collection(db, "teamStatistics"), where("teamId", "==", teamId))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.docs.length > 0) {
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as TeamStatistics
    }
    return null
  } catch (error) {
    console.error("Error getting team statistics:", error)
    throw error
  }
}

export async function getAllTeamStatistics(): Promise<TeamStatistics[]> {
  try {
    const q = query(collection(db, "teamStatistics"), orderBy("points", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as TeamStatistics[]
  } catch (error) {
    console.error("Error getting all statistics:", error)
    throw error
  }
}

export async function updateTeamStatistics(teamId: string, stats: Partial<Omit<TeamStatistics, "id" | "teamId">>) {
  try {
    const q = query(collection(db, "teamStatistics"), where("teamId", "==", teamId))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.docs.length > 0) {
      const docId = querySnapshot.docs[0].id
      await updateDoc(doc(db, "teamStatistics", docId), {
        ...stats,
        updatedAt: Timestamp.now(),
      })
    } else {
      // Create new statistics document if it doesn't exist
      await addDoc(collection(db, "teamStatistics"), {
        teamId,
        ...stats,
        updatedAt: Timestamp.now(),
      })
    }
  } catch (error) {
    console.error("Error updating team statistics:", error)
    throw error
  }
}

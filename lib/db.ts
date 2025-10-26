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

// ============ TEAMS ============

export async function createTeam(teamData: Omit<Team, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = await addDoc(collection(db, "teams"), {
      ...teamData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating team:", error)
    throw error
  }
}

export async function getTeams(): Promise<Team[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "teams"))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Team[]
  } catch (error) {
    console.error("Error getting teams:", error)
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
    const q = query(collection(db, "players"), where("teamId", "==", teamId), orderBy("number"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Player[]
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
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
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
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Match[]

    // Also get away matches
    const q2 = query(collection(db, "matches"), where("awayTeamId", "==", teamId), orderBy("date", "asc"))
    const querySnapshot2 = await getDocs(q2)
    const awayMatches = querySnapshot2.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
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
    const docRef = await addDoc(collection(db, "results"), {
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
    const q = query(collection(db, "results"), where("matchId", "==", matchId))
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
    await updateDoc(doc(db, "results", resultId), {
      ...resultData,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating match result:", error)
    throw error
  }
}

// ============ TEAM STATISTICS ============

export async function getTeamStatistics(teamId: string): Promise<TeamStatistics | null> {
  try {
    const q = query(collection(db, "statistics"), where("teamId", "==", teamId))
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
    const q = query(collection(db, "statistics"), orderBy("points", "desc"))
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
    const q = query(collection(db, "statistics"), where("teamId", "==", teamId))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.docs.length > 0) {
      const docId = querySnapshot.docs[0].id
      await updateDoc(doc(db, "statistics", docId), {
        ...stats,
        updatedAt: Timestamp.now(),
      })
    } else {
      // Create new statistics document if it doesn't exist
      await addDoc(collection(db, "statistics"), {
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

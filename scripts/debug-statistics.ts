import { getMatches, getAllMatchResults, getAllTeamStatistics, getTeams } from "../lib/db"
import { recalculateAllStatistics } from "../lib/statistics"

async function debugStatistics() {
  try {
    console.log("🔍 Debugging Statistics...")
    
    // Get all data
    const [teams, matches, results, statistics] = await Promise.all([
      getTeams(),
      getMatches(),
      getAllMatchResults(),
      getAllTeamStatistics()
    ])
    
    console.log("\n📊 Current Data:")
    console.log(`Teams: ${teams.length}`)
    console.log(`Matches: ${matches.length}`)
    console.log(`Match Results: ${results.length}`)
    console.log(`Team Statistics: ${statistics.length}`)
    
    // Show completed matches
    const completedMatches = matches.filter(m => m.status === "completed")
    console.log(`Completed Matches: ${completedMatches.length}`)
    
    // Show matches with results
    const matchesWithResults = matches.filter(m => 
      results.some(r => r.matchId === m.id)
    )
    console.log(`Matches with Results: ${matchesWithResults.length}`)
    
    console.log("\n🏆 Teams:")
    teams.forEach(team => {
      console.log(`- ${team.name} (ID: ${team.id})`)
    })
    
    console.log("\n⚽ Match Results:")
    results.forEach(result => {
      const match = matches.find(m => m.id === result.matchId)
      if (match) {
        const homeTeam = teams.find(t => t.id === match.homeTeamId)
        const awayTeam = teams.find(t => t.id === match.awayTeamId)
        console.log(`- ${homeTeam?.name || 'Unknown'} ${result.homeTeamScore} - ${result.awayTeamScore} ${awayTeam?.name || 'Unknown'}`)
      }
    })
    
    console.log("\n📈 Current Statistics:")
    statistics.forEach(stat => {
      const team = teams.find(t => t.id === stat.teamId)
      console.log(`- ${team?.name || 'Unknown'}: ${stat.matchesPlayed}M ${stat.wins}W ${stat.draws}D ${stat.losses}L ${stat.points}P`)
    })
    
    console.log("\n🔄 Recalculating statistics...")
    await recalculateAllStatistics()
    
    // Get updated statistics
    const updatedStatistics = await getAllTeamStatistics()
    console.log("\n📈 Updated Statistics:")
    updatedStatistics.forEach(stat => {
      const team = teams.find(t => t.id === stat.teamId)
      console.log(`- ${team?.name || 'Unknown'}: ${stat.matchesPlayed}M ${stat.wins}W ${stat.draws}D ${stat.losses}L ${stat.points}P`)
    })
    
    console.log("\n✅ Debug complete!")
    
  } catch (error) {
    console.error("❌ Error debugging statistics:", error)
  }
}

// Run if called directly
if (require.main === module) {
  debugStatistics()
}

export { debugStatistics }
"use client"

import { useState, useEffect } from "react"

export default function TestAPIPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testTeamsAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("Testing teams API...")
      const response = await fetch('/api/admin/teams')
      console.log("Teams API response status:", response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Teams data:", data)
      setTeams(data)
    } catch (err) {
      console.error("Teams API error:", err)
      setError(`Teams API error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testPlayersAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("Testing players API...")
      const response = await fetch('/api/admin/players')
      console.log("Players API response status:", response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Players data:", data)
      setPlayers(data)
    } catch (err) {
      console.error("Players API error:", err)
      setError(`Players API error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestTeam = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const testTeam = {
        name: "FC Test Caire",
        logo: "https://images.unsplash.com/photo-1614632537190-23e4b21ff3c3?w=200&h=200&fit=crop",
        color: "#1E40AF"
      }
      
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testTeam)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Team created:", data)
      
      // Refresh teams list
      await testTeamsAPI()
    } catch (err) {
      console.error("Create team error:", err)
      setError(`Create team error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestTeams = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/create-test-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Test teams created:", data)
      
      // Refresh teams list
      await testTeamsAPI()
    } catch (err) {
      console.error("Create test teams error:", err)
      setError(`Create test teams error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestPlayers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/create-test-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Test players created:", data)
      
      // Refresh players list
      await testPlayersAPI()
    } catch (err) {
      console.error("Create test players error:", err)
      setError(`Create test players error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testTeamsAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Test API</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Teams Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Teams API Test</h2>
              <div className="space-x-2">
                <button
                  onClick={testTeamsAPI}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Test Teams API"}
                </button>
                <button
                  onClick={createTestTeam}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Create Test Team
                </button>
                <button
                  onClick={createTestTeams}
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Create All Test Teams
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Teams found: {teams.length}</p>
              {teams.length > 0 ? (
                <div className="space-y-2">
                  {teams.map((team, index) => (
                    <div key={team.id || index} className="p-3 bg-gray-50 rounded">
                      <p><strong>Name:</strong> {team.name}</p>
                      <p><strong>ID:</strong> {team.id}</p>
                      <p><strong>Color:</strong> {team.color}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No teams found</p>
              )}
            </div>
          </div>
          
          {/* Players Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Players API Test</h2>
              <div className="space-x-2">
                <button
                  onClick={testPlayersAPI}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Test Players API"}
                </button>
                <button
                  onClick={createTestPlayers}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Create Test Players
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Players found: {players.length}</p>
              {players.length > 0 ? (
                <div className="space-y-2">
                  {players.slice(0, 5).map((player, index) => (
                    <div key={player.id || index} className="p-3 bg-gray-50 rounded">
                      <p><strong>Name:</strong> {player.name}</p>
                      <p><strong>Position:</strong> {player.position}</p>
                      <p><strong>Team ID:</strong> {player.teamId}</p>
                    </div>
                  ))}
                  {players.length > 5 && (
                    <p className="text-gray-500">... and {players.length - 5} more</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No players found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
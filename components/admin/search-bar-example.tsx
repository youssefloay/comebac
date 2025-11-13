/**
 * EXEMPLE D'UTILISATION DU COMPOSANT SearchBar
 * 
 * Ce fichier montre comment intégrer la barre de recherche
 * dans n'importe quelle page admin.
 */

"use client"

import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { SearchBar, SearchResult } from './search-bar'

export function SearchBarExample() {
  const [searchData, setSearchData] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les données au montage du composant
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Charger les entraîneurs
      const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
      const coaches: SearchResult[] = coachesSnap.docs.map(doc => ({
        id: doc.id,
        type: 'coach',
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        email: doc.data().email,
        teamName: doc.data().teamName,
      }))

      // Charger les joueurs
      const playersSnap = await getDocs(collection(db, 'playerAccounts'))
      const players: SearchResult[] = playersSnap.docs.map(doc => ({
        id: doc.id,
        type: 'player',
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        email: doc.data().email,
        teamName: doc.data().teamName,
        position: doc.data().position,
        jerseyNumber: doc.data().jerseyNumber,
      }))

      // Combiner et trier par nom
      const allData = [...coaches, ...players].sort((a, b) => 
        a.lastName.localeCompare(b.lastName)
      )

      setSearchData(allData)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  // Gérer la sélection d'un résultat
  const handleSelect = (result: SearchResult) => {
    console.log('Résultat sélectionné:', result)
    
    // Exemples d'actions possibles :
    
    // 1. Rediriger vers une page de détails
    // window.location.href = `/${result.type}/${result.id}`
    
    // 2. Ouvrir un modal avec les détails
    // setSelectedUser(result)
    // setModalOpen(true)
    
    // 3. Se faire passer pour l'utilisateur
    if (result.type === 'coach') {
      sessionStorage.setItem('impersonateCoachId', result.id)
      window.location.href = '/coach'
    } else {
      sessionStorage.setItem('impersonatePlayerId', result.id)
      window.location.href = '/player'
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
        Chargement...
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl">
      <SearchBar
        data={searchData}
        onSelect={handleSelect}
        placeholder="Rechercher un joueur ou entraîneur..."
        maxSuggestions={8}
      />
      
      {/* Afficher le nombre total d'utilisateurs */}
      <div className="mt-2 text-sm text-gray-600">
        {searchData.filter(d => d.type === 'coach').length} entraîneurs, {' '}
        {searchData.filter(d => d.type === 'player').length} joueurs
      </div>
    </div>
  )
}

/**
 * EXEMPLE 2: Recherche avec filtres
 */
export function SearchBarWithFilters() {
  const [searchData, setSearchData] = useState<SearchResult[]>([])
  const [filteredData, setFilteredData] = useState<SearchResult[]>([])
  const [filter, setFilter] = useState<'all' | 'coach' | 'player'>('all')

  useEffect(() => {
    // Appliquer le filtre
    if (filter === 'all') {
      setFilteredData(searchData)
    } else {
      setFilteredData(searchData.filter(d => d.type === filter))
    }
  }, [filter, searchData])

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Filtres */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('coach')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'coach'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Entraîneurs
        </button>
        <button
          onClick={() => setFilter('player')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'player'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Joueurs
        </button>
      </div>

      {/* Barre de recherche */}
      <SearchBar
        data={filteredData}
        onSelect={(result) => console.log(result)}
        placeholder={
          filter === 'all'
            ? 'Rechercher...'
            : filter === 'coach'
            ? 'Rechercher un entraîneur...'
            : 'Rechercher un joueur...'
        }
      />
    </div>
  )
}

/**
 * EXEMPLE 3: Recherche compacte pour header
 */
export function CompactSearchBar() {
  const [searchData, setSearchData] = useState<SearchResult[]>([])

  return (
    <div className="w-64">
      <SearchBar
        data={searchData}
        onSelect={(result) => {
          // Action rapide
          alert(`Vous avez sélectionné: ${result.firstName} ${result.lastName}`)
        }}
        placeholder="Recherche rapide..."
        maxSuggestions={5}
      />
    </div>
  )
}

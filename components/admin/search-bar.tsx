"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

export interface SearchResult {
  id: string
  type: 'coach' | 'player' | 'user' | 'admin'
  firstName: string
  lastName: string
  email: string
  teamName?: string
  position?: string
  jerseyNumber?: number
  role?: string
  phone?: string
  createdAt?: any
  lastLogin?: any
  emailVerified?: boolean
  hasLoggedIn?: boolean
  uid?: string
  teamId?: string
  // Informations supplémentaires pour les joueurs
  nickname?: string
  birthDate?: string
  height?: number
  foot?: string
  tshirtSize?: string
  grade?: string
  schoolName?: string
}

interface SearchBarProps {
  data: SearchResult[]
  onSelect: (result: SearchResult) => void
  placeholder?: string
  maxSuggestions?: number
}

export function SearchBar({ 
  data, 
  onSelect, 
  placeholder = "Rechercher un joueur ou entraîneur...",
  maxSuggestions = 8
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrer et afficher les suggestions
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const filtered = data.filter(item => {
      const searchLower = searchTerm.toLowerCase()
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase()
      const email = item.email.toLowerCase()
      const team = item.teamName?.toLowerCase() || ''
      const position = item.position?.toLowerCase() || ''
      const role = item.role?.toLowerCase() || ''
      const nickname = item.nickname?.toLowerCase() || ''
      const phone = item.phone?.toLowerCase() || ''
      
      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        team.includes(searchLower) ||
        position.includes(searchLower) ||
        role.includes(searchLower) ||
        nickname.includes(searchLower) ||
        phone.includes(searchLower)
      )
    }).slice(0, maxSuggestions)

    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
    setSelectedIndex(-1)
  }, [searchTerm, data, maxSuggestions])

  const handleSelect = (result: SearchResult) => {
    setSearchTerm('')
    setShowSuggestions(false)
    onSelect(result)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Jamais'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Input de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-[600px] overflow-y-auto">
          {suggestions.map((result, index) => (
            <button
              key={`${result.type}-${result.id}-${result.uid || ''}`}
              onClick={() => handleSelect(result)}
              className={`w-full px-5 py-5 flex items-start gap-4 hover:bg-blue-50 transition border-b-2 border-gray-200 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  result.type === 'coach' 
                    ? 'bg-gradient-to-br from-orange-600 to-red-600'
                    : result.type === 'player'
                    ? 'bg-gradient-to-br from-blue-600 to-green-600'
                    : result.type === 'admin'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                    : 'bg-gradient-to-br from-gray-600 to-gray-800'
                }`}>
                  {result.firstName[0]}{result.lastName[0]}
                </div>
                {result.type === 'player' && result.jerseyNumber && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                    {result.jerseyNumber}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                {/* Nom et type */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-black text-black text-lg">
                    {result.firstName} {result.lastName}
                    {result.type === 'player' && result.nickname && (
                      <span className="text-sm text-blue-600 ml-2 font-normal">
                        "{result.nickname}"
                      </span>
                    )}
                  </span>
                  {result.type === 'coach' ? (
                    <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-xs font-bold">
                      COACH
                    </span>
                  ) : result.type === 'player' ? (
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">
                      JOUEUR
                    </span>
                  ) : result.type === 'admin' ? (
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs font-bold">
                      ADMIN
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-600 text-white rounded text-xs font-bold">
                      USER
                    </span>
                  )}
                  
                  {/* Statut de connexion */}
                  {result.hasLoggedIn ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                      ✓ Actif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                      ✗ Jamais connecté
                    </span>
                  )}

                  {/* Email vérifié */}
                  {result.emailVerified === false && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                      ⚠ Email non vérifié
                    </span>
                  )}
                </div>

                {/* Email et ID */}
                <div className="space-y-1 mb-2 bg-gray-50 p-2 rounded border border-gray-200">
                  <p className="text-sm font-bold text-black truncate">
                    📧 {result.email}
                  </p>
                  {result.uid && (
                    <p className="text-xs font-semibold text-gray-700 truncate font-mono">
                      🆔 {result.uid}
                    </p>
                  )}
                </div>

                {/* Informations détaillées - Ligne 1 */}
                <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                  {/* Équipe */}
                  {result.teamName && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 border-2 border-blue-400 rounded">
                      <span className="text-blue-900 font-bold text-sm">⚽</span>
                      <span className="text-blue-900 font-bold">{result.teamName}</span>
                    </div>
                  )}

                  {/* Position (joueurs) */}
                  {result.position && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 border-2 border-green-400 rounded">
                      <span className="text-green-900 font-bold text-sm">📍</span>
                      <span className="text-green-900 font-bold">{result.position}</span>
                    </div>
                  )}

                  {/* Numéro de maillot (joueurs) */}
                  {result.jerseyNumber && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 border-2 border-indigo-400 rounded">
                      <span className="text-indigo-900 font-bold text-sm">#</span>
                      <span className="text-indigo-900 font-bold">{result.jerseyNumber}</span>
                    </div>
                  )}

                  {/* Rôle (utilisateurs) */}
                  {result.role && result.type === 'user' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 border-2 border-gray-400 rounded">
                      <span className="text-gray-900 font-bold text-sm">👤</span>
                      <span className="text-gray-900 font-bold">{result.role}</span>
                    </div>
                  )}
                </div>

                {/* Informations temporelles - Ligne 2 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Dernière connexion */}
                  {result.lastLogin && (
                    <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200">
                      <span className="text-sm">🕐</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-green-700 font-semibold">Connexion</span>
                        <span className="font-bold text-green-900">
                          {formatDate(result.lastLogin)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Date de création */}
                  {result.createdAt && (
                    <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                      <span className="text-sm">📅</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-purple-700 font-semibold">Créé le</span>
                        <span className="font-bold text-purple-900">
                          {formatDate(result.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Aucun résultat */}
      {showSuggestions && searchTerm && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-6 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Aucun résultat pour "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}

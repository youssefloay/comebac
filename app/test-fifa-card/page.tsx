"use client"

import { FifaCardPersonal } from "@/components/fifa/fifa-card-personal"
import type { Player, Team } from "@/lib/types"

export default function TestFIFACardPage() {
  // Exemple de joueur avec les nouvelles informations
  const testPlayer: Player = {
    id: "test-1",
    name: "Ahmed El-Masry",
    number: 10,
    position: "Milieu",
    teamId: "team-1",
    photo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=300&fit=crop&crop=face",
    
    // Nouvelles informations personnelles
    birthDate: "2007-03-15",
    age: 17,
    nationality: "Égypte",
    height: 175,
    weight: 68,
    birthPlace: "Le Caire",
    
    // Informations scolaires
    school: "Lycée Français du Caire",
    grade: "1ère S",
    favoriteSubject: "Mathématiques",
    languages: ["Arabe", "Français", "Anglais"],
    
    // Informations sportives
    alternativePositions: ["MOC", "MDC"],
    strongFoot: "Droit",
    experienceYears: 6,
    preferredNumber: 7,
    overall: 82,
    
    // Statistiques de saison
    seasonStats: {
      goals: 5,
      assists: 8,
      matches: 12,
      yellowCards: 2,
      redCards: 0,
      minutesPlayed: 1080
    },
    
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const testTeam: Team = {
    id: "team-1",
    name: "FC Pyramides",
    logo: "https://images.unsplash.com/photo-1614632537190-23e4b21ff3c3?w=200&h=200&fit=crop",
    color: "#1E40AF",
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test des nouvelles cartes FIFA avec informations personnelles
        </h1>
        
        <div className="flex flex-wrap justify-center gap-8">
          {/* Carte avec informations personnelles */}
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Carte FIFA avec Informations Personnelles</h2>
            <FifaCardPersonal 
              player={testPlayer} 
              team={testTeam}
            />
          </div>
        </div>

        {/* Informations affichées */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Informations du joueur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Informations de base :</strong>
              <ul className="mt-2 space-y-1">
                <li>Nom: {testPlayer.name}</li>
                <li>Âge: {testPlayer.age} ans</li>
                <li>Nationalité: {testPlayer.nationality}</li>
                <li>Position: {testPlayer.position}</li>
                <li>Numéro: {testPlayer.number}</li>
              </ul>
            </div>
            
            <div>
              <strong>Informations physiques :</strong>
              <ul className="mt-2 space-y-1">
                <li>Taille: {testPlayer.height} cm</li>
                <li>Poids: {testPlayer.weight} kg</li>
                <li>Pied fort: {testPlayer.strongFoot}</li>
                <li>Lieu de naissance: {testPlayer.birthPlace}</li>
                <li>Date de naissance: {testPlayer.birthDate}</li>
              </ul>
            </div>
            
            <div>
              <strong>Informations scolaires :</strong>
              <ul className="mt-2 space-y-1">
                <li>École: {testPlayer.school}</li>
                <li>Classe: {testPlayer.grade}</li>
                <li>Matière préférée: {testPlayer.favoriteSubject}</li>
                <li>Langues: {testPlayer.languages?.join(", ")}</li>
              </ul>
            </div>
            
            <div>
              <strong>Informations sportives :</strong>
              <ul className="mt-2 space-y-1">
                <li>Expérience: {testPlayer.experienceYears} ans</li>
                <li>Numéro préféré: {testPlayer.preferredNumber}</li>
                <li>Positions alt.: {testPlayer.alternativePositions?.join(", ")}</li>
                <li>Note générale: {testPlayer.overall}/99</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
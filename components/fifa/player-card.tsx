"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import type { Player, Team } from "@/lib/types"

interface PlayerCardProps {
  player: Player
  team?: Team
  variant?: "standard" | "compact"
}

export function FIFAPlayerCard({ 
  player, 
  team, 
  variant = "standard"
}: PlayerCardProps) {
  const [imageError, setImageError] = useState(false)

  // Position abrégée FIFA
  const getPositionAbbr = (position: string) => {
    switch (position) {
      case "Gardien": return "GK"
      case "Défenseur": return "CB"
      case "Milieu": return "CM"
      case "Attaquant": return "ST"
      default: return "CM"
    }
  }

  // Couleur de carte basée sur la note
  const getCardType = (overall: number) => {
    if (overall >= 90) return "fifa-gold"
    if (overall >= 85) return "fifa-purple"
    if (overall >= 80) return "fifa-blue"
    if (overall >= 75) return "fifa-green"
    return "fifa-bronze"
  }

  const overall = player.overall || 65
  const cardType = getCardType(overall)
  const positionAbbr = getPositionAbbr(player.position)

  // Photo par défaut basée sur l'ID du joueur pour cohérence
  const getDefaultPhoto = () => {
    const photos = [
      "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face"
    ]
    const index = (parseInt(player.id.slice(-1)) || player.number || 1) % photos.length
    return photos[index]
  }

  const photoUrl = player.photo || getDefaultPhoto()

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ scale: 1.05, y: -3 }}
        className="fifa-card-compact"
      >
        <div className={`fifa-card-bg ${cardType}`}>
          <div className="fifa-pattern"></div>
          
          {/* Rating et position */}
          <div className="fifa-rating-section">
            <div className="fifa-overall">{overall}</div>
            <div className="fifa-position">{positionAbbr}</div>
          </div>
          
          {/* Drapeau */}
          {player.nationality && (
            <div className="fifa-flag">
              <span className="fifa-flag-text">{player.nationality.slice(0, 3).toUpperCase()}</span>
            </div>
          )}
          
          {/* Logo club */}
          {team?.logo && (
            <div className="fifa-club-logo">
              <Image
                src={team.logo}
                alt={team.name}
                width={25}
                height={25}
                className="fifa-logo-image"
              />
            </div>
          )}
          
          {/* Photo */}
          <div className="fifa-photo-compact">
            {!imageError ? (
              <Image
                src={photoUrl}
                alt={player.name}
                width={70}
                height={70}
                className="fifa-player-image"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="fifa-placeholder-compact">
                <span className="fifa-placeholder-text">?</span>
              </div>
            )}
          </div>
          
          {/* Nom */}
          <div className="fifa-player-name">
            <div className="fifa-name-main">{player.name.split(' ')[0]}</div>
          </div>
          
          {/* Infos compactes */}
          <div className="fifa-info-compact">
            {player.age && (
              <div className="fifa-info-item-compact">
                <span className="fifa-info-value-compact">{player.age}</span>
                <span className="fifa-info-label-compact">ANS</span>
              </div>
            )}
            {player.height && (
              <div className="fifa-info-item-compact">
                <span className="fifa-info-value-compact">{player.height}</span>
                <span className="fifa-info-label-compact">CM</span>
              </div>
            )}
            {player.strongFoot && (
              <div className="fifa-info-item-compact">
                <span className="fifa-info-value-compact">{player.strongFoot.charAt(0)}</span>
                <span className="fifa-info-label-compact">PIED</span>
              </div>
            )}
            {player.experienceYears && (
              <div className="fifa-info-item-compact">
                <span className="fifa-info-value-compact">{player.experienceYears}</span>
                <span className="fifa-info-label-compact">EXP</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className="fifa-card"
    >
      <div className={`fifa-card-bg ${cardType}`}>
        <div className="fifa-pattern"></div>
        
        {/* Rating et position */}
        <div className="fifa-rating-section">
          <div className="fifa-overall-large">{overall}</div>
          <div className="fifa-position-large">{positionAbbr}</div>
        </div>
        
        {/* Drapeau */}
        {player.nationality && (
          <div className="fifa-flag">
            <span className="fifa-flag-text">{player.nationality.slice(0, 3).toUpperCase()}</span>
          </div>
        )}
        
        {/* Logo club */}
        {team?.logo && (
          <div className="fifa-club-logo">
            <Image
              src={team.logo}
              alt={team.name}
              width={35}
              height={35}
              className="fifa-logo-image"
            />
          </div>
        )}

        {/* Photo principale */}
        <div className="fifa-photo-main">
          {!imageError ? (
            <Image
              src={photoUrl}
              alt={player.name}
              width={120}
              height={120}
              className="fifa-player-image-main"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="fifa-placeholder-main">
              <span className="fifa-placeholder-text-main">?</span>
            </div>
          )}
        </div>

        {/* Nom du joueur */}
        <div className="fifa-player-name">
          <div className="fifa-name-main">{player.name}</div>
        </div>

        {/* Informations personnelles et sportives */}
        <div className="fifa-player-info">
          <div className="fifa-info-section">
            {/* Date de naissance et âge */}
            {player.birthDate && (
              <div className="fifa-info-item">
                <span className="fifa-info-label">Né le</span>
                <span className="fifa-info-value">{new Date(player.birthDate).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            
            {/* Taille et poids */}
            <div className="fifa-info-row">
              {player.height && (
                <div className="fifa-info-item-small">
                  <span className="fifa-info-label">Taille</span>
                  <span className="fifa-info-value">{player.height} cm</span>
                </div>
              )}
              {player.weight && (
                <div className="fifa-info-item-small">
                  <span className="fifa-info-label">Poids</span>
                  <span className="fifa-info-value">{player.weight} kg</span>
                </div>
              )}
            </div>
            
            {/* École */}
            {player.school && (
              <div className="fifa-info-item">
                <span className="fifa-info-label">École</span>
                <span className="fifa-info-value">{player.school}</span>
              </div>
            )}
            
            {/* Classe et matière préférée */}
            <div className="fifa-info-row">
              {player.grade && (
                <div className="fifa-info-item-small">
                  <span className="fifa-info-label">Classe</span>
                  <span className="fifa-info-value">{player.grade}</span>
                </div>
              )}
              {player.favoriteSubject && (
                <div className="fifa-info-item-small">
                  <span className="fifa-info-label">Matière</span>
                  <span className="fifa-info-value">{player.favoriteSubject}</span>
                </div>
              )}
            </div>
            
            {/* Pied fort et expérience */}
            <div className="fifa-info-row">
              {player.strongFoot && (
                <div className="fifa-info-item-small">
                  <span className="fifa-info-label">Pied</span>
                  <span className="fifa-info-value">{player.strongFoot}</span>
                </div>
              )}
              {player.experienceYears && (
                <div className="fifa-info-item-small">
                  <span className="fifa-info-label">Exp.</span>
                  <span className="fifa-info-value">{player.experienceYears} ans</span>
                </div>
              )}
            </div>
            
            {/* Positions alternatives */}
            {player.alternativePositions && player.alternativePositions.length > 0 && (
              <div className="fifa-info-item">
                <span className="fifa-info-label">Autres pos.</span>
                <span className="fifa-info-value">{player.alternativePositions.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}


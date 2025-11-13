"use client"

import Image from "next/image"
import type { Player, Team } from "@/lib/types"

interface FifaCardPersonalProps {
  player: Player
  team?: Team
}

export function FifaCardPersonal({
  player,
  team
}: FifaCardPersonalProps) {
  // Calculer l'âge si on a la date de naissance
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = player.birthDate ? calculateAge(player.birthDate) : player.age || 17

  return (
    <div className="fifa-card-container">
      <div className="fifa-card-wrapper active">
        {/* SVG Clip Path */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 267.3 427.3" className="fifa-svg-clip">
          <clipPath id="fifaPath">
            <path fill="#000" d="M265.3 53.9a33.3 33.3 0 0 1-17.8-5.5 32 32 0 0 1-13.7-22.9c-.2-1.1-.4-2.3-.4-3.4 0-1.3-1-1.5-1.8-1.9a163 163 0 0 0-31-11.6A257.3 257.3 0 0 0 133.7 0a254.9 254.9 0 0 0-67.1 8.7 170 170 0 0 0-31 11.6c-.8.4-1.8.6-1.8 1.9 0 1.1-.2 2.3-.4 3.4a32.4 32.4 0 0 1-13.7 22.9A33.8 33.8 0 0 1 2 53.9c-1.5.1-2.1.4-2 2v293.9c0 3.3 0 6.6.4 9.9a22 22 0 0 0 7.9 14.4c3.8 3.2 8.3 5.3 13 6.8 12.4 3.9 24.8 7.5 37.2 11.5a388.7 388.7 0 0 1 50 19.4 88.7 88.7 0 0 1 25 15.5v.1-.1c7.2-7 16.1-11.3 25-15.5a427 427 0 0 1 50-19.4l37.2-11.5c4.7-1.5 9.1-3.5 13-6.8 4.5-3.8 7.2-8.5 7.9-14.4.4-3.3.4-6.6.4-9.9V231.6 60.5v-4.6c.4-1.6-.3-1.9-1.7-2z"/>
          </clipPath>
        </svg>

        <div className="fifa-card-inner">
          {/* Top Section */}
          <div className="fifa-card-top">
            <div className="fifa-info">
              <div className="fifa-value">{player.overall || 75}</div>
              <div className="fifa-position">
                {player.position === "Gardien" ? "GK" :
                 player.position === "Défenseur" ? "CB" :
                 player.position === "Milieu" ? "CM" : "ST"}
              </div>
              
              {/* Country Flag */}
              <div className="fifa-country">
                <div className="fifa-flag-container">
                  <div className="fifa-flag-placeholder"></div>
                </div>
              </div>
              
              {/* Club Logo */}
              <div className="fifa-club">
                <div className="fifa-club-container">
                  {team?.logo ? (
                    <Image
                      src={team.logo}
                      alt={team.name}
                      width={40}
                      height={60}
                      className="fifa-club-image"
                    />
                  ) : (
                    <div className="fifa-club-placeholder"></div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Player Image */}
            <div className="fifa-player-image">
              <Image
                src={player.photo || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=300&fit=crop&crop=face"}
                alt={player.name}
                width={200}
                height={300}
                className="fifa-player-photo"
                unoptimized
              />
            </div>
            
            {/* Background Font */}
            <div className="fifa-backfont">FIFA</div>
          </div>

          {/* Bottom Section */}
          <div className="fifa-card-bottom">
            <div className="fifa-player-name">
              {player.name.length > 12 ? player.name.substring(0, 12) + '...' : player.name}
            </div>
            
            {/* Section des informations personnelles (remplace les stats FIFA) */}
            <div className="fifa-stats-section">
              <div className="fifa-stats-left">
                <ul>
                  <li><span>{age}</span><span>ANS</span></li>
                  <li><span>{player.height || 175}</span><span>CM</span></li>
                  <li><span>{player.experienceYears || 5}</span><span>EXP</span></li>
                </ul>
              </div>
              <div className="fifa-stats-right">
                <ul>
                  <li><span>{player.strongFoot?.charAt(0) || "D"}</span><span>PIED</span></li>
                  <li><span>{player.grade?.slice(0, 3) || "TER"}</span><span>CLS</span></li>
                  <li><span>{player.preferredNumber || player.number}</span><span>N°</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import Image from "next/image"

interface FifaCardAuthenticProps {
  playerName: string
  overall: number
  position: string
  nationality: string
  club: string
  playerImage: string
  countryFlag?: string
  clubLogo?: string
  stats: {
    pace: number
    shooting: number
    passing: number
    dribbling: number
    defending: number
    physical: number
  }
}

export function FifaCardAuthentic({
  playerName,
  overall,
  position,
  nationality,
  club,
  playerImage,
  countryFlag,
  clubLogo,
  stats
}: FifaCardAuthenticProps) {
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
              <div className="fifa-value">{overall}</div>
              <div className="fifa-position">{position}</div>
              
              {/* Country Flag */}
              <div className="fifa-country">
                <div className="fifa-flag-container">
                  {countryFlag ? (
                    <Image
                      src={countryFlag}
                      alt={nationality}
                      width={40}
                      height={25}
                      className="fifa-flag-image"
                    />
                  ) : (
                    <div className="fifa-flag-placeholder"></div>
                  )}
                </div>
              </div>
              
              {/* Club Logo */}
              <div className="fifa-club">
                <div className="fifa-club-container">
                  {clubLogo ? (
                    <Image
                      src={clubLogo}
                      alt={club}
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
                src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=600&fit=crop&crop=face"
                alt={playerName}
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
              {playerName.length > 12 ? playerName.substring(0, 12) + '...' : playerName}
            </div>
            
            <div className="fifa-stats-section">
              <div className="fifa-stats-left">
                <ul>
                  <li><span>{stats.pace}</span><span>PAC</span></li>
                  <li><span>{stats.shooting}</span><span>SHO</span></li>
                  <li><span>{stats.passing}</span><span>PAS</span></li>
                </ul>
              </div>
              <div className="fifa-stats-right">
                <ul>
                  <li><span>{stats.dribbling}</span><span>DRI</span></li>
                  <li><span>{stats.defending}</span><span>DEF</span></li>
                  <li><span>{stats.physical}</span><span>PHY</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
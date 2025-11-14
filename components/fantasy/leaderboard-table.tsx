"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Trophy, 
  Medal, 
  Award, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  Users
} from 'lucide-react'
import type { LeaderboardEntry } from '@/lib/types/fantasy'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  currentUserTeamId?: string
  totalEntries: number
  currentPage: number
  pageSize?: number
  onPageChange: (page: number) => void
  onSearch?: (query: string) => void
  showGameweekPoints?: boolean
  title?: string
  emptyMessage?: string
}

export function LeaderboardTable({
  entries,
  currentUserId,
  currentUserTeamId,
  totalEntries,
  currentPage,
  pageSize = 50,
  onPageChange,
  onSearch,
  showGameweekPoints = false,
  title = 'Classement Fantasy',
  emptyMessage = 'Aucune équipe dans le classement'
}: LeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const totalPages = Math.ceil(totalEntries / pageSize)
  const startRank = (currentPage - 1) * pageSize + 1
  const endRank = Math.min(currentPage * pageSize, totalEntries)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white'
    if (rank <= 10) return 'bg-sofa-green text-white'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  const isCurrentUserTeam = (teamId: string) => {
    return currentUserTeamId === teamId
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sofa-green/10 rounded-lg">
              <Trophy className="w-6 h-6 text-sofa-green" />
            </div>
            <div>
              <CardTitle className="text-sofa-text-primary">{title}</CardTitle>
              <p className="text-sm text-sofa-text-muted mt-1">
                {totalEntries} équipe{totalEntries > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>

          {/* Search */}
          {onSearch && (
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sofa-text-muted" />
              <Input
                type="text"
                placeholder="Rechercher une équipe..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-sofa-text-muted opacity-50" />
            <p className="text-sofa-text-muted">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-sofa-border">
                    <th className="text-left py-2 md:py-3 px-2 text-xs md:text-sm font-semibold text-sofa-text-muted">
                      Rang
                    </th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-sofa-text-muted">
                      Équipe
                    </th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-sofa-text-muted">
                      Points totaux
                    </th>
                    {showGameweekPoints && (
                      <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-sofa-text-muted">
                        Semaine
                      </th>
                    )}
                    <th className="text-center py-2 md:py-3 px-2 text-xs md:text-sm font-semibold text-sofa-text-muted">
                      Badges
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const isUserTeam = isCurrentUserTeam(entry.teamId)
                    
                    return (
                      <motion.tr
                        key={entry.teamId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={`
                          border-b border-sofa-border transition-colors
                          ${isUserTeam 
                            ? 'bg-gradient-to-r from-sofa-green/10 to-emerald-50 dark:from-sofa-green/20 dark:to-emerald-900/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }
                        `}
                      >
                        {/* Rank */}
                        <td className="py-3 md:py-4 px-2">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Badge 
                              className={`
                                ${getRankBadgeColor(entry.rank)} 
                                font-bold min-w-[2rem] md:min-w-[2.5rem] justify-center text-xs
                              `}
                            >
                              {entry.rank}
                            </Badge>
                            <span className="hidden md:inline">{getRankIcon(entry.rank)}</span>
                          </div>
                        </td>

                        {/* Team Name */}
                        <td className="py-3 md:py-4 px-2 md:px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 md:gap-2">
                              <span className={`
                                font-semibold text-sm md:text-base truncate max-w-[120px] md:max-w-none
                                ${isUserTeam ? 'text-sofa-green' : 'text-sofa-text-primary'}
                              `}>
                                {entry.teamName}
                              </span>
                              {isUserTeam && (
                                <Badge className="bg-sofa-green text-white text-[10px] md:text-xs">
                                  Vous
                                </Badge>
                              )}
                            </div>
                            {entry.userName && (
                              <span className="text-[10px] md:text-xs text-sofa-text-muted mt-0.5 truncate max-w-[120px] md:max-w-none">
                                {entry.userName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total Points */}
                        <td className="py-3 md:py-4 px-2 md:px-4 text-right">
                          <div className="flex items-center justify-end gap-0.5 md:gap-1">
                            <span className="text-base md:text-lg font-bold text-sofa-text-primary">
                              {entry.totalPoints}
                            </span>
                            <span className="text-xs md:text-sm text-sofa-text-muted hidden sm:inline">pts</span>
                          </div>
                        </td>

                        {/* Gameweek Points */}
                        {showGameweekPoints && (
                          <td className="py-3 md:py-4 px-2 md:px-4 text-right">
                            <div className="flex items-center justify-end gap-0.5 md:gap-1">
                              <TrendingUp className="w-3 h-3 text-sofa-green hidden md:inline" />
                              <span className="font-semibold text-sofa-green text-sm md:text-base">
                                {entry.gameweekPoints}
                              </span>
                              <span className="text-[10px] md:text-xs text-sofa-text-muted hidden sm:inline">pts</span>
                            </div>
                          </td>
                        )}

                        {/* Badges */}
                        <td className="py-3 md:py-4 px-2">
                          <div className="flex items-center justify-center gap-0.5 md:gap-1">
                            {entry.badges.length > 0 ? (
                              entry.badges.slice(0, 2).map((badge, i) => (
                                <span 
                                  key={i} 
                                  className="text-base md:text-lg" 
                                  title={badge}
                                >
                                  {getBadgeIcon(badge)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-sofa-text-muted">-</span>
                            )}
                            {entry.badges.length > 2 && (
                              <span className="text-[10px] md:text-xs text-sofa-text-muted">
                                +{entry.badges.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
                <div className="text-xs md:text-sm text-sofa-text-muted">
                  Affichage {startRank} - {endRank} sur {totalEntries}
                </div>

                <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center">
                  {/* First Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="hidden sm:flex"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>

                  {/* Previous Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">Précédent</span>
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers(currentPage, totalPages).map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-sofa-text-muted">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page as number)}
                          className={currentPage === page ? 'bg-sofa-green hover:bg-sofa-green/90' : ''}
                        >
                          {page}
                        </Button>
                      )
                    ))}
                  </div>

                  {/* Next Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <span className="mr-1 hidden sm:inline">Suivant</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  {/* Last Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="hidden sm:flex"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Generate page numbers for pagination with ellipsis
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = []
  const maxVisible = 5

  if (totalPages <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    if (currentPage > 3) {
      pages.push('...')
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('...')
    }

    // Always show last page
    pages.push(totalPages)
  }

  return pages
}

/**
 * Get badge icon from badge type
 */
function getBadgeIcon(badgeType: string): string {
  const badgeIcons: Record<string, string> = {
    top_10_week: '🏆',
    podium: '🥇',
    century: '💯',
    wildcard_master: '🃏',
    perfect_captain: '👑',
    champion: '🏅',
    winning_streak: '🔥'
  }

  return badgeIcons[badgeType] || '⭐'
}

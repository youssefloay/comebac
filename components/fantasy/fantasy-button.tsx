"use client"

import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface FantasyButtonProps {
  href: string
  page?: string
}

export function FantasyButton({ href, page = 'unknown' }: FantasyButtonProps) {
  const { user } = useAuth()

  const handleClick = async () => {
    try {
      await fetch('/api/track-fantasy-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid || 'anonymous',
          userEmail: user?.email || 'anonymous',
          userType: user ? 'authenticated' : 'public',
          page
        })
      })
    } catch (error) {
      console.error('Erreur tracking:', error)
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="relative p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors group"
      title="Fantasy"
    >
      <Sparkles className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
    </Link>
  )
}

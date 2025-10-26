"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/public" className="flex items-center gap-2 hover:opacity-80 transition">
              <span className="text-2xl">⚽</span>
              <h1 className="text-xl font-bold text-primary">Ligue Scolaire</h1>
            </Link>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div
              className={`${
                mobileMenuOpen ? "block" : "hidden"
              } md:flex gap-6 absolute md:static top-16 left-0 right-0 bg-white md:bg-transparent border-b md:border-0 p-4 md:p-0`}
            >
              <Link href="/public/teams" className="text-gray-700 hover:text-primary transition">
                Équipes
              </Link>
              <Link href="/public/matches" className="text-gray-700 hover:text-primary transition">
                Matchs
              </Link>
              <Link href="/public/ranking" className="text-gray-700 hover:text-primary transition">
                Classement
              </Link>
              <Link href="/public/stats" className="text-gray-700 hover:text-primary transition">
                Statistiques
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}
    </div>
  )
}

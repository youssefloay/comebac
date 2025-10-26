"use client"

import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If user is logged in, they will be redirected by AuthProvider
  // This page only shows for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚽</span>
          </div>
          <CardTitle className="text-2xl font-bold">Ligue Scolaire</CardTitle>
          <CardDescription>Connectez-vous pour accéder au championnat de football scolaire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/login" className="block">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Se Connecter (Admin)
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Créer un Compte
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

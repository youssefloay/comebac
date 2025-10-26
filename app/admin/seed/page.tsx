"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/seed", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: `✓ ${data.message}`,
        })
      } else {
        setMessage({
          type: "error",
          text: `Erreur: ${data.error}`,
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erreur de connexion: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Initialiser les données de test</CardTitle>
            <CardDescription>Créer 4 équipes avec 11 joueurs chacune</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleSeed} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                "Créer les données de test"
              )}
            </Button>

            {message && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  message.type === "success" ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <div className="text-xs text-slate-500 space-y-2 pt-4 border-t">
              <p>Les équipes créées:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>FC Étoile (bleu)</li>
                <li>AS Dragons (rouge)</li>
                <li>Olympique Bleu (bleu ciel)</li>
                <li>FC Victoire (vert)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

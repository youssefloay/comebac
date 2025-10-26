"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function InitializePage() {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const initializeData = async () => {
      setStatus("loading")
      setMessage("Initialisation des données de test...")

      try {
        const response = await fetch("/api/seed", {
          method: "POST",
        })

        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage(data.message || "Données créées avec succès!")
          setTimeout(() => {
            router.push("/admin")
          }, 2000)
        } else {
          setStatus("error")
          setMessage(data.error || "Erreur lors de la création des données")
        }
      } catch (error) {
        setStatus("error")
        setMessage(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
      }
    }

    initializeData()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Initialisation de la Ligue</CardTitle>
          <CardDescription>Création des données de test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {status === "loading" && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            )}
            {status === "success" && <div className="text-4xl">✓</div>}
            {status === "error" && <div className="text-4xl">✗</div>}
          </div>
          <p className="text-center text-sm">{message}</p>
          {status === "error" && (
            <Button onClick={() => window.location.reload()} className="w-full">
              Réessayer
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

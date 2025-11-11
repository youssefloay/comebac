"use client";

import { useAuth } from "@/lib/auth-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SimpleLogo } from "@/components/ui/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is logged in, they will be redirected by AuthProvider
  // This page only shows for non-authenticated users
  return (
    <div className="sofa-theme min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <SimpleLogo
              className="w-16 h-16 object-contain"
              alt="ComeBac League"
            />
          </div>
          <CardTitle className="text-2xl font-bold">ComeBac League</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder au championnat scolaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/login" className="block">
            <Button className="w-full sofa-btn">Se Connecter</Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Créer un Compte
            </Button>
          </Link>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <Link href="/register-team" className="block">
            <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50">
              ➕ Inscrire une Équipe
            </Button>
          </Link>
          <p className="text-xs text-center text-gray-500">
            Aucun compte requis pour l'inscription d'équipe
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

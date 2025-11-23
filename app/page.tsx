"use client";

import { useAuth } from "@/lib/auth-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If user is logged in, they will be redirected by AuthProvider
      // For non-authenticated users, redirect to public page (no login required)
      if (!user) {
        router.push("/public");
      }
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth or redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

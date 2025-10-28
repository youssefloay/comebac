"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import {
  Home,
  Trophy,
  Calendar,
  BarChart3,
  Users,
  Sun,
  Moon,
} from "lucide-react";

const navigationItems = [
  { href: "/public", label: "Accueil", icon: Home },
  { href: "/public/matches", label: "Matchs", icon: Calendar },
  { href: "/public/ranking", label: "Classement", icon: Trophy },
  { href: "/public/statistics", label: "Statistiques", icon: BarChart3 },
  { href: "/public/teams", label: "Équipes", icon: Users },
];

export function PremierLeagueNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="pl-nav">
      <div className="pl-nav-content">
        {/* Logo */}
        <Link href={user ? "/public" : "/"} className="pl-logo">
          <div className="pl-logo-icon">
            <img
              src="/comebac.png"
              alt="ComeBac League"
              className="w-8 h-8 object-contain rounded"
            />
          </div>
          <div>
            <div className="font-bold">ComeBac League</div>
            <div className="text-xs opacity-70 font-normal">Championnat Scolaire</div>
          </div>
        </Link>

        {/* Desktop Navigation Items - Only show when authenticated */}
        {user && (
          <div className="pl-nav-items hidden md:flex">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pl-nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-pl-text-secondary hidden sm:inline">
              En Direct
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="pl-theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          {/* Login Button for Non-authenticated Users */}
          {!user && (
            <Link href="/login">
              <button className="pl-btn pl-btn-primary">
                Se connecter
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
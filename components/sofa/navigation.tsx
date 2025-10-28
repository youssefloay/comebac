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
  { href: "/public/players", label: "Cartes FIFA 🎮", icon: Users },
];

export function SofaNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sofa-nav">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href={user ? "/public" : "/"}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/logo-comebac.svg"
                alt="ComeBac League"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sofa-text-primary">
                ComeBac League
              </h1>
              <p className="text-xs text-sofa-text-muted">
                Championnat Scolaire
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Items - Only show when authenticated */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sofa-nav-item relative ${
                      isActive ? "active" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>

                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-sofa-text-accent"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-sofa-red rounded-full animate-pulse"></div>
              <span className="text-sm text-sofa-text-secondary hidden sm:inline">
                En Direct
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="sofa-theme-toggle"
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
                <button className="sofa-btn text-sm px-4 py-2">
                  Se connecter
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

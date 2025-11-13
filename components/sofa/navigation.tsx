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
import { SimpleLogo } from "@/components/ui/logo";

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
    <nav className="sofa-nav sticky top-0 z-50" role="navigation" aria-label="Navigation principale">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Improved hierarchy */}
          <Link
            href={user ? "/public" : "/"}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            aria-label="Retour à l'accueil ComeBac League"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-sofa-text-accent to-sofa-green rounded-xl flex items-center justify-center shadow-lg">
              <SimpleLogo 
                className="w-6 h-6 object-contain filter brightness-0 invert"
                alt=""
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-sofa-text-primary">
                ComeBac League
              </h1>
              <p className="text-xs text-sofa-text-muted -mt-1">
                Championnat Scolaire
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Items - Improved accessibility */}
          {user && (
            <div className="hidden md:flex items-center" role="menubar">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sofa-nav-item relative px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive ? "active bg-sofa-text-accent/10 text-sofa-text-accent" : "hover:bg-sofa-bg-hover"
                    }`}
                    role="menuitem"
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>

                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-sofa-text-accent rounded-full"
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

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Live indicator - More prominent */}
            <div className="flex items-center gap-2 px-3 py-1 bg-sofa-red/10 rounded-full">
              <div className="w-2 h-2 bg-sofa-red rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-sofa-red hidden sm:inline">
                En Direct
              </span>
            </div>

            {/* Theme Toggle - Improved */}
            <button
              onClick={toggleTheme}
              className="sofa-theme-toggle p-2 rounded-lg hover:bg-sofa-bg-hover transition-colors"
              aria-label={`Basculer vers le thème ${theme === "light" ? "sombre" : "clair"}`}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {/* Login Button for Non-authenticated Users */}
            {!user && (
              <Link href="/login">
                <button className="sofa-btn text-sm px-4 py-2 bg-sofa-text-accent hover:bg-sofa-green transition-colors">
                  Se connecter
                </button>
              </Link>
            )}

            {/* User indicator when authenticated */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1 bg-sofa-bg-tertiary rounded-lg">
                <div className="w-6 h-6 bg-sofa-text-accent rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-xs text-sofa-text-secondary hidden sm:inline max-w-20 truncate">
                  {user.displayName || user.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

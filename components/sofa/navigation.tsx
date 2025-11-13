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

            {/* Instagram Link */}
            <a
              href="https://www.instagram.com/comebac.league/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-sofa-bg-hover transition-colors text-sofa-text-secondary hover:text-sofa-text-accent"
              aria-label="Suivez-nous sur Instagram"
              title="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* Contact Link */}
            <a
              href="mailto:contact@comebac.com"
              className="p-2 rounded-lg hover:bg-sofa-bg-hover transition-colors text-sofa-text-secondary hover:text-sofa-text-accent"
              aria-label="Nous contacter"
              title="Contact"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>

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

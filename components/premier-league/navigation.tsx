"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
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
          <div className="pl-logo-icon w-8 h-8 rounded-full bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 shadow-md flex items-center justify-center overflow-hidden">
            <img
              src="/comebac.png"
              alt="ComeBac League"
              className="w-[75%] h-[75%] object-contain"
              style={{ imageRendering: 'auto' }}
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
        <div className="flex items-center gap-2">
          {/* Notification Bell - TOUJOURS VISIBLE */}
          <NotificationBell />

          {/* Live Indicator - Hidden on small screens */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-pl-text-secondary">
              En Direct
            </span>
          </div>

          {/* Instagram Link - Hidden on mobile */}
          <a
            href="https://www.instagram.com/comebac.league/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex p-2 rounded-lg hover:bg-pl-bg-hover transition-colors text-pl-text-secondary hover:text-pl-text-accent"
            aria-label="Suivez-nous sur Instagram"
            title="Instagram"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>

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
              <button className="pl-btn pl-btn-primary text-sm px-3 py-1.5 md:px-4 md:py-2">
                Connexion
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
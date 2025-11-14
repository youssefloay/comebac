"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Home, Trophy, Calendar, BarChart3, Users, Sun, Moon, Sparkles } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

const navigationItems = [
  { href: "/public", label: "Accueil", icon: Home },
  { href: "/public/matches", label: "Matchs", icon: Calendar },
  { href: "/public/ranking", label: "Classement", icon: Trophy },
  { href: "/public/statistics", label: "Statistiques", icon: BarChart3 },
  { href: "/public/teams", label: "Équipes", icon: Users },
  { href: "/public/fantasy", label: "Fantasy", icon: Sparkles },
];

export function SofaNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? "/public" : "/"} className="flex items-center gap-3">
            <img 
              src="/comebac.png" 
              alt="ComeBac League" 
              className="w-10 h-10 object-contain rounded"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">ComeBac League</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Championnat Scolaire</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      isActive 
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* NOTIFICATION DROPDOWN */}
            <NotificationDropdown />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Login Button */}
            {!user && (
              <Link href="/login">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                  Connexion
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Home, Trophy, Calendar, BarChart3, Users, Sun, Moon, UserPlus } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { LanguageSelector } from "@/components/ui/language-selector";
import { FantasyButton } from "@/components/fantasy/fantasy-button";

const navigationItems = [
  { href: "/public", label: "Accueil", icon: Home },
  { href: "/public/matches", label: "Matchs", icon: Calendar },
  { href: "/public/ranking", label: "Classement", icon: Trophy },
  { href: "/public/statistics", label: "Statistiques", icon: BarChart3 },
  { href: "/public/teams", label: "Équipes", icon: Users },
];

export function SofaNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white/95 via-white/95 to-white/95 dark:from-gray-900/95 dark:via-gray-900/95 dark:to-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Modern 2025 */}
          <Link href={user ? "/public" : "/"} className="flex items-center gap-2 sm:gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl blur-sm group-hover:blur-md transition-all"></div>
              <img 
                src="/comebac-logo.svg" 
                alt="ComeBac League" 
                className="relative w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-md"
              />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                ComeBac League
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                Championnat Scolaire
              </p>
            </div>
          </Link>

          {/* Desktop Navigation - Accessible without auth */}
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

          {/* Right Actions - Modern 2025 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Selector - Only for non-admin pages */}
            {!isAdminPage && <LanguageSelector />}

            {/* Fantasy Button - Only for non-admin pages */}
            {!isAdminPage && <FantasyButton href="/public/fantasy" page="header" />}

            {/* Theme Toggle - Modern 2025 */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all"
            >
              {theme === "light" ? <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />}
            </motion.button>

            {/* NOTIFICATION DROPDOWN - Only if user is logged in */}
            {user && <NotificationDropdown />}

            {/* Register Team Button - Visible for all users */}
            <Link href="/register-team">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white rounded-xl sm:rounded-lg text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Inscrire une Équipe</span>
              </motion.button>
            </Link>

            {/* Login Button - Modern 2025 */}
            {!user && (
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl sm:rounded-lg text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Connexion
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

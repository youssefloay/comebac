"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import {
  Home,
  Trophy,
  Calendar,
  BarChart3,
  Users,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Menu,
  X,
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

export function MinimalistNavigation() {
  const pathname = usePathname();
  const { user, userProfile, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setShowMobileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  return (
    <>
      <nav className="nav-container">
        <div className="nav-content">
          {/* Logo */}
          <Link href={user ? "/public" : "/"} className="nav-logo">
            <div className="nav-logo-icon">
              <span>⚽</span>
            </div>
            <div>
              <div className="font-semibold">Ligue Scolaire</div>
              <div className="text-xs opacity-70">Championnat</div>
            </div>
          </Link>

          {/* Desktop Navigation Items - Only show when authenticated */}
          {user && (
            <div className="nav-items hidden md:flex">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? "active" : ""}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="theme-toggle md:hidden"
              aria-label="Menu"
            >
              {showMobileMenu ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn btn-ghost hidden md:flex"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">
                    {isAdmin ? "Admin" : userProfile?.fullName?.split(' ')[0] || "User"}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="user-menu"
                    >
                      <div className="user-menu-header">
                        <div className="font-medium text-sm">
                          {userProfile?.fullName || user.email}
                        </div>
                        <div className="text-xs opacity-70">
                          @{userProfile?.username || "user"} • {isAdmin ? "Admin" : "User"}
                        </div>
                      </div>

                      <div className="user-menu-content">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="user-menu-item"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Administration
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="user-menu-item danger"
                        >
                          <LogOut className="w-4 h-4" />
                          Se déconnecter
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`mobile-menu-overlay ${showMobileMenu ? 'open' : ''}`}
            onClick={() => setShowMobileMenu(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className={`mobile-menu ${showMobileMenu ? 'open' : ''}`}
      >
        <div className="mobile-menu-header">
          <div className="nav-logo">
            <div className="nav-logo-icon">
              <span>⚽</span>
            </div>
            <div>
              <div className="font-semibold">Ligue Scolaire</div>
              <div className="text-xs opacity-70">Championnat</div>
            </div>
          </div>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="theme-toggle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mobile-menu-content">
          {/* Mobile Navigation Items */}
          {user ? (
            <div className="space-y-1 mb-6">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm opacity-70 mb-4">
                Connectez-vous pour accéder au contenu
              </p>
              <Link
                href="/login"
                onClick={() => setShowMobileMenu(false)}
                className="btn btn-primary"
              >
                Se connecter
              </Link>
            </div>
          )}

          {/* Mobile User Section */}
          {user && (
            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ background: 'var(--bg-secondary)' }}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {userProfile?.fullName || user.email}
                  </div>
                  <div className="text-xs opacity-70">
                    @{userProfile?.username || "user"} • {isAdmin ? "Admin" : "User"}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className="mobile-nav-item"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Administration</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className="mobile-nav-item w-full text-left"
                  style={{ color: 'var(--accent-danger)' }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
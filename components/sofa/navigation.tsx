"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
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
} from "lucide-react";

const navigationItems = [
  { href: "/public", label: "Accueil", icon: Home },
  { href: "/public/matches", label: "Matchs", icon: Calendar },
  { href: "/public/ranking", label: "Classement", icon: Trophy },
  { href: "/public/statistics", label: "Statistiques", icon: BarChart3 },
  { href: "/public/teams", label: "Équipes", icon: Users },
];

export function SofaNavigation() {
  const pathname = usePathname();
  const { user, userProfile, logout, isAdmin } = useAuth();
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.classList.remove("mobile-menu-open");
    }

    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, [showMobileMenu]);

  return (
    <nav className="sofa-nav">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/public" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-sofa-green to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚽</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-sofa-text-primary">
                Ligue Scolaire
              </h1>
              <p className="text-xs text-sofa-text-muted">
                Championnat de Football
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Items */}
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

          {/* Mobile Burger Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sofa-nav-item p-2"
              aria-label="Menu"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-sofa-red rounded-full animate-pulse"></div>
              <span className="text-sm text-sofa-text-secondary hidden sm:inline">
                En Direct
              </span>
            </div>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 sofa-nav-item"
                >
                  <div className="w-8 h-8 bg-sofa-text-accent rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden md:inline text-sofa-text-primary">
                    {isAdmin ? "Admin" : "Utilisateur"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-sofa-text-muted" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 sofa-user-menu z-50"
                  >
                    <div className="p-3 border-b border-sofa-border">
                      <p className="text-sm font-medium text-sofa-text-primary">
                        {userProfile?.fullName || user.email}
                      </p>
                      <p className="text-xs text-sofa-text-muted">
                        @{userProfile?.username || "utilisateur"} •{" "}
                        {isAdmin ? "Admin" : "Utilisateur"}
                      </p>
                    </div>

                    <div className="p-2">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Tableau de bord Admin
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sofa-red hover:bg-sofa-bg-hover rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <button className="sofa-btn text-sm px-4 py-2">
                  Se connecter
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Mobile Menu */}
      <motion.div
        ref={mobileMenuRef}
        initial={{ x: "-100%" }}
        animate={{ x: showMobileMenu ? 0 : "-100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-[#1e252f] border-r border-sofa-border z-50 md:hidden"
        style={{ backgroundColor: "#1e252f" }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-sofa-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-sofa-green to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⚽</span>
              </div>
              <div>
                <h2 className="font-bold text-sofa-text-primary">
                  Ligue Scolaire
                </h2>
                <p className="text-xs text-sofa-text-muted">Championnat</p>
              </div>
            </div>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-2 hover:bg-sofa-bg-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-sofa-text-muted" />
            </button>
          </div>

          {/* Mobile Navigation Items */}
          <div className="flex-1 py-6">
            <nav className="space-y-2 px-4">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-sofa-text-accent/10 text-sofa-text-accent border-l-4 border-sofa-text-accent"
                        : "text-sofa-text-primary hover:bg-sofa-bg-hover"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile User Section */}
          {user && (
            <div className="border-t border-sofa-border p-4">
              <div className="flex items-center gap-3 mb-4 p-3 bg-sofa-bg-tertiary rounded-lg">
                <div className="w-10 h-10 bg-sofa-text-accent rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sofa-text-primary truncate">
                    {userProfile?.fullName || user.email}
                  </p>
                  <p className="text-xs text-sofa-text-muted">
                    @{userProfile?.username || "utilisateur"} •{" "}
                    {isAdmin ? "Admin" : "Utilisateur"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sofa-text-primary hover:bg-sofa-bg-hover rounded-lg transition-colors"
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
                  className="flex items-center gap-3 w-full px-4 py-3 text-sofa-red hover:bg-sofa-bg-hover rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}

          {/* Login Button for Non-authenticated Users */}
          {!user && (
            <div className="border-t border-sofa-border p-4">
              <Link
                href="/login"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-sofa-text-accent text-white rounded-lg font-medium hover:bg-sofa-green transition-colors"
              >
                <User className="w-5 h-5" />
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </nav>
  );
}

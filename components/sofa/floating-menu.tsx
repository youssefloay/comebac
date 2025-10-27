"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import {
  Home,
  Trophy,
  Calendar,
  BarChart3,
  Users,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";

const navigationItems = [
  { href: "/public", label: "Accueil", icon: Home, color: "#3b82f6" },
  { href: "/public/matches", label: "Matchs", icon: Calendar, color: "#10b981" },
  { href: "/public/ranking", label: "Classement", icon: Trophy, color: "#f59e0b" },
  { href: "/public/statistics", label: "Statistiques", icon: BarChart3, color: "#8b5cf6" },
  { href: "/public/teams", label: "Équipes", icon: Users, color: "#ef4444" },
];

export function FloatingMenu() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check if mobile menu is open from navigation
  useEffect(() => {
    const checkMobileMenu = () => {
      setIsMobileMenuOpen(document.body.classList.contains("mobile-menu-open"));
    };

    checkMobileMenu();
    const observer = new MutationObserver(checkMobileMenu);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Only show for authenticated users and when mobile menu is not open
  if (!user || isMobileMenuOpen) return null;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 md:hidden" ref={menuRef}>
      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 left-0 space-y-3"
          >
            {/* Theme Toggle */}
            <motion.button
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0, x: -20 }}
              transition={{ delay: 0.1 }}
              onClick={toggleTheme}
              className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-white" />
              ) : (
                <Sun className="w-5 h-5 text-white" />
              )}
            </motion.button>

            {/* Navigation Items */}
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.href}
                  initial={{ scale: 0, x: -20 }}
                  animate={{ scale: 1, x: 0 }}
                  exit={{ scale: 0, x: -20 }}
                  transition={{ delay: 0.1 * (index + 2) }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
                      isActive
                        ? "bg-gradient-to-r from-sofa-green to-emerald-500 ring-2 ring-white ring-opacity-50"
                        : "bg-white dark:bg-sofa-bg-card border border-sofa-border"
                    }`}
                    style={{
                      background: isActive 
                        ? "linear-gradient(135deg, #00d4aa 0%, #10b981 100%)"
                        : undefined
                    }}
                  >
                    <Icon 
                      className={`w-5 h-5 ${
                        isActive 
                          ? "text-white" 
                          : "text-sofa-text-primary"
                      }`}
                      style={{ color: isActive ? "white" : item.color }}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMenu}
        className="w-14 h-14 bg-gradient-to-r from-sofa-green to-emerald-500 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300"
        style={{
          background: isOpen 
            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            : "linear-gradient(135deg, #00d4aa 0%, #10b981 100%)"
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </motion.button>

      {/* Floating Labels */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 left-16 space-y-3 pointer-events-none flex flex-col items-start"
          >
            {/* Theme Label */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: 0.1 }}
              className="bg-sofa-bg-card border border-sofa-border rounded-lg px-4 py-2 shadow-xl whitespace-nowrap backdrop-blur-sm"
            >
              <span className="text-sm font-medium text-sofa-text-primary">
                {theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}
              </span>
            </motion.div>

            {/* Navigation Labels */}
            {navigationItems.map((item, index) => (
              <motion.div
                key={`label-${item.href}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: 0.1 * (index + 2) }}
                className="bg-sofa-bg-card border border-sofa-border rounded-lg px-4 py-2 shadow-xl whitespace-nowrap backdrop-blur-sm"
              >
                <span className="text-sm font-medium text-sofa-text-primary">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
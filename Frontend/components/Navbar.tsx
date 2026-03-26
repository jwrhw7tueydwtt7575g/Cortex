'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Zap } from 'lucide-react';

interface NavbarProps {
  connectedCount: number;
  totalIntegrations: number;
}

export function Navbar({ connectedCount, totalIntegrations }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-lg border-b" suppressHydrationWarning>
      <div className={`border-b transition-smooth ${mounted && theme === 'light' ? 'border-slate-200/30 bg-white/70 shadow-lg shadow-slate-200/20' : 'border-gray-700/30 bg-gray-950/70 shadow-lg shadow-black/20'}`} suppressHydrationWarning>
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Animated CORTEX Logo */}
              <div className="absolute inset-0 animate-pulse-glow rounded-lg" style={{
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4), transparent)',
              }} />
              <svg
                className="animate-spin-slow relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="url(#gradient)"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              CORTEX
            </h1>
          </div>

          {/* Status Pill */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
            mounted && theme === 'light'
              ? 'border-blue-300/30 bg-blue-50/60'
              : 'border-cyan-500/30 bg-gray-900/60'
          }`} suppressHydrationWarning>
            <div className={`w-2 h-2 rounded-full ${connectedCount === totalIntegrations ? 'animate-pulse-glow bg-green-500' : 'bg-yellow-500'}`} />
            <span className={`text-sm font-medium ${mounted && theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>
              {connectedCount} / {totalIntegrations} connected
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg transition-colors ${
              mounted && theme === 'light'
                ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'hover:bg-gray-800 text-gray-300 hover:text-gray-100'
            }`}
            aria-label="Toggle theme"
          >
            {mounted && theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

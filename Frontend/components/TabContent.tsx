'use client';

import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';
import { Check, X, ExternalLink } from 'lucide-react';

interface TabContentProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  urlInputValue: string;
  onUrlChange: (value: string) => void;
  isConnected: boolean;
  onConnect: () => void;
  onOpen?: () => void;
  children?: React.ReactNode;
}

const colorMap = {
  orange: 'border-orange-500/50 focus-within:shadow-orange-500/50 focus-within:border-orange-500',
  red: 'border-red-500/50 focus-within:shadow-red-500/50 focus-within:border-red-500',
  green: 'border-green-500/50 focus-within:shadow-green-500/50 focus-within:border-green-500',
  purple: 'border-purple-500/50 focus-within:shadow-purple-500/50 focus-within:border-purple-500',
  cyan: 'border-cyan-500/50 focus-within:shadow-cyan-500/50 focus-within:border-cyan-500',
};

const accentMap = {
  orange: 'text-orange-500',
  red: 'text-red-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
  cyan: 'text-cyan-500',
};

export function TabContent({
  title,
  icon,
  color,
  urlInputValue,
  onUrlChange,
  isConnected,
  onConnect,
  onOpen,
  children,
}: TabContentProps) {
  const { theme } = useTheme();
  const isMounted = useMounted();
  const colorClass = colorMap[color as keyof typeof colorMap];
  const accentClass = accentMap[color as keyof typeof accentMap];

  return (
    <div className="animate-fade-in-up p-6 max-w-7xl mx-auto">
      {/* Connection Card */}
      <div suppressHydrationWarning className={`backdrop-blur-md rounded-lg border p-6 mb-6 transition-all duration-300 hover:shadow-lg ${
        isMounted && theme === 'dark'
          ? `bg-gray-900/80 border-gray-700/50 hover:bg-gray-900/90 ${colorClass}`
          : `bg-white/80 border-slate-200/50 hover:bg-white/90 ${colorClass}`
      }`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={accentClass}>{icon}</div>
          <h2 className="text-lg font-semibold">{title} Configuration</h2>
        </div>

        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label suppressHydrationWarning className={`text-sm font-medium block mb-2 ${isMounted && theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
              Server URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={urlInputValue}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="https://example.com"
                suppressHydrationWarning
                className={`w-full px-4 py-3 rounded-lg border backdrop-blur-sm transition-all ${
                  isMounted && theme === 'dark'
                    ? 'bg-gray-800/50 text-white placeholder-gray-500 border-gray-700/30 focus:outline-none focus:border-opacity-100'
                    : 'bg-slate-50/50 text-slate-900 placeholder-slate-400 border-slate-200/30 focus:outline-none focus:border-opacity-100'
                } ${colorClass}`}
              />
            </div>
          </div>

          {/* Connection Status and Button */}
          <div className="flex items-center justify-between pt-2 gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-500 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-gray-400" />
                  <span suppressHydrationWarning className={`text-sm font-medium ${isMounted && theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                    Not connected
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isConnected && onOpen && (
                <button
                  onClick={onOpen}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-orange-600/80 hover:bg-orange-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open {title}
                </button>
              )}
              <button
                onClick={onConnect}
                disabled={!urlInputValue}
                suppressHydrationWarning
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  isConnected
                    ? isMounted && theme === 'dark'
                      ? 'bg-gray-800 text-gray-400 cursor-default'
                      : 'bg-slate-100 text-slate-400 cursor-default'
                    : `bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`
                }`}
              >
                {isConnected ? 'Connected' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {children && (
        <div suppressHydrationWarning className={`backdrop-blur-md rounded-lg border p-6 transition-all duration-300 hover:shadow-lg ${
          isMounted && theme === 'dark'
            ? 'bg-gray-900/80 border-gray-700/50 hover:bg-gray-900/90'
            : 'bg-white/80 border-slate-200/50 hover:bg-white/90'
        }`}>
          {children}
        </div>
      )}
    </div>
  );
}

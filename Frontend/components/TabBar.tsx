'use client';

import { useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';
import { Activity, TrendingUp, BarChart3, Zap, Cable } from 'lucide-react';

export type TabType = 'grafana' | 'prometheus' | 'dashplot' | 'automate' | 'integrations';

const TABS: Array<{ id: TabType; label: string; icon: React.ReactNode; color: string }> = [
  { id: 'grafana', label: 'Grafana', icon: <Activity className="w-4 h-4" />, color: 'orange' },
  { id: 'prometheus', label: 'Prometheus', icon: <TrendingUp className="w-4 h-4" />, color: 'red' },
  { id: 'dashplot', label: 'Dashplot', icon: <BarChart3 className="w-4 h-4" />, color: 'green' },
  { id: 'automate', label: 'Automate', icon: <Zap className="w-4 h-4" />, color: 'purple' },
  { id: 'integrations', label: 'Integrations', icon: <Cable className="w-4 h-4" />, color: 'cyan' },
];

const colorMap = {
  orange: { text: 'text-orange-500', hover: 'hover:text-orange-400', glow: 'shadow-orange-500/50' },
  red: { text: 'text-red-500', hover: 'hover:text-red-400', glow: 'shadow-red-500/50' },
  green: { text: 'text-green-500', hover: 'hover:text-green-400', glow: 'shadow-green-500/50' },
  purple: { text: 'text-purple-500', hover: 'hover:text-purple-400', glow: 'shadow-purple-500/50' },
  cyan: { text: 'text-cyan-500', hover: 'hover:text-cyan-400', glow: 'shadow-cyan-500/50' },
};

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { theme } = useTheme();
  const isMounted = useMounted();
  const underlineRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTabRef.current && underlineRef.current) {
      const button = activeTabRef.current;
      underlineRef.current.style.width = `${button.offsetWidth}px`;
      underlineRef.current.style.left = `${button.offsetLeft}px`;
    }
  }, [activeTab]);

  return (
    <div suppressHydrationWarning className={`fixed top-24 left-0 right-0 z-30 border-b backdrop-blur-lg transition-smooth ${
      isMounted && theme === 'dark'
        ? 'border-gray-700/30 bg-gray-950/50 shadow-md shadow-black/10'
        : 'border-slate-200/30 bg-white/50 shadow-md shadow-slate-200/10'
    }`}>
      <div className="px-6 relative">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const color = colorMap[tab.color as keyof typeof colorMap];

            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => onTabChange(tab.id)}
                suppressHydrationWarning
                className={`px-4 py-4 text-sm font-medium transition-colors flex items-center gap-2 relative ${
                  isActive
                    ? `${color.text}`
                    : isMounted && theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
        {/* Animated Underline */}
        <div
          ref={underlineRef}
          suppressHydrationWarning
          className={`absolute bottom-0 h-0.5 transition-all duration-300 ease-out ${
            isMounted && theme === 'dark' ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
          }`}
          style={{ left: 0, width: 0 }}
        />
      </div>
    </div>
  );
}

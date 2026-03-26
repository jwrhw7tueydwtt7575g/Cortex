'use client';

import { useTheme } from 'next-themes';

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className={`mt-20 py-12 px-6 border-t transition-colors ${
      theme === 'dark'
        ? 'border-gray-700/30 bg-gray-950/50'
        : 'border-slate-200/30 bg-white/50'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-3">
          <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            CORTEX
          </h3>
          <div className="space-y-1">
            <p className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-gray-300' : 'text-slate-700'
            }`}>
              Cluster Observability, Remediation & Telemetry EXecutor
            </p>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-gray-500' : 'text-slate-500'
            }`}>
              Unified monitoring and automation platform for Kubernetes clusters
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

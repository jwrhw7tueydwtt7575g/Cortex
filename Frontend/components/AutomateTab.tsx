'use client';

import { Zap } from 'lucide-react';

export function AutomateTab() {
  return (
    <div className="animate-fade-in-up p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="backdrop-blur-md rounded-lg border border-purple-500/50 p-6 mb-6 bg-gray-900/80">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Automation Control</h2>
        </div>
        <p className="text-sm text-gray-400">All automation is running smoothly. Logs and reports are being generated continuously.</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="backdrop-blur-md rounded-lg border border-purple-500/30 p-6 bg-gray-900/60">
          <p className="text-gray-400 text-sm mb-2">ML Pipeline</p>
          <p className="text-2xl font-bold text-green-400">🟢 Active</p>
          <p className="text-xs text-gray-500 mt-2">30-second intervals</p>
        </div>

        <div className="backdrop-blur-md rounded-lg border border-purple-500/30 p-6 bg-gray-900/60">
          <p className="text-gray-400 text-sm mb-2">Report Generator</p>
          <p className="text-2xl font-bold text-green-400">🟢 Active</p>
          <p className="text-xs text-gray-500 mt-2">60-second intervals</p>
        </div>

        <div className="backdrop-blur-md rounded-lg border border-purple-500/30 p-6 bg-gray-900/60">
          <p className="text-gray-400 text-sm mb-2">Log Streaming</p>
          <p className="text-2xl font-bold text-green-400">🟢 Active</p>
          <p className="text-xs text-gray-500 mt-2">Real-time chunks</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 backdrop-blur-md rounded-lg border border-purple-500/20 p-6 bg-purple-900/20">
        <p className="text-purple-300 text-sm leading-relaxed">
          <span className="font-semibold">✓</span> All pipeline components are running automatically<br/>
          <span className="font-semibold">✓</span> View real-time metrics in the <strong>Dashplot</strong> tab<br/>
          <span className="font-semibold">✓</span> Check generated reports in the <strong>Reports</strong> tab<br/>
          <span className="font-semibold">✓</span> Monitor K8s infrastructure in <strong>Grafana</strong> & <strong>Prometheus</strong>
        </p>
      </div>
    </div>
  );
}

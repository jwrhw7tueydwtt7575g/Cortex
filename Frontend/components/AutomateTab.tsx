'use client';

import { useState } from 'react';
import { Zap, Check, FileText, Play, Download } from 'lucide-react';
import { useTheme } from 'next-themes';

interface Report {
  id: string;
  name: string;
  status: 'pending' | 'syncing' | 'completed';
  progress: number;
  type: 'pdf' | 'document';
}

export function AutomateTab() {
  const { theme } = useTheme();
  const [reports, setReports] = useState<Report[]>([
    { id: '1', name: 'Daily Performance Report', status: 'completed', progress: 100, type: 'pdf' },
    { id: '2', name: 'System Health Audit', status: 'completed', progress: 100, type: 'pdf' },
    { id: '3', name: 'Security Compliance Check', status: 'pending', progress: 0, type: 'pdf' },
    { id: '4', name: 'Database Backup Summary', status: 'pending', progress: 0, type: 'pdf' },
    { id: '5', name: 'API Usage Analytics', status: 'pending', progress: 0, type: 'pdf' },
    { id: '6', name: 'Infrastructure Cost Report', status: 'pending', progress: 0, type: 'pdf' },
  ]);

  const startAutomation = (reportId: string) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId ? { ...report, status: 'syncing', progress: 0 } : report
      )
    );

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        setReports((prev) =>
          prev.map((report) =>
            report.id === reportId
              ? { ...report, status: 'completed', progress: 100 }
              : report
          )
        );
        clearInterval(interval);
      } else {
        setReports((prev) =>
          prev.map((report) =>
            report.id === reportId ? { ...report, progress } : report
          )
        );
      }
    }, 600);
  };

  return (
    <div className="animate-fade-in-up p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-purple-500">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold">Automate Reports</h2>
          </div>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`p-5 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-900/80 border-purple-500/30 hover:border-purple-500/50 hover:bg-gray-800/80'
                    : 'bg-white/80 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-purple-500/20">
                      <FileText className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-2">{report.name}</p>
                      <div className="bg-gray-700/20 rounded-full h-2 w-full">
                        {report.status === 'syncing' && (
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${report.progress}%` }}
                          />
                        )}
                        {report.status === 'completed' && (
                          <div className="h-full w-full bg-green-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {report.status === 'completed' && (
                      <>
                        <div className="animate-file-checkbox">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <button className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </>
                    )}
                    {report.status === 'syncing' && (
                      <div className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded">
                        {Math.round(report.progress)}%
                      </div>
                    )}
                    {report.status === 'pending' && (
                      <button
                        onClick={() => startAutomation(report.id)}
                        className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 transition-colors text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Automate
                      </button>
                    )}
                  </div>
                </div>

                {/* File sync animation indicator */}
                {report.status === 'syncing' && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="text-xs opacity-60">Processing files:</div>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-file-sync"
                          style={{ animationDelay: `${i * 0.3}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

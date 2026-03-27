'use client';

import { useState, useEffect } from 'react';
import { FileText, Play, Eye, Loader, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Report {
  _id: string;
  chunk_id: string;
  timestamp?: string;
  report?: {
    root_causes?: string[];
    components_affected?: string[];
    prevention_steps?: string[];
    immediate_actions?: string[];
    risk_level?: string;
    fix_time?: string;
    summary?: string;
  };
}

export function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [automating, setAutomating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const API_BASE = process.env.NEXT_PUBLIC_REPORT_API || 'http://localhost:5000';

  useEffect(() => {
    fetchReports();
    // Refresh reports every 30 seconds
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/reports/top5`);
      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch reports');
      }
    } catch (err) {
      setError(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAutomate = async () => {
    setAutomating(true);
    try {
      // This would trigger the report generation in the backend
      const response = await fetch('http://localhost:8050/api/reports/start-automation', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Report automation started',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to start automation',
        variant: 'destructive',
      });
    } finally {
      setAutomating(false);
    }
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  return (
    <div className="animate-fade-in-up p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="backdrop-blur-md rounded-lg border border-purple-500/50 p-6 mb-6 bg-gray-900/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">LLM Prevention Reports</h2>
          </div>
          <button
            onClick={handleAutomate}
            disabled={automating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {automating ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {automating ? 'Starting...' : 'Automate'}
          </button>
        </div>
        <p className="text-sm text-gray-400">Auto-generated reports every 60 seconds from latest log chunks</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="backdrop-blur-md rounded-lg border border-red-500/50 p-4 mb-6 bg-red-900/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchReports}
            className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="backdrop-blur-md rounded-lg border border-purple-500/20 p-12 bg-gray-900/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-gray-400">Fetching reports...</p>
          </div>
        </div>
      )}

      {/* Reports List */}
      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report, idx) => (
            <div
              key={report._id}
              className="backdrop-blur-md rounded-lg border border-purple-500/30 p-4 bg-gray-900/60 hover:bg-gray-900/80 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-purple-600/30 text-purple-300 text-xs rounded font-medium">
                      #{idx + 1}
                    </span>
                    <span className="text-sm text-gray-400">
                      {report.timestamp ? new Date(report.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white mb-2">
                    Chunk: {report.chunk_id.substring(0, 12)}...
                  </h3>

                  {/* Report Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <div className="p-2 bg-purple-600/20 rounded border border-purple-500/30">
                      <p className="text-xs text-gray-400">Risk Level</p>
                      <p className="font-semibold text-yellow-400">
                        {report.report?.risk_level || 'Unknown'}
                      </p>
                    </div>

                    <div className="p-2 bg-purple-600/20 rounded border border-purple-500/30">
                      <p className="text-xs text-gray-400">Root Causes</p>
                      <p className="font-semibold text-purple-300">
                        {report.report?.root_causes?.length || 0} identified
                      </p>
                    </div>

                    <div className="p-2 bg-purple-600/20 rounded border border-purple-500/30">
                      <p className="text-xs text-gray-400">Actions</p>
                      <p className="font-semibold text-green-400">
                        {(report.report?.immediate_actions?.length || 0) + 
                         (report.report?.prevention_steps?.length || 0)} steps
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {report.report?.summary || 'No summary available'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleViewReport(report)}
                    className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && !error && (
        <div className="backdrop-blur-md rounded-lg border border-purple-500/20 p-12 bg-gray-900/50 text-center">
          <FileText className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
          <p className="text-gray-400">No reports generated yet</p>
          <p className="text-sm text-gray-500 mt-2">Start automation to generate reports</p>
        </div>
      )}

      {/* Report Detail Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 border border-purple-500/50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-purple-500/20 bg-gray-900/95">
              <h2 className="text-lg font-semibold text-white">Report Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Chunk ID</p>
                  <p className="font-mono text-sm text-purple-300">{selectedReport.chunk_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Generated</p>
                  <p className="text-sm text-gray-300">
                    {selectedReport.timestamp ? new Date(selectedReport.timestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Risk Level */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Risk Level</p>
                <div className="px-3 py-2 bg-yellow-600/20 border border-yellow-500/30 rounded w-fit">
                  <p className="font-semibold text-yellow-400">
                    {selectedReport.report?.risk_level || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Root Causes */}
              {selectedReport.report?.root_causes && selectedReport.report.root_causes.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-white mb-2">Root Causes</p>
                  <ul className="space-y-1">
                    {selectedReport.report.root_causes.map((cause, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-red-400">•</span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prevention Steps */}
              {selectedReport.report?.prevention_steps && selectedReport.report.prevention_steps.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-white mb-2">Prevention Steps</p>
                  <ol className="space-y-1">
                    {selectedReport.report.prevention_steps.map((step, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-green-400">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Immediate Actions */}
              {selectedReport.report?.immediate_actions && selectedReport.report.immediate_actions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-white mb-2">Immediate Actions</p>
                  <ul className="space-y-1">
                    {selectedReport.report.immediate_actions.map((action, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-blue-400">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fix Time */}
              {selectedReport.report?.fix_time && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Estimated Fix Time</p>
                  <p className="text-sm font-semibold text-purple-300">{selectedReport.report.fix_time}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-purple-500/20">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

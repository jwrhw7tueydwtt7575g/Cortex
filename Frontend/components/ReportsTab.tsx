'use client';

import { useState, useEffect } from 'react';
import { FileText, Play, Eye, Loader, AlertCircle, Zap, Save, Cog } from 'lucide-react';
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
  const [automationTimeline, setAutomationTimeline] = useState<any[]>([]);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  const [currentAutomationChunk, setCurrentAutomationChunk] = useState<string | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [automationComplete, setAutomationComplete] = useState(false);
  const [playbookVersion, setPlaybookVersion] = useState<string | null>(null);
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

  const handleAutomate = async (report?: Report) => {
    try {
      const reportToAutomate = report || selectedReport;
      if (!reportToAutomate) {
        toast({
          title: 'Error',
          description: 'No report selected',
          variant: 'destructive',
        });
        return;
      }

      setCurrentAutomationChunk(reportToAutomate.chunk_id);
      setAutomationTimeline([
        {
          timestamp: new Date().toISOString(),
          stage: 'INITIALIZATION',
          status: 'in_progress',
          details: '🚀 Starting automation pipeline...'
        }
      ]);
      setAutomating(true);
      setShowTimelineModal(true);
      setAutomationComplete(false);
      setIsPollingStatus(true);

      console.log(`🤖 Triggering automation for chunk: ${reportToAutomate.chunk_id}`);
      
      let logs = null;
      try {
        const logsResponse = await fetch(`http://localhost:5000/api/logs/${reportToAutomate.chunk_id}`);
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          logs = logsData.logs || logsData.messages || null;
          console.log(`📝 Fetched ${logs?.length || 0} log entries for context`);
        }
      } catch (logsErr) {
        console.warn("⚠️ Could not fetch logs, proceeding without log context", logsErr);
      }
      
      const response = await fetch('http://localhost:5001/api/automate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunk_id: reportToAutomate.chunk_id,
          report: reportToAutomate.report || {},
          logs: logs,
          pod_name: 'log-generator-54ffbcd85d-95twm'
        })
      });
      
      const data = await response.json();
      
      if (response.ok || response.status === 202) {
        toast({
          title: '🚀 Automation Started',
          description: `Chunk ${reportToAutomate.chunk_id.substring(0, 8)}... processing...`,
        });
        console.log("✅ Automation triggered successfully with log context");
        
        setAutomationTimeline(prev => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            stage: 'REQUEST_RECEIVED',
            status: 'success',
            details: `📨 Request accepted by Ansible service`
          }
        ]);
        
        pollAutomationStatus(reportToAutomate.chunk_id);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error(`❌ Automation error:`, err);
      toast({
        title: '❌ Error',
        description: err instanceof Error ? err.message : 'Failed to start automation',
        variant: 'destructive',
      });
      setAutomating(false);
      setIsPollingStatus(false);
      setShowTimelineModal(false);
    }
  };

  const pollAutomationStatus = async (chunkId: string) => {
    setIsPollingStatus(true);
    const maxAttempts = 60; // Poll for up to 2 minutes (60 * 2s = 120s)
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/automation/status/${chunkId}`);
        const data = await response.json();
        
        if (data.timeline) {
          setAutomationTimeline(data.timeline);
          // Capture playbook version from response
          if (data.playbook_filename) {
            setPlaybookVersion(data.playbook_filename);
          }
          
          // Stop polling if complete
          if (data.overall_status === 'success' || data.overall_status === 'failed' || data.overall_status === 'error') {
            setIsPollingStatus(false);
            setAutomating(false);
            setAutomationComplete(true);
            if (data.overall_status === 'success') {
              toast({
                title: '✅ Success!',
                description: "Automation completed successfully!",
              });
            } else {
              toast({
                title: '❌ Failed',
                description: `❌ Automation ${data.overall_status}: ${data.error || 'Unknown error'}`,
                variant: 'destructive',
              });
            }
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          setIsPollingStatus(false);
          setAutomating(false);
          toast({
            title: 'Timeout',
            description: "Automation polling timeout - check backend logs",
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error("Status poll error:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setIsPollingStatus(false);
          setAutomating(false);
        }
      }
    };
    
    poll();
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
            onClick={() => handleAutomate()}
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

                  {/* Timeline Display for Active Automation */}
                  {isPollingStatus && currentAutomationChunk === report.chunk_id && automationTimeline.length > 0 && (
                    <div className="mt-4 p-3 bg-dark-800 rounded-lg border border-purple-600">
                      <h4 className="text-purple-400 font-semibold mb-2 text-sm">⏱️ Automation Timeline:</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {automationTimeline.map((event, idx) => (
                          <div key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className={`mt-0.5 font-bold ${event.status === 'success' ? 'text-green-400' : event.status === 'in_progress' ? 'text-yellow-400' : 'text-red-400'}`}>
                              {event.status === 'success' ? '✅' : event.status === 'in_progress' ? '⏳' : '❌'}
                            </span>
                            <div className="flex-1">
                              <span className="text-purple-400 font-medium">{event.stage}</span>
                              <span className="text-gray-500"> - {event.status}</span>
                              {event.details && <p className="text-gray-400 text-xs">{event.details}</p>}
                              <span className="text-gray-600 text-xs">{new Date(event.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {isPollingStatus && <p className="text-yellow-400 text-xs mt-2">🔄 Still monitoring...</p>}
                    </div>
                  )}
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
                  <button
                    onClick={() => handleAutomate(report)}
                    disabled={automating}
                    className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {automating ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Automate
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

      {/* Timeline Modal - Automation Progress */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-xl shadow-2xl p-8 max-w-2xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">🚀 Automation Timeline</h2>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-400">Pod: log-generator-54ffbcd85d-95twm</p>
                  {playbookVersion && (
                    <p className="text-sm text-purple-400">🎯 Playbook: {playbookVersion}</p>
                  )}
                </div>
              </div>
              {!automationComplete && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-yellow-400">Processing...</span>
                </div>
              )}
              {automationComplete && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-green-400">Complete</span>
                </div>
              )}
            </div>

            {/* Timeline Stages */}
            <div className="space-y-4 mb-8">
              {/* Stage 1: LLM Generation */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    automationTimeline.some(e => e.stage === 'PLAYBOOK_GENERATION') 
                      ? 'bg-green-500/20 border-2 border-green-500' 
                      : automationTimeline.some(e => e.stage === 'REQUEST_RECEIVED') 
                      ? 'bg-yellow-500/20 border-2 border-yellow-500 animate-pulse' 
                      : 'bg-gray-700/30 border-2 border-gray-600'
                  }`}>
                    <Zap className={`w-6 h-6 ${
                      automationTimeline.some(e => e.stage === 'PLAYBOOK_GENERATION') 
                        ? 'text-green-400' 
                        : automationTimeline.some(e => e.stage === 'REQUEST_RECEIVED') 
                        ? 'text-yellow-400 animate-spin' 
                        : 'text-gray-500'
                    }`} />
                  </div>
                  {automationTimeline.length > 2 && (
                    <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-blue-500 mt-1"></div>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <p className="font-semibold text-white">LLM Script Generation</p>
                  <p className="text-sm text-gray-400">Groq AI generating Ansible playbook...</p>
                  {automationTimeline.find(e => e.stage === 'PLAYBOOK_GENERATION') && (
                    <p className="text-xs text-green-400 mt-1">✅ Playbook generated successfully</p>
                  )}
                </div>
              </div>

              {/* Stage 2: Playbook Save */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    automationTimeline.some(e => e.stage === 'PLAYBOOK_SAVE') 
                      ? 'bg-green-500/20 border-2 border-green-500' 
                      : automationTimeline.some(e => e.stage === 'PLAYBOOK_GENERATION') && !automationTimeline.some(e => e.stage === 'PLAYBOOK_SAVE') 
                      ? 'bg-yellow-500/20 border-2 border-yellow-500 animate-pulse' 
                      : 'bg-gray-700/30 border-2 border-gray-600'
                  }`}>
                    <Save className={`w-6 h-6 ${
                      automationTimeline.some(e => e.stage === 'PLAYBOOK_SAVE') 
                        ? 'text-green-400' 
                        : automationTimeline.some(e => e.stage === 'PLAYBOOK_GENERATION') && !automationTimeline.some(e => e.stage === 'PLAYBOOK_SAVE') 
                        ? 'text-yellow-400 animate-spin' 
                        : 'text-gray-500'
                    }`} />
                  </div>
                  {automationTimeline.length > 3 && (
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 mt-1"></div>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <p className="font-semibold text-white">Playbook Saved</p>
                  <p className="text-sm text-gray-400">Saving playbook to ./playbooks/</p>
                  {automationTimeline.find(e => e.stage === 'PLAYBOOK_SAVE') && (
                    <p className="text-xs text-green-400 mt-1">✅ Playbook saved to disk</p>
                  )}
                </div>
              </div>

              {/* Stage 3: Playbook Execution */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    automationTimeline.some(e => e.stage === 'PLAYBOOK_EXECUTION') 
                      ? 'bg-green-500/20 border-2 border-green-500' 
                      : automationTimeline.some(e => e.stage === 'PLAYBOOK_SAVE') && !automationTimeline.some(e => e.stage === 'PLAYBOOK_EXECUTION') 
                      ? 'bg-yellow-500/20 border-2 border-yellow-500 animate-pulse' 
                      : 'bg-gray-700/30 border-2 border-gray-600'
                  }`}>
                    <Cog className={`w-6 h-6 ${
                      automationTimeline.some(e => e.stage === 'PLAYBOOK_EXECUTION') 
                        ? 'text-green-400' 
                        : automationTimeline.some(e => e.stage === 'PLAYBOOK_SAVE') && !automationTimeline.some(e => e.stage === 'PLAYBOOK_EXECUTION') 
                        ? 'text-yellow-400 animate-spin' 
                        : 'text-gray-500'
                    }`} />
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <p className="font-semibold text-white">Executing Playbook</p>
                  <p className="text-sm text-gray-400">Running automation on pod with ansible-playbook...</p>
                  {automationTimeline.find(e => e.stage === 'PLAYBOOK_EXECUTION') && (
                    <p className="text-xs text-green-400 mt-1">✅ Playbook executed successfully</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline Events Log */}
            {automationTimeline.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-300 mb-3 uppercase">Event Log</p>
                <div className="space-y-2">
                  {automationTimeline.map((event, idx) => (
                    <div key={idx} className="text-xs text-gray-400 border-l-2 border-purple-500/30 pl-3 py-1">
                      <p className="font-mono">{new Date(event.timestamp).toLocaleTimeString()}</p>
                      <p className="text-gray-300">{event.details || `Stage: ${event.stage}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {automationComplete && (
                <button
                  onClick={() => {
                    setShowTimelineModal(false);
                    setAutomationComplete(false);
                    setAutomationTimeline([]);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
                >
                  ✅ Close & Done
                </button>
              )}
              {!automationComplete && (
                <button
                  disabled
                  className="flex-1 px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed font-medium"
                >
                  ⏳ Processing...
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

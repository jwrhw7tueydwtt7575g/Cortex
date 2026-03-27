'use client';

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { TabContent } from './TabContent';

export function DashplotTab() {
  const [url, setUrl] = useState('http://localhost:8050');
  const [isConnected, setIsConnected] = useState(false);
  const [savedUrl, setSavedUrl] = useState('http://localhost:8050');

  const handleConnect = () => {
    if (url) {
      setSavedUrl(url);
      setIsConnected(true);
    }
  };

  const handleOpen = () => {
    if (savedUrl) {
      window.open(savedUrl, '_blank');
    }
  };

  return (
    <TabContent
      title="Dashplot"
      icon={<BarChart3 className="w-6 h-6" />}
      color="green"
      urlInputValue={url}
      onUrlChange={setUrl}
      isConnected={isConnected}
      onConnect={handleConnect}
      onOpen={handleOpen}
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-green-400">📊 Live Anomaly Detection</h3>
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-gray-300">Real-time ML model results with 30-second refresh</p>
            <p className="text-xs text-gray-400 mt-2">✓ Isolation Forest Results<br/>✓ Anomaly Scores<br/>✓ Historical Trends</p>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-green-400">📈 Time Series Forecasts</h3>
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-gray-300">Prophet forecasting on all historical log chunks</p>
            <p className="text-xs text-gray-400 mt-2"><strong>URL:</strong> {savedUrl}<br/>Port: 8050</p>
          </div>
        </div>
      </div>
    </TabContent>
  );
}

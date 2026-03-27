'use client';

import { useState } from 'react';
import { TabContent } from './TabContent';

export function PrometheusTab() {
  const [urlInputValue, setUrlInputValue] = useState('http://localhost:9090');
  const [isConnected, setIsConnected] = useState(false);
  const [savedUrl, setSavedUrl] = useState('http://localhost:9090');

  const handleConnect = () => {
    if (urlInputValue) {
      setSavedUrl(urlInputValue);
      setIsConnected(true);
    }
  };

  const handleOpen = () => {
    window.open(savedUrl, '_blank');
  };

  return (
    <TabContent
      title="Prometheus"
      icon={null}
      color="red"
      urlInputValue={urlInputValue}
      onUrlChange={setUrlInputValue}
      isConnected={isConnected}
      onConnect={handleConnect}
      onOpen={handleOpen}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg border border-red-500/20">
            <h3 className="font-semibold text-red-400 mb-2">📈 Prometheus Metrics</h3>
            <p className="text-sm text-gray-300">Time-series database for K8s cluster monitoring.</p>
            <p className="text-xs text-gray-400 mt-2">✓ Pod Metrics<br/>✓ Node Metrics<br/>✓ Custom Queries</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg border border-red-500/20">
            <h3 className="font-semibold text-red-400 mb-2">🔍 Configuration</h3>
            <p className="text-sm text-gray-300"><strong>URL:</strong> {savedUrl}</p>
            <p className="text-xs text-gray-400 mt-2"><strong>Query Language:</strong> PromQL<br/><strong>Port:</strong> 9090</p>
          </div>
        </div>
      </div>
    </TabContent>
  );
}

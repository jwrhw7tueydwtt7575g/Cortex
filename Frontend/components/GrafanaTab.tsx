'use client';

import { useState } from 'react';
import { TabContent } from './TabContent';

export function GrafanaTab() {
  const [urlInputValue, setUrlInputValue] = useState('http://localhost:4000');
  const [isConnected, setIsConnected] = useState(false);
  const [savedUrl, setSavedUrl] = useState('http://localhost:4000');

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
      title="Grafana"
      icon={null}
      color="orange"
      urlInputValue={urlInputValue}
      onUrlChange={setUrlInputValue}
      isConnected={isConnected}
      onConnect={handleConnect}
      onOpen={handleOpen}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg border border-orange-500/20">
            <h3 className="font-semibold text-orange-400 mb-2">📊 Grafana Dashboard</h3>
            <p className="text-sm text-gray-300">Kubernetes infrastructure metrics and visualization platform.</p>
            <p className="text-xs text-gray-400 mt-2">✓ K8s Pod Metrics<br/>✓ Real-time Monitoring<br/>✓ Alert Rules</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg border border-orange-500/20">
            <h3 className="font-semibold text-orange-400 mb-2">🎯 Default Credentials</h3>
            <p className="text-sm text-gray-300"><strong>URL:</strong> {savedUrl}</p>
            <p className="text-xs text-gray-400 mt-2"><strong>Username:</strong> admin<br/><strong>Password:</strong> admin123</p>
          </div>
        </div>
      </div>
    </TabContent>
  );
}

'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { TabContent } from './TabContent';

export function PrometheusTab() {
  const [url, setUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (url) {
      setIsConnected(true);
    }
  };

  const handleOpen = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <TabContent
      title="Prometheus"
      icon={<TrendingUp className="w-6 h-6" />}
      color="red"
      urlInputValue={url}
      onUrlChange={setUrl}
      isConnected={isConnected}
      onConnect={handleConnect}
      onOpen={handleOpen}
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm opacity-75">Time Series Data</h3>
          <div className="h-32 rounded bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
            <p className="text-sm opacity-50">Time series data will appear here</p>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-sm opacity-75">Target Status</h3>
          <div className="h-32 rounded bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
            <p className="text-sm opacity-50">Target information will appear here</p>
          </div>
        </div>
      </div>
    </TabContent>
  );
}

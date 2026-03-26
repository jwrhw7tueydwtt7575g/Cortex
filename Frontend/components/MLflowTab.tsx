'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { TabContent } from './TabContent';

export function MLflowTab() {
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
      title="MLflow"
      icon={<Brain className="w-6 h-6" />}
      color="green"
      urlInputValue={url}
      onUrlChange={setUrl}
      isConnected={isConnected}
      onConnect={handleConnect}
      onOpen={handleOpen}
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm opacity-75">Experiments</h3>
          <div className="h-32 rounded bg-gradient-to-br from-green-500/10 to-green-600/10 flex items-center justify-center">
            <p className="text-sm opacity-50">Experiments will appear here when connected</p>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-sm opacity-75">Model Metrics</h3>
          <div className="h-32 rounded bg-gradient-to-br from-green-500/10 to-green-600/10 flex items-center justify-center">
            <p className="text-sm opacity-50">Model metrics will appear here when connected</p>
          </div>
        </div>
      </div>
    </TabContent>
  );
}

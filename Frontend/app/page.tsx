'use client';

import { useState } from 'react';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CloudBackground } from '@/components/CloudBackground';
import { Navbar } from '@/components/Navbar';
import { TabBar, type TabType } from '@/components/TabBar';
import { GrafanaTab } from '@/components/GrafanaTab';
import { PrometheusTab } from '@/components/PrometheusTab';
import { DashplotTab } from '@/components/DashplotTab';
import { AutomateTab } from '@/components/AutomateTab';
import { IntegrationsTab } from '@/components/IntegrationsTab';
import { ReportsTab } from '@/components/ReportsTab';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('grafana');
  const [connectedCount, setConnectedCount] = useState(0);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'grafana':
        return <GrafanaTab />;
      case 'prometheus':
        return <PrometheusTab />;
      case 'dashplot':
        return <DashplotTab />;
      case 'automate':
        return <AutomateTab />;
      case 'reports':
        return <ReportsTab />;
      case 'integrations':
        return <IntegrationsTab />;
      default:
        return <GrafanaTab />;
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Cloud Background */}
      <CloudBackground />

      {/* Content Container */}
      <div className="relative z-10">
        {/* Navbar */}
        <Navbar connectedCount={connectedCount} totalIntegrations={5} />

        {/* Tab Bar */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Page Content */}
        <div className="pt-40">
          {renderTabContent()}
        </div>
      </div>
    </main>
  );
}

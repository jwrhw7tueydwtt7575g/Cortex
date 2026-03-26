'use client';

import { useState } from 'react';
import { Cable, Check, Settings, ExternalLink, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CredentialModal } from './CredentialModal';

interface IntegrationConfig {
  name: string;
  icon: string;
  description: string;
  category: 'messaging' | 'cloud' | 'tools' | 'devops';
  fields?: Array<{ key: string; label: string; placeholder: string; isSecret: boolean }>;
}

export function IntegrationsTab() {
  const { theme } = useTheme();
  const [activeIntegrations, setActiveIntegrations] = useState<Record<string, boolean>>({});
  const [configuredIntegrations, setConfiguredIntegrations] = useState<Record<string, boolean>>({});
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const integrations: IntegrationConfig[] = [
    { name: 'Slack', icon: '💬', description: 'Chat notifications', category: 'messaging', fields: [{ key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/...', isSecret: true }] },
    { name: 'PagerDuty', icon: '🚨', description: 'Incident management', category: 'messaging', fields: [{ key: 'api_key', label: 'API Key', placeholder: 'Enter your API key', isSecret: true }] },
    { name: 'GitHub', icon: '🐙', description: 'Code repository', category: 'tools', fields: [{ key: 'personal_token', label: 'Personal Access Token', placeholder: 'ghp_...', isSecret: true }] },
    { name: 'AWS', icon: '☁️', description: 'CloudWatch, EKS, EC2 logs', category: 'cloud', fields: [
      { key: 'access_key', label: 'AWS Access Key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE', isSecret: false },
      { key: 'secret_key', label: 'AWS Secret Access Key', placeholder: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', isSecret: true },
      { key: 'region', label: 'AWS Region', placeholder: 'us-east-1', isSecret: false },
      { key: 'account_id', label: 'AWS Account ID', placeholder: '123456789012', isSecret: false },
    ]},
    { name: 'GCP', icon: '🔵', description: 'Cloud Monitoring, GKE, Logging', category: 'cloud', fields: [
      { key: 'project_id', label: 'Project ID', placeholder: 'my-project-123456', isSecret: false },
      { key: 'service_account_json', label: 'Service Account JSON', placeholder: 'Paste entire JSON key file...', isSecret: true },
    ]},
    { name: 'Azure', icon: '🔶', description: 'Monitor, AKS, Log Analytics', category: 'cloud', fields: [
      { key: 'tenant_id', label: 'Tenant ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', isSecret: false },
      { key: 'client_id', label: 'Client ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', isSecret: false },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'Enter client secret', isSecret: true },
      { key: 'subscription_id', label: 'Subscription ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', isSecret: false },
    ]},
    { name: 'Datadog', icon: '📊', description: 'Monitoring & observability', category: 'devops', fields: [{ key: 'api_key', label: 'API Key', placeholder: 'Enter API key', isSecret: true }] },
    { name: 'Terraform', icon: '🏗️', description: 'Infrastructure as code', category: 'devops', fields: [{ key: 'cloud_token', label: 'Cloud Token', placeholder: 'Enter token', isSecret: true }] },
    { name: 'Docker', icon: '🐳', description: 'Container management', category: 'devops', fields: [{ key: 'registry_url', label: 'Registry URL', placeholder: 'docker.io', isSecret: false }] },
    { name: 'Kubernetes', icon: '☸️', description: 'Container orchestration', category: 'devops', fields: [
      { key: 'cluster_url', label: 'Cluster URL', placeholder: 'https://k8s-cluster.local', isSecret: false },
      { key: 'cluster_key', label: 'Cluster Key', placeholder: 'Enter cluster key', isSecret: true },
    ]},
    { name: 'Minikube', icon: '🚀', description: 'Local Kubernetes cluster', category: 'devops', fields: [
      { key: 'profile', label: 'Minikube Profile', placeholder: 'minikube', isSecret: false },
      { key: 'driver', label: 'Driver', placeholder: 'docker', isSecret: false },
    ]},
    { name: 'Kind', icon: '🎯', description: 'Kubernetes in Docker', category: 'devops', fields: [
      { key: 'cluster_name', label: 'Cluster Name', placeholder: 'kind', isSecret: false },
      { key: 'kubeconfig_path', label: 'Kubeconfig Path', placeholder: '~/.kube/config', isSecret: false },
    ]},
  ];

  const handleOpenModal = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  const handleOpenIntegration = (integrationName: string) => {
    // In a real app, this would open the integration's dashboard
    console.log(`Opening ${integrationName} dashboard...`);
  };

  const handleSaveCredentials = (credentials: Record<string, string>) => {
    if (selectedIntegration) {
      setConfiguredIntegrations((prev) => ({
        ...prev,
        [selectedIntegration.name]: true,
      }));
      setActiveIntegrations((prev) => ({
        ...prev,
        [selectedIntegration.name]: true,
      }));
    }
    setIsModalOpen(false);
  };

  const categories = ['messaging', 'cloud', 'tools', 'devops'] as const;
  const categoryLabels = {
    messaging: 'Messaging & Alerts',
    cloud: 'Cloud Providers',
    tools: 'Developer Tools',
    devops: 'DevOps & Infrastructure',
  };

  return (
    <>
      <div className="animate-fade-in-up space-y-8 p-6 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="text-cyan-500">
              <Cable className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold">Integrations</h2>
          </div>

          {categories.map((category) => {
            const categoryIntegrations = integrations.filter((i) => i.category === category);
            return (
              <div key={category} className="mb-8">
                <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                  {categoryLabels[category]}
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {categoryIntegrations.map((integration) => {
                    const isConfigured = configuredIntegrations[integration.name];
                    return (
                      <div
                        key={integration.name}
                        className={`backdrop-blur-md p-5 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                          isConfigured
                            ? theme === 'dark'
                              ? 'border-green-500/50 bg-green-500/10 hover:bg-green-500/15'
                              : 'border-green-500/50 bg-green-50 hover:bg-green-100/50'
                            : theme === 'dark'
                            ? 'border-cyan-500/30 bg-gray-800/40 hover:border-cyan-500/50 hover:bg-gray-800/50'
                            : 'border-cyan-500/30 bg-slate-50/40 hover:border-cyan-500/50 hover:bg-slate-100/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-2xl">{integration.icon}</span>
                          {isConfigured && <Check className="w-5 h-5 text-green-500" />}
                        </div>
                        <p className="font-semibold text-sm mb-1">{integration.name}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                          {integration.description}
                        </p>
                        {isConfigured && (
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleOpenIntegration(integration.name)}
                              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded transition-colors ${
                                theme === 'dark'
                                  ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open
                            </button>
                            <button
                              onClick={() => handleOpenModal(integration)}
                              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded transition-colors ${
                                theme === 'dark'
                                  ? 'border border-green-500/30 text-green-300 hover:bg-green-500/10'
                                  : 'border border-green-400 text-green-700 hover:bg-green-50'
                              }`}
                            >
                              <Settings className="w-3 h-3" />
                              Edit
                            </button>
                          </div>
                        )}
                        {!isConfigured && (
                          <button
                            onClick={() => handleOpenModal(integration)}
                            className={`mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded transition-colors ${
                              theme === 'dark'
                                ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                                : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                            }`}
                          >
                            <Zap className="w-3 h-3" />
                            Setup
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12 pt-8 border-t border-gray-700/30">
          <div className="text-center">
            <div className="inline-block px-6 py-3 rounded-lg backdrop-blur-md border border-cyan-500/30 bg-cyan-500/5">
              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}`}>
                ✨ More Integrations Coming Soon
              </p>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                We're constantly adding new integrations to expand CORTEX capabilities
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedIntegration && (
        <CredentialModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedIntegration(null);
          }}
          integrationName={selectedIntegration.name}
          fields={selectedIntegration.fields || []}
          onSave={handleSaveCredentials}
        />
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes';

interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  isSecret: boolean;
}

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrationName: string;
  fields: CredentialField[];
  onSave: (credentials: Record<string, string>) => void;
}

export function CredentialModal({
  isOpen,
  onClose,
  integrationName,
  fields,
  onSave,
}: CredentialModalProps) {
  const { theme } = useTheme();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(credentials);
    setCredentials({});
    onClose();
  };

  const handleChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const toggleShowPassword = (key: string) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-lg shadow-2xl border ${
          theme === 'dark'
            ? 'bg-gray-900 border-gray-700/50'
            : 'bg-white border-slate-200/50'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
          <h2 className="text-lg font-semibold">Setup {integrationName}</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-800'
                : 'hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {fields.map((field) => (
            <div key={field.key}>
              <label
                className={`text-sm font-medium block mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-700'
                }`}
              >
                {field.label}
              </label>
              <div className="relative">
                {field.key === 'service_account_json' ? (
                  <textarea
                    value={credentials[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={6}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all font-mono text-sm ${
                      theme === 'dark'
                        ? 'bg-gray-800/50 text-white placeholder-gray-500 border-gray-700/30 focus:outline-none focus:border-cyan-500/50'
                        : 'bg-slate-50/50 text-slate-900 placeholder-slate-400 border-slate-200/30 focus:outline-none focus:border-cyan-500/50'
                    }`}
                  />
                ) : (
                  <input
                    type={field.isSecret && !showPassword[field.key] ? 'password' : 'text'}
                    value={credentials[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-800/50 text-white placeholder-gray-500 border-gray-700/30 focus:outline-none focus:border-cyan-500/50'
                        : 'bg-slate-50/50 text-slate-900 placeholder-slate-400 border-slate-200/30 focus:outline-none focus:border-cyan-500/50'
                    }`}
                  />
                )}
                {field.isSecret && field.key !== 'service_account_json' && (
                  <button
                    type="button"
                    onClick={() => toggleShowPassword(field.key)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    {showPassword[field.key] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700/30">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={fields.some((f) => !credentials[f.key])}
            className="px-4 py-2 rounded-lg font-medium bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Connection
          </button>
        </div>
      </div>
    </div>
  );
}

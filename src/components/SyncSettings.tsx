'use client';

import { useState } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface SyncSettingsProps {
  onSync: (limit: number) => Promise<void>;
  isRefreshing: boolean;
}

export function SyncSettings({ onSync, isRefreshing }: SyncSettingsProps) {
  const [emailLimit, setEmailLimit] = useState(20);
  const [showSettings, setShowSettings] = useState(false);

  const handleSync = () => {
    onSync(emailLimit);
    setShowSettings(false);
  };

  return (
    <div className="relative">
      {/* Main sync button */}
      <button
        onClick={handleSync}
        disabled={isRefreshing}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isRefreshing ? (
          <LoadingSpinner size="sm" className="mr-2" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {isRefreshing ? 'Syncing...' : 'Sync Emails'}
      </button>

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="ml-2 inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Sync Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {/* Settings dropdown */}
      {showSettings && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Sync Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Number of emails to sync
                </label>
                <select
                  value={emailLimit}
                  onChange={(e) => setEmailLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10 emails</option>
                  <option value={20}>20 emails</option>
                  <option value={30}>30 emails</option>
                  <option value={50}>50 emails</option>
                  <option value={100}>100 emails</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={handleSync}
                  disabled={isRefreshing}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 transition-colors"
                >
                  {isRefreshing ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync {emailLimit} Emails
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

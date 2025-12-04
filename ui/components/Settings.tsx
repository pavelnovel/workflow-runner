import React, { useState, useEffect } from 'react';
import { Key, Trash2, Check, AlertCircle } from 'lucide-react';

interface SettingsProps {
  onApiKeyChange?: (key: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmDeletes, setConfirmDeletes] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key') || '';
    const storedConfirmDeletes = localStorage.getItem('confirm_deletes');

    setApiKey(storedKey);
    setConfirmDeletes(storedConfirmDeletes !== 'false');
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    onApiKeyChange?.(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleConfirmDeletesChange = (value: boolean) => {
    setConfirmDeletes(value);
    localStorage.setItem('confirm_deletes', String(value));
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      localStorage.clear();
      setApiKey('');
      setConfirmDeletes(true);
      alert('Local data cleared.');
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* API Key Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <Key className="text-brand-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Gemini API Key</h2>
            <p className="text-sm text-gray-500">Required for AI-powered workflow generation</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full border border-gray-300 rounded-lg p-3 pr-24 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveApiKey}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saved ? <Check size={16} /> : null}
              {saved ? 'Saved' : 'Save API Key'}
            </button>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Get an API key
            </a>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Preferences</h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900">Confirm before deleting</p>
              <p className="text-sm text-gray-500">Show confirmation dialog when deleting workflows or runs</p>
            </div>
            <button
              onClick={() => handleConfirmDeletesChange(!confirmDeletes)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                confirmDeletes ? 'bg-brand-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  confirmDeletes ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </label>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded-2xl border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <AlertCircle className="text-red-500" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Danger Zone</h2>
            <p className="text-sm text-gray-500">Irreversible actions</p>
          </div>
        </div>

        <button
          onClick={handleClearData}
          className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
        >
          <Trash2 size={16} />
          Clear All Local Data
        </button>
      </section>
    </div>
  );
};

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [timezone, setTimezone] = useState('Europe/Istanbul');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.timezone) {
          setTimezone(data.timezone);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timezone }),
      });
      if (res.ok) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage('Failed to save settings.');
      }
    } catch (error) {
      setMessage('Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500 animate-pulse">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Uygulama Ayarları</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Local Timezone (Bölgesel Zaman Dilimi)
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          >
            <option value="Europe/Istanbul">Istanbul (UTC+3)</option>
            <option value="UTC">UTC (GMT)</option>
            <option value="Europe/London">London (UTC/BST)</option>
            <option value="Europe/Berlin">Berlin (UTC+1/+2)</option>
            <option value="America/New_York">New York (UTC-5/-4)</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            n8n workflowları ve kampanya zamanlamaları bu zaman dilimine göre ayarlanacak. 
            n8n tarafındaki workflow zaman diliminin de aynı olduğundan emin olun.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-50">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`w-full md:w-auto h-11 px-8 rounded-lg font-medium transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
          >
            {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </Button>
          
          {message && (
            <p className={`mt-4 text-sm font-medium ${message.includes('success') || message.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

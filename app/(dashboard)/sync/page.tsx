'use client';

import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

export default function SyncPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const created = searchParams.get('created');

  const startSync = () => {
    window.location.href = '/api/google/auth';
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Sync Settings</h1>
      <p className="mb-6 text-gray-500">Google rehberinizi sistemle senkronize edin.</p>

      {status === 'success' && (
        <div className="mb-6 rounded-md bg-green-50 p-4 text-green-700 border border-green-200">
          Senkronizasyon başarıyla tamamlandı! {created} kişi aktarıldı.
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700 border border-red-200">
          Senkronizasyon sırasında bir hata oluştu. Lütfen tekrar deneyin.
        </div>
      )}

      <div className="rounded-lg border border-border p-6 bg-white shadow-sm">
        <h2 className="text-lg font-medium mb-2">Google Contacts</h2>
        <p className="text-sm text-gray-600 mb-4">
          Google hesabınıza bağlanarak rehberinizdeki kişileri ve telefon numaralarını otomatik olarak çekin.
        </p>
        <Button onClick={startSync} className="bg-blue-600 hover:bg-blue-700 text-white">
          Google ile Senkronize Et
        </Button>
      </div>
    </div>
  );
}
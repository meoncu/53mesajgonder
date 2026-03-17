'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Search, Edit3, X, FileText } from 'lucide-react';

interface Contact {
  id: string;
  fullName: string;
  primaryPhone?: string;
  primaryEmail?: string;
  source: string;
  tags: string[];
  notes?: string;
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error('Güncelleme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      closeNoteModal();
    },
  });

  const contacts = data?.items || [];

  const filteredContacts = contacts.filter((c: Contact) =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.primaryPhone && c.primaryPhone.includes(searchTerm)) ||
    (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openNoteModal = (contact: Contact) => {
    setSelectedContact(contact);
    setNoteText(contact.notes || '');
    setIsNoteModalOpen(true);
  };

  const closeNoteModal = () => {
    setIsNoteModalOpen(false);
    setSelectedContact(null);
    setNoteText('');
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContact) {
      updateNoteMutation.mutate({ id: selectedContact.id, notes: noteText });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Kişiler yükleniyor...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Hata: {(error as Error).message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Kişiler</h1>
          <p className="text-gray-500 text-sm">Rehberinizdeki tüm kişileri buradan yönetebilirsiniz.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="İsim, numara veya notlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 border-b border-border">
              <tr>
                <th className="px-6 py-4">Ad Soyad</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4">Kaynak</th>
                <th className="px-6 py-4">Açıklama / Not</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Search size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium">Kişi bulunamadı</p>
                      <p className="text-sm">Farklı bir arama yapmayı veya senkronize etmeyi deneyin.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact: Contact) => (
                  <tr key={contact.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {contact.fullName.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{contact.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-700 font-medium">{contact.primaryPhone || '-'}</span>
                        <span className="text-gray-400 text-xs">{contact.primaryEmail || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        contact.source === 'google' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                        {contact.source === 'google' ? 'Google' : contact.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {contact.notes ? (
                        <p className="text-gray-600 italic line-clamp-2 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {contact.notes}
                        </p>
                      ) : (
                        <span className="text-gray-300 text-xs italic">Not eklenmemiş...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openNoteModal(contact)}
                        className="p-2 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-blue-100 rounded-xl text-gray-400 transition-all active:scale-90"
                        title="Notu Düzenle"
                      >
                        <Edit3 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-gray-50/50 border-t border-border flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500">
            {filteredContacts.length} / {contacts.length} kişi gösteriliyor
          </span>
        </div>
      </div>

      {/* Note Edit Modal */}
      {isNoteModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-none mb-1">Açıklama Ekle</h3>
                  <p className="text-sm text-gray-500 font-medium">{selectedContact.fullName}</p>
                </div>
              </div>
              <button onClick={closeNoteModal} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleNoteSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Kişi Notu / Tanışma Hikayesi</label>
                <textarea
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Bu kişiyi nereden tanıyorsunuz? Özel bir notunuz var mı?"
                  rows={6}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none shadow-inner"
                />
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={closeNoteModal} className="flex-1 py-6 rounded-2xl border-gray-200 hover:bg-gray-50 font-bold">Vazgeç</Button>
                <Button
                  type="submit"
                  disabled={updateNoteMutation.isPending}
                  className="flex-1 py-6 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all text-base font-bold"
                >
                  {updateNoteMutation.isPending ? 'Kaydediliyor...' : 'Notu Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
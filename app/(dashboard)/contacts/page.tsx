'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Search, Edit3, X, FileText, Trash2, User, Phone, 
  Tag, ArrowUp, ArrowDown, Users, Plus 
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  color?: string;
}

interface Contact {
  id: string;
  fullName: string;
  primaryPhone?: string;
  primaryEmail?: string;
  source: string;
  tags: string[];
  groupIds: string[];
  notes?: string;
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Contact; direction: 'asc' | 'desc' } | null>({ key: 'fullName', direction: 'asc' });
  
  const [formData, setFormData] = useState({
    fullName: '',
    primaryPhone: '',
    notes: '',
    groupIds: [] as string[]
  });
  
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch('/api/groups');
      return res.json();
    },
  });

  const groups: Group[] = (groupsData?.items || []).filter((g: any) => !g.type || g.type === 'contact');

  const { data, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Güncelleme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      closeEditModal();
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Silme işlemi başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const contacts = data?.items || [];

  const handleSort = (key: keyof Contact) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aValue: string = '';
    let bValue: string = '';

    if (key === 'tags') {
      const aNames = (a.groupIds || []).map((gid: string) => groups.find(g => g.id === gid)?.name || '').filter(Boolean).sort().join(', ');
      const bNames = (b.groupIds || []).map((gid: string) => groups.find(g => g.id === gid)?.name || '').filter(Boolean).sort().join(', ');
      aValue = aNames.toLowerCase();
      bValue = bNames.toLowerCase();
    } else {
      aValue = (a[key] || '').toString().toLowerCase();
      bValue = (b[key] || '').toString().toLowerCase();
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredContacts = sortedContacts.filter((c: Contact) =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.primaryPhone && c.primaryPhone.includes(searchTerm)) ||
    (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.tags && c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      fullName: contact.fullName,
      primaryPhone: contact.primaryPhone || '',
      notes: contact.notes || '',
      groupIds: contact.groupIds || []
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedContact(null);
    setFormData({ fullName: '', primaryPhone: '', notes: '', groupIds: [] });
  };

  const toggleGroupId = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContact) {
      updateContactMutation.mutate({ 
        id: selectedContact.id, 
        data: formData 
      });
    }
  };

  const handleDelete = (contact: Contact) => {
    if (confirm(`${contact.fullName} isimli kişiyi silmek istediğinize emin misiniz?`)) {
      deleteContactMutation.mutate(contact.id);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-outfit">Kişiler yükleniyor...</div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-outfit">Kişiler</h1>
          <p className="text-gray-500 text-xs font-outfit">Rehber yönetimi ve kategorizasyon.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="İsim, numara veya grup ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/50 uppercase font-bold text-gray-500 border-b border-border">
              <tr>
                <th className="px-5 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort('fullName')}>
                  <div className="flex items-center gap-1.5">
                    Ad Soyad
                    {sortConfig?.key === 'fullName' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                    ) : <ArrowUp size={14} className="text-gray-300 opacity-0 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort('primaryPhone')}>
                  <div className="flex items-center gap-1.5">
                    İletişim
                    {sortConfig?.key === 'primaryPhone' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />)}
                  </div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort('tags')}>
                  <div className="flex items-center gap-1.5">
                    Gruplar / Etiketler
                    {sortConfig?.key === 'tags' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />)}
                  </div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort('source')}>
                  <div className="flex items-center gap-1.5">
                    Kaynak
                    {sortConfig?.key === 'source' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />)}
                  </div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => handleSort('notes')}>
                  <div className="flex items-center gap-1.5">
                    Notlar
                    {sortConfig?.key === 'notes' && (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />)}
                  </div>
                </th>
                <th className="px-5 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <Users size={48} className="opacity-20" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">Kişi bulunamadı</p>
                      <p className="text-sm">Arama kriterlerinizi değiştirmeyi deneyin.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact: Contact) => {
                  const firstGroupId = contact.groupIds?.[0];
                  const firstGroup = firstGroupId ? groups.find(g => g.id === firstGroupId) : null;
                  const rowColor = firstGroup?.color || '';

                  return (
                    <tr 
                      key={contact.id} 
                      className="hover:opacity-80 transition-all group border-b border-gray-50 last:border-0"
                      style={rowColor ? { backgroundColor: `${rowColor}08` } : {}}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs shadow-sm"
                            style={{ backgroundColor: rowColor || '#3B82F6' }}
                          >
                            {contact.fullName.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-900">{contact.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                            <Phone size={10} className="text-gray-400" />
                            {contact.primaryPhone || '-'}
                          </div>
                          {contact.primaryEmail && <span className="text-gray-400 text-[10px] ml-4">{contact.primaryEmail}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(contact.groupIds || []).map((gid) => {
                            const group = groups.find(g => g.id === gid);
                            if (!group) return null;
                            return (
                              <span 
                                key={gid} 
                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1"
                                style={{ 
                                  backgroundColor: `${group.color || '#3B82F6'}15`, 
                                  color: group.color || '#3B82F6',
                                  borderColor: `${group.color || '#3B82F6'}33`
                                }}
                              >
                                <Tag size={8} />
                                {group.name}
                              </span>
                            );
                          })}
                          {(!contact.groupIds || contact.groupIds.length === 0) && (
                            <button 
                              onClick={() => openEditModal(contact)}
                              className="text-gray-300 hover:text-blue-500 transition-colors flex items-center gap-1 text-[10px] group/add"
                            >
                              <Plus size={10} /> Grup Ekle
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          contact.source === 'google' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {contact.source === 'google' ? 'Google' : 'Sistem'}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        {contact.notes ? (
                          <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100 group-hover:bg-white transition-colors">
                            <p className="text-gray-600 line-clamp-1 text-[11px] leading-relaxed">
                              {contact.notes}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-[10px] italic ml-2">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => openEditModal(contact)}
                            className="p-2 hover:bg-white hover:shadow-sm hover:text-blue-600 rounded-xl text-gray-400 border border-transparent hover:border-gray-100 transition-all font-bold"
                            title="Düzenle"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(contact)}
                            className="p-2 hover:bg-white hover:shadow-sm hover:text-red-600 rounded-xl text-gray-400 border border-transparent hover:border-gray-100 transition-all font-bold"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-gray-50/30 border-t border-border flex justify-between items-center">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Toplam {filteredContacts.length} kayıt listelendi
          </span>
        </div>
      </div>

      {isEditModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-2xl text-white shadow-lg shadow-blue-200">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-none mb-1">Kişiyi Düzenle</h3>
                  <p className="text-sm text-gray-500 font-medium">{selectedContact.fullName}</p>
                </div>
              </div>
              <button onClick={closeEditModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Ad Soyad</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-[18px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Telefon Numarası</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input
                    type="tel"
                    value={formData.primaryPhone}
                    onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                    placeholder="905xxxxxxxxx"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-[18px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Gruplandırma (Seçiniz)</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-100 custom-scrollbar">
                  {groups.map((group) => (
                    <div 
                      key={group.id} 
                      onClick={() => toggleGroupId(group.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border ${
                        formData.groupIds.includes(group.id) 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        formData.groupIds.includes(group.id) ? 'bg-white border-white text-blue-600' : 'bg-transparent border-gray-300'
                      }`}>
                        {formData.groupIds.includes(group.id) && <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm" />}
                      </div>
                      <span className="text-[11px] font-bold truncate">{group.name}</span>
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <div className="col-span-2 text-center py-6">
                      <p className="text-[11px] text-gray-400 italic">Tanımlı grup bulunamadı...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Kişiye Özel Notlar</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Kişi hakkında notlar..."
                    rows={4}
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-[22px] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none text-sm font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100 mt-4 shrink-0">
                <Button type="button" variant="outline" onClick={closeEditModal} className="flex-1 py-6 rounded-[20px] border-gray-200 hover:bg-gray-50 font-bold text-sm h-12">Vazgeç</Button>
                <Button
                  type="submit"
                  disabled={updateContactMutation.isPending}
                  className="flex-1 py-6 rounded-[20px] bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all text-sm font-bold h-12"
                >
                  {updateContactMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Search, Edit3, X, FileText, Trash2, User, Phone, 
  Tag, ArrowUp, ArrowDown, Users, Plus, CheckSquare, Square
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
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
    staleTime: 15 * 60 * 1000,
  });

  const groups: Group[] = (groupsData?.items || []).filter((g: any) => !g.type || g.type === 'contact');

  const { data, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (contactIds: string[]) => {
      const res = await fetch('/api/contacts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds }),
      });
      if (!res.ok) throw new Error('Toplu silme başarısız');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedIds([]);
      alert(data.message || 'Seçilen kişiler silindi.');
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
    (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`${selectedIds.length} kişiyi toplu olarak silmek istediğinize emin misiniz?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

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

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-outfit font-bold">Kişiler yükleniyor...</div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-outfit tracking-tight">Kişiler</h1>
          <p className="text-gray-500 text-xs font-bold font-outfit uppercase tracking-widest opacity-60">Rehber yönetimi ve toplu işlemler.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button 
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              variant="destructive"
              className="rounded-xl px-4 py-2 h-10 font-bold text-xs bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2 animate-in slide-in-from-right-4 duration-300"
            >
              <Trash2 size={14} />
              {selectedIds.length} Kişiyi Sil
            </Button>
          )}
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="İsim veya numara ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-bold shadow-sm h-10"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/50 uppercase font-black text-gray-500 border-b border-border">
              <tr>
                <th className="px-5 py-4 w-10">
                  <button 
                    onClick={toggleSelectAll}
                    className="p-1 rounded-lg hover:bg-gray-200 transition-colors text-gray-400 hover:text-blue-600"
                  >
                    {selectedIds.length === filteredContacts.length && filteredContacts.length > 0
                      ? <CheckSquare size={18} className="text-blue-600" /> 
                      : <Square size={18} />
                    }
                  </button>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors group" onClick={() => handleSort('fullName')}>
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
                <th className="px-5 py-4">Gruplar / Etiketler</th>
                <th className="px-5 py-4 w-24">Kaynak</th>
                <th className="px-5 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="bg-gray-50 p-6 rounded-3xl mb-4 border border-gray-100">
                        <Users size={48} className="opacity-20 text-blue-600" />
                      </div>
                      <p className="text-lg font-black text-gray-900 tracking-tight">Kişi bulunamadı</p>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-60">Arama kriterlerinizi kontrol edin.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact: Contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  const firstGroupId = contact.groupIds?.[0];
                  const firstGroup = firstGroupId ? groups.find(g => g.id === firstGroupId) : null;
                  const rowColor = firstGroup?.color || '';

                  return (
                    <tr 
                      key={contact.id} 
                      className={`hover:bg-gray-50 transition-all group border-b border-gray-50 last:border-0 ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <button 
                          onClick={() => toggleSelect(contact.id)}
                          className="p-1 rounded-lg transition-colors"
                        >
                          {isSelected 
                            ? <CheckSquare size={18} className="text-blue-600" /> 
                            : <Square size={18} className="text-gray-300 group-hover:text-gray-400" />
                          }
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-black text-sm shadow-sm border-2 border-white"
                            style={{ backgroundColor: rowColor || '#3B82F6' }}
                          >
                            {contact.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm">{contact.fullName}</span>
                            {contact.notes && <span className="text-[10px] text-gray-400 truncate max-w-[120px] font-bold">{contact.notes}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-gray-700 font-bold text-sm">
                            <Phone size={12} className="text-blue-500" />
                            {contact.primaryPhone || '-'}
                          </div>
                          {contact.primaryEmail && <span className="text-gray-400 text-[10px] font-bold">{contact.primaryEmail}</span>}
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
                                className="px-2.5 py-1 rounded-xl text-[10px] font-black border flex items-center gap-1.5 shadow-sm"
                                style={{ 
                                  backgroundColor: `${group.color || '#3B82F6'}10`, 
                                  color: group.color || '#3B82F6',
                                  borderColor: `${group.color || '#3B82F6'}20`
                                }}
                              >
                                <Tag size={10} />
                                {group.name}
                              </span>
                            );
                          })}
                          {(!contact.groupIds || contact.groupIds.length === 0) && (
                            <button 
                              onClick={() => openEditModal(contact)}
                              className="text-gray-300 hover:text-blue-600 transition-all flex items-center gap-1 text-[10px] font-bold py-1 px-2 border border-dashed border-gray-200 rounded-xl hover:border-blue-200"
                            >
                              <Plus size={10} /> Grup Ekle
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-black border shadow-xs ${
                          contact.source === 'google' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                          {contact.source === 'google' ? 'Google' : 'Sistem'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => openEditModal(contact)}
                            className="p-2.5 hover:bg-white hover:shadow-lg hover:text-blue-600 rounded-2xl text-gray-400 border border-transparent hover:border-gray-100 transition-all"
                            title="Düzenle"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(contact)}
                            className="p-2.5 hover:bg-white hover:shadow-lg hover:text-red-600 rounded-2xl text-gray-400 border border-transparent hover:border-gray-100 transition-all"
                            title="Sil"
                          >
                            <Trash2 size={18} />
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
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
            {selectedIds.length > 0 
              ? `${selectedIds.length} / ${filteredContacts.length} KİŞİ SEÇİLDİ`
              : `Toplam ${filteredContacts.length} kayıt listelendi`
            }
          </span>
        </div>
      </div>

      {/* Edit Modal remains similar with premium look */}
      {isEditModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-200">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Kişiyi Düzenle</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedContact.fullName}</p>
                </div>
              </div>
              <button onClick={closeEditModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Ad Soyad</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Telefon Numarası</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="tel"
                    value={formData.primaryPhone}
                    onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                    placeholder="905xxxxxxxxx"
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Gruplandırma</label>
                <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-[24px] border border-gray-100 custom-scrollbar">
                  {groups.map((group) => (
                    <div 
                      key={group.id} 
                      onClick={() => toggleGroupId(group.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                        formData.groupIds.includes(group.id) 
                          ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100' 
                          : 'bg-white border-transparent hover:border-blue-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                        formData.groupIds.includes(group.id) ? 'bg-white border-white scale-110' : 'bg-transparent border-gray-200'
                      }`}>
                        {formData.groupIds.includes(group.id) && <div className="w-2 h-2 bg-blue-600 rounded-sm" />}
                      </div>
                      <span className={`text-[11px] font-black truncate ${formData.groupIds.includes(group.id) ? 'text-white' : 'text-gray-700'}`}>
                        {group.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Kişiye Özel Notlar</label>
                <div className="relative group">
                  <FileText className="absolute left-5 top-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Kişi hakkında notlar..."
                    rows={4}
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-transparent rounded-[24px] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none text-sm font-bold text-gray-900 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100 mt-4 shrink-0">
                <Button type="button" variant="outline" onClick={closeEditModal} className="flex-1 py-7 rounded-2xl border-gray-100 hover:bg-gray-50 font-black text-sm h-14 tracking-widest shadow-sm uppercase">Vazgeç</Button>
                <Button
                  type="submit"
                  disabled={updateContactMutation.isPending}
                  className="flex-1 py-7 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-200 active:scale-95 transition-all text-sm font-black h-14 tracking-widest uppercase"
                >
                  {updateContactMutation.isPending ? 'KAYDEDİLİYOR...' : 'KAYDET'}
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
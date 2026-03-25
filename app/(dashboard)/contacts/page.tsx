'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Search, Edit3, X, FileText, Trash2, User, Phone, 
  Tag, ArrowUp, ArrowDown, Users, Plus, CheckSquare, Square, AlertTriangle
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

  const contacts = useMemo(() => data?.items || [] as Contact[], [data]);

  // DUPLICATE DETECTION LOGIC
  const duplicateNumbers = useMemo(() => {
    const counts: Record<string, number> = {};
    const duplicatesSet = new Set<string>();
    
    contacts.forEach((c: Contact) => {
      if (c.primaryPhone && c.primaryPhone.length > 5) {
        counts[c.primaryPhone] = (counts[c.primaryPhone] || 0) + 1;
        if (counts[c.primaryPhone] > 1) {
          duplicatesSet.add(c.primaryPhone);
        }
      }
    });
    
    return duplicatesSet;
  }, [contacts]);

  const createContactMutation = useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Kayıt başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      closeEditModal();
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

  const openAddModal = () => {
    setSelectedContact(null);
    setFormData({
      fullName: '',
      primaryPhone: '',
      notes: '',
      groupIds: []
    });
    setIsEditModalOpen(true);
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
    } else {
      createContactMutation.mutate(formData);
    }
  };

  const handleDelete = (contact: Contact) => {
    if (confirm(`${contact.fullName} isimli kişiyi silmek istediğinize emin misiniz?`)) {
      deleteContactMutation.mutate(contact.id);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400 font-bold font-outfit uppercase tracking-widest">Kişiler yükleniyor...</div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-gray-900 font-outfit tracking-tighter">Rehber</h1>
            {duplicateNumbers.size > 0 && (
              <div 
                className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-1.5 animate-pulse"
                title={`${duplicateNumbers.size} farklı numara mükerrer kaydedilmiş.`}
              >
                <AlertTriangle size={10} />
                {duplicateNumbers.size} Mükerrer Kayıt
              </div>
            )}
          </div>
          <p className="text-gray-500 text-[11px] font-bold font-outfit uppercase tracking-widest opacity-60">Kontaklarınızı yönetin ve gruplandırın.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={openAddModal}
            className="rounded-[18px] px-6 py-2.5 h-12 font-black text-xs bg-gray-900 text-white hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} />
            HIZLI KAYIT +
          </Button>

          {selectedIds.length > 0 && (
            <Button 
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              variant="destructive"
              className="rounded-[18px] px-6 py-2.5 h-12 font-black text-xs bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-100 flex items-center gap-2 animate-in zoom-in-95"
            >
              <Trash2 size={16} />
              {selectedIds.length} SİL
            </Button>
          )}
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type="text"
              placeholder="Ara (İsim veya numara)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-5 py-3 bg-white border border-gray-100 rounded-[18px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold shadow-sm h-12"
            />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-xl shadow-gray-100/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/40 uppercase font-black text-gray-400 border-b border-gray-50 tracking-widest">
              <tr>
                <th className="px-6 py-6 w-10">
                  <button 
                    onClick={toggleSelectAll}
                    className="p-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {selectedIds.length === filteredContacts.length && filteredContacts.length > 0
                      ? <CheckSquare size={20} className="text-blue-600" /> 
                      : <Square size={20} className="text-gray-300" />
                    }
                  </button>
                </th>
                <th className="px-6 py-6 cursor-pointer hover:bg-gray-100/50 transition-colors group" onClick={() => handleSort('fullName')}>
                  <div className="flex items-center gap-1.5">
                    Ad Soyad
                    {sortConfig?.key === 'fullName' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                    ) : <ArrowUp size={14} className="text-gray-200 opacity-0 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-6 py-6">İletişim</th>
                <th className="px-6 py-6">Gruplar</th>
                <th className="px-6 py-6 w-24">Kaynak</th>
                <th className="px-6 py-6 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-32 text-center bg-gray-50/20">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-white p-8 rounded-[32px] mb-6 shadow-xl shadow-gray-100 border border-gray-50">
                        <Users size={64} className="text-blue-100" strokeWidth={1} />
                      </div>
                      <p className="text-xl font-black text-gray-900 tracking-tight">Eşleşen kayıt bulunamadı...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact: Contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  const isDuplicate = contact.primaryPhone && duplicateNumbers.has(contact.primaryPhone);
                  
                  const firstGroupId = contact.groupIds?.[0];
                  const firstGroup = firstGroupId ? groups.find(g => g.id === firstGroupId) : null;
                  const rowColor = firstGroup?.color || '';

                  return (
                    <tr 
                      key={contact.id} 
                      className={`hover:bg-gray-50/80 transition-all group border-b border-gray-50/50 last:border-0 ${isSelected ? 'bg-blue-50/20' : ''}`}
                    >
                      <td className="px-6 py-5">
                        <button 
                          onClick={() => toggleSelect(contact.id)}
                          className="p-1 rounded-lg transition-colors"
                        >
                          {isSelected 
                            ? <CheckSquare size={20} className="text-blue-600" /> 
                            : <Square size={20} className="text-gray-200 group-hover:text-gray-300" />
                          }
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-11 h-11 rounded-[16px] text-white flex items-center justify-center font-black text-sm shadow-lg border-2 border-white transform transition-transform group-hover:scale-105"
                            style={{ backgroundColor: rowColor || '#3B82F6', boxShadow: `0 8px 20px -8px ${rowColor || '#3B82F6'}` }}
                          >
                            {contact.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-gray-900 text-[13px] tracking-tight">{contact.fullName}</span>
                            {contact.notes && <span className="text-[10px] text-gray-400 truncate max-w-[150px] font-bold uppercase tracking-widest opacity-70 mt-0.5">{contact.notes}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className={`flex items-center gap-2 font-black text-[13px] tracking-tight ${isDuplicate ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded-lg w-fit' : 'text-gray-700'}`}>
                            <Phone size={12} className={isDuplicate ? 'text-red-500' : 'text-blue-500'} />
                            {contact.primaryPhone || '-'}
                            {isDuplicate && <AlertTriangle size={10} className="animate-bounce" />}
                          </div>
                          {contact.primaryEmail && <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider ml-5">{contact.primaryEmail}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {(contact.groupIds || []).map((gid) => {
                            const group = groups.find(g => g.id === gid);
                            if (!group) return null;
                            return (
                              <span 
                                key={gid} 
                                className="px-3 py-1.5 rounded-[12px] text-[9px] font-black border flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                                style={{ 
                                  backgroundColor: `${group.color || '#3B82F6'}10`, 
                                  color: group.color || '#3B82F6',
                                  borderColor: `${group.color || '#3B82F6'}20`
                                }}
                              >
                                <Tag size={10} strokeWidth={3} />
                                {group.name.toUpperCase()}
                              </span>
                            );
                          })}
                          {(!contact.groupIds || contact.groupIds.length === 0) && (
                            <button 
                              onClick={() => openEditModal(contact)}
                              className="text-gray-300 hover:text-blue-600 transition-all flex items-center gap-1 text-[9px] font-bold py-1.5 px-3 border border-dashed border-gray-100 rounded-[12px] hover:border-blue-100 uppercase tracking-widest"
                            >
                              <Plus size={10} /> GRUP EKLE
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[9px] font-black border shadow-sm tracking-widest ${
                          contact.source === 'google' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                          {contact.source === 'google' ? 'GOOGLE' : 'MANUEL'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => openEditModal(contact)}
                            className="p-3 bg-white shadow-xl shadow-gray-100 border border-gray-100 hover:text-blue-600 rounded-[14px] text-gray-400 transition-all hover:-translate-y-0.5"
                            title="Düzenle"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(contact)}
                            className="p-3 bg-white shadow-xl shadow-gray-100 border border-gray-100 hover:text-red-600 rounded-[14px] text-gray-400 transition-all hover:-translate-y-0.5"
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
        <div className="px-8 py-5 bg-gray-50/30 border-t border-gray-50 flex justify-between items-center mt-auto">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            {selectedIds.length > 0 
              ? `${selectedIds.length} / ${filteredContacts.length} KİŞİ SEÇİLDİ`
              : `TOPLAM ${filteredContacts.length} KAYIT LİSTELENDİ`
            }
          </span>
        </div>
      </div>

      {/* MODAL SECTION - THE SAME PREMIUM LOOK FOR ADD/EDIT */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/40">
            <div className="px-12 py-10 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-[20px] text-white shadow-2xl ${selectedContact ? 'bg-blue-600 shadow-blue-200' : 'bg-gray-900 shadow-gray-200'}`}>
                  {selectedContact ? <User size={24} /> : <Plus size={24} strokeWidth={3} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-1">
                    {selectedContact ? 'Kişiyi Düzenle' : 'Yeni Kayıt'}
                  </h3>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    {selectedContact ? selectedContact.fullName : 'REHBERE EKLE'}
                  </p>
                </div>
              </div>
              <button onClick={closeEditModal} className="p-3 hover:bg-gray-100 rounded-full text-gray-300 transition-all active:scale-90">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-12 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Ad Soyad</label>
                <div className="relative group/field">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/field:text-blue-600 group-focus-within/field:scale-110 transition-all" size={20} />
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-16 pr-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-[24px] focus:ring-8 focus:ring-blue-100/30 focus:border-blue-600 focus:bg-white outline-none transition-all text-[15px] font-black text-gray-900 shadow-inner"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Telefon Numarası</label>
                <div className="relative group/field">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/field:text-blue-600 group-focus-within/field:scale-110 transition-all" size={20} />
                  <input
                    type="tel"
                    value={formData.primaryPhone}
                    onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                    placeholder="905xxxxxxxxx"
                    className="w-full pl-16 pr-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-[24px] focus:ring-8 focus:ring-blue-100/30 focus:border-blue-600 focus:bg-white outline-none transition-all text-[15px] font-black text-gray-900 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Grup Seçimi</label>
                <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto p-4 bg-gray-50/50 rounded-[32px] border-2 border-gray-50 custom-scrollbar shadow-inner">
                  {groups.map((group) => {
                    const isSelected = formData.groupIds.includes(group.id);
                    return (
                      <div 
                        key={group.id} 
                        onClick={() => toggleGroupId(group.id)}
                        className={`group flex items-center gap-3 p-4 rounded-[20px] cursor-pointer transition-all border-2 ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-200' 
                            : 'bg-white border-transparent hover:border-blue-100'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-white border-white scale-110' : 'bg-transparent border-gray-100'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm" />}
                        </div>
                        <span className={`text-[12px] font-black truncate tracking-tight ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                          {group.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Özel Notlar</label>
                <div className="relative group/field">
                  <FileText className="absolute left-6 top-6 text-gray-300 group-focus-within/field:text-blue-600 transition-all" size={20} />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Kişi hakkında önemli detaylar..."
                    rows={4}
                    className="w-full pl-16 pr-8 py-6 bg-gray-50/50 border-2 border-transparent rounded-[32px] focus:ring-8 focus:ring-blue-100/30 focus:border-blue-600 focus:bg-white outline-none transition-all resize-none text-[14px] font-black text-gray-900 shadow-inner"
                  />
                </div>
              </div>

              <div className="flex gap-5 pt-10 border-t border-gray-50 mt-6 shrink-0 pb-4">
                <Button type="button" variant="outline" onClick={closeEditModal} className="flex-1 py-8 rounded-[24px] border-2 border-gray-100 hover:bg-gray-50 font-black text-sm h-16 tracking-[0.2em] uppercase transition-all hover:scale-[1.02]">İPTAL</Button>
                <Button
                  type="submit"
                  disabled={createContactMutation.isPending || updateContactMutation.isPending}
                  className={`flex-1 py-8 rounded-[24px] text-white shadow-2xl active:scale-95 transition-all text-sm font-black h-16 tracking-[0.2em] uppercase hover:scale-[1.02] ${
                    selectedContact ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-gray-900 hover:bg-black shadow-gray-300'
                  }`}
                >
                  {createContactMutation.isPending || updateContactMutation.isPending ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}
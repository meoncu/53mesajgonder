'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Plus, Trash2, Edit2, Users, Search, X, 
  LayoutGrid, List, Columns, GripVertical
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

interface Contact {
  id: string;
  fullName: string;
  primaryPhone?: string;
  groupIds: string[];
}

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'cards' | 'board' | 'matrix'>('board');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  
  // Group editing state
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  
  // Member management state
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Fetch groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch('/api/groups');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  // Fetch contacts
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newGroup: typeof formData) => {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/groups/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const toggleMemberMutation = useMutation({
    mutationFn: async ({ contactId, isMember, groupId }: { contactId: string; isMember: boolean; groupId: string }) => {
      const method = isMember ? 'DELETE' : 'POST';
      const body = isMember 
        ? JSON.stringify({ contactId }) 
        : JSON.stringify({ contactIds: [contactId] });
      
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const openModal = (group: Group | null = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({ name: group.name, description: group.description });
    } else {
      setEditingGroup(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setFormData({ name: '', description: '' });
  };

  const openMemberModal = (group: Group) => {
    setSelectedGroup(group);
    setIsMemberModalOpen(true);
  };

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    setSelectedGroup(null);
    setMemberSearchTerm('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const groups = groupsData?.items || [];
  const contacts = contactsData?.items || [];
  
  const filteredContacts = contacts.filter((c: Contact) => 
    c.fullName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    (c.primaryPhone && c.primaryPhone.includes(memberSearchTerm))
  );

  if (groupsLoading) return <div className="p-8 text-center text-gray-500">Gruplar yükleniyor...</div>;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-outfit">Gruplar</h1>
          <p className="text-gray-500 text-xs">Grup yönetimi ve üye düzenleme.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button 
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Kart Görünümü"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Pano Görünümü"
            >
              <Columns size={16} />
            </button>
            <button 
              onClick={() => setViewMode('matrix')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'matrix' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Matris Görünümü"
            >
              <List size={16} />
            </button>
          </div>
          <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm h-9 px-4 text-sm">
            <Plus size={16} className="mr-1.5" /> Yeni Grup
          </Button>
        </div>
      </div>

      {/* View Modes */}
      {viewMode === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 min-h-[500px] scrollbar-hide">
          {groups.map((group: Group) => (
            <div key={group.id} className="flex-none w-72 bg-gray-50/50 border border-border rounded-xl flex flex-col shadow-sm">
              <div className="p-3 border-b border-border bg-white rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                    <Users size={16} />
                  </div>
                  <h3 className="font-bold text-gray-900 leading-tight truncate max-w-[120px] text-sm">{group.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openModal(group)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"><Edit2 size={12} /></button>
                  <button onClick={() => openMemberModal(group)} className="p-1 hover:bg-blue-600 hover:text-white rounded text-blue-600 transition-colors"><Plus size={12} /></button>
                </div>
              </div>
              
              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2 flex justify-between">
                  <span>Üyeler ({group.memberCount || 0})</span>
                </div>
                {contacts.filter((c: Contact) => c.groupIds?.includes(group.id)).map((contact: Contact) => (
                  <div key={contact.id} className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group/item">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-none capitalize">
                        {contact.fullName.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{contact.fullName}</span>
                    </div>
                    <button 
                      onClick={() => toggleMemberMutation.mutate({ contactId: contact.id, isMember: true, groupId: group.id })}
                      className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                
                {group.memberCount === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-xs text-gray-400 italic">Üye bulunmuyor.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => openModal()}
            className="flex-none w-72 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/10 transition-all group"
          >
            <div className="bg-gray-50 group-hover:bg-blue-50 p-3 rounded-full mb-2 transition-colors">
              <Plus size={24} />
            </div>
            <span className="font-bold text-sm">Yeni Grup Ekle</span>
          </button>
        </div>
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group: Group) => (
            <div key={group.id} className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <Users size={20} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(group)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500"><Edit2 size={14} /></button>
                  <button onClick={() => { if(confirm('Sil?')) deleteMutation.mutate(group.id) }} className="p-1.5 hover:bg-red-50 rounded-md text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-0.5">{group.name}</h3>
              <p className="text-gray-500 text-xs mb-3 h-8 line-clamp-2">{group.description || 'Açıklama yok.'}</p>
              
              <div className="flex flex-wrap gap-1 mb-6 max-h-20 overflow-y-auto pr-1">
                {contacts.filter((c: Contact) => c.groupIds?.includes(group.id)).slice(0, 5).map((contact: Contact) => (
                  <span key={contact.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    {contact.fullName}
                  </span>
                ))}
                {group.memberCount > 5 && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                    +{group.memberCount - 5}
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">{group.memberCount || 0} Üye</span>
                <button onClick={() => openMemberModal(group)} className="text-xs font-bold text-blue-600 hover:underline">Yönet</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'matrix' && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-900 sticky left-0 bg-gray-50 z-10">Kişi / Gruplar</th>
                  {groups.map((group: Group) => (
                    <th key={group.id} className="px-6 py-4 font-bold text-gray-900 text-center min-w-[120px]">
                      {group.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.filter((c: Contact) => c.groupIds && c.groupIds.length > 0).map((contact: Contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 sticky left-0 bg-white border-r border-gray-100 group-hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                          {contact.fullName.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-800">{contact.fullName}</span>
                      </div>
                    </td>
                    {groups.map((group: Group) => {
                      const isMember = contact.groupIds?.includes(group.id);
                      return (
                        <td key={group.id} className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleMemberMutation.mutate({ contactId: contact.id, isMember, groupId: group.id })}
                            className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition-all ${
                              isMember 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                                : 'bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-400'
                            }`}
                          >
                            {isMember ? <Users size={12} /> : <Plus size={12} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Modals remain same but use refined UX */}
       {/* Group Create/Edit Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">
                {editingGroup ? 'Grubu Güncelle' : 'Yeni Grup'}
              </h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grup İsmi</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Açıklama</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none font-medium text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1 rounded-lg h-9 text-xs font-bold border-gray-200">Vazgeç</Button>
                <Button type="submit" className="flex-1 rounded-lg h-9 bg-blue-600 text-white font-bold text-xs">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Management Modal */}
      {isMemberModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-0.5">{selectedGroup.name} Grubu</h3>
                <p className="text-[11px] text-gray-500">Üye yönetimi.</p>
              </div>
              <button onClick={closeMemberModal} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Ara..." value={memberSearchTerm} onChange={(e) => setMemberSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-gray-50/50">
              {filteredContacts.map((contact: Contact) => {
                const isMember = contact.groupIds?.includes(selectedGroup.id);
                return (
                  <div key={contact.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${isMember ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-border text-gray-900 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isMember ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                        {contact.fullName.charAt(0)}
                      </div>
                      <span className="font-bold text-xs tracking-tight">{contact.fullName}</span>
                    </div>
                    <button 
                      onClick={() => toggleMemberMutation.mutate({ contactId: contact.id, isMember, groupId: selectedGroup.id })}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${isMember ? 'bg-white/20 hover:bg-white/30 truncate' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {isMember ? 'Çıkar' : 'Ekle'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <Button onClick={closeMemberModal} className="bg-gray-900 text-white px-6 rounded-lg font-bold h-9 text-xs">Kapat</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Plus, Trash2, Send, Calendar, Clock, 
  MessageSquare, Users, CheckCircle2, AlertCircle, X, Pencil, Star, Search
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  message: string;
  groupIds: string[];
  contactIds?: string[];
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed';
  isArchived: boolean;
  sentAt?: string;
  sentRecipients?: { id: string; fullName: string; phone: string }[];
  scheduledAt?: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  type?: 'contact' | 'campaign';
}

interface Contact {
  id: string;
  fullName: string;
  primaryPhone?: string;
  isFavorite?: boolean;
  groupIds?: string[];
}

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    groupIds: [] as string[],
    contactIds: [] as string[],
    scheduledAt: '',
    status: 'draft' as Campaign['status']
  });
  const [contactSearch, setContactSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'groups' | 'contacts'>('groups');
  const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
    refetchInterval: 3000, // Her 3 saniyede bir otomatik yenile (canlı progress için)
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch('/api/groups');
      return res.json();
    }
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newCampaign: any) => {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = data.fields ? ` (${data.fields.join(', ')})` : '';
        throw new Error((data.error || 'Kampanya oluşturulamadı') + details);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      closeModal();
    },
    onError: (error: Error) => {
      alert(`Lütfen formu kontrol edin: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Kampanya güncellenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      closeModal();
    },
    onError: (error: Error) => {
      alert(`Güncelleme Hatası: ${error.message}\n\nİpucu: Supabase'de 'contact_ids' sütununun 'text[]' (Array) tipinde olduğundan emin olun.`);
    }
  });

  const openModal = () => {
    setEditingCampaignId(null);
    setFormData({ name: '', message: '', groupIds: [], contactIds: [], scheduledAt: '', status: 'draft' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCampaignId(null);
    setFormData({ name: '', message: '', groupIds: [], contactIds: [], scheduledAt: '', status: 'draft' });
    setContactSearch('');
    setShowSelectedOnly(false);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);
    const safeContactIds = Array.isArray(campaign.contactIds) ? campaign.contactIds : [];
    
    let localScheduledDate = '';
    if (campaign.scheduledAt) {
      const d = new Date(campaign.scheduledAt);
      if (!isNaN(d.getTime())) {
        // Javascript Date nesnesini yerel saate göre YYYY-MM-DDThh:mm formatına çevirme
        const offset = d.getTimezoneOffset() * 60000; 
        localScheduledDate = new Date(d.getTime() - offset).toISOString().slice(0, 16);
      }
    }

    setFormData({
      name: campaign.name,
      message: campaign.message,
      groupIds: Array.isArray(campaign.groupIds) ? campaign.groupIds : [],
      contactIds: safeContactIds,
      scheduledAt: localScheduledDate,
      status: campaign.status
    });
    setIsModalOpen(true);
  };

  const handleGroupToggle = (groupId: string) => {
    setFormData(prev => {
      const currentGroups = Array.isArray(prev.groupIds) ? prev.groupIds : [];
      return {
        ...prev,
        groupIds: currentGroups.includes(groupId)
          ? currentGroups.filter(id => id !== groupId)
          : [...currentGroups, groupId]
      };
    });
  };

  const handleContactToggle = (contactId: string) => {
    setFormData(prev => {
      const currentContacts = Array.isArray(prev.contactIds) ? prev.contactIds : [];
      return {
        ...prev,
        contactIds: currentContacts.includes(contactId)
          ? currentContacts.filter(id => id !== contactId)
          : [...currentContacts, contactId]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalStatus = formData.status;
    if (formData.status === 'draft' || formData.status === 'scheduled') {
      finalStatus = formData.scheduledAt ? 'scheduled' : 'draft';
    }
    
    const payload = { 
      ...formData, 
      groupIds: Array.isArray(formData.groupIds) ? formData.groupIds : [],
      contactIds: Array.isArray(formData.contactIds) ? formData.contactIds : [],
      status: finalStatus,
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null
    };
    
    if (editingCampaignId) {
      updateMutation.mutate({ id: editingCampaignId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const rawCampaigns: Campaign[] = campaignsData?.items || [];
  const allGroups: Group[] = groupsData?.items || [];
  const campaignGroups = allGroups.filter(g => g.type === 'campaign');
  const contactGroups = allGroups.filter(g => !g.type || g.type === 'contact');
  
  const allContacts: Contact[] = contactsData?.items || [];
  const sortedContacts = [...allContacts].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Filter campaigns based on archive state
  const getIsArchived = (c: Campaign) => c.isArchived || c.status === 'completed';

  // Filter campaigns based on archive state
  const campaigns = rawCampaigns.filter(c => showArchive ? getIsArchived(c) : !getIsArchived(c));

  const filteredContactsSelection = sortedContacts.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(contactSearch.toLowerCase()) || 
                         (c.primaryPhone && c.primaryPhone.includes(contactSearch));
    const currentSelected = Array.isArray(formData.contactIds) ? formData.contactIds : [];
    if (showSelectedOnly) {
      return matchesSearch && currentSelected.includes(c.id);
    }
    return matchesSearch;
  });

  const clearContactSelection = () => {
    if (confirm('Tüm seçili kişileri temizlemek istediğinize emin misiniz?')) {
      setFormData(prev => ({ ...prev, contactIds: [] }));
    }
  };

  const createGroupMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, type: 'campaign' }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const handleCreateGroup = () => {
    const name = prompt('Yeni kampanya grubu ismi:');
    if (name) createGroupMutation.mutate(name);
  };

  const handleForceComplete = (campaign: Campaign) => {
    if (confirm(`'${campaign.name}' kampanyasını manuel olarak 'Tamamlandı' işaretlemek istiyor musunuz?`)) {
      updateMutation.mutate({ 
        id: campaign.id, 
        data: { status: 'completed' } 
      });
    }
  };

  const handleResetToDraft = (campaign: Campaign) => {
    if (confirm(`'${campaign.name}' kampanyasını taslağa geri çekmek istiyor musunuz?`)) {
      updateMutation.mutate({ 
        id: campaign.id, 
        data: { status: 'draft' } 
      });
    }
  };

  if (campaignsLoading) return <div className="p-8 text-center text-gray-500">Kampanyalar yükleniyor...</div>;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-outfit">Kampanyalar</h1>
          <p className="text-gray-500 text-xs text-center md:text-left">Mesaj gönderimlerinizi yönetin.</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={() => setShowArchive(!showArchive)}
            className={`rounded-lg text-xs font-bold h-9 px-4 border ${showArchive ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-white'}`}
          >
            {showArchive ? 'Aktif Kampanyalar' : 'Arşivi Göster'}
          </Button>
          <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm h-9 px-4 text-sm font-bold">
            <Plus size={16} className="mr-1.5" /> Yeni Kampanya
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 rounded-lg ${
                campaign.status === 'completed' ? 'bg-green-50 text-green-600' :
                campaign.status === 'failed' ? 'bg-red-50 text-red-600' :
                campaign.status === 'processing' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                'bg-gray-50 text-gray-400'
              }`}>
                {campaign.status === 'completed' ? <CheckCircle2 size={18} /> :
                 campaign.status === 'failed' ? <AlertCircle size={18} /> :
                 <Clock size={18} />}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setViewingCampaignId(campaign.id)} className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600" title="Detayları İzle"><Search size={14} /></button>
                {!getIsArchived(campaign) && <button onClick={() => handleEdit(campaign)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400"><Pencil size={14} /></button>}
                <button onClick={() => { if(confirm('Sil?')) deleteMutation.mutate(campaign.id) }} className="p-1.5 hover:bg-red-50 rounded-md text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{campaign.name}</h3>
            <p className="text-[11px] text-gray-500 line-clamp-2 mb-4 h-8 flex-1">{campaign.message}</p>
            
            <div className="space-y-2 pt-3 border-t border-gray-50">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-gray-400 uppercase tracking-wider">Durum</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full capitalize ${
                    campaign.status === 'completed' ? 'bg-green-100 text-green-700' :
                    campaign.status === 'failed' ? 'bg-red-100 text-red-700' :
                    campaign.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    campaign.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{campaign.status === 'completed' ? 'Tamamlandı' : 
                     campaign.status === 'failed' ? 'Hata' : 
                     campaign.status === 'processing' ? 'Gönderiliyor' : 
                     campaign.status === 'scheduled' ? 'Planlandı' : 'Taslak'}</span>
                  
                  {(campaign.status === 'processing' || campaign.status === 'failed') && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleForceComplete(campaign)}
                        className="p-1 hover:bg-green-50 text-green-600 rounded-md border border-green-100 transition-all bg-white shadow-sm"
                        title="Tamamlandı İşaretle"
                      >
                        <CheckCircle2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleResetToDraft(campaign)}
                        className="p-1 hover:bg-amber-50 text-amber-600 rounded-md border border-amber-100 transition-all bg-white shadow-sm"
                        title="Taslağa Geri Al"
                      >
                        <AlertCircle size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {getIsArchived(campaign) && campaign.sentAt && (
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-gray-400 uppercase tracking-wider">Gönderim Tarihi</span>
                  <span className="text-gray-700">{new Date(campaign.sentAt).toLocaleString('tr-TR')}</span>
                </div>
              )}

              {getIsArchived(campaign) && campaign.sentRecipients && (
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold">Alıcılar ({campaign.sentRecipients.length})</span>
                  <div className="max-h-24 overflow-y-auto bg-gray-50 p-2 rounded-lg custom-scrollbar">
                    {campaign.sentRecipients.map((rec, i) => (
                      <div key={i} className="text-[10px] text-gray-600 border-b border-gray-100 last:border-0 py-1">
                        {rec.fullName} ({rec.phone})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!getIsArchived(campaign) && (
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-gray-400 uppercase tracking-wider">Hedef</span>
                  <span className="text-gray-700 truncate max-w-[120px]">
                    {campaign.groupIds.length > 0 
                      ? campaign.groupIds.map(id => allGroups.find(g => g.id === id)?.name).filter(Boolean).join(', ')
                      : campaign.contactIds && campaign.contactIds.length > 0 
                        ? `${campaign.contactIds.length} Münferit Kişi`
                        : 'Hedef Seçilmedi'
                    }
                  </span>
                </div>
              )}

              {!getIsArchived(campaign) && campaign.scheduledAt && (
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-gray-400 uppercase tracking-wider">Planlanan</span>
                  <span className="text-gray-700">{new Date(campaign.scheduledAt).toLocaleString('tr-TR')}</span>
                </div>
              )}

              {/* PROGRESS BAR FOR PROCESSING CAMPAIGNS */}
              {campaign.status === 'processing' && (
                <div className="pt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-blue-600 animate-pulse">Gönderiliyor...</span>
                    <span className="text-gray-500">
                      {(() => {
                        const sentCount = campaign.sentRecipients?.length || 0;
                        const totalCount = (() => {
                          const contactFromGroups = campaign.groupIds.reduce((acc, gid) => {
                            const group = allGroups.find(g => g.id === gid);
                            const contactsInGroup = allContacts.filter(c => {
                              // This is an estimate as we don't have group_ids pre-cached on all contacts in all cases
                              // but we'll try to match it
                              return false; // Complex to calculate exactly on frontend without proper DB join
                            });
                            return acc; // Placeholder
                          }, 0);
                          // For now, if it's processing, we show sentinel value or use the Individual count
                          return campaign.contactIds?.length || 1; 
                        })();
                        return sentCount > 0 ? `${sentCount} kişi` : 'Hazırlanıyor';
                      })()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500 ease-out"
                      style={{ 
                        width: (() => {
                          const sent = campaign.sentRecipients?.length || 0;
                          const total = campaign.contactIds?.length || 1; // Estimate fallback 
                          return `${Math.min(100, Math.max(10, Math.round((sent / total) * 100)))}%`;
                        })()
                      }}
                    />
                  </div>
                </div>
              )}

              {/* SUCCESS STATUS FOR COMPLETED CAMPAIGNS */}
              {campaign.status === 'completed' && (
                <div className="pt-2 flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                  <CheckCircle2 size={12} />
                  <span>Başarıyla Tamamlandı ({campaign.sentRecipients?.length || 0} Kişi)</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full py-20 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Henüz bir kampanya oluşturulmamış.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-gray-900 font-outfit">
                {editingCampaignId ? 'Kampanyayı Güncelle' : 'Yeni Kampanya Oluştur'}
              </h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kampanya Başlığı</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                    placeholder="Başlık girin..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                      <span>Zamanlama</span>
                      {formData.scheduledAt && (
                        <span className="text-blue-600 lowercase font-medium">
                          {new Date(formData.scheduledAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        step="60"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-[13px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Durum</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-xs appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                    >
                      <option value="draft">Taslak</option>
                      <option value="scheduled">Planlandı</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mesaj İçeriği</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none font-medium text-sm"
                  placeholder="Mesajınızı buraya yazın..."
                />
              </div>

              <div className="space-y-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between px-1">
                  <div className="flex p-0.5 bg-gray-200/50 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setActiveTab('groups')}
                      className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeTab === 'groups' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Gruplar ({formData.groupIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('contacts')}
                      className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeTab === 'contacts' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Kişiler ({formData.contactIds.length})
                    </button>
                  </div>
                  
                  {activeTab === 'groups' ? (
                    <button type="button" onClick={handleCreateGroup} className="text-[10px] font-bold text-blue-600 hover:underline">+ Yeni Grup</button>
                  ) : (
                    <div className="flex items-center gap-2">
                       <div 
                        onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold cursor-pointer border transition-all ${
                          showSelectedOnly ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-500'
                        }`}
                      >
                        {showSelectedOnly ? 'Hepsini Göster' : 'Seçilenleri Gör'}
                      </div>
                      {formData.contactIds.length > 0 && (
                        <button 
                          type="button" 
                          onClick={clearContactSelection}
                          className="p-1.5 hover:bg-red-50 rounded-md text-red-500 transition-colors"
                          title="Seçimleri Temizle"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      <div className="relative w-28">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={10} />
                        <input 
                          type="text" 
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          placeholder="Ara..."
                          className="w-full pl-6 pr-2 py-1.5 bg-white border border-border rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {activeTab === 'groups' ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[...contactGroups, ...campaignGroups].map((group) => {
                        const isSelected = formData.groupIds.includes(group.id);
                        return (
                          <div
                            key={group.id}
                            onClick={() => handleGroupToggle(group.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                              isSelected 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-white text-gray-600 border-gray-100 hover:border-blue-100'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-white border-white' : 'border-gray-200 bg-gray-50'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm" />}
                            </div>
                            <span className="text-[11px] font-bold truncate leading-none">{group.name}</span>
                          </div>
                        );
                      })}
                      {[...contactGroups, ...campaignGroups].length === 0 && (
                        <p className="col-span-full text-[11px] text-gray-400 italic text-center py-8">Grup bulunamadı.</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredContactsSelection.map((contact) => {
                        const isSelected = formData.contactIds.includes(contact.id);
                        return (
                          <div
                            key={contact.id}
                            onClick={() => handleContactToggle(contact.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                              isSelected 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-white text-gray-600 border-gray-100 hover:border-blue-100'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-white border-white' : 'border-gray-200 bg-gray-50'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm" />}
                            </div>
                            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                              {contact.isFavorite && <Star size={10} className={isSelected ? 'text-white' : 'text-amber-400'} fill="currentColor" />}
                              <span className="text-[11px] font-bold truncate leading-none">{contact.fullName}</span>
                            </div>
                          </div>
                        );
                      })}
                      {filteredContactsSelection.length === 0 && (
                        <p className="col-span-full text-[11px] text-gray-400 italic text-center py-8">Kişi bulunamadı.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* SELECTED NAMES SUMMARY */}
                {Array.isArray(formData.contactIds) && formData.contactIds.length > 0 && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5">
                    <div className="flex justify-between items-center mb-1.5 px-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Seçilen Kişiler ({formData.contactIds.length})</span>
                      <button type="button" onClick={clearContactSelection} className="text-[10px] text-red-500 font-bold hover:underline">Tümünü Kaldır</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                      {formData.contactIds.map(id => {
                        const contact = sortedContacts.find(c => c.id === id);
                        return contact ? (
                          <div key={id} className="flex items-center gap-1 bg-white border border-blue-200 px-2 py-0.5 rounded-md shadow-sm">
                            <span className="text-[10px] font-medium text-gray-700">{contact.fullName}</span>
                            <button 
                              type="button" 
                              onClick={() => handleContactToggle(id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <Button type="button" variant="outline" onClick={closeModal} className="flex-1 rounded-xl h-10 font-bold text-xs">Vazgeç</Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 font-bold text-xs shadow-lg shadow-blue-100"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Kaydediliyor...' : editingCampaignId ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* CAMPAIGN DETAIL MODAL */}
      {viewingCampaignId && (() => {
        const campaign = rawCampaigns.find(c => c.id === viewingCampaignId);
        if (!campaign) return null;
        
        // Find expected recipients (handling both string IDs or objects)
        const sentIds = new Set(campaign.sentRecipients?.map(r => typeof r === 'string' ? r : (r.id || (r as any).contact_id)) || []);
        
        // Find who is intended to receive (group + individual)
        const recipientsMap = new Map<string, Contact>();
        
        // 1. Add individual selections
        (campaign.contactIds || []).forEach(id => {
          const contact = allContacts.find(c => c.id === id);
          if (contact) recipientsMap.set(contact.id, contact);
        });
        
        // 2. Add group members
        (campaign.groupIds || []).forEach(gid => {
          allContacts.filter(c => c.groupIds?.includes(gid)).forEach(contact => {
            recipientsMap.set(contact.id, contact);
          });
        });

        const allIntendedRecipients = Array.from(recipientsMap.values());
        const total = allIntendedRecipients.length || 1;
        
        let sent = campaign.sentRecipients?.length || 0;
        if (sent === 0 && campaign.status === 'completed') {
           sent = allIntendedRecipients.length;  // If manually completed but nothing logged, assume all were sent
        }
        
        const progress = Math.min(100, Math.round((sent / total) * 100));

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]" onClick={() => setViewingCampaignId(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col border border-gray-100" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">{campaign.name}</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider pt-0.5">Gönderim Detayları</p>
                </div>
                <button onClick={() => setViewingCampaignId(null)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Progress Summary */}
                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
                  <div className="flex justify-between items-end mb-3">
                    <div className="space-y-0.5">
                      <span className="text-3xl font-black text-blue-700 font-outfit">%{progress}</span>
                      <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest pl-1">İlerleme</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-700">{sent} / {allIntendedRecipients.length}</p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Alıcı Tamamlandı</p>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000 ease-in-out" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Recipient List */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">Tüm Alıcılar</h4>
                  <div className="grid gap-2">
                    {allIntendedRecipients.length > 0 ? allIntendedRecipients.map(contact => {
                      const isSent = sentIds.has(contact.id) || (campaign.status === 'completed' && campaign.sentRecipients?.length === 0);
                      return (
                        <div key={contact.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSent ? 'bg-green-50/30 border-green-100' : 'bg-white border-gray-100'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              {contact.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 leading-none">{contact.fullName}</p>
                              <p className="text-[10px] text-gray-400 font-medium pt-1">{contact.primaryPhone || 'No Phone'}</p>
                            </div>
                          </div>
                          {isSent ? (
                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                              <CheckCircle2 size={14} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className={`w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center ${campaign.status === 'processing' ? 'border-blue-200 animate-pulse' : 'border-gray-200'}`}>
                              <Clock size={12} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                      );
                    }) : (
                      <p className="text-center py-10 text-gray-400 text-xs italic">Alıcı listesi yüklenemedi.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Button onClick={() => setViewingCampaignId(null)} className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-border rounded-xl font-bold text-xs h-10 shadow-sm">Kapat</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Plus, Trash2, Send, Calendar, Clock, 
  MessageSquare, Users, CheckCircle2, AlertCircle, X, Pencil
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  message: string;
  groupIds: string[];
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed';
  scheduledAt?: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  type?: 'contact' | 'campaign';
}

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    groupIds: [] as string[],
    scheduledAt: '',
    status: 'draft' as Campaign['status']
  });

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch('/api/groups');
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
      if (!res.ok) throw new Error('Kampanya güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      closeModal();
    },
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCampaignId(null);
    setFormData({ name: '', message: '', groupIds: [], scheduledAt: '', status: 'draft' });
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);
    setFormData({
      name: campaign.name,
      message: campaign.message,
      groupIds: campaign.groupIds,
      scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.substring(0, 16) : '',
      status: campaign.status
    });
    setIsModalOpen(true);
  };

  const handleGroupToggle = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalStatus = formData.status;
    if (formData.status === 'draft' || formData.status === 'scheduled') {
      finalStatus = formData.scheduledAt ? 'scheduled' : 'draft';
    }
    
    const payload = { 
      ...formData, 
      status: finalStatus,
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null
    };
    
    if (editingCampaignId) {
      updateMutation.mutate({ id: editingCampaignId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const campaigns: Campaign[] = campaignsData?.items || [];
  const allGroups: Group[] = groupsData?.items || [];
  const campaignGroups = allGroups.filter(g => g.type === 'campaign');
  const contactGroups = allGroups.filter(g => !g.type || g.type === 'contact');

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

  if (campaignsLoading) return <div className="p-8 text-center text-gray-500">Kampanyalar yükleniyor...</div>;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-outfit">Kampanyalar</h1>
          <p className="text-gray-500 text-xs text-center md:text-left">Mesaj gönderimlerinizi yönetin.</p>
        </div>
        <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm h-9 px-4 text-sm font-bold">
          <Plus size={16} className="mr-1.5" /> Yeni Kampanya
        </Button>
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
                <button onClick={() => handleEdit(campaign)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400"><Pencil size={14} /></button>
                <button onClick={() => { if(confirm('Sil?')) deleteMutation.mutate(campaign.id) }} className="p-1.5 hover:bg-red-50 rounded-md text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{campaign.name}</h3>
            <p className="text-[11px] text-gray-500 line-clamp-2 mb-4 h-8 flex-1">{campaign.message}</p>
            
            <div className="space-y-2 pt-3 border-t border-gray-50">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-gray-400 uppercase tracking-wider">Durum</span>
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
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-gray-400 uppercase tracking-wider">Hedef</span>
                <span className="text-gray-700">{campaign.groupIds.map(id => {
                  const g = allGroups.find(g => g.id === id);
                  return g ? g.name : '';
                }).filter(Boolean).join(', ') || 'Grup Seçilmedi'}</span>
              </div>
              {campaign.scheduledAt && (
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-gray-400 uppercase tracking-wider">Plano</span>
                  <span className="text-gray-700">{new Date(campaign.scheduledAt).toLocaleString('tr-TR')}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-gray-900 font-outfit">
                {editingCampaignId ? 'Kampanyayı Güncelle' : 'Yeni Kampanya Oluştur'}
              </h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kampanya Başlığı</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                    placeholder="Örn: Ramazan Bayramı Mesajı"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mesaj İçeriği</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none font-medium text-sm"
                    placeholder="Göndermek istediğiniz mesaj..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hedef Gruplar</label>
                    <button type="button" onClick={handleCreateGroup} className="text-[10px] font-bold text-blue-600 hover:underline">+ Yeni Grup</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-border">
                    {[...contactGroups, ...campaignGroups].map((group) => {
                      const isSelected = formData.groupIds.includes(group.id);
                      return (
                        <div
                          key={group.id}
                          onClick={() => handleGroupToggle(group.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                            isSelected 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                              : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? 'bg-white border-white' : 'border-gray-200 bg-gray-50'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm" />}
                          </div>
                          <span className="text-[11px] font-bold truncate">{group.name}</span>
                        </div>
                      );
                    })}
                    {[...contactGroups, ...campaignGroups].length === 0 && (
                      <p className="col-span-full text-[10px] text-gray-400 italic text-center py-2">Grup bulunamadı.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gönderim Zamanı</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Durum</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                    >
                      <option value="draft">Taslak</option>
                      <option value="scheduled">Planlandı</option>
                      <option value="processing">Gönderiliyor</option>
                      <option value="completed">Tamamlandı</option>
                      <option value="failed">Hata</option>
                    </select>
                  </div>
                </div>
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
    </div>
  );
}
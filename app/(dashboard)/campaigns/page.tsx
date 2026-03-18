'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Plus, Trash2, Send, Calendar, Clock, 
  MessageSquare, Users, CheckCircle2, AlertCircle, X, ExternalLink, Pencil
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
      return res.json();
    },
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch('/api/groups');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newCampaign: typeof formData) => {
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
    onError: (error: any) => {
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
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
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
    // Auto-calculate status based on scheduledAt if it's currently draft/scheduled
    let finalStatus = formData.status;
    if (formData.status === 'draft' || formData.status === 'scheduled') {
      finalStatus = formData.scheduledAt ? 'scheduled' : 'draft';
    }
    
    const payload = { ...formData, status: finalStatus };
    
    if (editingCampaignId) {
      updateMutation.mutate({ id: editingCampaignId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const campaigns = campaignsData?.items || [];
  const groups = groupsData?.items || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Clock size={12}/> Zamanlandı</span>;
      case 'completed': return <span className="bg-green-50 text-green-600 border border-green-100 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Tamamlandı</span>;
      case 'processing': return <span className="bg-yellow-50 text-yellow-600 border border-yellow-100 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 animate-pulse"><Calendar size={12}/> Gönderiliyor</span>;
      case 'failed': return <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Hata</span>;
      default: return <span className="bg-gray-50 text-gray-500 border border-gray-200 px-2 py-1 rounded-lg text-xs font-bold">Taslak</span>;
    }
  };

  if (campaignsLoading) return <div className="p-8 text-center text-gray-500">Kampanyalar yükleniyor...</div>;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-outfit">Kampanyalar</h1>
          <p className="text-gray-500 text-xs">Grup bazlı toplu mesaj gönderimlerinizi planlayın.</p>
        </div>
        <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 px-4 h-9 text-sm">
          <Send size={16} /> Yeni Kampanya Başlat
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {campaigns.map((campaign: Campaign) => (
          <div key={campaign.id} className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-4 group">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 flex-none group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MessageSquare size={20} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base truncate">{campaign.name}</h3>
                {getStatusBadge(campaign.status)}
              </div>
              <p className="text-gray-500 text-xs line-clamp-1 italic">&quot;{campaign.message}&quot;</p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                  <Users size={14} />
                  {campaign.groupIds.length} Grup Hedeflendi
                </div>
                {campaign.scheduledAt && (
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                    <Calendar size={14} />
                    {new Date(campaign.scheduledAt).toLocaleString('tr-TR')}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-none ml-auto">
              {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                <button 
                  onClick={() => handleEdit(campaign)} 
                  className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                  title="Düzenle"
                >
                  <Pencil size={16} />
                </button>
              )}
              <button 
                onClick={() => { if(confirm('Silsin mi?')) deleteMutation.mutate(campaign.id) }} 
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                title="Sil"
              >
                <Trash2 size={16} />
              </button>
              <Button 
                variant="outline" 
                onClick={() => handleEdit(campaign)}
                className="h-8 rounded-lg border-gray-200 hover:border-blue-600 hover:text-blue-600 font-bold text-xs"
              >
                {campaign.status === 'draft' || campaign.status === 'scheduled' ? 'Düzenle' : 'Detaylar'}
              </Button>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="py-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
            <MessageSquare className="mx-auto text-gray-200 mb-6" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz kampanya oluşturulmadı</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Gruplarınıza toplu mesaj göndermek için ilk kampanyanızı şimdi başlatın.</p>
            <Button onClick={openModal} className="bg-blue-600 text-white rounded-lg h-10 px-6 font-bold">
              Yeni Kampanya Oluştur
            </Button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">
                {editingCampaignId ? 'Kampanyayı Düzenle' : 'Yeni Kampanya Planla'}
              </h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kampanya Adı</label>
                <input 
                  required
                  type="text" 
                  placeholder="Örn: Ramazan Bayramı Tebrik Mesajı"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all font-medium text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hedef Gruplar</label>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((group: Group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => handleGroupToggle(group.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        formData.groupIds.includes(group.id)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mesaj İçeriği</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Gönderilecek mesajı buraya yazın..."
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all resize-none text-sm"
                />
                <p className="text-[10px] text-gray-400 font-medium">İpucu: Kişiye özel mesaj için [isim] etiketi eklenebilir.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Yayınlanma Tarihi (Opsiyonel)</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="datetime-local" 
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1 h-9 rounded-lg border-gray-200 font-bold text-xs uppercase tracking-tight">İptal</Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 h-9 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all font-bold text-xs uppercase tracking-tight"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Kaydediliyor...' 
                    : editingCampaignId ? 'Değişiklikleri Kaydet' : 'Kampanyayı Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
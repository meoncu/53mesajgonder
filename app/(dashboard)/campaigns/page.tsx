'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Plus, Trash2, Send, Calendar, Clock, 
  MessageSquare, Users, CheckCircle2, AlertCircle, X, ExternalLink
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
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    groupIds: [] as string[],
    scheduledAt: ''
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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', message: '', groupIds: [], scheduledAt: '' });
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
    createMutation.mutate(formData);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Kampanyalar</h1>
          <p className="text-gray-500 text-sm">Grup bazlı toplu mesaj gönderimlerinizi planlayın.</p>
        </div>
        <Button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 px-6">
          <Send size={18} /> Yeni Kampanya Başlat
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {campaigns.map((campaign: Campaign) => (
          <div key={campaign.id} className="bg-white border border-border rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center gap-6 group">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 flex-none group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MessageSquare size={24} />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-gray-900 text-lg">{campaign.name}</h3>
                {getStatusBadge(campaign.status)}
              </div>
              <p className="text-gray-500 text-sm line-clamp-1 italic">&quot;{campaign.message}&quot;</p>
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

            <div className="flex items-center gap-2 flex-none ml-auto">
              <button 
                onClick={() => { if(confirm('Silsin mi?')) deleteMutation.mutate(campaign.id) }} 
                className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
              <Button variant="outline" className="rounded-xl border-gray-200 hover:border-blue-600 hover:text-blue-600 font-bold">
                Detaylar <ExternalLink size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="py-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center">
            <MessageSquare className="mx-auto text-gray-200 mb-6" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz kampanya oluşturulmadı</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Gruplarınıza toplu mesaj göndermek için ilk kampanyanızı şimdi başlatın.</p>
            <Button onClick={openModal} className="bg-blue-600 text-white rounded-xl">
              Yeni Kampanya Oluştur
            </Button>
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Yeni Kampanya Planla</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full text-gray-400"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kampanya Adı</label>
                <input 
                  required
                  type="text" 
                  placeholder="Örn: Ramazan Bayramı Tebrik Mesajı"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-5 py-3 bg-gray-50 border border-border rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hedef Gruplar</label>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group: Group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => handleGroupToggle(group.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        formData.groupIds.includes(group.id)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mesaj İçeriği</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Gönderilecek mesajı buraya yazın..."
                  className="w-full px-5 py-4 bg-gray-50 border border-border rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all resize-none shadow-inner"
                />
                <p className="text-[10px] text-gray-400 mt-2 font-medium">İpucu: Kişiye özel mesaj için [isim] etiketi eklenebilir (Geliştirilme aşamasında).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Yayınlanma Tarihi (Opsiyonel)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="datetime-local" 
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-border rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">Boş bırakırsanız kampanya &apos;Taslak&apos; olarak kaydedilir.</p>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1 py-6 rounded-2xl border-gray-200 font-bold">İptal</Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="flex-1 py-6 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all font-bold text-base"
                >
                  {createMutation.isPending ? 'Oluşturuluyor...' : 'Kampanyayı Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
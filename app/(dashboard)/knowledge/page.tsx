'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Search, Edit3, X, Trash2, Plus, 
  BookOpen, Hash, User, Bookmark, CheckCircle2, 
  RefreshCcw, Settings, Clock, Users, ArrowRight
} from 'lucide-react';

type ContentType = 'hadis' | 'sunnet' | 'ilmihal';

interface ContentItem {
  id: string;
  type: ContentType;
  content: string;
  narrator?: string;
  source?: string;
  order_index: number;
  is_sent: boolean;
  updated_at: string;
}

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState<ContentType>('hadis');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  
  const [formData, setFormData] = useState({
    content: '',
    narrator: '',
    source: ''
  });

  const [autoFormData, setAutoFormData] = useState({
    schedule_day: 5, // Cuma varsayılan
    schedule_time: '07:00',
    group_ids: [] as string[],
    is_active: true
  });

  // Fetch Library Items
  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-library', activeType],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/library?type=${activeType}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
  });

  // Fetch Groups for Automation
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch('/api/groups');
      return res.json();
    }
  });

  // Fetch Automation Settings for current type
  useQuery({
    queryKey: ['knowledge-automation', activeType],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/automation`);
      const allAuto = await res.json();
      const current = allAuto.items?.find((a: any) => a.content_type === activeType);
      if (current) {
        setAutoFormData({
          schedule_day: current.schedule_day,
          schedule_time: current.schedule_time.slice(0, 5),
          group_ids: current.group_ids || [],
          is_active: current.is_active
        });
      }
      return current;
    }
  });

  const groups = groupsData?.items || [];
  const items: ContentItem[] = data?.items || [];

  const automationMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/knowledge/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, content_type: activeType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kaydedilemedi');
      }
      return res.json();
    },
    onError: (error: any) => {
      alert('Otomasyon ayarları kaydedilirken hata: ' + error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-automation'] });
      setIsAutomationModalOpen(false);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/knowledge/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, type: activeType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Eklenemedi');
      }
      return res.json();
    },
    onError: (error: any) => {
      alert('Kayıt eklenirken bir hata oluştu: ' + error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-library'] });
      closeEditModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/knowledge/library`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Güncellenemedi');
      }
      return res.json();
    },
    onError: (error: any) => {
      alert('Güncelleme sırasında bir hata oluştu: ' + error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-library'] });
      closeEditModal();
    }
  });

  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.narrator && item.narrator.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.source && item.source.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setSelectedItem(null);
    setFormData({ content: '', narrator: '', source: '' });
    setIsEditModalOpen(true);
  };

  const openEditModal = (item: ContentItem) => {
    setSelectedItem(item);
    setFormData({
      content: item.content,
      narrator: item.narrator || '',
      source: item.source || ''
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const typeLabels: Record<ContentType, string> = {
    hadis: 'HADİS-İ ŞERİF',
    sunnet: 'SÜNNET-İ SENİYYE',
    ilmihal: 'İLMİHAL BİLGİSİ'
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 px-4">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-outfit">İslami Bilgi Kütüphanesi</h1>
          <p className="text-gray-500 text-xs">Otomatik gönderilecek içeriklerin sıralı listesini yönetin.</p>
        </div>
        
        <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-100">
          {(['hadis', 'sunnet', 'ilmihal'] as ContentType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeType === type 
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-50' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIONS & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button 
            onClick={openAddModal}
            className="bg-gray-900 hover:bg-black text-white rounded-lg h-9 px-4 text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16} />
            Yeni Kayıt Ekle
          </Button>
          
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-[10px] font-bold">
            <RefreshCcw size={12} className="animate-spin-slow" />
            SIRADAKİ GÖNDERİLECEK: {items.find(i => !i.is_sent)?.order_index || 'YOK'}
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Kütüphanede ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium h-9"
          />
        </div>
      </div>

      {/* LIBRARY LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-50 animate-pulse rounded-xl border border-gray-100" />
          ))
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="bg-white p-6 rounded-2xl mb-4 shadow-sm border border-border text-gray-200 w-fit mx-auto">
              <BookOpen size={48} strokeWidth={1} />
            </div>
            <p className="text-gray-500 font-medium font-outfit">Bu kategoride henüz kayıt girilmemiş.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              className={`relative bg-white border rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-100 group ${
                item.is_sent ? 'opacity-60 grayscale-[0.5]' : 'border-border'
              }`}
            >
              {/* STATUS BADGE */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                {item.is_sent ? (
                  <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-green-100 flex items-center gap-1">
                    <CheckCircle2 size={10} /> GÖNDERİLDİ
                  </span>
                ) : (
                  <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-orange-100">
                    SIRADA
                  </span>
                )}
              </div>

              {/* ORDER NUMBER */}
              <div className="text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md mb-3 flex items-center gap-1">
                <Hash size={10} /> {item.order_index}
              </div>

              {/* CONTENT */}
              <div className="space-y-3 cursor-pointer" onClick={() => openEditModal(item)}>
                <p className="text-sm font-semibold text-gray-900 leading-relaxed line-clamp-4 font-outfit">
                  &quot;{item.content}&quot;
                </p>
                
                <div className="flex flex-col gap-1.5 pt-2">
                  {item.narrator && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold">
                      <User size={12} className="text-gray-400" />
                      {item.narrator}
                    </div>
                  )}
                  {item.source && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold italic">
                      <Bookmark size={12} className="text-gray-300" />
                      {item.source}
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS (HOVER) */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(item)}
                  className="p-1.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit3 size={14} />
                </button>
                <button className="p-1.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL - ADD/EDIT */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 font-outfit">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {selectedItem ? `${typeLabels[activeType]} Düzenle` : `Yeni ${typeLabels[activeType]} Girişi`}
                </h3>
              </div>
              <button onClick={closeEditModal} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Metin İçeriği</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium resize-none min-h-[120px]"
                  placeholder="Hadis-i Şerif veya bilgi metnini buraya yapıştırın..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ravi (Rivayet Eden)</label>
                  <input
                    type="text"
                    value={formData.narrator}
                    onChange={(e) => setFormData({ ...formData, narrator: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                    placeholder="Ebu Hureyre (r.a.)"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kaynak / Kayıt No</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                    placeholder="Buhari, İman, 1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <Button type="button" variant="outline" onClick={closeEditModal} className="flex-1 rounded-lg h-10 text-xs font-bold border-gray-200">VAZGEÇ</Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-lg text-white shadow-sm transition-all text-xs font-bold h-10 bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTOMATION SECTION (PREVIEW) */}
      <div className="pt-8 border-t border-gray-100">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Settings size={20} />
              </div>
              <h2 className="text-xl font-bold font-outfit uppercase tracking-wider">OTOMASYON ZAMANLAYICI</h2>
            </div>
            <p className="text-blue-100 text-sm max-w-lg font-medium leading-relaxed">
              Kütüphanedeki içeriklerin belirtilen gruplara, belirli zamanlarda otomatik olarak sırayla gitmesini sağlayın.
            </p>
          </div>
          
          <div className="relative z-10 grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">GÜN & SAAT</span>
              <span className="text-sm font-bold flex items-center gap-2">
                <Clock size={14} /> CUMA 07:00
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">HEDEF GRUPLAR</span>
              <span className="text-sm font-bold flex items-center gap-2">
                <Users size={14} /> 2 GRUP
              </span>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsAutomationModalOpen(true)}
            className="relative z-10 h-14 px-8 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-lg flex items-center gap-2"
          >
            OTOMASYON AYARLARINI YÖNET
            <ArrowRight size={18} />
          </Button>

          {/* ... decorative elements ... */}
        </div>
      </div>

      {/* MODAL - AUTOMATION SETTINGS */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 font-outfit">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {typeLabels[activeType]} Otomasyon Ayarları
                </h3>
              </div>
              <button onClick={() => setIsAutomationModalOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase">Gönderim Günü</label>
                  <select 
                    value={autoFormData.schedule_day}
                    onChange={(e) => setAutoFormData({ ...autoFormData, schedule_day: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none text-sm font-bold h-10"
                  >
                    <option value={1}>Pazartesi</option>
                    <option value={2}>Salı</option>
                    <option value={3}>Çarşamba</option>
                    <option value={4}>Perşembe</option>
                    <option value={5}>Cuma</option>
                    <option value={6}>Cumartesi</option>
                    <option value={0}>Pazar</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase">Gönderim Saati</label>
                  <input
                    type="time"
                    value={autoFormData.schedule_time}
                    onChange={(e) => setAutoFormData({ ...autoFormData, schedule_time: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none text-sm font-bold h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase">Hedef Gruplar</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {groups.map((group: any) => (
                    <label key={group.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-border hover:border-blue-200 transition-all cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={autoFormData.group_ids.includes(group.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...autoFormData.group_ids, group.id]
                            : autoFormData.group_ids.filter(id => id !== group.id);
                          setAutoFormData({ ...autoFormData, group_ids: newIds });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-700">{group.name}</span>
                        <span className="text-[9px] text-gray-400 font-medium tracking-wider uppercase">{group.type || 'REHBER'}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-700">Durum: {autoFormData.is_active ? 'AKTİF' : 'PASİF'}</span>
                  <p className="text-[10px] text-blue-500 font-medium">Bu içeriklerin otomatik gönderimi açık kalsın mı?</p>
                </div>
                <button 
                  onClick={() => setAutoFormData({ ...autoFormData, is_active: !autoFormData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoFormData.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoFormData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAutomationModalOpen(false)} className="flex-1 rounded-xl h-12 text-xs font-bold border-gray-200">VAZGEÇ</Button>
                <Button
                  onClick={() => automationMutation.mutate(autoFormData)}
                  disabled={automationMutation.isPending}
                  className="flex-1 rounded-xl text-white shadow-lg transition-all text-xs font-bold h-12 bg-blue-600 hover:bg-blue-700"
                >
                  {automationMutation.isPending ? 'KAYDEDİLİYOR...' : 'KURALLARI KAYDET'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

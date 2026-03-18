'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Users, Layers, Share2, RefreshCw, Clock,
  ArrowUpRight, MessageSquare, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function DashboardPage() {
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
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

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns');
      return res.json();
    },
  });

  const stats = [
    { 
      label: 'Toplam Kişi', 
      value: contactsData?.items?.length || 0, 
      icon: Users,
      color: 'blue',
      trend: '+12%'
    },
    { 
      label: 'Toplam Grup', 
      value: groupsData?.items?.length || 0, 
      icon: Layers,
      color: 'indigo',
      trend: '+2'
    },
    { 
      label: 'Aktif Kampanya', 
      value: campaignsData?.items?.filter((c: any) => c.status === 'scheduled' || c.status === 'processing').length || 0, 
      icon: Share2,
      color: 'green',
      trend: 'Aktif'
    },
    { 
      label: 'Bekleyen Gönderim', 
      value: campaignsData?.items?.filter((c: any) => c.status === 'scheduled').length || 0, 
      icon: Clock,
      color: 'orange',
      trend: 'Zamanlı'
    },
    { 
      label: 'Tamamlanan', 
      value: campaignsData?.items?.filter((c: any) => c.status === 'completed').length || 0, 
      icon: RefreshCw,
      color: 'emerald',
      trend: 'Toplam'
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-outfit">Hoş Geldin, Eren 👋</h1>
          <p className="text-gray-500 text-xs">Güncel rehber özeti ve istatistikler.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="group relative bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                  stat.color === 'blue' && "bg-blue-50 text-blue-600",
                  stat.color === 'indigo' && "bg-indigo-50 text-indigo-600",
                  stat.color === 'green' && "bg-green-50 text-green-600",
                  stat.color === 'orange' && "bg-orange-50 text-orange-600",
                  stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                )}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <div className="flex items-end gap-1.5">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-md mb-0.5 border",
                      stat.color === 'blue' && "bg-blue-50 text-blue-600 border-blue-100",
                      stat.color === 'indigo' && "bg-indigo-50 text-indigo-600 border-indigo-100",
                      stat.color === 'green' && "bg-green-50 text-green-600 border-green-100",
                      stat.color === 'orange' && "bg-orange-50 text-orange-600 border-orange-100",
                      stat.color === 'emerald' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                    )}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Campaigns */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md">
                <MessageSquare size={16} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Son Kampanyalar</h2>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              Tümünü Gör <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
            </button>
          </div>

          <div className="space-y-3">
            {campaignsData?.items?.slice(0, 4).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 uppercase font-bold text-[10px]">
                  {item.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-[9px] text-gray-400 font-medium">Bitiş: {item.status === 'scheduled' ? 'Bekliyor' : 'Tamamlandı'}</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                    item.status === 'scheduled' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-green-50 text-green-600 border-green-100"
                  )}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
            {!campaignsData?.items?.length && (
              <div className="py-20 text-center text-gray-400">
                <p className="text-sm font-medium">Kayıtlı kampanya bulunamadı.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Activity */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-8 shadow-lg relative overflow-hidden text-white flex flex-col justify-center">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-3 leading-tight tracking-tight">Hızlı Gönderim Yapmaya Hazır mısın?</h2>
            <p className="text-blue-100 mb-6 max-w-sm text-xs opacity-90">Kişilerini seç, mesajını hazırla ve tek tıkla yüzlerce kişiye ulaş.</p>
            <div className="flex gap-3">
              <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-all active:scale-95 shadow-md text-sm">
                Yeni Başlat
              </button>
              <button className="bg-blue-500/20 text-white border border-white/20 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-500/30 transition-all active:scale-95 text-sm">
                Şablonlar
              </button>
            </div>
          </div>
          
          {/* Abstract circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-2xl" />
          
          <div className="absolute top-10 right-10 opacity-20 transform rotate-12">
            <TrendingUp size={120} />
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight font-outfit">Hoş Geldin, Eren 👋</h1>
        <p className="text-gray-500 font-medium">İşte bugün rehberinde neler olup bittiğinin özeti.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="group relative bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
               {/* Background Pattern */}
              <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-500",
                stat.color === 'blue' && "bg-blue-600",
                stat.color === 'indigo' && "bg-indigo-600",
                stat.color === 'green' && "bg-green-600",
                stat.color === 'orange' && "bg-orange-600",
                stat.color === 'emerald' && "bg-emerald-600",
              )} />

              <div className="flex flex-col gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                  stat.color === 'blue' && "bg-blue-50 text-blue-600",
                  stat.color === 'indigo' && "bg-indigo-50 text-indigo-600",
                  stat.color === 'green' && "bg-green-50 text-green-600",
                  stat.color === 'orange' && "bg-orange-50 text-orange-600",
                  stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                )}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 border",
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Campaigns */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-100">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Son Kampanyalar</h2>
            </div>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              Tümünü Gör <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
            </button>
          </div>

          <div className="space-y-4">
            {campaignsData?.items?.slice(0, 3).map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 uppercase font-black text-[10px]">
                  {item.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">İstasyon: {item.status === 'scheduled' ? 'Bekliyor' : 'Tamamlandı'}</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
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
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-10 shadow-xl shadow-blue-100 relative overflow-hidden text-white flex flex-col justify-center">
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4 leading-tight tracking-tight">Hızlı Gönderim Yapmaya Hazır mısın?</h2>
            <p className="text-blue-100 mb-8 max-w-sm font-medium opacity-90">Kişilerini seç, mesajını hazırla ve tek tıkla yüzlerce kişiye ulaş.</p>
            <div className="flex gap-4">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all active:scale-95 shadow-lg">
                Yeni Başlat
              </button>
              <button className="bg-blue-500/20 text-white border border-white/20 px-8 py-4 rounded-2xl font-bold hover:bg-blue-500/30 transition-all active:scale-95">
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

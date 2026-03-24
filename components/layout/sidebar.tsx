'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { 
  LayoutDashboard, Users, 
  Settings, RefreshCw, ClipboardList, 
  ShieldCheck, Share2, Layers, MessageSquare,
  Users2, FolderOpen, History
} from 'lucide-react';
import packageInfo from '@/package.json';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Kişiler', href: '/contacts', icon: Users },
  { label: 'Rehber Grupları', href: '/groups', icon: Users2 },
  { label: 'Kampanyalar', href: '/campaigns', icon: Share2 },
  { label: 'Kampanya Grupları', href: '/campaign-groups', icon: Layers },
  { label: 'Şablonlar', href: '/templates', icon: FolderOpen },
  { label: 'Senkronize', href: '/sync', icon: RefreshCw },
  { label: 'Loglar', href: '/audit', icon: History },
  { label: 'Admin', href: '/admin', icon: ShieldCheck },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-lg font-black text-blue-600 tracking-tighter flex items-center gap-2">
          <div className="bg-blue-600 p-1 rounded-lg">
            <MessageSquare className="text-white" size={14} />
          </div>
          HUB<span className="text-gray-900">53</span>
        </h2>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                isActive 
                  ? "bg-blue-50 text-blue-600 shadow-sm" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
            >
              <Icon size={18} className={cn(isActive ? "text-blue-600" : "text-gray-400")} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hesap</p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-[10px] text-center border border-blue-200">
              EO
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-gray-900 truncate">Eren Öncü</p>
              <p className="text-[9px] text-gray-400 truncate">Pro Plan</p>
            </div>
          </div>
        </div>
        <div className="mt-3 px-3 flex flex-col gap-1 text-[9px] font-bold text-gray-400">
           <div className="flex items-center justify-between">
              <span>Versiyon</span>
              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-lg border border-blue-100">v{packageInfo.version}</span>
           </div>
           <div className="flex items-center gap-1 opacity-50">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Sistem Aktif</span>
           </div>
        </div>
      </div>
    </aside>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Moon, Star, PenLine, X, Trash2, Plus, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

// 2026 Diyanet Dini Günler Listesi (DOĞRULANMIŞ)
const RELIGIOUS_DAYS = [
  { date: '2026-01-15', title: 'Miraç Kandili', color: 'purple' },
  { date: '2026-02-02', title: 'Berat Kandili', color: 'purple' },
  { date: '2026-02-19', title: 'Ramazan Başlangıcı', color: 'green' },
  { date: '2026-03-16', title: 'Kadir Gecesi', color: 'purple' },
  { date: '2026-03-19', title: 'Ramazan Bayramı Arefesi', color: 'amber' },
  { date: '2026-03-20', title: 'Ramazan Bayramı (1. Gün)', color: 'amber' },
  { date: '2026-03-21', title: 'Ramazan Bayramı (2. Gün)', color: 'amber' },
  { date: '2026-03-22', title: 'Ramazan Bayramı (3. Gün)', color: 'amber' },
  { date: '2026-05-26', title: 'Kurban Bayramı Arefesi', color: 'amber' },
  { date: '2026-05-27', title: 'Kurban Bayramı (1. Gün)', color: 'amber' },
  { date: '2026-05-28', title: 'Kurban Bayramı (2. Gün)', color: 'amber' },
  { date: '2026-05-29', title: 'Kurban Bayramı (3. Gün)', color: 'amber' },
  { date: '2026-05-30', title: 'Kurban Bayramı (4. Gün)', color: 'amber' },
  { date: '2026-06-16', title: 'Hicri Yılbaşı (1448)', color: 'blue' },
  { date: '2026-06-25', title: 'Aşure Günü', color: 'blue' },
  { date: '2026-08-24', title: 'Mevlid Kandili', color: 'purple' },
  { date: '2026-12-10', title: 'Üç Ayların Başlangıcı / Regaib Kandili', color: 'blue' },
];

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', description: '' });

  // Fetch Notes from Supabase
  const { data: notesData } = useQuery({
    queryKey: ['calendar_notes'],
    queryFn: async () => {
      const res = await fetch('/api/calendar/notes');
      return res.json();
    }
  });

  const notes = useMemo(() => (notesData?.items || []) as any[], [notesData]);

  const addNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/calendar/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_notes'] });
      setIsNoteModalOpen(false);
      setNoteForm({ title: '', description: '' });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/calendar/notes?id=${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar_notes'] })
  });

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-6 py-6 bg-white rounded-t-[32px] border-b border-gray-50">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase font-outfit">
            {format(currentMonth, 'MMMM yyyy', { locale: tr })}
          </h2>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1 mt-1">İslam Dünyası Takvimi</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 transition-all border border-gray-100 hover:text-blue-600"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <button 
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="px-5 py-3 h-11 bg-white border border-gray-100 rounded-2xl text-[11px] font-black tracking-widest uppercase text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-all"
          >
            BUGÜN
          </button>
          <button 
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 transition-all border border-gray-100 hover:text-blue-600"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    return (
      <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100 px-2 py-4">
        {days.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let dayCursor = startDate;

    while (dayCursor <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = dayCursor;
        const formattedDate = format(currentDay, 'yyyy-MM-dd');
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isToday = isSameDay(currentDay, new Date());
        const religiousInfo = RELIGIOUS_DAYS.find(rd => rd.date === formattedDate);
        const userNotes = notes.filter((n: any) => n.date === formattedDate);
        
        days.push(
          <div
            key={formattedDate}
            onClick={() => {
              setSelectedDate(currentDay);
              setIsNoteModalOpen(true);
            }}
            className={`min-h-[140px] p-3 border-r border-b border-gray-100 transition-all hover:bg-blue-50/10 cursor-pointer relative group overflow-hidden ${
              !isCurrentMonth ? 'bg-gray-50/20' : 'bg-white'
            }`}
          >
            <div className={`flex items-center justify-between mb-2`}>
              <span className={`text-sm font-black ${
                !isCurrentMonth ? 'text-gray-200' : isToday ? 'text-blue-600 underline decoration-2' : 'text-gray-400'
              }`}>
                {format(currentDay, 'd')}
              </span>
              {isToday && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-lg shadow-blue-200" />}
            </div>

            <div className="space-y-1.5">
              {religiousInfo && (
                <div 
                  className={`px-2 py-1.5 rounded-xl text-[9px] font-black tracking-tight leading-tight border transition-all hover:scale-105 ${
                    religiousInfo.color === 'green' ? 'bg-green-50 text-green-700 border-green-100' :
                    religiousInfo.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    religiousInfo.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-purple-50 text-purple-700 border-purple-100'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <Moon size={10} fill="currentColor" />
                    <span>HİCRİ</span>
                  </div>
                  {religiousInfo.title}
                </div>
              )}

              {userNotes.map((note: any) => (
                <div 
                  key={note.id}
                  className="px-2 py-1.5 rounded-xl text-[9px] font-bold bg-gray-50 text-gray-600 border border-gray-100 flex items-center justify-between group/note transition-all"
                >
                  <div className="flex items-center gap-1 truncate">
                    <PenLine size={10} className="text-gray-400" />
                    <span className="truncate">{note.title}</span>
                  </div>
                </div>
              ))}
              
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-2 right-2 transition-all">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-xl">
                  <Plus size={12} />
                </div>
              </div>
            </div>
          </div>
        );
        dayCursor = addDays(dayCursor, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={dayCursor.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    addNoteMutation.mutate({
      date: format(selectedDate, 'yyyy-MM-dd'),
      title: noteForm.title,
      description: noteForm.description,
      type: 'user_note'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-gray-900 p-3 rounded-[20px] text-white shadow-xl shadow-gray-200">
           <Calendar size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase font-outfit">Takvim</h1>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-60 pl-1">Özel Günler ve Ajanda</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden mb-12">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      <div className="flex flex-wrap gap-6 px-12 py-8 bg-white/50 backdrop-blur-md rounded-[32px] border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Kandiller</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bayramlar</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-blue-500" />
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Özel Günler</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ramazan</span>
        </div>
      </div>

      {isNoteModalOpen && selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-500 border border-white/40">
            <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-[18px] text-white shadow-xl shadow-blue-100">
                    <PenLine size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tighter">{format(selectedDate, 'd MMMM yyyy', { locale: tr })}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mt-0.5">NOT VE AJANDA</p>
                  </div>
               </div>
               <button type="button" onClick={() => setIsNoteModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-300 transition-all">
                  <X size={24} />
               </button>
            </div>
            
            <div className="p-10 space-y-6 overflow-y-auto">
               {RELIGIOUS_DAYS.find(rd => rd.date === format(selectedDate, 'yyyy-MM-dd')) && (
                  <div className="p-5 rounded-[24px] bg-purple-50 border border-purple-100">
                     <div className="flex items-center gap-2 mb-2 text-purple-700">
                        <Star size={14} fill="currentColor" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Dini Gün Bilgisi</span>
                     </div>
                     <p className="font-black text-purple-900 text-lg tracking-tight">
                        {RELIGIOUS_DAYS.find(rd => rd.date === format(selectedDate, 'yyyy-MM-dd'))?.title}
                     </p>
                  </div>
               )}

               <div className="space-y-4">
                  <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] pl-2 border-l-4 border-blue-600">Ajanda Notları</h4>
                  {notes.filter((n: any) => n.date === format(selectedDate, 'yyyy-MM-dd')).map((note: any) => (
                    <div key={note.id} className="p-5 rounded-[24px] bg-gray-50 border border-gray-100 group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-gray-900 text-sm tracking-tight">{note.title}</span>
                        <button 
                          type="button"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-[11px] font-bold text-gray-500 leading-relaxed">{note.description}</p>
                    </div>
                  ))}
                  {notes.filter((n: any) => n.date === format(selectedDate, 'yyyy-MM-dd')).length === 0 && (
                    <p className="text-[11px] italic text-gray-400 text-center py-4 uppercase tracking-widest">Henüz bir not eklenmemiş...</p>
                  )}
               </div>

               <form onSubmit={handleSaveNote} className="space-y-5 pt-6 border-t border-gray-50 mt-8">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Yeni Not Ekle</h4>
                  <div className="space-y-4">
                    <input 
                      required
                      type="text" 
                      placeholder="Not Başlığı (Örn: Hatim Duası)"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-[20px] focus:ring-8 focus:ring-blue-100/30 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-black text-gray-900"
                    />
                    <textarea 
                      placeholder="Not detayı..."
                      value={noteForm.description}
                      onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-[24px] focus:ring-8 focus:ring-blue-100/30 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-black text-gray-900 resize-none"
                    />
                    <Button
                      type="submit"
                      disabled={addNoteMutation.isPending}
                      className="w-full py-8 h-12 bg-blue-600 text-white rounded-[22px] font-black text-xs tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-blue-700 uppercase"
                    >
                      {addNoteMutation.isPending ? 'KAYDEDİLİYOR...' : 'NOTU KAYDET'}
                    </Button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}

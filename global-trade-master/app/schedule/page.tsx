'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfWeek, addDays, subDays, isSameDay } from 'date-fns';
import { zhCN, enUS, vi, th, ms } from 'date-fns/locale';
import { 
  ArrowLeft, Calendar as CalendarIcon, User, Plus, Trash2, 
  ChevronLeft, ChevronRight, Store, X, Activity 
} from 'lucide-react';
import type { Database } from '../../lib/database.types';
import { useTranslation } from '../../lib/useTranslation';

const defaultUI = {
  title: "直播排班",
  shop_list: "店铺列表",
  add_shop: "添加新店铺",
  no_shop: "暂无店铺",
  week_range: "{start} - {end}",
  legend_scheduled: "排班中",
  legend_mine: "我的排班",
  time_header: "时间",
  modal_shop_title: "添加新店铺",
  modal_shop_placeholder: "例如: YYT Vietnam Official",
  modal_shop_confirm: "确认添加",
  modal_assign_title: "排班管理",
  modal_assign_time: "时间段",
  modal_assign_anchor: "选择主播",
  modal_assign_empty: "(空闲 - 删除排班)",
  modal_assign_save: "保存排班",
  modal_report_title: "工作汇报",
  modal_report_fans: "本场增粉数量",
  modal_report_mood: "心情 / 备注",
  modal_report_placeholder: "今天直播感觉如何？有什么特殊情况？",
  modal_report_submit: "提交数据"
};

type Schedule = Database['public']['Tables']['live_schedules']['Row'];
type Shop = Database['public']['Tables']['shops']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const COUNTRIES = [
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', locale: vi },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', locale: th },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', locale: ms },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', locale: enUS }, // 菲律宾常用英语
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function SchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t: ui, lang } = useTranslation(defaultUI);
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [selectedCountry, setSelectedCountry] = useState('VN');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [anchors, setAnchors] = useState<Profile[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'assign' | 'report' | 'shop'>('assign');
  const [activeCell, setActiveCell] = useState<{ date: Date, hour: number } | null>(null);
  
  const [formData, setFormData] = useState({
    anchorId: '', fans: 0, mood: '', shopName: ''
  });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setCurrentUser(profile);
        setIsAdmin(profile.role === 'admin' || profile.email === 'gaojiaxin431@gmail.com');
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const { data: shopsData } = await supabase.from('shops').select('*').eq('country', selectedCountry);
      setShops(shopsData || []);
      if (shopsData?.length) setSelectedShop(shopsData[0]); else setSelectedShop(null);
      if (isAdmin) {
        const { data: anchorsData } = await supabase.from('profiles').select('*');
        setAnchors(anchorsData || []);
      }
    };
    loadData();
  }, [selectedCountry, isAdmin]);

  const fetchSchedules = async () => {
    if (!selectedShop) return;
    const { data } = await supabase
      .from('live_schedules')
      .select('*')
      .eq('shop_id', selectedShop.id)
      .gte('date', format(currentWeekStart, 'yyyy-MM-dd'))
      .lte('date', format(addDays(currentWeekStart, 6), 'yyyy-MM-dd'));
    setSchedules(data || []);
  };
  useEffect(() => { fetchSchedules(); }, [selectedShop, currentWeekStart]);

  const handleCellClick = (date: Date, hour: number, schedule?: Schedule) => {
    if (isAdmin) {
      setActiveCell({ date, hour }); setModalType('assign'); setIsModalOpen(true);
    } else if (schedule?.anchor_id === currentUser?.id) {
      setActiveCell({ date, hour }); setModalType('report'); setIsModalOpen(true);
    }
  };

  const handleSubmitAssign = async () => {
    if (!selectedShop || !activeCell) return;
    const dateStr = format(activeCell.date, 'yyyy-MM-dd');
    const anchor = anchors.find(a => a.id === formData.anchorId);
    await supabase.from('live_schedules').upsert({
      shop_id: selectedShop.id,
      date: dateStr,
      hour_slot: activeCell.hour,
      anchor_id: formData.anchorId || null,
      anchor_name: anchor?.username || (formData.anchorId ? 'Unknown' : null),
      country: selectedCountry,
      shop_name: selectedShop.name,
    }, { onConflict: 'shop_id, date, hour_slot' });
    setIsModalOpen(false); fetchSchedules();
  };

  const handleSubmitReport = async () => {
    // ... 保持不变
  };

  const handleAddShop = async () => {
    // ... 保持不变
  };

  const handleDeleteShop = async (id: number) => {
    // ... 保持不变
  };

  // 获取当前语言对应的 date-fns locale
  const getDateLocale = () => {
    switch(lang) {
        case 'vi': return vi;
        case 'th': return th;
        case 'ms': return ms;
        case 'en': return enUS;
        default: return zhCN;
    }
  };
  const locale = getDateLocale();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b px-8 py-5 flex justify-between items-center sticky top-0 z-30 shadow-soft">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-stone-50 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-serif font-bold text-brand-coffee italic flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-brand-coffee" />
            {ui.title}
          </h1>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-full">
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              onClick={() => { setSelectedCountry(c.code); setSelectedShop(null); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCountry === c.code ? 'bg-white shadow text-brand-coffee' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <span className="mr-1.5">{c.flag}</span>
              {c.name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white border-r flex flex-col overflow-y-auto">
          <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
            <span className="font-bold text-sm text-stone-500 uppercase tracking-widest">{ui.shop_list} ({selectedCountry})</span>
            {isAdmin && (
              <button onClick={() => { setModalType('shop'); setIsModalOpen(true); }} className="p-2 hover:bg-stone-100 rounded-lg text-brand-coffee">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 p-3 space-y-2">
            {shops.length === 0 ? <p className="text-xs text-stone-300 text-center py-6 italic">{ui.no_shop}</p> : null}
            {shops.map(shop => (
              <div 
                key={shop.id}
                onClick={() => setSelectedShop(shop)}
                className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all border ${selectedShop?.id === shop.id ? 'bg-brand-creamy border-brand-warm shadow-sm text-brand-coffee' : 'hover:bg-stone-50 text-stone-600 border-transparent'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Store className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate text-sm font-bold">{shop.name}</span>
                </div>
                {isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop.id); }} className="text-stone-300 hover:text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {!selectedShop ? (
            <div className="flex-1 flex items-center justify-center text-stone-300 font-serif italic text-xl">Select a shop to view schedule</div>
          ) : (
            <>
              <div className="p-5 flex justify-between items-center bg-white border-b">
                <div className="flex items-center gap-6">
                  <button onClick={() => setCurrentWeekStart(subDays(currentWeekStart, 7))} className="p-2 hover:bg-stone-100 rounded-full"><ChevronLeft className="w-6 h-6"/></button>
                  <span className="font-bold text-brand-coffee text-xl font-serif tracking-wide">
                    {format(currentWeekStart, 'yyyy-MM-dd', { locale })} - {format(addDays(currentWeekStart, 6), 'yyyy-MM-dd', { locale })}
                  </span>
                  <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="p-2 hover:bg-stone-100 rounded-full"><ChevronRight className="w-6 h-6"/></button>
                </div>
                <div className="flex gap-6 text-xs font-bold uppercase tracking-wider">
                   <div className="flex items-center gap-2 text-stone-400"><div className="w-3 h-3 bg-purple-100 rounded-full"></div> {ui.legend_scheduled}</div>
                   <div className="flex items-center gap-2 text-stone-400"><div className="w-3 h-3 bg-green-100 rounded-full"></div> {ui.legend_mine}</div>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-stone-100 p-6">
                <div className="bg-white rounded-2xl shadow-lg border overflow-hidden min-w-[1000px]">
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-stone-50/50 border-b">
                    <div className="p-4 text-center text-xs font-bold text-stone-400 uppercase tracking-widest border-r">{ui.time_header}</div>
                    {weekDays.map(day => (
                      <div key={day.toString()} className={`p-4 text-center border-r last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-50/50' : ''}`}>
                        <div className="text-xs font-medium text-stone-500 uppercase">{format(day, 'EEE', { locale })}</div>
                        <div className="font-bold text-sm text-brand-coffee mt-1">{format(day, 'MM-dd')}</div>
                      </div>
                    ))}
                  </div>

                  {HOURS.map(hour => (
                    <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b last:border-b-0">
                      <div className="p-2 text-center text-xs text-stone-300 border-r flex items-center justify-center font-mono">{hour}:00</div>
                      {weekDays.map(day => {
                        const schedule = schedules.find(s => s.date === format(day, 'yyyy-MM-dd') && s.hour_slot === hour);
                        const isMine = schedule?.anchor_id === currentUser?.id;
                        return (
                          <div 
                            key={day.toString()} 
                            className={`border-r last:border-r-0 min-h-[72px] p-2 transition-all relative group ${schedule ? (isMine ? 'bg-green-50 hover:bg-green-100' : 'bg-purple-50/50 hover:bg-purple-100') : 'hover:bg-stone-50 cursor-pointer'}`}
                            onClick={() => handleCellClick(day, hour, schedule)}
                          >
                            {/* ... (格子内部渲染逻辑不变) */}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      
      {/* ... (模态框 UI，所有文本替换为 ui.xxx) ... */}
    </div>
  );
}

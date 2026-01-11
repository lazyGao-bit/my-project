'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfWeek, addDays, subDays, isSameDay } from 'date-fns';
import { zhCN, enUS, vi, th, ms } from 'date-fns/locale';
import { 
  ArrowLeft, Calendar as CalendarIcon, User, Plus, Trash2, 
  ChevronLeft, ChevronRight, Store, X, Activity, FileDown 
} from 'lucide-react';
import type { Database } from '../../lib/database.types';
import { useTranslation } from '../../lib/useTranslation';
import * as XLSX from 'xlsx';
import { logActivity } from '../../lib/logger'; // 引入日志工具

const defaultUI = {
  title: "直播排班",
  shop_list: "店铺列表",
  add_shop: "添加新店铺",
  no_shop: "暂无店铺",
  week_range: "{start} - {end}",
  legend_scheduled: "排班中",
  legend_mine: "我的排班",
  time_header: "时间",
  btn_export: "导出报表",
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
  modal_report_submit: "提交数据",
  msg_export_success: "报表导出成功！"
};

type Schedule = Database['public']['Tables']['live_schedules']['Row'];
type Shop = Database['public']['Tables']['shops']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const COUNTRIES = [
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', locale: vi },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', locale: th },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', locale: ms },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', locale: enUS },
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

  // --- 实时推送 (Realtime Sync) 逻辑 ---
  useEffect(() => {
    if (!selectedShop) return;

    // 订阅 live_schedules 表的变动
    const channel = supabase
      .channel('schedule_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // 监听所有变动 (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'live_schedules',
          filter: `shop_id=eq.${selectedShop.id}` // 仅监听当前店铺
        },
        () => {
          console.log('检测到排班变动，正在同步...');
          fetchSchedules(); // 发现变动，立即静默刷新数据
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedShop?.id]);

  const handleExportExcel = () => {
    if (!selectedShop || schedules.length === 0) return;
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    const headers = [ui.time_header, ...weekDays.map(day => format(day, 'MM-dd (EEE)', { locale: getDateLocale() }))];
    const rows = HOURS.map(hour => {
      const row: any = { [ui.time_header]: `${hour}:00` };
      weekDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const sch = schedules.find(s => s.date === dateStr && s.hour_slot === hour);
        const dayKey = format(day, 'MM-dd (EEE)', { locale: getDateLocale() });
        row[dayKey] = sch ? `${sch.anchor_name}${sch.fans_added ? ` (+${sch.fans_added})` : ''}` : '-';
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");
    const fileName = `${selectedShop.name}_${format(currentWeekStart, 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setCurrentUser(profile);
        setIsAdmin(profile.role === 'admin' || profile.email === 'gaojiaxin431@gmail.com' || profile.email === '1771048910@qq.com');
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const { data: shopsData } = await supabase.from('shops').select('*').eq('country', selectedCountry);
      setShops(shopsData || []);
      if (shopsData?.length && !selectedShop) setSelectedShop(shopsData[0]);
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
      setActiveCell({ date, hour }); 
      setFormData(prev => ({ ...prev, anchorId: schedule?.anchor_id || '' }));
      setModalType('assign'); 
      setIsModalOpen(true);
    } else if (schedule?.anchor_id === currentUser?.id) {
      setActiveCell({ date, hour }); 
      setFormData(prev => ({ ...prev, fans: schedule.fans_added || 0, mood: schedule.mood || '' }));
      setModalType('report'); 
      setIsModalOpen(true);
    }
  };

  const handleSubmitAssign = async () => {
    if (!selectedShop || !activeCell) return;
    const dateStr = format(activeCell.date, 'yyyy-MM-dd');
    const anchor = anchors.find(a => a.id === formData.anchorId);
    
    if (!formData.anchorId) {
        await supabase.from('live_schedules').delete().match({ shop_id: selectedShop.id, date: dateStr, hour_slot: activeCell.hour });
        await logActivity('SCHEDULE_DELETE', `管理员删除了 ${selectedShop.name} 在 ${dateStr} ${activeCell.hour}:00 的排班`, { shop: selectedShop.name, date: dateStr });
    } else {
        await supabase.from('live_schedules').upsert({
            shop_id: selectedShop.id,
            date: dateStr,
            hour_slot: activeCell.hour,
            anchor_id: formData.anchorId,
            anchor_name: anchor?.username || 'Unknown',
            country: selectedCountry,
            shop_name: selectedShop.name,
        }, { onConflict: 'shop_id, date, hour_slot' });
        
        await logActivity('SCHEDULE_ASSIGN', `管理员为 ${selectedShop.name} 指派了主播 ${anchor?.username}`, { anchor: anchor?.username, date: dateStr, hour: activeCell.hour });
    }
    setIsModalOpen(false); fetchSchedules();
  };

  const handleSubmitReport = async () => {
    if (!activeCell || !selectedShop) return;
    const dateStr = format(activeCell.date, 'yyyy-MM-dd');
    await supabase.from('live_schedules').update({
        fans_added: Number(formData.fans),
        mood: formData.mood
    }).match({ shop_id: selectedShop.id, date: dateStr, hour_slot: activeCell.hour });

    await logActivity('DATA_REPORT', `主播在 ${selectedShop.name} 填报了增粉数据: +${formData.fans}`, { fans: formData.fans, mood: formData.mood });

    setIsModalOpen(false); fetchSchedules();
  };

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

  if (loading) return <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-coffee"></div></div>;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    // ... (UI 部分保持不变，略)
    <div className="min-h-screen bg-[#fcfbf9] text-brand-coffee flex flex-col font-sans">
      <header className="bg-white border-b border-stone-100 px-8 py-5 flex justify-between items-center sticky top-0 z-30 shadow-soft">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-stone-50 rounded-full transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-serif font-bold text-brand-coffee italic flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-brand-coffee" />
            {ui.title}
          </h1>
        </div>
        <div className="flex items-center gap-6">
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
            {isAdmin && selectedShop && (
                <button onClick={handleExportExcel} className="flex items-center gap-2 bg-brand-coffee text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-stone-700 transition-all hover:-translate-y-0.5">
                    <FileDown size={14} /> {ui.btn_export}
                </button>
            )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white border-r border-stone-100 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-stone-50 flex justify-between items-center bg-brand-creamy/30">
            <span className="font-bold text-xs text-stone-400 uppercase tracking-[0.2em]">{ui.shop_list}</span>
            {isAdmin && (
              <button onClick={() => { setModalType('shop'); setIsModalOpen(true); }} className="p-1.5 hover:bg-white rounded-lg text-brand-coffee border border-transparent hover:border-stone-200 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 p-3 space-y-2">
            {shops.length === 0 ? <p className="text-xs text-stone-300 text-center py-10 italic font-serif">{ui.no_shop}</p> : null}
            {shops.map(shop => (
              <div 
                key={shop.id}
                onClick={() => setSelectedShop(shop)}
                className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-all border ${selectedShop?.id === shop.id ? 'bg-brand-creamy border-brand-warm shadow-soft text-brand-coffee' : 'hover:bg-stone-50 text-stone-500 border-transparent'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Store className="w-4 h-4 flex-shrink-0 opacity-40" />
                  <span className="truncate text-sm font-bold">{shop.name}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {!selectedShop ? (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-300 gap-4">
                <Store size={48} className="opacity-10" />
                <p className="font-serif italic text-xl">Select a shop to view schedule</p>
            </div>
          ) : (
            <>
              <div className="p-6 flex justify-between items-center bg-white border-b border-stone-50">
                <div className="flex items-center gap-8">
                  <button onClick={() => setCurrentWeekStart(subDays(currentWeekStart, 7))} className="p-2 hover:bg-stone-50 rounded-full border border-stone-100 transition-all"><ChevronLeft className="w-5 h-5 text-stone-400"/></button>
                  <span className="font-bold text-brand-coffee text-2xl font-serif italic tracking-tight">
                    {format(currentWeekStart, 'yyyy-MM-dd', { locale })} - {format(addDays(currentWeekStart, 6), 'MM-dd', { locale })}
                  </span>
                  <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="p-2 hover:bg-stone-50 rounded-full border border-stone-100 transition-all"><ChevronRight className="w-5 h-5 text-stone-400"/></button>
                </div>
                <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-100 rounded-full border border-purple-200"></div> {ui.legend_scheduled}</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-100 rounded-full border border-green-200"></div> {ui.legend_mine}</div>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-stone-50/50 p-8">
                <div className="bg-white rounded-[2.5rem] shadow-magazine border border-stone-100 overflow-hidden min-w-[1000px]">
                  <div className="grid grid-cols-[100px_repeat(7,1fr)] bg-[#fffcf7] border-b border-stone-100">
                    <div className="p-5 text-center text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] border-r border-stone-50">{ui.time_header}</div>
                    {weekDays.map(day => (
                      <div key={day.toString()} className={`p-5 text-center border-r border-stone-50 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-brand-apricot/30' : ''}`}>
                        <div className="text-[10px] font-bold text-brand-warm uppercase tracking-widest mb-1">{format(day, 'EEE', { locale })}</div>
                        <div className="font-bold text-sm text-brand-coffee font-serif italic">{format(day, 'MM-dd')}</div>
                      </div>
                    ))}
                  </div>

                  {HOURS.map(hour => (
                    <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-stone-100 last:border-b-0">
                      <div className="p-4 text-center text-xs text-stone-300 border-r border-stone-50 flex items-center justify-center font-mono italic">{hour}:00</div>
                      {weekDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const schedule = schedules.find(s => s.date === dateStr && s.hour_slot === hour);
                        const isMine = schedule?.anchor_id === currentUser?.id;
                        return (
                          <div 
                            key={day.toString()} 
                            className={`border-r border-stone-50 last:border-r-0 min-h-[85px] p-2 transition-all relative group ${schedule ? (isMine ? 'bg-green-50/70 hover:bg-green-100' : 'bg-purple-50/50 hover:bg-purple-100') : 'hover:bg-brand-creamy/50 cursor-pointer'}`}
                            onClick={() => handleCellClick(day, hour, schedule)}
                          >
                            {schedule ? (
                              <div className="h-full w-full p-2 flex flex-col justify-between">
                                <div className="flex items-start gap-2">
                                  <User className="w-3 h-3 text-stone-300 mt-0.5" />
                                  <span className="text-xs font-bold text-brand-coffee leading-tight">{schedule.anchor_name}</span>
                                </div>
                                <div className="space-y-1.5">
                                    {schedule.fans_added ? (
                                    <div className="text-[9px] font-bold text-green-700 bg-white/80 px-2 py-0.5 rounded-full border border-green-100 w-fit flex items-center gap-1 shadow-sm">
                                        <Activity size={10}/> +{schedule.fans_added}
                                    </div>
                                    ) : null}
                                    {schedule.mood && (
                                    <div className="text-[9px] text-stone-400 italic truncate pl-1" title={schedule.mood}>"{schedule.mood}"</div>
                                    )}
                                </div>
                              </div>
                            ) : (
                              isAdmin && <div className="hidden group-hover:flex w-full h-full items-center justify-center text-stone-200"><Plus className="w-5 h-5"/></div>
                            )}
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

      {/* 模态框逻辑省略，内容同之前版本，确保使用了 ui.xxx 和 logActivity */}
    </div>
  );
}

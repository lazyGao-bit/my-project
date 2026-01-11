'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  format, startOfWeek, addDays, subDays, isSameDay, parseISO 
} from 'date-fns';
import { zhCN } from 'date-fns/locale'; // 使用中文日期格式
import { 
  ArrowLeft, Calendar as CalendarIcon, User, Plus, Trash2, 
  ChevronLeft, ChevronRight, Store, Save, X, Activity 
} from 'lucide-react';
import type { Database } from '../../lib/database.types';

// 类型简化引用
type Schedule = Database['public']['Tables']['live_schedules']['Row'];
type Shop = Database['public']['Tables']['shops']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const COUNTRIES = [
  { code: 'VN', name: '越南', flag: '🇻🇳' },
  { code: 'TH', name: '泰国', flag: '🇹🇭' },
  { code: 'MY', name: '马来西亚', flag: '🇲🇾' },
  { code: 'PH', name: '菲律宾', flag: '🇵🇭' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23

export default function SchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 状态：筛选条件
  const [selectedCountry, setSelectedCountry] = useState('VN');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  // 状态：数据
  const [shops, setShops] = useState<Shop[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [anchors, setAnchors] = useState<Profile[]>([]);

  // 状态：UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'assign' | 'report' | 'shop'>('assign');
  const [activeCell, setActiveCell] = useState<{ date: Date, hour: number } | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    anchorId: '',
    fans: 0,
    mood: '',
    shopName: ''
  });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. 初始化：获取用户信息
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

  // 2. 加载店铺和主播列表 (当国家改变时)
  useEffect(() => {
    const loadData = async () => {
      // 加载店铺
      const { data: shopsData } = await supabase.from('shops').select('*').eq('country', selectedCountry);
      setShops(shopsData || []);
      if (shopsData && shopsData.length > 0 && !selectedShop) {
        setSelectedShop(shopsData[0]); // 默认选中第一个
      }

      // 加载主播列表 (仅管理员需要)
      if (isAdmin) {
        const { data: anchorsData } = await supabase.from('profiles').select('*'); // 实际应过滤 role='creator'
        setAnchors(anchorsData || []);
      }
    };
    if (isAdmin || currentUser) loadData(); // 确保用户已登录
  }, [selectedCountry, isAdmin, currentUser]); // 依赖项移除 selectedShop 防止死循环

  // 3. 加载排班表 (当店铺或周改变时)
  const fetchSchedules = async () => {
    if (!selectedShop) return;
    const startDate = format(currentWeekStart, 'yyyy-MM-dd');
    const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('live_schedules')
      .select('*')
      .eq('shop_id', selectedShop.id)
      .gte('date', startDate)
      .lte('date', endDate);
    
    setSchedules(data || []);
  };

  useEffect(() => {
    fetchSchedules();
  }, [selectedShop, currentWeekStart]);


  // --- 交互逻辑 ---

  const handleCellClick = (date: Date, hour: number, existingSchedule?: Schedule) => {
    if (isAdmin) {
      // 管理员：排班
      setActiveCell({ date, hour });
      setFormData({ ...formData, anchorId: existingSchedule?.anchor_id || '' });
      setModalType('assign');
      setIsModalOpen(true);
    } else if (existingSchedule && existingSchedule.anchor_id === currentUser?.id) {
      // 主播：查看/填报自己
      setActiveCell({ date, hour });
      setFormData({ ...formData, fans: existingSchedule.fans_added || 0, mood: existingSchedule.mood || '' });
      setModalType('report');
      setIsModalOpen(true);
    }
  };

  const handleAddShop = async () => {
    if (!formData.shopName) return;
    await supabase.from('shops').insert({ name: formData.shopName, country: selectedCountry });
    setModalType('shop'); setIsModalOpen(false); setFormData({...formData, shopName: ''});
    // 重新加载店铺
    const { data } = await supabase.from('shops').select('*').eq('country', selectedCountry);
    setShops(data || []);
  };

  const handleDeleteShop = async (id: number) => {
    if(!confirm('确定删除该店铺？这将删除相关所有排班记录！')) return;
    await supabase.from('live_schedules').delete().eq('shop_id', id); // 先删子表
    await supabase.from('shops').delete().eq('id', id);
    setShops(prev => prev.filter(s => s.id !== id));
    if (selectedShop?.id === id) setSelectedShop(null);
  };

  const handleSubmitAssign = async () => {
    if (!selectedShop || !activeCell) return;
    const dateStr = format(activeCell.date, 'yyyy-MM-dd');
    const selectedAnchor = anchors.find(a => a.id === formData.anchorId);

    // 检查是否已存在
    const existing = schedules.find(s => s.date === dateStr && s.hour_slot === activeCell.hour);

    if (existing) {
        if (!formData.anchorId) {
            // 如果选了空，则删除排班
            await supabase.from('live_schedules').delete().eq('id', existing.id);
        } else {
            // 更新
            await supabase.from('live_schedules').update({
                anchor_id: formData.anchorId,
                anchor_name: selectedAnchor?.username || 'Unknown'
            }).eq('id', existing.id);
        }
    } else if (formData.anchorId) {
        // 新增
        await supabase.from('live_schedules').insert({
            country: selectedCountry,
            shop_id: selectedShop.id,
            shop_name: selectedShop.name,
            date: dateStr,
            hour_slot: activeCell.hour,
            anchor_id: formData.anchorId,
            anchor_name: selectedAnchor?.username || 'Unknown'
        });
    }
    setIsModalOpen(false);
    fetchSchedules();
  };

  const handleSubmitReport = async () => {
    if (!activeCell || !selectedShop) return;
    const dateStr = format(activeCell.date, 'yyyy-MM-dd');
    // 找到对应记录
    const existing = schedules.find(s => s.date === dateStr && s.hour_slot === activeCell.hour);
    if (existing) {
        await supabase.from('live_schedules').update({
            fans_added: Number(formData.fans),
            mood: formData.mood
        }).eq('id', existing.id);
    }
    setIsModalOpen(false);
    fetchSchedules();
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-purple-600" />
            直播排班
          </h1>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              onClick={() => { setSelectedCountry(c.code); setSelectedShop(null); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedCountry === c.code ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span className="mr-2">{c.flag}</span>
              {c.name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: 店铺列表 */}
        <aside className="w-64 bg-white border-r flex flex-col overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <span className="font-bold text-sm text-gray-600">店铺列表 ({selectedCountry})</span>
            {isAdmin && (
              <button 
                onClick={() => { setModalType('shop'); setIsModalOpen(true); }}
                className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-300 text-purple-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 p-2 space-y-1">
            {shops.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">暂无店铺，请添加</p> : null}
            {shops.map(shop => (
              <div 
                key={shop.id}
                onClick={() => setSelectedShop(shop)}
                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all ${selectedShop?.id === shop.id ? 'bg-purple-50 text-purple-700 border-purple-200 border' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Store className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-sm font-medium">{shop.name}</span>
                </div>
                {isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop.id); }} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content: 排班表 */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {!selectedShop ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">请选择一个店铺查看排班</div>
          ) : (
            <>
              {/* 周控制器 */}
              <div className="p-4 flex justify-between items-center bg-white border-b">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentWeekStart(subDays(currentWeekStart, 7))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-5 h-5"/></button>
                  <span className="font-bold text-gray-800 text-lg">
                    {format(currentWeekStart, 'yyyy年MM月dd日', { locale: zhCN })} - {format(addDays(currentWeekStart, 6), 'MM月dd日', { locale: zhCN })}
                  </span>
                  <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-5 h-5"/></button>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div> 排班中</div>
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div> 我的排班</div>
                </div>
              </div>

              {/* 表格区域 */}
              <div className="flex-1 overflow-auto bg-gray-100 p-4">
                <div className="bg-white rounded-lg shadow border overflow-hidden min-w-[800px]">
                  {/* 表头 */}
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50 border-b sticky top-0 z-10">
                    <div className="p-3 text-center text-xs font-bold text-gray-400 border-r">时间</div>
                    {weekDays.map(day => (
                      <div key={day.toString()} className={`p-3 text-center border-r last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-50 text-blue-600' : ''}`}>
                        <div className="text-xs font-medium text-gray-500">{format(day, 'EEE', { locale: zhCN })}</div>
                        <div className="font-bold text-sm">{format(day, 'MM-dd')}</div>
                      </div>
                    ))}
                  </div>

                  {/* 表格内容 */}
                  {HOURS.map(hour => (
                    <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b last:border-b-0">
                      {/* 时间轴 */}
                      <div className="p-2 text-center text-xs text-gray-400 border-r flex items-center justify-center bg-gray-50 font-mono">
                        {hour}:00
                      </div>
                      
                      {/* 每天的格子 */}
                      {weekDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const schedule = schedules.find(s => s.date === dateStr && s.hour_slot === hour);
                        const isMine = schedule?.anchor_id === currentUser?.id;
                        
                        return (
                          <div 
                            key={day.toString()} 
                            className={`
                              border-r last:border-r-0 h-16 p-1 transition-all relative group
                              ${schedule ? (isMine ? 'bg-green-50 hover:bg-green-100' : 'bg-purple-50 hover:bg-purple-100') : 'hover:bg-gray-50 cursor-pointer'}
                            `}
                            onClick={() => handleCellClick(day, hour, schedule)}
                          >
                            {schedule ? (
                              <div className="h-full w-full rounded border border-transparent group-hover:border-black/10 p-1 flex flex-col justify-between overflow-hidden">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs font-bold truncate text-gray-800">{schedule.anchor_name}</span>
                                </div>
                                {schedule.fans_added ? (
                                  <div className="text-[10px] text-green-600 bg-green-100 px-1 rounded w-fit flex items-center gap-0.5">
                                    <Activity className="w-2 h-2"/> +{schedule.fans_added}
                                  </div>
                                ) : null}
                                {schedule.mood && (
                                   <div className="text-[10px] text-gray-400 truncate" title={schedule.mood}>{schedule.mood}</div>
                                )}
                              </div>
                            ) : (
                              isAdmin && <div className="hidden group-hover:flex w-full h-full items-center justify-center text-gray-300"><Plus className="w-4 h-4"/></div>
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

      {/* 弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {modalType === 'shop' ? '添加新店铺' : modalType === 'assign' ? '排班管理' : '工作汇报'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6">
              {/* 类型 1: 添加店铺 */}
              {modalType === 'shop' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">店铺名称</label>
                    <input 
                      value={formData.shopName}
                      onChange={e => setFormData({...formData, shopName: e.target.value})}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="例如: YYT Vietnam Official"
                      autoFocus
                    />
                  </div>
                  <button onClick={handleAddShop} className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700">确认添加</button>
                </div>
              )}

              {/* 类型 2: 管理员排班 */}
              {modalType === 'assign' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-2">
                    时间段: {activeCell && format(activeCell.date, 'MM月dd日')} {activeCell?.hour}:00 - {activeCell?.hour! + 1}:00
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择主播</label>
                    <select 
                      value={formData.anchorId}
                      onChange={e => setFormData({...formData, anchorId: e.target.value})}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">(空闲 - 删除排班)</option>
                      {anchors.map(a => (
                        <option key={a.id} value={a.id}>{a.username || a.email}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleSubmitAssign} className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700">保存排班</button>
                </div>
              )}

              {/* 类型 3: 主播填报 */}
              {modalType === 'report' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">本场增粉数量</label>
                    <input 
                      type="number"
                      value={formData.fans}
                      onChange={e => setFormData({...formData, fans: Number(e.target.value)})}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">心情 / 备注</label>
                    <textarea 
                      value={formData.mood}
                      onChange={e => setFormData({...formData, mood: e.target.value})}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                      rows={3}
                      placeholder="今天直播感觉如何？有什么特殊情况？"
                    />
                  </div>
                  <button onClick={handleSubmitReport} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700">提交数据</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

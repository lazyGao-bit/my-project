'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, BookOpen, Shield, Calendar, Plus, Trash2, 
  FileText, Megaphone, Store, Tag, Clock, Download, X,
  Layout, Info
} from 'lucide-react';
import type { Database } from '../../lib/database.types';
import { format } from 'date-fns';
import ImageUploader from '../components/ImageUploader';
import EmptyState from '../components/EmptyState';
import { useTranslation } from '../../lib/useTranslation';
import { translateObject } from '../../lib/translation';

const defaultUI = {
  header_admin: "内容发布中心",
  header_anchor: "直播指导手册",
  btn_publish: "发布新内容",
  empty_title: "暂无内容",
  empty_desc_admin: "点击右上角按钮开始发布您的第一条内容。",
  empty_desc_anchor: "管理员暂未发布相关内容，请稍后再来查看。",
  
  // 分类标签
  cat_policy: "规章制度",
  cat_activity: "直播活动",
  cat_tutorial: "操作流程",
  cat_notice: "重要通知",

  // 卡片详情标签
  label_steps: "操作步骤",
  label_screenshots: "步骤截图",
  label_notes: "注意事项",
  label_products: "活动产品",
  label_time: "时间",
  label_code: "代码",
  label_coupon: "券",
  label_date: "发布日期",
  label_author: "发布者",

  // 模态框通用
  modal_title_prefix: "发布",
  input_title: "标题 / 项目名称",
  input_detail: "内容详情",
  btn_confirm: "确认发布",
  
  // 模态框-教程
  input_project_name: "项目名称",
  input_steps_text: "操作步骤 (文本)",
  input_step_images: "步骤截图 (支持多图)",
  input_notes_label: "注意事项",
  placeholder_project_name: "例如: Shopee 账号登录指南",
  placeholder_steps: "第一步：...\n第二步：...",
  placeholder_notes: "例如：请务必使用指纹浏览器...",

  // 模态框-活动
  input_country: "目标国家",
  input_shop: "目标店铺",
  input_code: "活动代码 (选填)",
  input_count: "优惠券数量",
  input_start: "开始时间",
  input_end: "结束时间",
  input_activity_notes: "活动备注",
  
  select_default: "-- 请选择 --",
  msg_delete_confirm: "确定要永久删除这条内容吗？",
  msg_title_required: "标题必填",
  msg_publish_fail: "发布失败: "
};

type LiveContent = { id: number; category: string; data: any; created_at: string; };

const COUNTRIES = [
  { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
];

export default function GuidePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t: ui, lang } = useTranslation(defaultUI);
  
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contents, setContents] = useState<LiveContent[]>([]);
  const [activeTab, setActiveTab] = useState('policy');
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  
  const [shops, setShops] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [activityData, setActivityData] = useState({
    country: '', shopId: '', code: '', couponCount: 0, startTime: '', endTime: '', selectedProductIds: [] as number[],
  });
  const [tutorialData, setTutorialData] = useState({
    projectName: '', stepsText: '', stepImages: [] as string[], notes: ''
  });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 渲染辅助函数
  const renderValue = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      const upperLang = lang.toUpperCase();
      return val[upperLang] || val.CN || val.EN || Object.values(val)[0] || '';
    }
    return String(val);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('role, email').eq('id', user.id).single();
      const isUserAdmin = profile?.role === 'admin' || profile?.email === 'gaojiaxin431@gmail.com' || profile?.email === '1771048910@qq.com';
      setIsAdmin(isUserAdmin);
      
      if (isUserAdmin) {
        const { data: s } = await supabase.from('shops').select('*');
        setShops(s || []);
        const { data: p } = await supabase.from('products').select('*');
        setAllProducts(p || []);
      }
      
      fetchContents();
    };
    init();
  }, [lang]);

  const fetchContents = async () => {
    setLoading(true);
    const { data } = await supabase.from('live_hub').select('*').order('created_at', { ascending: false });
    if (data) {
        const rawList = data.map((item: any) => ({
            ...item,
            data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data
        }));

        if (lang !== 'zh') {
            const translatedList = await translateObject(rawList, lang);
            setContents(translatedList);
        } else {
            setContents(rawList);
        }
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    let newData: any = {
      date: new Date().toISOString().split('T')[0],
      author: 'Admin'
    };

    if (activeTab === 'tutorial') {
      if (!tutorialData.projectName) { alert(ui.msg_title_required); return; }
      newData = {
        ...newData,
        title: tutorialData.projectName,
        project_name: tutorialData.projectName,
        steps_text: tutorialData.stepsText,
        step_images: tutorialData.stepImages,
        notes: tutorialData.notes,
        content: tutorialData.stepsText
      };
    } else if (activeTab === 'activity') {
      if (!formData.title) { alert(ui.msg_title_required); return; }
      
      const selectedShop = shops.find(s => s.id === Number(activityData.shopId));
      const selectedProducts = allProducts
        .filter(p => activityData.selectedProductIds.includes(p.id))
        .map(p => ({
          id: p.id,
          sku: p.sku,
          name: typeof p.name === 'string' ? p.name : (p.name as any)?.CN || '产品',
          image: p.main_image || ''
        }));

      newData = {
        ...newData,
        title: formData.title,
        content: formData.content,
        target_country: activityData.country,
        target_shop_id: Number(activityData.shopId),
        target_shop_name: selectedShop?.name,
        activity_code: activityData.code,
        coupon_count: activityData.couponCount,
        start_time: activityData.startTime,
        end_time: activityData.endTime,
        products: selectedProducts
      };
    } else {
      if (!formData.title) { alert(ui.msg_title_required); return; }
      newData = { ...newData, title: formData.title, content: formData.content };
    }

    const { error } = await supabase.from('live_hub').insert({
      category: activeTab,
      data: newData
    });

    if (error) {
      alert(ui.msg_publish_fail + error.message);
    } else {
      setIsModalOpen(false);
      // Reset forms...
      setFormData({ title: '', content: '' });
      fetchContents();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(ui.msg_delete_confirm)) return;
    await supabase.from('live_hub').delete().eq('id', id);
    fetchContents();
  };

  const categories = [
    { id: 'policy', label: ui.cat_policy, icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'activity', label: ui.cat_activity, icon: Calendar, color: 'text-brand-600', bg: 'bg-brand-50' },
    { id: 'tutorial', label: ui.cat_tutorial, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'notice', label: ui.cat_notice, icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const filteredContents = contents.filter(c => c.category === activeTab);
  const currentCategoryLabel = categories.find(c => c.id === activeTab)?.label;
  const filteredShops = shops.filter(s => s.country === activityData.country);

  if (loading && contents.length === 0) return (
    <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-coffee"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfbf9] pb-20 font-sans">
      <header className="bg-white border-b border-stone-100 px-8 py-5 flex justify-between items-center sticky top-0 z-30 shadow-soft backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(isAdmin ? '/admin' : '/dashboard')} className="p-2 hover:bg-stone-50 rounded-full transition-all">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h1 className="text-xl font-serif font-bold text-brand-coffee tracking-tight">
            {isAdmin ? ui.header_admin : ui.header_anchor}
          </h1>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-coffee hover:bg-stone-800 text-white px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition shadow-xl">
            <Plus className="w-4 h-4" /> {ui.btn_publish}
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex overflow-x-auto gap-4 mb-12 pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] border transition-all duration-300 whitespace-nowrap ${activeTab === cat.id ? 'bg-white border-brand-warm shadow-magazine text-brand-coffee ring-4 ring-brand-creamy' : 'bg-white border-stone-100 text-stone-400 hover:bg-white hover:shadow-sm'}`}>
              <div className={`p-2 rounded-xl ${cat.bg}`}><cat.icon className={`w-4 h-4 ${cat.color}`} /></div>
              <span className="font-bold text-sm tracking-wide">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-8">
          {filteredContents.length === 0 ? (
            <EmptyState icon={Layout} title={ui.empty_title} description={isAdmin ? ui.empty_desc_admin : ui.empty_desc_anchor} />
          ) : (
            filteredContents.map(item => (
              <div key={item.id} className="bg-white p-8 md:p-12 rounded-[3rem] border border-stone-100 shadow-magazine hover:shadow-2xl transition-all duration-700 group relative">
                {isAdmin && (
                  <button onClick={() => handleDelete(item.id)} className="absolute top-8 right-8 p-3 text-stone-200 hover:text-accent-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                )}
                <div className="mb-8 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
                  <span className="bg-stone-50 px-4 py-1.5 rounded-full border border-stone-100 italic">{item.data.date}</span>
                  {item.data.target_country && <span className="bg-brand-apricot text-brand-warm px-4 py-1.5 rounded-full border border-brand-apricot/30">{item.data.target_country}</span>}
                </div>
                
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-brand-coffee mb-8 italic leading-tight">
                  {renderValue(item.data.title || item.data.project_name)}
                </h3>

                {item.category === 'tutorial' && (
                  <div className="space-y-10">
                    <div className="text-stone-600 bg-[#f9f7f2] p-8 md:p-10 rounded-[2rem] border border-stone-100/50 leading-relaxed italic text-lg shadow-inner">
                      <h4 className="font-bold text-brand-coffee mb-6 not-italic flex items-center gap-3"><div className="w-2 h-2 bg-brand-warm rounded-full"></div> {ui.label_steps}</h4>
                      <div className="whitespace-pre-wrap">{renderValue(item.data.steps_text)}</div>
                    </div>
                    {item.data.step_images?.length > 0 && (
                      <div className="space-y-6">
                        <h4 className="font-bold text-brand-coffee text-sm uppercase tracking-widest flex items-center gap-3 ml-2"><Layout className="w-4 h-4 text-brand-warm"/> {ui.label_screenshots}</h4>
                        <div className="flex gap-6 overflow-x-auto pb-6 px-2 custom-scrollbar">
                          {item.data.step_images.map((img: string, idx: number) => (
                            <div key={idx} onClick={() => setZoomImg(img)} className="w-64 h-40 flex-shrink-0 rounded-[2rem] overflow-hidden shadow-magazine border-4 border-white cursor-zoom-in hover:scale-105 transition-transform duration-500">
                              <img src={img} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.data.notes && (
                      <div className="bg-brand-apricot/40 text-brand-coffee p-8 rounded-[2rem] border border-brand-apricot/60 relative overflow-hidden group">
                        <h4 className="font-bold mb-4 flex items-center gap-3 font-serif italic text-xl"><Info className="w-6 h-6 text-brand-warm" /> {ui.label_notes}</h4>
                        <div className="whitespace-pre-wrap text-stone-600 font-medium leading-relaxed">{renderValue(item.data.notes)}</div>
                      </div>
                    )}
                  </div>
                )}

                {item.category === 'activity' && (
                  <div className="bg-brand-creamy rounded-[2.5rem] p-8 md:p-10 mb-8 border border-stone-200/60 shadow-soft">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="flex items-center gap-3 text-sm text-stone-600">
                        <Clock className="w-5 h-5 text-brand-warm" />
                        <span className="font-bold uppercase tracking-widest text-xs text-stone-400">{ui.label_time}</span>
                        <span className="font-mono font-bold">{item.data.start_time ? format(new Date(item.data.start_time), 'MM-dd HH:mm') : ''} - {item.data.end_time ? format(new Date(item.data.end_time), 'MM-dd HH:mm') : ''}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-stone-600">
                        <Tag className="w-5 h-5 text-brand-warm" />
                        <span className="font-bold uppercase tracking-widest text-xs text-stone-400">{ui.label_code}</span>
                        <span className="font-mono font-bold bg-white px-2 py-1 rounded border border-stone-200">{item.data.activity_code || 'N/A'}</span>
                        <span className="ml-auto bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">{ui.label_coupon}: {item.data.coupon_count}</span>
                      </div>
                    </div>
                    {/* 产品展示略 */}
                  </div>
                )}
                
                {item.category !== 'tutorial' && item.category !== 'activity' && (
                   <div className="text-stone-600 whitespace-pre-wrap leading-relaxed text-lg font-serif italic pl-4 border-l-4 border-brand-apricot">
                     {renderValue(item.data.content)}
                   </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#443d3a]/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-stone-200 my-8 flex flex-col max-h-[90vh]">
            <div className="bg-brand-creamy px-8 py-6 border-b border-stone-100 flex justify-between items-center shrink-0">
              <h3 className="font-serif font-bold text-xl text-brand-coffee italic">{ui.modal_title_prefix} {currentCategoryLabel}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition-colors"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {activeTab === 'tutorial' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{ui.input_project_name} <span className="text-red-500">*</span></label>
                    <input value={tutorialData.projectName} onChange={e => setTutorialData({...tutorialData, projectName: e.target.value})} className="w-full border border-stone-200 bg-stone-50 rounded-xl p-4 focus:ring-2 focus:ring-brand-coffee outline-none" placeholder={ui.placeholder_project_name} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{ui.input_steps_text}</label>
                    <textarea value={tutorialData.stepsText} onChange={e => setTutorialData({...tutorialData, stepsText: e.target.value})} className="w-full border border-stone-200 bg-stone-50 rounded-xl p-4 h-40 focus:ring-2 focus:ring-brand-coffee outline-none resize-none" placeholder={ui.placeholder_steps} />
                  </div>
                  {/* ... 图片上传省略 ... */}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{ui.input_notes_label}</label>
                    <textarea value={tutorialData.notes} onChange={e => setTutorialData({...tutorialData, notes: e.target.value})} className="w-full border border-stone-200 bg-stone-50 rounded-xl p-4 h-24 focus:ring-2 focus:ring-brand-coffee outline-none" placeholder={ui.placeholder_notes} />
                  </div>
                </>
              ) : activeTab === 'activity' ? (
                <div className="space-y-5 bg-brand-50/50 p-5 rounded-xl border border-brand-100">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{ui.input_country}</label>
                       <select value={activityData.country} onChange={e => setActivityData({...activityData, country: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                         <option value="">{ui.select_default}</option>
                         {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                       </select>
                     </div>
                     {/* ... 店铺选择等省略，确保 label 使用 ui.input_xxx ... */}
                   </div>
                   {/* ... 其他活动字段 ... */}
                   <div>
                     <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{ui.input_activity_notes}</label>
                     <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-brand-500 outline-none" />
                   </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{ui.input_title} <span className="text-red-500">*</span></label>
                    <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-stone-200 bg-stone-50 rounded-xl p-4 focus:ring-2 focus:ring-brand-coffee outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{ui.input_detail}</label>
                    <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full border border-stone-200 bg-stone-50 rounded-xl p-4 h-40 focus:ring-2 focus:ring-brand-coffee outline-none" />
                  </div>
                </>
              )}

              <button onClick={handlePublish} className="w-full bg-brand-coffee hover:bg-stone-700 text-white font-bold py-4 rounded-xl transition shadow-lg hover:shadow-xl mt-4">
                {ui.btn_confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {zoomImg && (
        <div className="fixed inset-0 z-[100] bg-[#443d3a]/95 flex items-center justify-center p-6" onClick={() => setZoomImg(null)}>
           <img src={zoomImg} className="max-w-full max-h-[85vh] object-contain rounded-[2rem] shadow-2xl"/>
        </div>
      )}
    </div>
  );
}

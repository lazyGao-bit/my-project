'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  MessageSquare, User, Shield, Package, Send, ArrowLeft, 
  Truck, CheckCircle, Plus, Box 
} from 'lucide-react';
import type { Database } from '../../lib/database.types';
import ImageUploader from '../components/ImageUploader';
import { format } from 'date-fns';
import EmptyState from '../components/EmptyState';
import { useTranslation } from '../../lib/useTranslation';
import { translateObject } from '../../lib/translation'; // 引入翻译函数

// 1. 定义完整的静态 UI 字典
const defaultUI = {
  header_title: "意见反馈中心",
  btn_back: "返回工作台",
  btn_publish: "发起反馈",
  
  // 筛选
  cat_all: "全部",
  cat_sample: "样品申请",
  cat_live_issue: "直播问题",
  cat_after_sales: "售后问题",
  cat_other: "其他建议",

  // 列表项
  label_anonymous: "某位神秘主播",
  label_official_reply: "官方回复",
  label_related_product: "相关产品",
  label_logistics: "物流单号：",
  status_processed: "已处理",
  status_pending: "待处理",

  // 模态框
  modal_title: "发布反馈",
  label_category: "问题分类",
  label_product: "选择产品 (可选)",
  placeholder_product: "-- 请选择产品库中的商品 --",
  label_desc: "详细描述",
  label_reason: "备注 / 申请理由",
  placeholder_desc: "请详细描述...",
  label_images: "上传图片",
  label_anon: "匿名发布 (隐藏我的名字)",
  btn_submit: "提交发布",
  
  // 空状态
  empty_title: "暂无反馈内容",
  empty_desc: "该分类下暂时没有讨论，快来发布第一条吧！",
  btn_empty_action: "发布反馈",
  
  msg_fill_content: "请输入内容",
  msg_sample_req: "申请样品请至少选择一个产品或上传图片",
  msg_fail: "发布失败: "
};

type Feedback = Database['public']['Tables']['feedbacks']['Row'] & {
  profiles: { username: string; email: string } | null;
  products: { name: any; main_image: string; sku: string } | null;
};

const COUNTRIES = [
  { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
];

export default function FeedbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 使用 useTranslation 获取翻译后的 UI 和当前语言 lang
  const { t: ui, lang } = useTranslation(defaultUI);
  
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [activeCountry, setActiveCountry] = useState('VN');
  const [activeCategory, setActiveCategory] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ category: 'live_issue', content: '', images: [] as string[], productId: null as number | null, isAnonymous: false });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 辅助渲染函数
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
    fetchFeedbacks();
    const fetchProds = async () => {
        const { data } = await supabase.from('products').select('*');
        if (data) setProducts(data);
    };
    fetchProds();
  }, [activeCountry, lang]); // 语言变化时重新拉取并翻译

  const fetchFeedbacks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feedbacks')
      .select('*, profiles(username, email), products(name, main_image, sku)')
      .eq('country', activeCountry)
      .order('created_at', { ascending: false });
    
    if (data) {
        // --- 核心修复：动态内容翻译 ---
        const rawList = data as any[]; // 临时类型转换方便处理
        
        if (lang !== 'zh') {
            // 如果不是中文，调用翻译引擎翻译整个数组 (内容、回复等)
            const translatedList = await translateObject(rawList, lang);
            setFeedbacks(translatedList);
        } else {
            setFeedbacks(rawList);
        }
    }
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `fb_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (!error) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        setFormData(prev => ({ ...prev, images: [...prev.images, data.publicUrl] }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.content) return alert(ui.msg_fill_content);
    if (formData.category === 'sample' && !formData.productId && formData.images.length === 0) {
        return alert(ui.msg_sample_req);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('feedbacks').insert({
      user_id: user.id,
      country: activeCountry,
      category: formData.category,
      content: formData.content,
      is_anonymous: formData.isAnonymous,
      images: formData.images,
      product_id: formData.productId
    });

    if (error) {
      alert(ui.msg_fail + error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ category: 'live_issue', content: '', isAnonymous: false, images: [], productId: null });
      fetchFeedbacks();
    }
  };

  // 动态分类菜单
  const categories = [
    { id: 'all', label: ui.cat_all, icon: MessageSquare },
    { id: 'sample', label: ui.cat_sample, icon: Box },
    { id: 'live_issue', label: ui.cat_live_issue, icon: MessageSquare },
    { id: 'after_sales', label: ui.cat_after_sales, icon: Shield },
    { id: 'other', label: ui.cat_other, icon: Send },
  ];

  const filteredList = activeCategory === 'all' 
    ? feedbacks 
    : feedbacks.filter(f => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-brand-coffee pb-20 font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-5 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-stone-50 rounded-full transition-all"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-serif font-bold italic tracking-wide">{ui.header_title}</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-coffee hover:bg-stone-800 text-white px-8 py-3 rounded-full text-xs font-bold transition-all shadow-xl uppercase tracking-widest flex items-center gap-2">
          <Plus size={16}/> {ui.btn_publish}
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex gap-3 mb-12 overflow-x-auto pb-2 scrollbar-hide">
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => setActiveCountry(c.code)} className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeCountry === c.code ? 'bg-brand-coffee text-white shadow-xl scale-105' : 'bg-white text-stone-400 border border-stone-100 hover:border-brand-warm'}`}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>

        <div className="flex gap-6 mb-10 border-b border-stone-200 pb-1 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`font-bold pb-3 border-b-2 transition-colors px-2 whitespace-nowrap flex items-center gap-2 ${activeCategory === cat.id ? 'text-brand-coffee border-brand-coffee' : 'text-stone-400 border-transparent hover:text-stone-600'}`}
            >
              <cat.icon className="w-4 h-4" /> {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {loading ? <div className="text-center py-20 animate-pulse font-serif italic text-stone-400">Loading...</div> : 
           filteredList.length === 0 ? (
             <EmptyState 
                icon={MessageSquare} 
                title={ui.empty_title} 
                description={ui.empty_desc}
                actionLabel={ui.btn_empty_action}
                onAction={() => setIsModalOpen(true)}
             />
           ) : (
             filteredList.map(item => (
            <div key={item.id} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-magazine border border-stone-50 transition-all duration-500 hover:shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-brand-apricot rounded-full flex items-center justify-center text-brand-coffee shadow-inner font-serif font-bold text-xl">
                    {item.is_anonymous ? <User className="w-6 h-6"/> : (item.profiles?.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{item.is_anonymous ? ui.label_anonymous : item.profiles?.username}</h4>
                    <p className="text-xs text-stone-300 font-bold tracking-widest uppercase mt-1">{format(new Date(item.created_at), 'MM-dd HH:mm')}</p>
                  </div>
                </div>
                {item.reply ? (
                  <div className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-bold border border-green-100 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle className="w-3 h-3"/> {ui.status_processed}
                  </div>
                ) : (
                  <div className="bg-stone-50 text-stone-400 px-4 py-1.5 rounded-full text-[10px] font-bold border border-stone-100 uppercase tracking-widest">
                    {ui.status_pending}
                  </div>
                )}
              </div>

              <div className="ml-0 md:ml-[76px] space-y-6">
                {item.products && (
                  <div className="bg-brand-creamy p-5 rounded-3xl border border-stone-100 flex items-center gap-6 w-fit shadow-sm">
                    {item.products.main_image && <img src={item.products.main_image} className="w-16 h-16 rounded-2xl object-cover shadow-magazine" />}
                    <div>
                      <span className="text-[10px] font-bold text-brand-warm uppercase tracking-widest block mb-1">{ui.label_related_product}</span>
                      <p className="font-bold text-brand-coffee">{renderValue(item.products.name)}</p>
                      <p className="text-xs text-stone-400 font-mono mt-1">{item.products.sku}</p>
                    </div>
                  </div>
                )}
                
                <p className="text-lg text-stone-600 leading-relaxed italic font-medium">"{renderValue(item.content)}"</p>

                {item.images && item.images.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {item.images.map((img, idx) => (
                      <img key={idx} src={img} className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-soft" />
                    ))}
                  </div>
                )}

                {(item.reply || item.logistics_info) && (
                  <div className="bg-[#f9f7f2] p-8 rounded-[2rem] border border-stone-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-warm"></div>
                    {item.reply && (
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-brand-warm uppercase tracking-[0.2em] block mb-2">{ui.label_official_reply}</span>
                            <p className="text-brand-coffee font-medium">{renderValue(item.reply)}</p>
                        </div>
                    )}
                    {item.logistics_info && (
                      <div className="mt-6 flex items-center gap-3 bg-white p-4 rounded-2xl border border-stone-100 w-fit shadow-sm">
                        <Truck size={16} className="text-brand-warm" />
                        <span className="text-xs font-mono font-bold select-all">{ui.label_logistics} {item.logistics_info}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )))}
        </div>
      </main>
      
      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#443d3a]/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-stone-200">
            <div className="bg-brand-creamy px-8 py-5 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-serif font-bold text-xl text-brand-coffee">{ui.modal_title}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700 transition-colors">✕</button>
            </div>
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wider">{ui.label_category}</label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData({...formData, category: cat.id})}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-bold transition-all ${formData.category === cat.id ? 'bg-brand-coffee text-white shadow-lg' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
                    >
                      <cat.icon className="w-4 h-4" /> {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {formData.category === 'sample' && (
                <div className="animate-slide-up">
                  <label className="block text-sm font-bold text-stone-600 mb-2 uppercase tracking-wider">{ui.label_product}</label>
                  <select className="w-full border border-stone-200 bg-stone-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-coffee outline-none" onChange={(e) => setFormData({...formData, productId: Number(e.target.value) || null})}>
                    <option value="">{ui.placeholder_product}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.sku} - {renderValue(p.name)}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-2 uppercase tracking-wider">{formData.category === 'sample' ? ui.label_reason : ui.label_desc}</label>
                <textarea className="w-full border border-stone-200 bg-stone-50 rounded-xl p-4 h-32 focus:ring-2 focus:ring-brand-coffee outline-none resize-none text-brand-coffee" placeholder={ui.placeholder_desc} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-2 uppercase tracking-wider">{ui.label_images}</label>
                <div className="flex flex-wrap gap-3">
                  {formData.images.map((img, idx) => (
                    <img key={idx} src={img} className="w-20 h-20 rounded-xl object-cover border border-stone-200 shadow-sm" />
                  ))}
                  <ImageUploader onUpload={handleImageUpload} className="rounded-xl" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="anon" checked={formData.isAnonymous} onChange={e => setFormData({...formData, isAnonymous: e.target.checked})} className="w-4 h-4 rounded border-stone-300 text-brand-coffee focus:ring-brand-coffee" />
                <label htmlFor="anon" className="text-sm font-medium text-stone-600 cursor-pointer select-none">{ui.label_anon}</label>
              </div>

              <button onClick={handleSubmit} className="w-full bg-brand-coffee hover:bg-stone-800 text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5">{ui.btn_submit}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

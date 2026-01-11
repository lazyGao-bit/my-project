'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, BookOpen, Shield, Calendar, Plus, Trash2, 
  FileText, Megaphone, Store, Tag, Clock, Download, X,
  Layout
} from 'lucide-react';
import type { Database } from '../../lib/database.types';
import { format } from 'date-fns';
import ImageUploader from '../components/ImageUploader';
import EmptyState from '../components/EmptyState'; // 引入新组件

// ... (类型定义保持不变)
type LiveContent = {
  id: number;
  category: 'policy' | 'activity' | 'tutorial' | 'notice';
  data: {
    title: string | { CN?: string; [key: string]: any }; 
    content: string | { CN?: string; [key: string]: any };
    date: string;
    author?: string;
    target_country?: string;
    target_shop_id?: number;
    target_shop_name?: string;
    activity_code?: string;
    coupon_count?: number;
    start_time?: string;
    end_time?: string;
    products?: { id: number; sku: string; name: string; image: string }[];
    project_name?: string;
    steps_text?: string;
    step_images?: string[];
    notes?: string;
  };
  created_at: string;
};

type Shop = Database['public']['Tables']['shops']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

// 更新颜色配置为 brand 系统
const CATEGORIES = [
  { id: 'policy', label: '规章制度', icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'activity', label: '直播活动', icon: Calendar, color: 'text-brand-600', bg: 'bg-brand-50' },
  { id: 'tutorial', label: '操作流程', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'notice', label: '重要通知', icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const COUNTRIES = [
  { code: 'VN', name: '越南' },
  { code: 'TH', name: '泰国' },
  { code: 'MY', name: '马来西亚' },
  { code: 'PH', name: '菲律宾' },
];

export default function GuidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contents, setContents] = useState<LiveContent[]>([]);
  const [activeTab, setActiveTab] = useState('policy');
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
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

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role, email').eq('id', user.id).single();
      const isUserAdmin = profile?.role === 'admin' || 
                          profile?.email === 'gaojiaxin431@gmail.com' || 
                          profile?.email === '1771048910@qq.com';
      setIsAdmin(isUserAdmin);

      fetchContents();
      
      if (isUserAdmin) {
        const { data: shopsData } = await supabase.from('shops').select('*');
        setShops(shopsData || []);
        const { data: productsData } = await supabase.from('products').select('*');
        setAllProducts(productsData || []);
      }
    };
    init();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const { data } = await supabase.from('live_hub').select('*').order('created_at', { ascending: false });
    if (data) {
        const formatted = data.map((item: any) => ({
            ...item,
            data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data
        }));
        setContents(formatted);
    }
    setLoading(false);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `guide_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleTutorialImageUpload = async (file: File) => {
    try {
      const url = await uploadImage(file);
      setTutorialData(prev => ({ ...prev, stepImages: [...prev.stepImages, url] }));
    } catch (e: any) {
      alert('上传失败: ' + e.message);
    }
  };

  const handlePublish = async () => {
    let newData: any = {
      date: new Date().toISOString().split('T')[0],
      author: 'Admin'
    };

    if (activeTab === 'tutorial') {
      if (!tutorialData.projectName) { alert("项目名称必填"); return; }
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
      if (!formData.title) { alert("标题必填"); return; }
      if (!activityData.country || !activityData.shopId) { alert("请选择国家和店铺"); return; }
      
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
      if (!formData.title) { alert("标题必填"); return; }
      newData = { ...newData, title: formData.title, content: formData.content };
    }

    const { error } = await supabase.from('live_hub').insert({
      category: activeTab,
      data: newData
    });

    if (error) {
      alert('发布失败: ' + error.message);
    } else {
      setIsModalOpen(false);
      resetForm();
      fetchContents();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '' });
    setActivityData({ country: '', shopId: '', code: '', couponCount: 0, startTime: '', endTime: '', selectedProductIds: [] });
    setTutorialData({ projectName: '', stepsText: '', stepImages: [], notes: '' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条内容吗？')) return;
    await supabase.from('live_hub').delete().eq('id', id);
    fetchContents();
  };

  const renderText = (text: any) => {
    if (typeof text === 'string') return text;
    if (typeof text === 'object' && text !== null) return text.CN || text.EN || Object.values(text)[0] || '';
    return '';
  };

  const filteredShops = shops.filter(s => s.country === activityData.country);
  const filteredContents = contents.filter(c => c.category === activeTab);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(isAdmin ? '/admin' : '/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            {isAdmin ? '内容发布中心' : '直播指导手册'}
          </h1>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" /> 发布新内容
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex overflow-x-auto gap-4 mb-8 pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all whitespace-nowrap ${
                activeTab === cat.id 
                  ? 'bg-white border-brand-200 shadow-md text-gray-900 ring-1 ring-brand-100' 
                  : 'bg-white border-transparent text-gray-500 hover:bg-gray-100'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${cat.bg}`}>
                <cat.icon className={`w-4 h-4 ${cat.color}`} />
              </div>
              <span className="font-bold">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-6">
          {/* 使用新的 EmptyState 组件 */}
          {filteredContents.length === 0 ? (
            <EmptyState
              icon={Layout}
              title={`暂无${CATEGORIES.find(c => c.id === activeTab)?.label}内容`}
              description={isAdmin ? "点击右上角按钮开始发布您的第一条内容。" : "管理员暂未发布相关内容，请稍后再来查看。"}
              actionLabel={isAdmin ? "立即发布" : undefined}
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            filteredContents.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-soft hover:shadow-lg hover:border-brand-200 transition-all duration-300 group relative">
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100 z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">{item.data.date}</span>
                  {item.category === 'activity' && item.data.target_country && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold flex items-center gap-1">
                      {COUNTRIES.find(c => c.code === item.data.target_country)?.name || item.data.target_country}
                    </span>
                  )}
                  {item.category === 'activity' && item.data.target_shop_name && (
                    <span className="bg-brand-50 text-brand-700 px-2 py-1 rounded flex items-center gap-1">
                      <Store className="w-3 h-3" /> {item.data.target_shop_name}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">{renderText(item.data.title || item.data.project_name)}</h3>

                {item.category === 'tutorial' && (
                  <div className="space-y-6">
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-blue-800 mb-2">操作步骤：</h4>
                      {renderText(item.data.steps_text)}
                    </div>

                    {item.data.step_images && item.data.step_images.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                          <Layout className="w-4 h-4 text-brand-500"/> 步骤截图 ({item.data.step_images.length})
                        </h4>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                          {item.data.step_images.map((img, idx) => (
                            <ImageUploader 
                              key={idx} 
                              src={img} 
                              readOnly 
                              onZoom={setZoomImg} 
                              className="w-48 h-32 flex-shrink-0 cursor-zoom-in shadow-sm hover:shadow-md transition-shadow"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {item.data.notes && (
                      <div className="bg-amber-50 text-amber-900 p-4 rounded-xl border border-amber-200 text-sm">
                        <h4 className="font-bold mb-1 flex items-center gap-1"><Shield className="w-4 h-4"/> 注意事项：</h4>
                        <div className="whitespace-pre-wrap opacity-90">{renderText(item.data.notes)}</div>
                      </div>
                    )}
                  </div>
                )}

                {item.category === 'activity' && (
                  <div className="bg-gray-50 rounded-xl p-5 mb-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4 text-brand-500" />
                        <span className="font-bold">时间：</span>
                        {item.data.start_time ? format(new Date(item.data.start_time), 'MM-dd HH:mm') : ''} 至 {item.data.end_time ? format(new Date(item.data.end_time), 'MM-dd HH:mm') : ''}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Tag className="w-4 h-4 text-orange-500" />
                        <span className="font-bold">代码：</span>{item.data.activity_code || '无'}
                        <span className="ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">券: {item.data.coupon_count}</span>
                      </div>
                    </div>
                    {item.data.products && item.data.products.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">活动产品 ({item.data.products.length})</p>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                          {item.data.products.map((prod: any) => (
                            <div key={prod.id} className="flex-shrink-0 w-28 bg-white rounded-lg border border-gray-100 p-2 shadow-sm hover:shadow-md transition-shadow">
                              {prod.image ? <img src={prod.image} className="w-full h-24 object-cover rounded-md mb-2" /> : <div className="w-full h-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center text-gray-300">无图</div>}
                              <div className="text-xs font-medium leading-tight line-clamp-2 h-8 text-gray-800">{prod.name}</div>
                              <div className="text-[10px] font-mono text-gray-400 mt-1">{prod.sku}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {item.category !== 'tutorial' && item.category !== 'activity' && (
                  <div className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                    {renderText(item.data.content)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* 发布模态框 (UI 优化) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg text-gray-800">发布{CATEGORIES.find(c => c.id === activeTab)?.label}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 hover:bg-gray-100"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* --- 教程专属表单 --- */}
              {activeTab === 'tutorial' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">项目名称 <span className="text-red-500">*</span></label>
                    <input 
                      value={tutorialData.projectName}
                      onChange={e => setTutorialData({...tutorialData, projectName: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      placeholder="例如: Shopee 账号登录指南"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">操作步骤 (文本)</label>
                    <textarea 
                      value={tutorialData.stepsText}
                      onChange={e => setTutorialData({...tutorialData, stepsText: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none min-h-[120px]"
                      placeholder="第一步：...&#10;第二步：..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">步骤截图 (支持多图)</label>
                    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      {tutorialData.stepImages.map((img, idx) => (
                        <ImageUploader 
                          key={idx} 
                          src={img} 
                          onDelete={() => {
                            const newImgs = [...tutorialData.stepImages];
                            newImgs.splice(idx, 1);
                            setTutorialData({...tutorialData, stepImages: newImgs});
                          }}
                          onZoom={setZoomImg}
                        />
                      ))}
                      <ImageUploader onUpload={handleTutorialImageUpload} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">注意事项</label>
                    <textarea 
                      value={tutorialData.notes}
                      onChange={e => setTutorialData({...tutorialData, notes: e.target.value})}
                      className="w-full border border-amber-200 bg-amber-50 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none min-h-[80px]"
                      placeholder="例如：请务必使用指纹浏览器..."
                    />
                  </div>
                </>
              ) : activeTab === 'activity' ? (
                // ... (保持直播活动的表单逻辑，仅做样式微调) ...
                <div className="space-y-5 bg-brand-50/50 p-5 rounded-xl border border-brand-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">目标国家</label>
                      <select 
                        value={activityData.country}
                        onChange={e => setActivityData({...activityData, country: e.target.value, shopId: ''})} 
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="">-- 选择国家 --</option>
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">目标店铺</label>
                      <select 
                        value={activityData.shopId}
                        onChange={e => setActivityData({...activityData, shopId: e.target.value})}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        disabled={!activityData.country}
                      >
                        <option value="">-- 选择店铺 --</option>
                        {filteredShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* ... 其他活动字段保持结构不变，仅类名调整 ... */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">活动代码 (Code)</label>
                      <input 
                        value={activityData.code}
                        onChange={e => setActivityData({...activityData, code: e.target.value})}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="选填"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">优惠券数量</label>
                      <input 
                        type="number"
                        value={activityData.couponCount}
                        onChange={e => setActivityData({...activityData, couponCount: Number(e.target.value)})}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">开始时间</label>
                      <input 
                        type="datetime-local"
                        value={activityData.startTime}
                        onChange={e => setActivityData({...activityData, startTime: e.target.value})}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">结束时间</label>
                      <input 
                        type="datetime-local"
                        value={activityData.endTime}
                        onChange={e => setActivityData({...activityData, endTime: e.target.value})}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">关联产品 (可多选)</label>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-white scrollbar-thin">
                      {allProducts.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => {
                            const ids = activityData.selectedProductIds;
                            if (ids.includes(p.id)) {
                              setActivityData({...activityData, selectedProductIds: ids.filter(i => i !== p.id)});
                            } else {
                              setActivityData({...activityData, selectedProductIds: [...ids, p.id]});
                            }
                          }}
                          className={`
                            relative cursor-pointer border rounded-md overflow-hidden aspect-square transition-all
                            ${activityData.selectedProductIds.includes(p.id) ? 'ring-2 ring-brand-500 border-transparent shadow-md' : 'border-gray-200 hover:border-gray-300'}
                          `}
                        >
                          <img src={p.main_image || ''} className="w-full h-full object-cover" />
                          {activityData.selectedProductIds.includes(p.id) && (
                            <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                              <span className="text-white font-bold text-xs bg-brand-600 px-1 rounded shadow-sm">已选</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] truncate px-1 py-0.5">
                            {p.sku}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">活动备注</label>
                    <textarea 
                      value={formData.content}
                      onChange={e => setFormData({...formData, content: e.target.value})}
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-brand-500 outline-none min-h-[80px]"
                      placeholder="请输入..."
                    />
                  </div>
                </div>
              ) : (
                // --- 通用表单 ---
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">标题 <span className="text-red-500">*</span></label>
                    <input 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      placeholder="请输入标题..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">内容详情</label>
                    <textarea 
                      value={formData.content}
                      onChange={e => setFormData({...formData, content: e.target.value})}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none min-h-[150px]"
                      placeholder="请输入具体内容..."
                    />
                  </div>
                </>
              )}

              <button 
                onClick={handlePublish}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片放大 Overlay (UI 优化) */}
      {zoomImg && (
        <div className="fixed inset-0 z-[99] bg-black/90 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300 backdrop-blur-sm">
           <img src={zoomImg} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"/>
           <div className="absolute top-6 right-6 flex gap-4">
             <a href={zoomImg} download target="_blank" rel="noreferrer" className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all backdrop-blur-md" title="下载图片">
               <Download className="w-6 h-6" />
             </a>
             <button onClick={() => setZoomImg(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all backdrop-blur-md">
               <X className="w-6 h-6" />
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

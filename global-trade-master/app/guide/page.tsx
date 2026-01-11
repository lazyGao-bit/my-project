'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, BookOpen, Shield, Calendar, Plus, Trash2, 
  FileText, Megaphone, Store, Tag, Clock, Download, X
} from 'lucide-react';
import type { Database } from '../../lib/database.types';
import { format } from 'date-fns';
import ImageUploader from '../components/ImageUploader';

// 扩展内容类型
type LiveContent = {
  id: number;
  category: 'policy' | 'activity' | 'tutorial' | 'notice';
  data: {
    // 通用
    title: string | { CN?: string; [key: string]: any }; 
    content: string | { CN?: string; [key: string]: any };
    date: string;
    author?: string;
    
    // 活动专属
    target_country?: string;
    target_shop_id?: number;
    target_shop_name?: string;
    activity_code?: string;
    coupon_count?: number;
    start_time?: string;
    end_time?: string;
    products?: { id: number; sku: string; name: string; image: string }[];

    // 教程专属
    project_name?: string; // 项目名称
    steps_text?: string;   // 操作步骤文本
    step_images?: string[]; // 步骤截图 URL 数组
    notes?: string;        // 注意事项
  };
  created_at: string;
};

type Shop = Database['public']['Tables']['shops']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

const CATEGORIES = [
  { id: 'policy', label: '规章制度', icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'activity', label: '直播活动', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
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
  
  // 辅助数据状态
  const [shops, setShops] = useState<Shop[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [zoomImg, setZoomImg] = useState<string | null>(null); // 图片放大
  
  // 表单状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 通用字段
  const [formData, setFormData] = useState({ title: '', content: '' });
  // 活动专属字段
  const [activityData, setActivityData] = useState({
    country: '', shopId: '', code: '', couponCount: 0, startTime: '', endTime: '', selectedProductIds: [] as number[],
  });
  // 教程专属字段
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

  // 上传图片到 Supabase
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `guide_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file); // 复用 bucket
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
        title: tutorialData.projectName, // 教程标题用项目名称
        project_name: tutorialData.projectName,
        steps_text: tutorialData.stepsText,
        step_images: tutorialData.stepImages,
        notes: tutorialData.notes,
        content: tutorialData.stepsText // 兼容显示
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
      // 规章制度、通知
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(isAdmin ? '/admin' : '/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            {isAdmin ? '内容发布中心' : '直播指导手册'}
          </h1>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-md"
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
                  ? 'bg-white border-purple-200 shadow-md text-gray-900' 
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
          {filteredContents.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
              暂无{CATEGORIES.find(c => c.id === activeTab)?.label}内容
            </div>
          ) : (
            filteredContents.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100 z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                {/* 头部元信息 */}
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">{item.data.date}</span>
                  {item.category === 'activity' && item.data.target_country && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold flex items-center gap-1">
                      {COUNTRIES.find(c => c.code === item.data.target_country)?.name || item.data.target_country}
                    </span>
                  )}
                  {item.category === 'activity' && item.data.target_shop_name && (
                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded flex items-center gap-1">
                      <Store className="w-3 h-3" /> {item.data.target_shop_name}
                    </span>
                  )}
                </div>
                
                {/* 标题 */}
                <h3 className="text-xl font-bold text-gray-900 mb-4">{renderText(item.data.title || item.data.project_name)}</h3>

                {/* --- 教程专属展示 --- */}
                {item.category === 'tutorial' && (
                  <div className="space-y-6">
                    {/* 操作步骤 */}
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-bold text-blue-800 mb-2">操作步骤：</h4>
                      {renderText(item.data.steps_text)}
                    </div>

                    {/* 图片画廊 */}
                    {item.data.step_images && item.data.step_images.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2">
                          <ImageIcon className="w-4 h-4"/> 步骤截图 ({item.data.step_images.length})
                        </h4>
                        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                          {item.data.step_images.map((img, idx) => (
                            <ImageUploader 
                              key={idx} 
                              src={img} 
                              readOnly 
                              onZoom={setZoomImg} 
                              className="w-40 h-24 flex-shrink-0 cursor-zoom-in"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 注意事项 */}
                    {item.data.notes && (
                      <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 text-sm">
                        <h4 className="font-bold mb-1 flex items-center gap-1"><Shield className="w-4 h-4"/> 注意事项：</h4>
                        <div className="whitespace-pre-wrap">{renderText(item.data.notes)}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- 活动专属展示 --- */}
                {item.category === 'activity' && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    {/* ... (保持之前的活动展示逻辑) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="font-bold">时间：</span>
                        {item.data.start_time ? format(new Date(item.data.start_time), 'MM-dd HH:mm') : ''} 至 {item.data.end_time ? format(new Date(item.data.end_time), 'MM-dd HH:mm') : ''}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Tag className="w-4 h-4 text-orange-500" />
                        <span className="font-bold">代码：</span>{item.data.activity_code || '无'}
                        <span className="ml-2 bg-orange-100 text-orange-700 px-1.5 rounded text-xs">券: {item.data.coupon_count}</span>
                      </div>
                    </div>
                    {item.data.products && item.data.products.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase">活动产品 ({item.data.products.length})</p>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                          {item.data.products.map((prod: any) => (
                            <div key={prod.id} className="flex-shrink-0 w-24 bg-white rounded-lg border p-1 shadow-sm">
                              {prod.image ? <img src={prod.image} className="w-full h-20 object-cover rounded mb-1" /> : <div className="w-full h-20 bg-gray-100 rounded mb-1 flex items-center justify-center text-gray-300">无图</div>}
                              <div className="text-[10px] leading-tight line-clamp-2 h-8 text-gray-700">{prod.name}</div>
                              <div className="text-[10px] font-mono text-gray-400 mt-1">{prod.sku}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- 普通内容展示 --- */}
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

      {/* 发布模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-gray-800">发布{CATEGORIES.find(c => c.id === activeTab)?.label}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* --- 教程专属表单 --- */}
              {activeTab === 'tutorial' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">项目名称 <span className="text-red-500">*</span></label>
                    <input 
                      value={tutorialData.projectName}
                      onChange={e => setTutorialData({...tutorialData, projectName: e.target.value})}
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="例如: Shopee 账号登录指南"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">操作步骤 (文本)</label>
                    <textarea 
                      value={tutorialData.stepsText}
                      onChange={e => setTutorialData({...tutorialData, stepsText: e.target.value})}
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]"
                      placeholder="第一步：...&#10;第二步：..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">步骤截图 (支持多图)</label>
                    <div className="flex flex-wrap gap-3">
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
                    <label className="block text-sm font-bold text-gray-700 mb-1">注意事项</label>
                    <textarea 
                      value={tutorialData.notes}
                      onChange={e => setTutorialData({...tutorialData, notes: e.target.value})}
                      className="w-full border border-amber-200 bg-amber-50 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none min-h-[80px]"
                      placeholder="例如：请务必使用指纹浏览器..."
                    />
                  </div>
                </>
              ) : activeTab === 'activity' ? (
                // ... (保持直播活动的表单逻辑) ...
                <div className="space-y-5 bg-purple-50 p-5 rounded-xl border border-purple-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">目标国家</label>
                      <select 
                        value={activityData.country}
                        onChange={e => setActivityData({...activityData, country: e.target.value, shopId: ''})} 
                        className="w-full border rounded-lg p-2 text-sm"
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
                        className="w-full border rounded-lg p-2 text-sm"
                        disabled={!activityData.country}
                      >
                        <option value="">-- 选择店铺 --</option>
                        {filteredShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">活动代码 (Code)</label>
                      <input 
                        value={activityData.code}
                        onChange={e => setActivityData({...activityData, code: e.target.value})}
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="选填"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">优惠券数量</label>
                      <input 
                        type="number"
                        value={activityData.couponCount}
                        onChange={e => setActivityData({...activityData, couponCount: Number(e.target.value)})}
                        className="w-full border rounded-lg p-2 text-sm"
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
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">结束时间</label>
                      <input 
                        type="datetime-local"
                        value={activityData.endTime}
                        onChange={e => setActivityData({...activityData, endTime: e.target.value})}
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">关联产品 (可多选)</label>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-white">
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
                            relative cursor-pointer border rounded-md overflow-hidden aspect-square
                            ${activityData.selectedProductIds.includes(p.id) ? 'ring-2 ring-purple-500 border-transparent' : 'border-gray-200'}
                          `}
                        >
                          <img src={p.main_image || ''} className="w-full h-full object-cover" />
                          {activityData.selectedProductIds.includes(p.id) && (
                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                              <span className="text-white font-bold text-xs bg-purple-600 px-1 rounded">已选</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] truncate px-1">
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
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                      placeholder="请输入..."
                    />
                  </div>
                </div>
              ) : (
                // --- 通用表单 ---
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">标题 <span className="text-red-500">*</span></label>
                    <input 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="请输入标题..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">内容详情</label>
                    <textarea 
                      value={formData.content}
                      onChange={e => setFormData({...formData, content: e.target.value})}
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none min-h-[150px]"
                      placeholder="请输入具体内容..."
                    />
                  </div>
                </>
              )}

              <button 
                onClick={handlePublish}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition shadow-lg hover:shadow-xl"
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片放大 Overlay */}
      {zoomImg && (
        <div className="fixed inset-0 z-[99] bg-black/95 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
           <img src={zoomImg} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"/>
           <div className="absolute top-4 right-4 flex gap-4">
             <a href={zoomImg} download target="_blank" rel="noreferrer" className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors" title="下载图片">
               <Download className="w-8 h-8" />
             </a>
             <button onClick={() => setZoomImg(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
               <X className="w-8 h-8" />
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { 
  ArrowLeft, Search, Filter, ShoppingBag, 
  Trash2, Plus, Loader2, Image as ImageIcon,
  Maximize2, X, ChevronDown, ChevronUp, FileSpreadsheet,
  Languages, BookOpen, Calendar, Shield, Mic2
} from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../lib/database.types';
import { smartTranslate, type TranslationSet } from '../../lib/translation';
import * as XLSX from 'xlsx';

// --- 类型定义 ---
type Product = {
  id?: number; 
  sku: string; 
  mainImage: string; 
  patternImages: string[];
  name: TranslationSet; 
  size: TranslationSet; 
  features: TranslationSet;
};

// 管理员白名单
const ADMIN_EMAILS = ['gaojiaxin431@gmail.com', 'admin@example.com', '1771048910@qq.com'];

// ==========================================
// 组件: 图片上传器
// ==========================================
const ImageUploader = ({ src, onUpload, onDelete, onZoom, isMain = false, className = "", isAdmin }: any) => {
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    await onUpload(e.target.files[0]);
    setUploading(false);
  };

  if (!isAdmin && !src) return null;

  return (
    <div className={`relative group ${isMain ? 'w-full h-64' : 'w-20 h-20 flex-shrink-0'} ${className}`}>
      {src ? (
        <>
          {/* 修复：使用 object-contain 确保花型图片完整显示，不被裁剪 */}
          <img src={src} className={`w-full h-full ${isMain ? 'object-cover rounded-t-2xl' : 'object-cover rounded-lg border border-slate-200'}`} />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
             {onZoom && <button onClick={(e) => { e.stopPropagation(); onZoom(src); }} className="bg-white/90 p-1.5 rounded-full hover:text-blue-600"><Maximize2 className="w-3 h-3" /></button>}
             {isAdmin && onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="bg-white/90 p-1.5 rounded-full hover:text-red-600"><X className="w-3 h-3" /></button>}
          </div>
        </>
      ) : (
        <label className={`cursor-pointer border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 transition-colors flex flex-col items-center justify-center text-slate-400 gap-2 w-full h-full ${isMain ? 'rounded-t-2xl' : 'rounded-lg'}`}>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading}/>
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-purple-500"/> : (isMain ? <ImageIcon className="w-8 h-8"/> : <Plus className="w-4 h-4"/>)}
        </label>
      )}
    </div>
  );
};

// ==========================================
// 组件: 产品卡片
// ==========================================
const ProductCard = ({ p, activeLang, isAdmin, handleDeleteProduct, handleImageUpload, setZoomImg, refreshData }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const getLangText = (obj: any) => obj?.[activeLang] || obj?.CN || '';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all relative group flex flex-col h-full">
      {isAdmin && (
        <button 
          onClick={() => handleDeleteProduct(p.id!, p.sku)}
          className="absolute top-2 right-2 z-20 bg-white/90 p-2 rounded-full shadow text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* 主图 */}
      <div className="relative">
         <ImageUploader 
           src={p.mainImage} 
           isMain 
           isAdmin={isAdmin}
           onZoom={setZoomImg}
           onUpload={(file: File) => handleImageUpload(p.sku, file, false)}
           onDelete={async () => { await supabase.from('products').update({ main_image: '' }).eq('sku', p.sku); refreshData(); }}
         />
         <span className="absolute top-4 left-4 bg-black/60 text-white px-2 py-0.5 rounded text-xs backdrop-blur font-mono shadow-sm">{p.sku}</span>
      </div>

      <div className="p-5 flex-1 flex flex-col">
         {/* 修复：移除 line-clamp-2，允许标题完整显示 */}
         <h3 className="font-bold text-slate-800 mb-3 text-lg leading-tight">
            {getLangText(p.name)}
         </h3>

         <div className="space-y-3 text-sm flex-1">
            {/* 尺寸 */}
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
               <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Size</span>
               <p className="text-slate-700">{getLangText(p.size)}</p>
            </div>
            
            {/* 特点 (可展开) */}
            <div 
              className={`bg-slate-50 p-2 rounded border border-slate-100 transition-all cursor-pointer hover:bg-purple-50/30 group/feat`}
              onClick={() => setIsExpanded(!isExpanded)}
            >
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Features</span>
                 <span className="text-[10px] text-purple-400 flex items-center gap-1 opacity-0 group-hover/feat:opacity-100 transition-opacity">
                    {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                 </span>
               </div>
               {/* 依然保留 expand 逻辑，但默认显示更多行 */}
               <p className={`text-slate-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                  {getLangText(p.features)}
               </p>
            </div>
         </div>

         {/* 附图 */}
         {/* 修复：允许横向滚动，增加内边距防止阴影被切 */}
         <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
               {/* 确保 patternImages 是数组 */}
               {Array.isArray(p.patternImages) && p.patternImages.map((img: string, idx: number) => (
                  <ImageUploader 
                    key={idx} 
                    src={img} 
                    isAdmin={isAdmin}
                    onZoom={setZoomImg}
                    onDelete={async () => {
                     const newP = [...p.patternImages]; newP.splice(idx, 1);
                     await supabase.from('products').update({ pattern_images: newP }).eq('sku', p.sku);
                     refreshData();
                  }}/>
               ))}
               {isAdmin && <ImageUploader onUpload={(file: File) => handleImageUpload(p.sku, file, true)} isAdmin={isAdmin} />}
            </div>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 主页面组件
// ==========================================
export default function ProductsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLang, setActiveLang] = useState<keyof TranslationSet>('CN');
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true);
      }
    };
    checkUser();
  }, [supabase]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id', {ascending: false});
    if (data) { 
      const formatted = data.map((p: any) => {
        // --- 核心修复：更强健的 JSON 解析逻辑 ---
        let patterns = p.pattern_images || [];
        // 如果数据库里存的是字符串（例如 "[url1, url2]"），尝试解析它
        if (typeof patterns === 'string') {
            try {
                patterns = JSON.parse(patterns);
            } catch (e) {
                // 如果解析失败，可能是单个 URL 字符串，尝试直接包装成数组，或者置空
                if (patterns.startsWith('http')) {
                    patterns = [patterns];
                } else {
                    console.error(`Failed to parse pattern_images for ${p.sku}:`, patterns);
                    patterns = [];
                }
            }
        }
        
        return {
          id: p.id,
          sku: p.sku,
          mainImage: p.main_image || '',
          patternImages: Array.isArray(patterns) ? patterns : [], // 确保一定是数组
          name: p.name || {},
          size: p.size || {},
          features: p.features || {}
        };
      });
      setProducts(formatted); 
    }
    setLoading(false);
  };
  useEffect(() => { fetchProducts(); }, []);

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `prod_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageUpload = async (sku: string, file: File, isPattern: boolean) => {
    if (!isAdmin) return;
    try {
      const publicUrl = await uploadFile(file);
      if (isPattern) {
        const prod = products.find(p => p.sku === sku);
        if (prod) {
           const newImgs = [...prod.patternImages, publicUrl];
           await supabase.from('products').update({ pattern_images: newImgs }).eq('sku', sku);
           fetchProducts();
        }
      } else {
        await supabase.from('products').update({ main_image: publicUrl }).eq('sku', sku);
        fetchProducts();
      }
    } catch (e: any) { alert('上传失败: ' + e.message); }
  };

  const handleDeleteProduct = async (id: number, sku: string) => {
    if (!confirm(`确定删除产品 ${sku} 吗？`)) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setProgress("解析 Excel...");
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        
        const items = sheetData.map((row: any) => ({
            sku: String(row['SKU']||'').trim(),
            name: String(row['Name']||row['商品名称']||'').trim(),
            size: String(row['Size']||row['尺寸']||'').trim(),
            features: String(row['Features']||row['特点']||'').trim()
        })).filter(i => i.sku);

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          setProgress(`正在导入: ${item.sku} (${i+1}/${items.length})`);
          
          const [n, s, f] = await Promise.all([
            smartTranslate(item.name),
            smartTranslate(item.size),
            smartTranslate(item.features)
          ]);

          await supabase.from('products').upsert({
            sku: item.sku,
            name: n,
            size: s,
            features: f
          }, { onConflict: 'sku' });
        }
        alert("导入完成！");
        fetchProducts();
      } catch (e: any) { alert("导入出错: " + e.message); }
      finally { setLoading(false); setProgress(""); }
    };
    reader.readAsBinaryString(file);
  };

  const filteredProducts = products.filter(p => 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.name[activeLang] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Link href="/" className="text-gray-500 hover:text-purple-600 transition">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
              YYT 产品库
            </h1>
            {isAdmin && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">管理员模式</span>}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
            <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
               {['CN','EN','VN','TH'].map((code) => (
                 <button 
                   key={code} 
                   onClick={() => setActiveLang(code as any)}
                   className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${activeLang===code ? 'bg-white shadow text-purple-600' : 'text-gray-400'}`}
                 >
                   {code}
                 </button>
               ))}
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                 <div className="relative">
                    <input type="file" onChange={handleExcelUpload} className="absolute inset-0 opacity-0 cursor-pointer w-8" title="导入Excel" disabled={loading} />
                    <button className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition" disabled={loading}>
                       {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileSpreadsheet className="w-5 h-5"/>}
                    </button>
                 </div>
                 <button 
                   onClick={() => alert("请使用Excel导入或后续添加的手动录入功能")}
                   className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200 transition"
                 >
                   <Plus className="w-5 h-5"/>
                 </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {progress && (
        <div className="bg-blue-600 text-white text-xs text-center py-1">
          {progress}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 relative max-w-md mx-auto">
           <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
           <input 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
             placeholder="搜索 SKU 或产品名称..."
           />
        </div>

        {loading && !progress ? (
           <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-purple-300"/></div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(p => (
                <ProductCard 
                  key={p.sku} 
                  p={p} 
                  activeLang={activeLang} 
                  isAdmin={isAdmin}
                  handleDeleteProduct={handleDeleteProduct}
                  handleImageUpload={handleImageUpload}
                  setZoomImg={setZoomImg}
                  refreshData={fetchProducts}
                />
              ))}
           </div>
        )}
        
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-400">暂无产品数据</div>
        )}
      </main>

      {zoomImg && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomImg(null)}>
           <img src={zoomImg} className="max-w-full max-h-full object-contain" />
           <button className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20">
             <X className="w-8 h-8" />
           </button>
        </div>
      )}
    </div>
  );
}

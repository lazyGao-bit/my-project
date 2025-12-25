"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Upload, Trash2, Globe, 
  Image as ImageIcon, X, Loader2, FileSpreadsheet, Plus,
  Search, CheckSquare, Square, RefreshCw, Zap, ShieldAlert,
  Calendar, BookOpen, Mic2, Shield, Trophy, Edit3, Languages, Cloud,
  Maximize2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MessageCircle// 新增图标
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';

// ==========================================
// 🔑 配置区域
// ==========================================
const DEEPLX_ENDPOINT = "https://api.deeplx.org/eIWrZKBZE5N-E8C-k-tB6uwxbgBD-7sVjt45RQ16EoI/translate";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxWAorgDqTQhmAxTyJ7cbZ1JAKphJKknw3vCyrh3Zq1Gk2KHyoODXp2mYQydHvJ5hRZ/exec";
const ADMIN_PASSWORD = "888"; 
const ITEMS_PER_PAGE = 12; 

// --- 类型定义 ---
type TranslationSet = { CN: string; VN: string; TH: string; PH: string; MY: string; EN: string; };
type Product = {
  id?: number; sku: string; mainImage: string; patternImages: string[];
  name: TranslationSet; size: TranslationSet; features: TranslationSet;
};

// --- 工具函数 ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const cleanText = (text: any): string => String(text || "").trim().replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "");
const uploadToSupabase = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { error } = await supabase.storage.from('product-images').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return data.publicUrl;
};

// ==========================================
// 🖼️ 图片组件
// ==========================================
const ImageUploader = ({ src, onUpload, onDelete, onZoom, isMain = false, className = "" }: any) => {
  const [uploading, setUploading] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    await onUpload(e.target.files[0]);
    setUploading(false);
  };
  return (
    <div className={`relative group ${isMain ? 'w-full h-48' : 'w-16 h-16 flex-shrink-0'} ${className}`}>
      {src ? (
        <>
          <img src={src} className={`w-full h-full object-cover border border-slate-200 ${isMain ? 'rounded-xl' : 'rounded-lg'}`} />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
             {onZoom && <button onClick={(e) => { e.stopPropagation(); onZoom(src); }} className="bg-white/90 p-1.5 rounded-full hover:text-blue-600"><Maximize2 className="w-3 h-3" /></button>}
             {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="bg-white/90 p-1.5 rounded-full hover:text-red-600"><X className="w-3 h-3" /></button>}
          </div>
        </>
      ) : (
        <label className={`cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-slate-400 gap-2 w-full h-full ${isMain ? 'rounded-xl' : 'rounded-lg'}`}>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading}/>
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-500"/> : (isMain ? <ImageIcon className="w-8 h-8"/> : <Plus className="w-4 h-4"/>)}
        </label>
      )}
    </div>
  );
};

// --- 翻译输入框 ---
const TranslatableInput = ({ value, onChange, placeholder, rows = 1, className = "" }: any) => {
  const [loading, setLoading] = useState(false);
  const handleTrans = async () => {
    if(!value.CN) return; setLoading(true);
    const res = await smartTranslate(value.CN);
    onChange(res); setLoading(false);
  };
  return (
    <div className={`relative ${className}`}>
      {rows===1 ? <input value={value.CN} onChange={e=>onChange({...value,CN:e.target.value})} className="w-full border rounded px-2 py-1 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-200" placeholder={placeholder}/>
      : <textarea value={value.CN} onChange={e=>onChange({...value,CN:e.target.value})} className="w-full border rounded px-2 py-1 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none" rows={rows} placeholder={placeholder}/>}
      <button onClick={handleTrans} disabled={loading} className="absolute right-1 top-1 p-1 text-blue-500 hover:bg-blue-50 rounded" title="点击AI翻译">{loading?<Loader2 className="w-3 h-3 animate-spin"/>:<Languages className="w-3 h-3"/>}</button>
    </div>
  );
};

// ==========================================
// 🆕 新增组件：单个产品卡片 (支持文本展开)
// ==========================================
const ProductCard = ({ p, activeLang, isAdmin, handleDeleteProduct, handleImageUpload, setZoomImg, fetchProducts }: any) => {
  // 🌟 控制展开/收起的状态
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all relative">
      {isAdmin && (
        <button 
          onClick={() => handleDeleteProduct(p.id!, p.sku)}
          className="absolute top-2 right-2 z-20 bg-white p-2 rounded-full shadow-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="relative p-4 pb-0">
         <ImageUploader 
           src={p.mainImage} 
           isMain 
           onZoom={setZoomImg}
           onUpload={(file: File) => handleImageUpload(p.sku, file, false)}
           onDelete={async () => { await supabase.from('products').update({ main_image: '' }).eq('sku', p.sku); fetchProducts(); }}
         />
         <span className="absolute top-6 left-6 bg-black/60 text-white px-2 py-0.5 rounded text-xs backdrop-blur">{p.sku}</span>
      </div>

      <div className="p-5">
         {/* 1. 标题：取消固定高度，允许完整显示 */}
         <h3 className="font-bold text-slate-800 mb-2 leading-tight">
            {p.name[activeLang]||p.name.CN}
         </h3>

         <div className="space-y-2 text-sm">
            {/* 尺寸 */}
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
               <span className="text-[10px] text-slate-400 block uppercase font-bold">Size</span>
               {p.size[activeLang]||p.size.CN}
            </div>
            
            {/* 2. 产品特点：支持点击展开 */}
            <div 
              className={`bg-slate-50 p-2 rounded border border-slate-100 transition-all cursor-pointer hover:bg-blue-50/50 group`}
              onClick={() => setIsExpanded(!isExpanded)}
            >
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] text-slate-400 uppercase font-bold">Features</span>
                 <span className="text-[10px] text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isExpanded ? <>收起 <ChevronUp className="w-3 h-3"/></> : <>展开 <ChevronDown className="w-3 h-3"/></>}
                 </span>
               </div>
               
               {/* 核心逻辑：如果 expanded 为 true，不限制行数；否则限制 3 行 */}
               <p className={`text-slate-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                  {p.features[activeLang]||p.features.CN}
               </p>
               
               {!isExpanded && (
                  <div className="text-center mt-1">
                     <ChevronDown className="w-4 h-4 text-slate-300 mx-auto"/>
                  </div>
               )}
            </div>
         </div>

         <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Patterns</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
               {p.patternImages.map((img: string, idx: number) => (
                  <ImageUploader 
                    key={idx} 
                    src={img} 
                    onZoom={setZoomImg}
                    onDelete={async () => {
                     const newP = [...p.patternImages]; newP.splice(idx, 1);
                     await supabase.from('products').update({ pattern_images: newP }).eq('sku', p.sku);
                     fetchProducts();
                  }}/>
               ))}
               <ImageUploader onUpload={(file: File) => handleImageUpload(p.sku, file, true)}/>
            </div>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 翻译引擎
// ==========================================
const fetchGoogleGAS = async (text: string, targetLang: string) => {
  const t = cleanText(text); if (!t) return "";
  let g = targetLang; if (targetLang === 'ms') g = 'ms'; if (targetLang === 'tl' || targetLang === 'ph') g = 'tl';
  try {
    const params = new URLSearchParams(); params.append('text', t); params.append('target', g); params.append('source', 'zh-CN');
    const res = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: params, redirect: 'follow' });
    if (!res.ok) return ""; const data = await res.json(); return data.text || data.result || ""; 
  } catch (e) { return ""; }
};
const fetchDeepLX = async (text: string) => {
  const t = cleanText(text); if (!t) return "";
  try {
    const res = await fetch(DEEPLX_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t, source_lang: "ZH", target_lang: "EN" }) });
    if (!res.ok) return ""; const data = await res.json(); const result = data.data || data.translations?.[0]?.text;
    return (result && String(result).includes("Error")) ? "" : (result || "");
  } catch (e) { return ""; }
};
const smartTranslate = async (text: string): Promise<TranslationSet> => {
  const t = cleanText(text); if (!t) return { CN:'', VN:'', TH:'', PH:'', MY:'', EN:'' };
  const isEn = /^[a-zA-Z0-9\s,.-]+$/.test(t);
  let en = t;
  if (!isEn) {
    en = await fetchDeepLX(t);
    if (!en) { await delay(200); en = await fetchGoogleGAS(t, "en"); }
  }
  const vn = await fetchGoogleGAS(t, "vi"); await delay(100);
  const th = await fetchGoogleGAS(t, "th"); await delay(100);
  const my = await fetchGoogleGAS(t, "ms");
  return { CN: t, EN: en||t, VN: vn||"", TH: th||"", PH: en||t, MY: my||"" }; 
};

// --- 云端同步 ---
const syncLiveItem = async (category: string, data: any, id?: number) => {
  if (id) await supabase.from('live_hub').update({ data }).eq('id', id);
  else await supabase.from('live_hub').insert({ category, data });
};
const deleteLiveItem = async (id: number) => { await supabase.from('live_hub').delete().eq('id', id); };

// ==========================================
// 📺 LiveHub 组件
// ==========================================
const LiveHub = ({ isAdmin, activeLang, onZoom }: any) => {
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLiveHub = async () => {
    setLoading(true);
    const { data } = await supabase.from('live_hub').select('*').order('created_at', {ascending: true});
    if (data) {
      setTutorials(data.filter(i => i.category === 'tutorial'));
      setPlans(data.filter(i => i.category === 'plan'));
      setPolicies(data.filter(i => i.category === 'policy'));
      setScripts(data.filter(i => i.category === 'script'));
    }
    setLoading(false);
  };
  useEffect(() => { loadLiveHub(); }, []);

  const handleSave = async (cat: string, itemData: any, id?: number) => { await syncLiveItem(cat, itemData, id); loadLiveHub(); };
  const handleDelete = async (id: number) => { if(confirm("确定删除?")) { await deleteLiveItem(id); loadLiveHub(); }};
  const renderText = (set: any) => set?.[activeLang] || set?.CN || '...';
  const emptyTrans = { CN:'', EN:'', VN:'', TH:'', PH:'', MY:'' };
  const handleTutorialImg = async (file: File, tutId: number, stepIndex: number, currentSteps: any[]) => {
    try {
      const url = await uploadToSupabase(file);
      const newSteps = [...currentSteps]; newSteps[stepIndex].image = url;
      const tut = tutorials.find(t => t.id === tutId);
      if(tut) handleSave('tutorial', { ...tut.data, steps: newSteps }, tutId);
    } catch(e) { alert("图片上传失败"); }
  };

  if (loading) return <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500"/></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* 教程 */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100">
         <div className="flex items-center gap-2 mb-6 border-b pb-2"><BookOpen className="w-5 h-5 text-purple-600"/> <h2 className="text-lg font-bold">接入教程 / Tutorials</h2>{isAdmin && <button onClick={()=>handleSave('tutorial', { platform: 'TikTok', title: {...emptyTrans,CN:'新教程'}, steps: [] })} className="ml-auto text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">+ 新增</button>}</div>
         <div className="space-y-8">{tutorials.map(tut => { const d = tut.data; return (
           <div key={tut.id} className="border rounded-xl p-4 bg-slate-50/50">
             <div className="flex justify-between items-center mb-4">
               {isAdmin ? <div className="flex gap-2 w-full"><select value={d.platform} onChange={e=>handleSave('tutorial', {...d, platform:e.target.value}, tut.id)} className="bg-white border rounded text-sm font-bold"><option>TikTok</option><option>Shopee</option></select><TranslatableInput value={d.title} onChange={(v:any)=>handleSave('tutorial', {...d, title:v}, tut.id)} className="flex-1"/><button onClick={()=>handleDelete(tut.id)} className="text-red-400"><Trash2 className="w-4 h-4"/></button></div>
               : <h3 className="font-bold text-slate-800 flex items-center gap-2"><span className="bg-black text-white text-xs px-2 py-0.5 rounded">{d.platform}</span> {renderText(d.title)}</h3>}
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto pb-2">
               {d.steps?.map((step: any, idx: number) => (
                 <div key={idx} className="relative bg-white p-2 rounded-lg border h-full flex flex-col shadow-sm">
                   <div className="relative aspect-[9/16] bg-slate-100 rounded mb-2 overflow-hidden border border-slate-100">
                     <ImageUploader src={step.image} isMain onZoom={onZoom} onUpload={(file: File) => handleTutorialImg(file, tut.id, idx, d.steps)} className={!isAdmin ? "pointer-events-none" : ""}/>
                     <span className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 rounded-full backdrop-blur">Step {idx+1}</span>
                   </div>
                   {isAdmin ? (<div className="flex flex-col gap-2 h-full"><TranslatableInput value={step.text} onChange={(v:any)=>{const newSteps=[...d.steps];newSteps[idx].text=v;handleSave('tutorial',{...d,steps:newSteps},tut.id)}} rows={3} className="text-xs"/><button onClick={()=>{const newSteps=d.steps.filter((_:any,i:number)=>i!==idx);handleSave('tutorial',{...d,steps:newSteps},tut.id)}} className="mt-auto text-xs text-red-400 border border-red-200 rounded py-1 hover:bg-red-50">删除步骤</button></div>) 
                   : <p className="text-xs text-slate-600 leading-relaxed font-medium">{renderText(step.text)}</p>}
                 </div>
               ))}{isAdmin && <button onClick={()=>handleSave('tutorial', {...d, steps:[...(d.steps||[]), { image:'', text: emptyTrans }]}, tut.id)} className="border-2 border-dashed border-slate-300 rounded-lg h-64 w-40 flex flex-col gap-2 items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-blue-500 hover:border-blue-300 transition-all"><Plus/><span className="text-xs">添加步骤</span></button>}
             </div>
           </div>
         );})}</div>
      </section>
      
      {/* 计划 & 规则 & 话术 (保持原样) */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center gap-2 mb-4 border-b pb-2"><Calendar className="w-5 h-5 text-blue-600"/><h2 className="text-lg font-bold">直播计划 / Weekly Plan</h2>{isAdmin && <button onClick={() => handleSave('plan', { day: {...emptyTrans,CN:'周一'}, country: 'VN', activity: {...emptyTrans,CN:'活动'}, details: emptyTrans })} className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">+ 新增</button>}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{plans.map(p => { const d = p.data; return (<div key={p.id} className="bg-slate-50 p-4 rounded-xl border relative">{isAdmin && <button onClick={()=>handleDelete(p.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><X className="w-4 h-4"/></button>}<div className="flex gap-2 mb-2 items-center">{isAdmin ? <><TranslatableInput value={d.day} onChange={(v:any)=>handleSave('plan', {...d, day:v}, p.id)} className="w-20"/><input value={d.country} onChange={e=>handleSave('plan', {...d, country:e.target.value}, p.id)} className="w-16 text-xs border rounded px-1 py-1 font-bold"/><TranslatableInput value={d.activity} onChange={(v:any)=>handleSave('plan', {...d, activity:v}, p.id)} className="flex-1"/></> : <><span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm text-sm">{renderText(d.day)}</span><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">{d.country}</span><span className="text-xs text-slate-500 border border-blue-200 px-1 rounded">{renderText(d.activity)}</span></>}</div>{isAdmin ? <TranslatableInput value={d.details} onChange={(v:any)=>handleSave('plan', {...d, details:v}, p.id)} rows={3}/> : <p className="text-sm text-slate-700 mt-2">{renderText(d.details)}</p>}</div>);})}</div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">{[{t:'violation',c:'red',n:'红线规则'},{t:'incentive',c:'amber',n:'激励政策'}].map((conf:any) => (<div key={conf.t} className={`bg-white rounded-2xl border border-${conf.c}-100 p-6`}><div className={`flex items-center gap-2 mb-4 text-${conf.c}-600`}><Shield className="w-5 h-5"/> <h2 className="text-lg font-bold">{conf.n}</h2>{isAdmin && <button onClick={()=>handleSave('policy', { type: conf.t, title: emptyTrans, content: emptyTrans })} className={`ml-auto text-xs bg-${conf.c}-50 px-2 py-1 rounded`}>+ 新增</button>}</div><div className="space-y-3">{policies.filter(x => x.data.type === conf.t).map(p => { const d = p.data; return (<div key={p.id} className={`bg-${conf.c}-50/50 p-3 rounded-lg border border-${conf.c}-100 text-sm`}>{isAdmin ? <div className="space-y-2"><div className="flex justify-between gap-2"><TranslatableInput value={d.title} onChange={(v:any)=>handleSave('policy', {...d, title:v}, p.id)} className="font-bold w-full"/><button onClick={()=>handleDelete(p.id)}><Trash2 className="w-3 h-3 text-red-300"/></button></div><TranslatableInput value={d.content} onChange={(v:any)=>handleSave('policy', {...d, content:v}, p.id)} rows={2}/></div> : <><h4 className={`font-bold text-${conf.c}-700 mb-1`}>{renderText(d.title)}</h4><p className="text-slate-600">{renderText(d.content)}</p></>}</div>);})}</div></div>))}</section>
      <section className="bg-white rounded-2xl p-6 border border-slate-100"><div className="flex items-center gap-2 mb-4 border-b pb-2"><Mic2 className="w-5 h-5 text-green-600"/><h2 className="text-lg font-bold">话术 / Scripts</h2>{isAdmin && <button onClick={()=>handleSave('script', { scene:'场景', text: emptyTrans })} className="ml-auto text-xs bg-green-50 text-green-600 px-2 py-1 rounded">+ 新增</button>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{scripts.map(s => { const d = s.data; return (<div key={s.id} className="bg-slate-50 p-4 rounded-xl border relative">{isAdmin && <button onClick={()=>handleDelete(s.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><X className="w-4 h-4"/></button>}<div className="mb-2">{isAdmin ? <input value={d.scene} onChange={e=>handleSave('script',{...d,scene:e.target.value},s.id)} className="font-bold text-sm px-1 rounded"/> : <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">{d.scene}</span>}</div>{isAdmin ? <TranslatableInput value={d.text} onChange={(v:any)=>handleSave('script',{...d,text:v},s.id)} rows={3}/> : <p className="font-bold text-slate-800 text-sm mb-2">{renderText(d.text)}</p>}</div>);})}</div></section>
    </div>
  );
};

// ==========================================
// 🚀 主程序
// ==========================================
export default function DigitalProductCatalog() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'live'>('catalog');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeLang, setActiveLang] = useState<keyof TranslationSet>('CN');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('id', {ascending: false});
    if (data) { 
      setProducts(data.map((p: any) => ({ ...p, mainImage: p.main_image || '', patternImages: p.pattern_images || [] }))); 
    }
    setLoading(false);
  };
  useEffect(() => { fetchProducts(); }, []);

  const handleImageUpload = async (sku: string, file: File, isPattern: boolean) => {
    try {
      const publicUrl = await uploadToSupabase(file);
      if (isPattern) {
        const currentProduct = products.find(p => p.sku === sku);
        if (currentProduct) {
           const newPatterns = [...(currentProduct.patternImages || []), publicUrl];
           await supabase.from('products').update({ pattern_images: newPatterns }).eq('sku', sku);
           setProducts(prev => prev.map(p => p.sku === sku ? { ...p, patternImages: newPatterns } : p));
        }
      } else {
        await supabase.from('products').update({ main_image: publicUrl }).eq('sku', sku);
        setProducts(prev => prev.map(p => p.sku === sku ? { ...p, mainImage: publicUrl } : p));
      }
    } catch (error: any) { alert('上传失败: ' + error.message); }
  };

  const handleDeleteProduct = async (id: number, sku: string) => {
    if (!isAdmin || !confirm(`删除 ${sku}?`)) return;
    setLoading(true);
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setLoading(false);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setProgress("解析 Excel...");
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const grouped = new Map<string, any>();
        data.forEach((row: any) => {
          const sku = String(row['SKU']||'').trim(); if(!sku) return;
          const rawName = String(row['Name']||row['商品名称']||'').trim(); 
          const rawSize = String(row['Size']||row['尺寸']||'').trim(); 
          const rawFeat = String(row['Features']||row['特点']||'').trim();
          if (!grouped.has(sku)) grouped.set(sku, { sku, name: rawName, features: rawFeat, sizes: new Set(rawSize?[rawSize]:[]) });
          else { const exist = grouped.get(sku); if(!exist.name && rawName) exist.name = rawName; if(rawFeat.length > exist.features.length) exist.features = rawFeat; if(rawSize) exist.sizes.add(rawSize); }
        });
        const items = Array.from(grouped.values());
        for (let i = 0; i < items.length; i++) {
          const item = items[i]; setProgress(`翻译保存: ${item.sku} (${i+1}/${items.length})`);
          const [n, s, f] = await Promise.all([smartTranslate(item.name), smartTranslate(Array.from(item.sizes).join(" / ")), smartTranslate(item.features)]);
          const { data: existing } = await supabase.from('products').select('main_image, pattern_images').eq('sku', item.sku).single();
          await supabase.from('products').upsert({
            sku: item.sku, name: n, size: s, features: f,
            main_image: existing?.main_image || '',
            pattern_images: existing?.pattern_images || []
          }, { onConflict: 'sku' });
          await delay(300);
        }
        fetchProducts(); alert("导入完成");
      } catch (e: any) { alert("出错: " + e.message); } finally { setLoading(false); setProgress(""); e.target.value = ''; }
    };
    reader.readAsBinaryString(file);
  };

  const handleAdminToggle = () => { if (isAdmin) setIsAdmin(false); else if (prompt("管理员密码") === ADMIN_PASSWORD) setIsAdmin(true); else alert("错误"); };
  const handleClearDatabase = async () => { if (isAdmin && confirm("清空全部?")) { setLoading(true); await supabase.from('products').delete().neq('id', 0); setProducts([]); setLoading(false); } };

  // --- 分页逻辑 ---
  const filteredProducts = useMemo(() => products.filter(p => !searchTerm || (p.sku+p.name.CN).toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm]);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const handlePageChange = (newPage: number) => { if(newPage >= 1 && newPage <= totalPages) { setCurrentPage(newPage); window.scrollTo({ top: 0, behavior: 'smooth' }); }};

  const LANG_OPTIONS: { code: keyof TranslationSet; label: string; flag: string }[] = [ { code: 'CN', label: '中文', flag: '🇨🇳' }, { code: 'EN', label: 'English', flag: '🇺🇸' }, { code: 'VN', label: 'Tiếng Việt', flag: '🇻🇳' }, { code: 'TH', label: 'ไทย', flag: '🇹🇭' }, { code: 'PH', label: 'Tagalog', flag: '🇵🇭' }, { code: 'MY', label: 'Melayu', flag: '🇲🇾' }, ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><div className="bg-[#0052D9] text-white p-2 rounded-lg"><Package className="w-5 h-5"/></div><h1 className="text-lg font-bold hidden md:block">TeamHub <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Cloud</span></h1></div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
               <button onClick={()=>setActiveTab('catalog')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab==='catalog'?'bg-white shadow-sm text-blue-600':'text-slate-500'}`}>产品库</button>
               <button onClick={()=>setActiveTab('live')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab==='live'?'bg-white shadow-sm text-blue-600':'text-slate-500'}`}>直播指导</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex bg-slate-100 p-1 rounded-lg">{LANG_OPTIONS.map(l=><button key={l.code} onClick={()=>setActiveLang(l.code)} className={`px-2 py-1 rounded text-xs ${activeLang===l.code?'bg-white shadow text-blue-600':'text-slate-400'}`}>{l.flag}</button>)}</div>
             {isAdmin && activeTab==='catalog' && (<div className="flex items-center gap-2"><div className="relative"><input type="file" onChange={handleExcelUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={loading}/><button className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-2">{loading?<Loader2 className="w-4 h-4 animate-spin"/>:<FileSpreadsheet className="w-4 h-4"/>} 导入</button></div><button onClick={handleClearDatabase} className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-bold flex items-center gap-2"><Trash2 className="w-4 h-4"/> 清空库</button></div>)}
             <button onClick={handleAdminToggle} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border ${isAdmin?'bg-slate-800 text-white':'bg-white text-slate-400'}`}>{isAdmin?'管理员':'主播模式'}</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'live' ? <LiveHub isAdmin={isAdmin} activeLang={activeLang} onZoom={setZoomImg}/> : (
          <>
             <div className="mb-6 relative max-w-md mx-auto">
               <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
               <input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="搜索产品..."/>
             </div>
             {loading && <div className="text-center text-blue-500 text-sm mb-4 animate-pulse">{progress || "正在同步云端数据..."}</div>}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {displayProducts.map(p => (
                   // 🌟 使用提取出来的单独卡片组件，支持展开逻辑
                   <ProductCard 
                     key={p.id} 
                     p={p} 
                     activeLang={activeLang} 
                     isAdmin={isAdmin} 
                     handleDeleteProduct={handleDeleteProduct} 
                     handleImageUpload={handleImageUpload} 
                     setZoomImg={setZoomImg} 
                     fetchProducts={fetchProducts}
                   />
                ))}
             </div>
             {totalPages > 1 && (
               <div className="flex justify-center items-center gap-4 py-4">
                 <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full border bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronLeft className="w-5 h-5"/></button>
                 <span className="text-sm font-bold text-slate-600">Page {currentPage} of {totalPages}</span>
                 <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full border bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronRight className="w-5 h-5"/></button>
               </div>
             )}
          </>
        )}
      </main>
      {zoomImg && (<div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200" onClick={() => setZoomImg(null)}><img src={zoomImg} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"/><button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-8 h-8" /></button></div>)}
      <a 
        href="https://wa.me/8615038655729" // ⚠️ 请把这里的数字换成你的 WhatsApp 手机号
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#20bd5a] hover:scale-105 transition-all flex items-center gap-2 font-bold animate-in fade-in zoom-in"
      >
        <MessageCircle className="w-5 h-5" />
        <span>Contact Us</span>
      </a>
    </div>
  );
}
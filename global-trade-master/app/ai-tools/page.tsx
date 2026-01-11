'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Wand2, ArrowLeft, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Database } from '../../lib/database.types';
import { useTranslation } from '../../lib/useTranslation';

const defaultUI = {
  header_title: "AI 内容生成",
  btn_back: "返回工作台",
  
  label_select_product: "选择产品",
  placeholder_select: "-- 请选择产品 --",
  loading_products: "加载产品库中...",
  
  label_select_pattern: "选择重点推荐花型 (可选)",
  
  label_target_market: "目标市场/语言",
  
  label_content_type: "内容类型",
  type_live_script: "直播带货脚本",
  type_short_video: "短视频文案",
  
  btn_generate: "立即生成内容",
  btn_generating: "正在思考中...",
  
  result_title: "生成结果",
  btn_copy: "复制全文",
  btn_copied: "已复制",
  
  empty_state_title: "AI 助手就绪",
  empty_state_desc: "请在左侧选择产品并配置参数，\nAI 将为您生成专属营销内容。"
};

// ... 类型定义保持不变
type Product = {
  id: number;
  sku: string;
  name: { CN: string };
  size: { CN: string };
  features: { CN: string };
  pattern_images: string[];
};

const COUNTRIES = [
  { code: 'CN', name: 'China', icon: '🇨🇳' },
  { code: 'VN', name: 'Vietnam', icon: '🇻🇳' },
  { code: 'MY', name: 'Malaysia', icon: '🇲🇾' },
  { code: 'TH', name: 'Thailand', icon: '🇹🇭' },
  { code: 'US', name: 'USA', icon: '🇺🇸' },
  { code: 'KR', name: 'Korea', icon: '🇰🇷' },
];

export default function AIGeneratorPage() {
  const router = useRouter();
  const { t: ui } = useTranslation(defaultUI);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPatternIndex, setSelectedPatternIndex] = useState<number | null>(null);
  const [targetCountry, setTargetCountry] = useState('VN');
  const [contentType, setContentType] = useState<'live_script' | 'short_video'>('live_script');
  
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('id, sku, name, size, features, pattern_images');
      if (data) {
        const parsedData = data.map((p: any) => ({
            ...p,
            pattern_images: Array.isArray(p.pattern_images) ? p.pattern_images : (typeof p.pattern_images === 'string' ? JSON.parse(p.pattern_images) : [])
        }));
        setProducts(parsedData);
      }
      setLoadingProducts(false);
    };
    fetchProducts();
  }, [supabase]);

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setGenerating(true);
    setResult('');

    try {
      const patternName = selectedPatternIndex !== null ? `Pattern #${selectedPatternIndex + 1}` : undefined;

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.name.CN || selectedProduct.sku,
          features: selectedProduct.features.CN,
          size: selectedProduct.size.CN,
          patternName,
          targetCountry,
          contentType
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] flex flex-col md:flex-row font-sans text-brand-coffee">
      {/* 左侧：配置区 */}
      <div className="w-full md:w-1/3 bg-white border-r border-stone-100 p-8 overflow-y-auto h-screen sticky top-0 shadow-soft z-10">
        <div className="flex items-center gap-2 mb-10 text-stone-400 hover:text-brand-coffee cursor-pointer transition-colors group" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm tracking-wide uppercase">{ui.btn_back}</span>
        </div>

        <h1 className="text-3xl font-serif font-bold italic text-brand-coffee mb-8 flex items-center gap-3">
          <div className="bg-brand-apricot p-2 rounded-xl">
             <Wand2 className="w-6 h-6 text-brand-warm" />
          </div>
          {ui.header_title}
        </h1>

        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{ui.label_select_product}</label>
            {loadingProducts ? (
              <div className="text-sm text-stone-400 italic flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> {ui.loading_products}</div>
            ) : (
              <select 
                className="w-full border border-stone-200 bg-stone-50 rounded-xl p-4 focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all font-medium"
                onChange={(e) => {
                    const pid = parseInt(e.target.value);
                    setSelectedProduct(products.find(p => p.id === pid) || null);
                    setSelectedPatternIndex(null);
                }}
                value={selectedProduct?.id || ''}
              >
                <option value="">{ui.placeholder_select}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.sku} - {p.name.CN?.slice(0, 20)}...</option>
                ))}
              </select>
            )}
          </div>

          {selectedProduct && selectedProduct.pattern_images?.length > 0 && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{ui.label_select_pattern}</label>
              <div className="grid grid-cols-4 gap-3">
                {selectedProduct.pattern_images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedPatternIndex(idx === selectedPatternIndex ? null : idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${idx === selectedPatternIndex ? 'border-brand-coffee ring-4 ring-brand-apricot/50 scale-105' : 'border-transparent hover:border-stone-200'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                    {idx === selectedPatternIndex && (
                      <div className="absolute inset-0 bg-brand-coffee/40 flex items-center justify-center backdrop-blur-[1px]">
                        <Check className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{ui.label_target_market}</label>
            <div className="grid grid-cols-2 gap-3">
              {COUNTRIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setTargetCountry(c.code)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all duration-300 ${targetCountry === c.code ? 'bg-brand-coffee text-white shadow-lg border-brand-coffee' : 'border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-700'}`}
                >
                  <span className="text-lg">{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{ui.label_content_type}</label>
            <div className="flex bg-stone-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setContentType('live_script')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${contentType === 'live_script' ? 'bg-white shadow-md text-brand-coffee' : 'text-stone-400 hover:text-stone-600'}`}
              >
                {ui.type_live_script}
              </button>
              <button 
                onClick={() => setContentType('short_video')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${contentType === 'short_video' ? 'bg-white shadow-md text-brand-coffee' : 'text-stone-400 hover:text-stone-600'}`}
              >
                {ui.type_short_video}
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedProduct || generating}
            className="w-full bg-brand-coffee hover:bg-stone-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 mt-4 hover:-translate-y-0.5 active:translate-y-0"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {ui.btn_generating}
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                {ui.btn_generate}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 右侧：结果展示区 */}
      <div className="w-full md:w-2/3 p-8 md:p-16 bg-[#fcfbf9] min-h-screen flex flex-col">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-serif font-bold text-brand-coffee italic">{ui.result_title}</h2>
            {result && (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-brand-coffee transition-colors bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm hover:shadow-md"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? ui.btn_copied : ui.btn_copy}
              </button>
            )}
          </div>

          <div className="flex-1 bg-white rounded-[2.5rem] shadow-magazine border border-stone-100 p-10 md:p-12 overflow-y-auto min-h-[600px] relative">
            {result ? (
              <div className="prose prose-stone max-w-none whitespace-pre-wrap leading-loose text-lg text-stone-600 font-medium">
                {result}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Wand2 className="w-10 h-10 text-stone-200" />
                </div>
                <h3 className="text-xl font-bold text-stone-400 mb-2">{ui.empty_state_title}</h3>
                <p className="text-center text-sm font-medium leading-relaxed whitespace-pre-wrap opacity-70">
                  {ui.empty_state_desc}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

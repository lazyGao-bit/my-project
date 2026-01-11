'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Wand2, ArrowLeft, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Database } from '../../lib/database.types';

// 类型定义
type Product = {
  id: number;
  sku: string;
  name: { CN: string };
  size: { CN: string };
  features: { CN: string };
  pattern_images: string[];
};

const COUNTRIES = [
  { code: 'CN', name: '中国 (China)', icon: '🇨🇳' },
  { code: 'VN', name: '越南 (Vietnam)', icon: '🇻🇳' },
  { code: 'MY', name: '马来西亚 (Malaysia)', icon: '🇲🇾' },
  { code: 'TH', name: '泰国 (Thailand)', icon: '🇹🇭' },
  { code: 'US', name: '美国 (USA)', icon: '🇺🇸' },
  { code: 'KR', name: '韩国 (Korea)', icon: '🇰🇷' },
];

export default function AIGeneratorPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // 表单状态
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPatternIndex, setSelectedPatternIndex] = useState<number | null>(null);
  const [targetCountry, setTargetCountry] = useState('VN');
  const [contentType, setContentType] = useState<'live_script' | 'short_video'>('live_script');
  
  // 生成状态
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. 加载产品列表
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('id, sku, name, size, features, pattern_images');
      if (data) {
        // 简单处理 pattern_images 可能为字符串的情况
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

  // 2. 处理生成请求
  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setGenerating(true);
    setResult(''); // 清空上次结果

    try {
      // 准备花型名称（这里假设花型图片没有名字，暂用索引代替，实际项目中建议给花型加 name 字段）
      const patternName = selectedPatternIndex !== null ? `花型 #${selectedPatternIndex + 1}` : undefined;

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
      alert('生成失败: ' + error.message);
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* 左侧：配置区 */}
      <div className="w-full md:w-1/3 bg-white border-r border-gray-200 p-6 overflow-y-auto h-screen sticky top-0">
        <div className="flex items-center gap-2 mb-8 text-purple-600 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">返回工作台</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-purple-500" />
          AI 内容生成
        </h1>

        <div className="space-y-6">
          {/* 1. 选择产品 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">选择产品</label>
            {loadingProducts ? (
              <div className="text-sm text-gray-400">加载产品库中...</div>
            ) : (
              <select 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                onChange={(e) => {
                    const pid = parseInt(e.target.value);
                    setSelectedProduct(products.find(p => p.id === pid) || null);
                    setSelectedPatternIndex(null); // 重置花型选择
                }}
                value={selectedProduct?.id || ''}
              >
                <option value="">-- 请选择产品 --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.sku} - {p.name.CN?.slice(0, 20)}...</option>
                ))}
              </select>
            )}
          </div>

          {/* 2. 选择花型 (如果有) */}
          {selectedProduct && selectedProduct.pattern_images?.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">选择重点推荐花型 (可选)</label>
              <div className="grid grid-cols-4 gap-2">
                {selectedProduct.pattern_images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedPatternIndex(idx === selectedPatternIndex ? null : idx)}
                    className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${idx === selectedPatternIndex ? 'border-purple-600 ring-2 ring-purple-100' : 'border-transparent hover:border-gray-300'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                    {idx === selectedPatternIndex && (
                      <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 选择国家 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">目标市场/语言</label>
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setTargetCountry(c.code)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${targetCountry === c.code ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <span>{c.icon}</span>
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 4. 内容类型 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">内容类型</label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setContentType('live_script')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${contentType === 'live_script' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                直播带货脚本
              </button>
              <button 
                onClick={() => setContentType('short_video')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${contentType === 'short_video' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                短视频文案
              </button>
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={!selectedProduct || generating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                正在思考中...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                立即生成内容
              </>
            )}
          </button>
        </div>
      </div>

      {/* 右侧：结果展示区 */}
      <div className="w-full md:w-2/3 p-8 md:p-12 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">生成结果</h2>
            {result && (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制全文'}
              </button>
            )}
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 overflow-y-auto min-h-[500px] relative">
            {result ? (
              <div className="prose prose-purple max-w-none whitespace-pre-wrap leading-relaxed text-gray-700">
                {result}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Wand2 className="w-8 h-8 text-gray-300" />
                </div>
                <p>请在左侧选择产品并配置参数，<br/>AI 将为您生成专属营销内容。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Sun, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fcfbf9]/95 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        {/* 背景暖色光晕 */}
        <div className="absolute w-32 h-32 bg-orange-100/60 rounded-full blur-2xl animate-pulse"></div>
        
        {/* 核心图标：缓慢旋转的太阳 */}
        <div className="relative z-10 p-4 bg-white/50 rounded-full shadow-sm border border-white/60">
          <Sun 
            className="w-12 h-12 text-[#e6cbb3] animate-[spin_8s_linear_infinite]" 
            strokeWidth={1.5} 
          />
        </div>
        
        {/* 装饰元素：跳动的星星 */}
        <Sparkles 
          className="absolute -top-1 -right-2 w-6 h-6 text-[#d4bca5] animate-bounce" 
          style={{ animationDuration: '2s' }}
          strokeWidth={1.5}
        />
      </div>
      
      {/* 文字提示 */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-lg font-serif italic text-[#5c524d] tracking-widest animate-pulse">
          Weaving Language...
        </p>
        
        {/* 模拟进度的跳动点 */}
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#e6cbb3] animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#d4bca5] animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#9e8a78] animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

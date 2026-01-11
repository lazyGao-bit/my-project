'use client';

import { motion } from 'framer-motion';
import { Globe, Sparkles } from 'lucide-react';

export default function TranslationLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fcfbf9]/80 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* 中心地球图标 */}
          <div className="w-16 h-16 bg-brand-coffee text-[#fcfbf9] rounded-full flex items-center justify-center shadow-lg relative z-10">
            <Globe className="w-8 h-8 animate-pulse" />
          </div>
          
          {/* 环绕的星球/光点动画 */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 -m-2 rounded-full border-2 border-dashed border-brand-warm/30 w-20 h-20"
          />
          
          {/* 漂浮的星星 */}
          <motion.div
            animate={{ y: [-5, 5, -5], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-4 -right-4 text-brand-600"
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl font-serif font-bold text-brand-coffee">Translating...</h3>
          <p className="text-sm text-stone-500 font-medium tracking-wide">正在为您编织语言</p>
        </div>
      </div>
    </motion.div>
  );
}

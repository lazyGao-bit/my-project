'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import Link from 'next/link';
import type { Database } from '../../lib/database.types';

export default function HeroProductBg() {
  const [products, setProducts] = useState<{ sku: string; main_image: string }[]>([]);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProducts = async () => {
      // 随机获取有图片的产品，限制数量
      const { data } = await supabase
        .from('products')
        .select('sku, main_image')
        .not('main_image', 'is', null)
        .limit(18); // 获取多一点以填充屏幕
      
      if (data) {
        setProducts(data as any);
      }
    };
    fetchProducts();
  }, [supabase]);

  // 将产品分成3列显示
  const columns = [
    products.slice(0, 6),
    products.slice(6, 12),
    products.slice(12, 18),
  ];

  if (products.length === 0) return null;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden select-none h-full">
      {/* 氛围遮罩层：核心修改点 */}
      {/* 使用 #fcfbf9 (品牌奶油色) 进行渐变遮罩，确保文字可读性 */}
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#fcfbf9]/95 via-[#fcfbf9]/70 to-[#fcfbf9] pointer-events-none"></div>
      
      {/* 动态产品瀑布流 */}
      <div className="grid grid-cols-3 gap-4 md:gap-8 h-[150%] -mt-20 px-2 md:px-20 opacity-50">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-6 md:gap-8 w-full">
            {col.map((product, idx) => (
              <motion.div
                key={`${product.sku}-${idx}`}
                initial={{ y: 0 }}
                animate={{ 
                  y: colIndex % 2 === 0 ? [-20, -100] : [-100, -20] // 奇偶列反向移动，制造视差
                }} 
                transition={{ 
                  duration: 25 + idx * 3, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  ease: "linear" 
                }}
                className="relative aspect-[3/4] w-full rounded-2xl md:rounded-[2rem] overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 z-10"
              >
                <Link href="/products" className="block w-full h-full relative">
                    {product.main_image && (
                        <Image
                          src={product.main_image}
                          alt={product.sku}
                          fill
                          className="object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out"
                          sizes="(max-width: 768px) 33vw, 20vw"
                        />
                    )}
                    {/* 悬停时的点击提示遮罩 */}
                    <div className="absolute inset-0 bg-[#443d3a]/0 group-hover:bg-[#443d3a]/5 transition-colors duration-300 flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-bold tracking-widest text-sm transition-opacity bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/30">View</span>
                    </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

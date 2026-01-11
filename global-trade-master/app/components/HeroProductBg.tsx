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
      // 随机获取一些有图片的产品
      const { data } = await supabase
        .from('products')
        .select('sku, main_image')
        .not('main_image', 'is', null)
        .limit(12);
      
      if (data) {
        setProducts(data as any);
      }
    };
    fetchProducts();
  }, [supabase]);

  // 将产品分成3列显示
  const columns = [
    products.slice(0, 4),
    products.slice(4, 8),
    products.slice(8, 12),
  ];

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* 阳光与窗帘的氛围层 - 覆盖在图片之上，制造朦胧感 */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#fcfbf9]/80 via-[#fcfbf9]/60 to-[#fcfbf9] backdrop-blur-[2px]"></div>
      
      {/* 暖色光晕 */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-100/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 z-0"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-50/40 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 z-0"></div>

      {/* 动态产品瀑布流 */}
      <div className="flex justify-between gap-8 h-[120%] -mt-10 px-4 md:px-20 opacity-40 grayscale-[20%] hover:grayscale-0 transition-all duration-1000">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-8 w-1/3">
            {col.map((product, idx) => (
              <motion.div
                key={product.sku}
                initial={{ y: 0 }}
                animate={{ y: colIndex % 2 === 0 ? -100 : 0 }} // 简单的视差位移
                transition={{ 
                  duration: 20 + idx * 5, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  ease: "linear" 
                }}
                className="relative aspect-[3/4] w-full rounded-[2rem] overflow-hidden pointer-events-auto cursor-pointer group"
              >
                <Link href="/products" className="block w-full h-full">
                    {product.main_image && (
                        <Image
                        src={product.main_image}
                        alt={product.sku}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 33vw, 20vw"
                        />
                    )}
                    {/* 悬停时的遮罩 */}
                    <div className="absolute inset-0 bg-[#443d3a]/0 group-hover:bg-[#443d3a]/10 transition-colors duration-300"></div>
                </Link>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

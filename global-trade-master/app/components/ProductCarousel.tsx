'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { Database } from '../../lib/database.types';

// Fisher-Yates (aka Knuth) Shuffle an array in-place.
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default function ProductCarousel() {
  const [products, setProducts] = useState<{ sku: string; main_image: string | null }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. 获取数据并洗牌
  useEffect(() => {
    const fetchAndShuffleProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('sku, main_image')
        .not('main_image', 'is', null)
        .limit(10);
      
      if (data) {
        setProducts(shuffle(data as any));
      }
    };
    fetchAndShuffleProducts();
  }, [supabase]);

  // 2. 自动轮播定时器
  useEffect(() => {
    // 如果没有产品或用户正在悬停，则清除定时器
    if (products.length === 0 || isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // 设置新的定时器
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % products.length);
    }, 4000); // 4秒间隔

    // 组件卸载时清除定时器
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [products, isHovered]); // 当产品数据或悬停状态变化时，重新评估定时器

  if (products.length === 0) {
    // 在数据加载完成前，显示一个优雅的占位符
    return <div className="aspect-[4/5] bg-[#f9f7f0] rounded-[3rem] animate-pulse"></div>;
  }

  const currentProduct = products[currentIndex];

  return (
    <Link 
      href="/products" 
      className="block flex-1 w-full relative group perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[4/5] bg-[#fcfbf9] rounded-[3rem] shadow-inner overflow-hidden relative transform group-hover:rotate-y-6 transition-transform duration-700 border border-stone-100">
        <AnimatePresence>
          {currentProduct.main_image && (
            <motion.div
              key={currentProduct.sku}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={currentProduct.main_image}
                alt={currentProduct.sku}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 33vw"
                priority={true} // 确保第一张图优先加载
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 悬浮标签 */}
        <div className="absolute -bottom-10 -right-6 bg-white/80 backdrop-blur-md p-10 rounded-[2.5rem] shadow-magazine border border-white animate-bounce-slow">
           <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-2">New Arrivals</span>
           <span className="text-2xl font-serif font-bold text-[#443d3a] italic">2024 Collection</span>
        </div>
      </div>
    </Link>
  );
}

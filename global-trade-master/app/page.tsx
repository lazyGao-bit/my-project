
import { Globe, Users, TrendingUp, ShoppingBag, ArrowRight, Sun, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from 'next/headers';
import LanguageSwitcher from "./components/LanguageSwitcher";
import HeroProductBg from "./components/HeroProductBg"; 
import ProductCarousel from "./components/ProductCarousel";

const pageContent = {
  nav: {
    login: "主播/管理员登录",
  },
  hero: {
    title: "织造温暖，连接全球",
    description: "在 YYT，我们用匠心织造每一寸纤维。结合前沿 AI 与本土温度，我们致力于将极致舒适的家纺艺术，温柔地送达东南亚的每一个家庭。",
    cta_join: "开启旅程 (主播入驻)",
    cta_story: "我们的故事",
  },
  stats: {
    items: [
      { id: 1, name: '覆盖国家', value: '4+', icon: 'Globe' },
      { id: 2, name: '签约主播', value: '500+', icon: 'Users' },
      { id: 3, name: '月GMV增长', value: '120%', icon: 'TrendingUp' },
      { id: 4, name: '合作品牌', value: '1000+', icon: 'ShoppingBag' },
    ]
  },
  story: {
    subtitle: "Brand Heritage",
    title: "YYT 的进击之路",
    items: [
      { year: '2011', title: '匠心起源', desc: 'YYT 的故事始于“丝绸之府”浙江湖州。我们深耕蚊帐产品的线下外贸出口，迈出了从0到1的第一步。' },
      { year: '2013', title: '电商转型', desc: '在淘宝上架首款产品，收获来自大学生的第一笔订单，坚定了我们直接服务消费者的决心。' },
      { year: '2016', title: '走向世界', desc: '组建国际贸易团队，足迹远至非洲与东南亚，在 B2B 市场占据一席之地。' },
      { year: '2019', title: '深耕本土', desc: '年销售额突破3亿元，跻身湖州电商企业 TOP3，成为行业领领军力量。' },
      { year: '2020', title: '全域爆发', desc: '建立多地区生产基地，构建多品牌矩阵，全面覆盖国内主流电商平台。' },
      { year: '2024', title: '全球零售新篇章', desc: '依托 TikTok、Shopee 等国际平台，深入东南亚及日韩市场，直接对话全球消费者。' },
    ],
    vision_title: "未来愿景",
    vision_desc: "从一顶蚊帐到全品类家纺，YYT 始终致力于成为家纺行业的领军者。我们将继续秉持“创新、成长、拼搏、为善”的价值观，为全球家庭创造更健康、更舒适的生活方式。"
  },
  product: {
    title: "极致选品，悦己生活",
    description: "我们严选每一缕原棉，精控每一道织物工艺。在这里，您可以翻阅电子手册，寻找那份专属的触感；或是利用 AI，深度解读每一款产品的温柔底色。",
    cta: "浏览产品库 (Guest)"
  },
  footer: {
    rights: "YYT Global Trade. All rights reserved."
  }
};

async function translateText(text: string, targetLang: string) {
  const apiUrl = 'https://translator-api.gaojiaxin431.workers.dev';
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  const sourceLang = isChinese ? 'zh' : 'en';
  if (sourceLang === targetLang) return text;
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source_lang: sourceLang, target_lang: targetLang }),
      cache: 'force-cache' 
    });
    const data = await response.json();
    return data.translated_text || text;
  } catch (error) { return text; }
}

async function translateObject<T extends Record<string, any>>(obj: T, lang: string): Promise<T> {
  if (!obj) return obj;
  const translatedObj = { ...obj };
  for (const key in translatedObj) {
    const value = translatedObj[key];
    if (typeof value === 'string') {
      if (/[\u4e00-\u9fa5]/.test(value) || value.length > 3) { 
         translatedObj[key] = await translateText(value, lang) as T[Extract<keyof T, string>];
      }
    } else if (Array.isArray(value)) {
      translatedObj[key] = await Promise.all(
        value.map(item => (typeof item === 'object' ? translateObject(item, lang) : item))
      ) as T[Extract<keyof T, string>];
    } else if (typeof value === 'object' && value !== null) {
      translatedObj[key] = await translateObject(value, lang);
    }
  }
  return translatedObj;
}

interface HomePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Home({ searchParams }: HomePageProps) {
  const cookieStore = cookies();
  const cookieLang = cookieStore.get('NEXT_LOCALE')?.value;
  const lang = (typeof searchParams.lang === 'string' ? searchParams.lang : cookieLang) || 'zh';
  
  let content = pageContent;
  if (lang !== 'zh') { content = await translateObject(pageContent, lang); }

  const iconMap: { [key: string]: any } = { Globe, Users, TrendingUp, ShoppingBag };

  return (
    <div className="bg-[#fcfbf9] text-[#443d3a] selection:bg-[#fdf3e7] selection:text-[#9e8a78] font-sans overflow-x-hidden">
      
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcfbf9]/80 backdrop-blur-xl border-b border-stone-100/50 transition-all duration-300">
        <nav className="flex items-center justify-between p-6 lg:px-12 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-[#443d3a] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="font-serif font-bold text-[#fcfbf9] text-xl">Y</span>
            </div>
            <span className="text-xl font-bold tracking-widest uppercase hidden sm:block font-serif">YYT Global</span>
          </div>
          <div className="flex items-center gap-8">
            <LanguageSwitcher />
            <Link href="/login" className="text-sm font-bold tracking-wide text-white bg-[#443d3a] px-8 py-3 rounded-full hover:bg-stone-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              {content.nav.login}
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* 1. Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
          <HeroProductBg />
          <div className="max-w-5xl mx-auto text-center space-y-12 relative z-30 pointer-events-none"> 
            <div className="inline-flex items-center gap-2 bg-white/70 border border-stone-200/60 px-5 py-2 rounded-full text-stone-500 text-xs font-bold uppercase tracking-widest animate-fade-in shadow-sm backdrop-blur-md pointer-events-auto">
              <Sun className="w-3 h-3 text-orange-400" />
              Born for Comfort
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-[#443d3a] leading-[1.15] animate-slide-up font-serif drop-shadow-sm pointer-events-auto">
               {content.hero.title}
            </h1>
            <p className="mt-8 text-xl md:text-2xl text-stone-600 max-w-3xl mx-auto leading-relaxed font-medium opacity-95 animate-slide-up bg-[#fcfbf9]/40 backdrop-blur-md p-6 rounded-2xl shadow-soft pointer-events-auto" style={{ animationDelay: '0.2s' }}>
              {content.hero.description}
            </p>
            <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up pointer-events-auto" style={{ animationDelay: '0.4s' }}>
              <Link href="/login" className="w-full sm:w-auto rounded-full bg-[#443d3a] px-12 py-5 text-sm font-bold text-white shadow-2xl hover:bg-stone-800 hover:scale-105 transition-all duration-500 uppercase tracking-widest">
                {content.hero.cta_join}
              </Link>
              <a href="#story" className="text-sm font-bold text-stone-600 hover:text-[#443d3a] flex items-center gap-2 group transition-colors px-6 py-4 bg-white/40 rounded-full backdrop-blur-sm border border-white/20">
                {content.hero.cta_story} 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </section>

        {/* 2. Stats Section */}
        <section className="py-32 bg-white/60 backdrop-blur-sm border-y border-stone-100/50 relative z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {content.stats.items.map((stat) => {
                const Icon = iconMap[stat.icon];
                return (
                  <div key={stat.id} className="flex flex-col items-center gap-6 p-10 rounded-[3rem] bg-white/80 border border-white shadow-magazine hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                    <div className="p-5 bg-[#fffcf7] rounded-full group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                       {Icon && <Icon className="w-7 h-7 text-[#9e8a78]" />}
                    </div>
                    <div className="text-center">
                      <dd className="text-5xl font-bold tracking-tighter text-[#443d3a] mb-3 font-serif">{stat.value}</dd>
                      <dt className="text-xs font-bold text-stone-400 uppercase tracking-widest">{stat.name}</dt>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Heritage Section */}
        <section id="story" className="py-40 relative overflow-hidden bg-[#fcfbf9]">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-[#fdf3e7]/30 to-transparent rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-24 items-start">
              <div className="lg:w-1/3 sticky top-32">
                <span className="text-[#9e8a78] font-bold tracking-[0.3em] uppercase text-xs border-b border-[#9e8a78] pb-2">{content.story.subtitle}</span>
                <h2 className="mt-8 text-5xl md:text-6xl font-bold leading-tight text-[#443d3a] font-serif italic">
                  {content.story.title}
                </h2>
              </div>
              <div className="lg:w-2/3 space-y-20">
                {content.story.items.map((item, index) => (
                  <div key={index} className="flex gap-12 group">
                    <span className="text-4xl font-bold text-stone-200 group-hover:text-[#443d3a] transition-colors duration-700 font-serif pt-2">{item.year}</span>
                    <div className="space-y-4 pb-12 border-b border-stone-200/50 flex-1 group-last:border-0 relative">
                      <div className="absolute -left-[53px] top-5 w-3 h-3 bg-stone-200 rounded-full group-hover:bg-[#443d3a] transition-colors duration-500"></div>
                      <h3 className="text-2xl font-bold text-[#443d3a] group-hover:translate-x-2 transition-transform duration-500">{item.title}</h3>
                      <p className="text-lg text-stone-500 leading-relaxed max-w-xl font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-12 group">
                  <span className="text-4xl font-bold text-stone-200 group-hover:text-[#443d3a] transition-colors duration-700 font-serif pt-2">Future</span>
                  <div className="space-y-4 relative">
                     <div className="absolute -left-[53px] top-5 w-3 h-3 bg-stone-200 rounded-full group-hover:bg-[#443d3a] transition-colors duration-500"></div>
                     <h3 className="text-2xl font-bold text-[#443d3a] group-hover:translate-x-2 transition-transform duration-500">{content.story.vision_title}</h3>
                     <p className="text-lg text-stone-500 leading-relaxed max-w-xl font-medium">{content.story.vision_desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Product Gallery */}
        <section className="py-40 bg-[#f5f3ef]">
           <div className="max-w-screen-2xl mx-auto px-6">
             <div className="bg-white rounded-[4rem] p-12 md:p-24 shadow-magazine flex flex-col lg:flex-row items-center gap-20 relative overflow-hidden">
               <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#fdf3e7] rounded-full blur-[120px] opacity-70"></div>
               <div className="flex-1 space-y-12 relative z-10">
                 <div className="w-14 h-14 bg-[#fffcf7] rounded-full flex items-center justify-center shadow-soft border border-stone-50">
                    <Heart className="w-6 h-6 text-[#e1c4a9]" fill="currentColor" />
                 </div>
                 <h2 className="text-5xl md:text-6xl font-bold text-[#443d3a] font-serif leading-tight">{content.product.title}</h2>
                 <p className="text-xl text-stone-500 leading-relaxed opacity-80 font-medium max-w-lg">
                   {content.product.description}
                 </p>
                 <Link 
                   href="/products" 
                   className="inline-flex items-center text-lg font-bold text-[#443d3a] border-b-2 border-stone-200 hover:border-[#443d3a] pb-2 transition-all duration-500 group"
                 >
                   {content.product.cta} 
                   <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-3 transition-transform" />
                 </Link>
               </div>
               
               <div className="flex-1 w-full">
                  <ProductCarousel />
               </div>
             </div>
           </div>
        </section>
      </main>

      <footer className="py-24 border-t border-stone-200/50 text-center bg-[#fcfbf9]">
        <div className="max-w-md mx-auto space-y-8">
           <div className="text-3xl font-serif italic text-[#443d3a] tracking-wide">YYT Global</div>
           <p className="text-sm font-bold tracking-widest text-stone-400 uppercase">© 2026 {content.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}

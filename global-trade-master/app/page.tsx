
import { Globe, Users, TrendingUp, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "./components/LanguageSwitcher";

export default function Home() {
  return (
    <div className="bg-black text-white selection:bg-purple-500 selection:text-white">
      {/* 导航栏 */}
      <header className="fixed inset-x-0 top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <nav className="flex items-center justify-between p-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex lg:flex-1 items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">Y</span>
            </div>
            <span className="text-xl font-bold tracking-tighter">YYT GLOBAL</span>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <Link href="/login" className="text-sm font-semibold leading-6 text-white bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition">
              主播/管理员登录 <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* 1. 沉浸式首屏 (Hero) */}
        <div className="relative isolate px-6 pt-14 lg:px-8 h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 -z-10">
             <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black"></div>
             {/* 这里的背景图建议后续替换为真实的直播间照片 */}
          </div>
          
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              连接全球，重塑直播电商
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
              YYT 致力于通过 AI 技术与本土化运营，为东南亚市场带来前所未有的购物体验。我们不仅仅是在销售商品，更是在传递一种未来的生活方式。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/login" className="rounded-full bg-purple-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-all">
                加入我们 (主播入驻)
              </Link>
              <a href="#story" className="text-sm font-semibold leading-6 text-white hover:text-purple-300 transition">
                了解品牌故事 <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. 品牌数据规模 */}
        <div className="py-24 sm:py-32 bg-zinc-900/50 border-y border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
              {[
                { id: 1, name: '覆盖国家', value: '4+', icon: Globe },
                { id: 2, name: '签约主播', value: '500+', icon: Users },
                { id: 3, name: '月GMV增长', value: '120%', icon: TrendingUp },
                { id: 4, name: '合作品牌', value: '1000+', icon: ShoppingBag },
              ].map((stat) => (
                <div key={stat.id} className="mx-auto flex max-w-xs flex-col gap-y-4">
                  <dt className="text-base leading-7 text-gray-400 flex items-center justify-center gap-2">
                    <stat.icon className="w-5 h-5 text-purple-500" />
                    {stat.name}
                  </dt>
                  <dd className="order-first text-5xl font-bold tracking-tight text-white sm:text-6xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* 3. 品牌故事与发展历程 */}
        <div id="story" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center mb-16">
              <h2 className="text-base font-semibold leading-7 text-purple-400">Our Journey</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                从零到无限的进击之路
              </p>
            </div>
            
            <div className="relative border-l border-gray-700 ml-4 md:ml-0 space-y-12">
              {[
                { year: '2020', title: '梦想启航', desc: 'YYT 成立于杭州，确立了“出海东南亚”的核心战略。' },
                { year: '2021', title: '深耕越南', desc: '在胡志明市建立首个海外直播基地，签约首批 50 名本土主播。' },
                { year: '2022', title: '技术赋能', desc: '自主研发 AI 选品系统，直播间转化率提升 200%。' },
                { year: '2023', title: '全域爆发', desc: '拓展至泰国、马来、菲律宾，成为 TikTok Shop 头部服务商。' },
                { year: '2024', title: 'AI 时代', desc: '全面引入 LLM 大模型，实现直播脚本、短视频文案的自动化生成。' },
              ].map((item, index) => (
                <div key={index} className="relative pl-8 md:pl-12 group">
                  <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-purple-600 border border-black group-hover:scale-150 transition-all duration-300"></div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                    <span className="text-2xl font-bold text-purple-500">{item.year}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{item.title}</h3>
                      <p className="mt-2 text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. 产品展示 (电子手册入口) */}
        <section className="py-24 bg-zinc-900">
           <div className="mx-auto max-w-7xl px-6 lg:px-8">
             <div className="flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="flex-1">
                 <h2 className="text-3xl font-bold mb-6">极致选品，严控质量</h2>
                 <p className="text-gray-400 mb-8 text-lg">
                   我们为每一款产品都建立了详尽的数字档案。作为游客，您可以自由浏览我们的产品电子手册；作为主播，您可以获得 AI 辅助的深度卖点解析。
                 </p>
                 <button className="text-purple-400 hover:text-purple-300 flex items-center font-bold">
                   浏览产品库 (Guest) <ArrowRight className="ml-2 w-5 h-5" />
                 </button>
               </div>
               <div className="flex-1 relative h-64 w-full bg-gradient-to-tr from-purple-800 to-indigo-900 rounded-2xl flex items-center justify-center">
                 <span className="text-white/20 font-bold text-4xl">Product Showcase</span>
               </div>
             </div>
           </div>
        </section>
      </main>

      <footer className="bg-black py-12 border-t border-white/10 text-center text-gray-500">
        <p>© {new Date().getFullYear()} YYT Global Trade. All rights reserved.</p>
      </footer>
    </div>
  );
}

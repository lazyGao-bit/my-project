'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Database } from '../../lib/database.types';
import { 
  Video, CalendarDays, MessageSquare, Mail, ShieldAlert, BookOpen, LogOut, Sparkles
} from 'lucide-react';
import { useTranslation } from '../../lib/useTranslation';

// --- 全量静态文案定义 (默认中文) ---
const defaultContent = {
  nav: {
    title: "YYT 工作台",
    role_creator: "主播",
    role_admin: "管理员",
    country_global: "全球",
    btn_logout: "退出"
  },
  header: {
    badge: "Live Dashboard", // 英文通常保留作为装饰
    welcome: "欢迎回来",
    ready: "准备好开始今天的直播了吗？",
    admin_mode: "管理员模式"
  },
  modules: {
    ai: {
      title: "AI 内容生成",
      desc: "利用 LLM 生成短视频文案、直播脚本和多维度产品介绍。"
    },
    schedule: {
      title: "直播排班表",
      desc: "查看您的排班时间。管理员可在此进行排班管理。"
    },
    guide: {
      title: "直播指导手册",
      desc: "查看最新的规章制度、活动通知和操作流程。"
    },
    feedback: {
      title: "意见反馈区",
      desc: "提交直播问题、样品申请或建议。查看公示回复。"
    },
    admin_portal: {
      title: "高级管理后台",
      desc: "进入超级管理员界面，管理全站数据。"
    }
  }
};

type UserProfile = Database['public']['Tables']['profiles']['Row'];

export default function DashboardPage() {
  const router = useRouter();
  // 使用 useTranslation Hook 获取翻译后的内容
  const { t, loading: transLoading } = useTranslation(defaultContent);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-coffee"></div>
    </div>
  );

  const isAdmin = profile?.role === 'admin' || profile?.email === 'gaojiaxin431@gmail.com' || profile?.email === '1771048910@qq.com';
  
  return (
    <div className="min-h-screen bg-[#fcfbf9] text-brand-coffee selection:bg-brand-apricot">
      {/* 顶部导航 */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-brand-coffee w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg">
             <span className="font-serif font-bold text-lg italic">Y</span>
          </div>
          <span className="font-bold tracking-widest text-brand-coffee uppercase text-sm">{t.nav.title}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
             <div className="text-sm font-bold text-brand-coffee">{profile?.username || profile?.email}</div>
             <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
               {profile?.role === 'admin' ? t.nav.role_admin : t.nav.role_creator} | {profile?.country || t.nav.country_global}
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-accent-500 hover:text-accent-600 bg-rose-50 px-5 py-2.5 rounded-full transition-all border border-rose-100 shadow-sm">
            <LogOut size={14} /> {t.nav.btn_logout}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-brand-apricot text-brand-warm text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-sm border border-brand-creamy">
               <Sparkles size={12} className="animate-pulse" /> {t.header.badge}
            </div>
            <h1 className="text-5xl font-serif font-bold text-brand-coffee tracking-tight">
              {t.header.welcome}, {profile?.username || 'User'}
            </h1>
            <p className="text-stone-400 font-medium italic text-lg">{t.header.ready}</p>
          </div>
          {isAdmin && (
             <div className="bg-brand-coffee text-[#fcfbf9] text-[10px] font-bold px-5 py-2 rounded-full shadow-2xl animate-pulse tracking-widest uppercase flex items-center gap-2">
                <ShieldAlert size={12} /> {t.header.admin_mode}
             </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <ModuleCard icon={Video} title={t.modules.ai.title} desc={t.modules.ai.desc} color="bg-blue-50" iconColor="text-blue-400" onClick={() => router.push('/ai-tools')} />
          <ModuleCard icon={CalendarDays} title={t.modules.schedule.title} desc={t.modules.schedule.desc} color="bg-green-50" iconColor="text-green-400" onClick={() => router.push('/schedule')} />
          <ModuleCard icon={BookOpen} title={t.modules.guide.title} desc={t.modules.guide.desc} color="bg-purple-50" iconColor="text-purple-400" onClick={() => router.push('/guide')} />
          <ModuleCard icon={MessageSquare} title={t.modules.feedback.title} desc={t.modules.feedback.desc} color="bg-orange-50" iconColor="text-orange-400" onClick={() => router.push('/feedback')} />

          {isAdmin && (
            <div className="bg-brand-coffee p-10 rounded-[2.5rem] shadow-2xl hover:shadow-glow hover:-translate-y-1 transition-all cursor-pointer group flex flex-col items-start border border-brand-warm" onClick={() => router.push('/admin')}>
              <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform border border-white/20 shadow-inner">
                <ShieldAlert className="w-8 h-8 text-brand-creamy" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-serif italic">{t.modules.admin_portal.title}</h3>
              <p className="text-sm text-stone-300 leading-relaxed font-medium opacity-80">{t.modules.admin_portal.desc}</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function ModuleCard({ icon: Icon, title, desc, color, iconColor, onClick }: any) {
    return (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-magazine border border-stone-100 hover:shadow-2xl hover:border-brand-creamy hover:-translate-y-1 transition-all cursor-pointer group flex flex-col items-start" onClick={onClick}>
            <div className={`w-16 h-16 ${color} rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner`}>
              <Icon className={`w-8 h-8 ${iconColor}`} />
            </div>
            <h3 className="text-2xl font-bold text-brand-coffee mb-4 font-serif italic group-hover:translate-x-1 transition-transform">{title}</h3>
            <p className="text-sm text-stone-400 leading-relaxed font-medium">{desc}</p>
        </div>
    );
}

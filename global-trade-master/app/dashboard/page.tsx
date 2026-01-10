'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Database } from '../../lib/database.types';
import { 
  LayoutDashboard, 
  Video, 
  CalendarDays, 
  MessageSquare, 
  Mail, 
  Users,
  ShieldAlert
} from 'lucide-react';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 从 profiles 表获取用户详情和角色
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>;

  // 简单的管理员判断逻辑 (实际生产中应完全依赖 profile.role)
  const isAdmin = profile?.role === 'admin' || profile?.email === 'gaojiaxin431@gmail.com' || profile?.email === '1771048910@qq.com';
  
  const navigateTo = (path: string) => {
    alert(`即将跳转到功能模块: ${path} \n(该模块将在下一阶段开发)`);
    // router.push(path); 
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 w-8 h-8 rounded flex items-center justify-center text-white font-bold">Y</div>
          <span className="font-bold text-gray-800">YYT 工作台</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
             <div className="text-sm font-bold text-gray-900">{profile?.username || profile?.email}</div>
             <div className="text-xs text-gray-500 capitalize">{profile?.role || 'Creator'} | {profile?.country || 'Global'}</div>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition">退出</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? '管理员控制中心' : '主播工作台'}
            </h1>
            <p className="text-gray-500 mt-2">欢迎回来，准备好开始今天的直播了吗？</p>
          </div>
          {isAdmin && (
             <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-purple-200">Admin Mode</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* --- 核心功能区 --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group" onClick={() => navigateTo('/ai-tools')}>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI 内容生成</h3>
            <p className="text-sm text-gray-500">
              利用 LLM 生成短视频文案、直播脚本和多维度产品介绍。
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group" onClick={() => navigateTo('/schedule')}>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition">
              <CalendarDays className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">直播排班表</h3>
            <p className="text-sm text-gray-500">
              查看您的排班时间。{isAdmin ? '管理员可在此进行排班管理。' : '在此登记增粉数据。'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group" onClick={() => navigateTo('/feedback')}>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">意见反馈区</h3>
            <p className="text-sm text-gray-500">
              提交直播问题、样品申请或建议。查看公示回复。
            </p>
          </div>

          {/* --- 管理员专属区 --- */}
          {isAdmin && (
            <>
              <div className="bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-700 hover:border-zinc-500 transition cursor-pointer group" onClick={() => navigateTo('/admin/users')}>
                <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center mb-4 group-hover:bg-zinc-600 transition">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">主播管理</h3>
                <p className="text-sm text-gray-400">
                  管理主播档案、查看增粉数据报表。
                </p>
              </div>

              <div className="bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-700 hover:border-zinc-500 transition cursor-pointer group" onClick={() => navigateTo('/admin/marketing')}>
                <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center mb-4 group-hover:bg-zinc-600 transition">
                  <Mail className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">邮件营销</h3>
                <p className="text-sm text-gray-400">
                  向特定国家的主播群发问卷调查或通知。
                </p>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Database } from '../../lib/database.types';
import { 
  Users, 
  FileText, 
  Calendar, 
  Mail, 
  ArrowLeft, 
  ShieldCheck, 
  Settings,
  BarChart3
} from 'lucide-react';

// 管理员白名单
const ADMIN_EMAILS = ['gaojiaxin431@gmail.com', 'admin@example.com', '1771048910@qq.com'];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/login');
        return;
      }

      if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
        alert('权限不足：您不是管理员');
        router.push('/dashboard');
        return;
      }

      setUserEmail(user.email);
      setLoading(false);
    };

    checkAdmin();
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigateTo = (path: string) => {
    // router.push(path);
    alert(`功能开发中: ${path}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-500 font-medium">正在验证管理员身份...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-zinc-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-1.5 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">YYT Admin Console</h1>
              <p className="text-xs text-zinc-400">超级管理员控制台</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-300 hidden sm:block">{userEmail}</span>
            <button 
              onClick={handleLogout}
              className="text-sm bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-sm text-gray-500 hover:text-purple-600 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          返回普通用户仪表盘
        </button>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900">系统概览</h2>
          <p className="text-gray-500 mt-1">管理用户、排班、内容分发及系统设置。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div 
            onClick={() => navigateTo('/admin/users')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-100 transition">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-700">主播管理</h3>
            <p className="text-sm text-gray-500">
              审核新注册主播，管理主播档案，查看主播绩效与评级。
            </p>
          </div>

          <div 
            onClick={() => router.push('/schedule')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-700">排班管理中心</h3>
            <p className="text-sm text-gray-500">
              编辑全球各站点直播时间表，分配主播，调整直播场次。
            </p>
          </div>

          {/* 内容发布 - 链接已更新 */}
          <div 
            onClick={() => router.push('/guide')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700">内容发布</h3>
            <p className="text-sm text-gray-500">
              发布新的产品手册、直播规范文档以及平台公告。
            </p>
          </div>

          <div 
            onClick={() => navigateTo('/admin/marketing')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-pink-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-100 transition">
              <Mail className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-pink-700">邮件自动营销</h3>
            <p className="text-sm text-gray-500">
              创建问卷调查，向特定国家主播群发邮件，查看反馈统计。
            </p>
          </div>

          <div 
            onClick={() => navigateTo('/admin/stats')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-100 transition">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-700">全域数据看板</h3>
            <p className="text-sm text-gray-500">
              查看 GMV、增粉数、直播时长等核心指标的实时数据大屏。
            </p>
          </div>

          <div 
            onClick={() => navigateTo('/admin/settings')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-zinc-300 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-700">系统设置</h3>
            <p className="text-sm text-gray-500">
              配置系统参数，管理管理员权限，查看操作日志。
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

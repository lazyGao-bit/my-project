'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Database } from '../../lib/database.types';

// 更新白名单，加入你的邮箱
const ADMIN_EMAILS = ['gaojiaxin431@gmail.com', 'admin@example.com', '1771048910@qq.com'];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

      // 核心安全检查：如果用户邮箱不在白名单中，强制踢回普通仪表盘
      if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
        alert('权限不足：您不是管理员');
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">
        正在验证管理员权限...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full p-8 border border-zinc-700 rounded-lg bg-zinc-800">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-500">管理员控制台</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          >
            退出登录
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-700 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">用户管理</h2>
            <p className="text-gray-300">查看和管理所有注册用户（开发中...）</p>
          </div>
          <div className="bg-zinc-700 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">内容发布</h2>
            <p className="text-gray-300">发布新的直播预告或产品信息（开发中...）</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
            <button 
                onClick={() => router.push('/dashboard')}
                className="text-zinc-400 hover:text-white underline"
            >
                返回普通用户仪表盘
            </button>
        </div>
      </div>
    </div>
  );
}

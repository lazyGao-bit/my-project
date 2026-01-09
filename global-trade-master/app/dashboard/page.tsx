'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Database } from '../../lib/database.types';

// 定义管理员邮箱白名单 (必须与 admin/page.tsx 保持一致，或者提取到公共配置文件中)
const ADMIN_EMAILS = ['gaojiaxin431@gmail.com', 'admin@example.com', '1771048910@qq.com'];

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
      } else {
        const email = user.email || '';
        setUserEmail(email);
        
        // 检查是否为管理员
        if (ADMIN_EMAILS.includes(email)) {
          setIsAdmin(true);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full bg-white shadow-md rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">仪表盘</h1>
        <p className="text-gray-600 mb-6">
          欢迎, <span className="font-semibold">{userEmail || '用户'}</span>!
        </p>
        
        {/* 仅管理员可见的区域 */}
        {isAdmin && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-purple-800 text-sm mb-3">您拥有管理员权限</p>
            <button
              onClick={() => router.push('/admin')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              进入管理员后台
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { Database } from '../../lib/database.types';
import { LoaderCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // 新增: 用户名
  const [country, setCountry] = useState('vietnam'); // 新增: 国家
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSigningUp) {
        // --- 注册逻辑 ---
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;

        if (authData.user) {
          // 注册成功后，将额外信息写入 profiles 表
          const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            email: email,
            username: username,
            country: country,
            role: 'creator' // 默认为主播
          });
          
          if (profileError) {
             console.error("Profile creation failed:", profileError);
             // 注意：实际生产中可能需要处理回滚，或提示用户
          }
        }

        // 假设你已经在 Supabase 关闭了邮件验证，这里直接提示成功
        alert('注册成功！欢迎加入 YYT。');
        setIsSigningUp(false); // 切换回登录模式
      } else {
        // --- 登录逻辑 ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSigningUp ? '申请成为 YYT 主播' : '登录 YYT 工作台'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            全球领先的跨境直播电商平台
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* 基础信息 */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
               <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="you@example.com" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
               <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="••••••••" minLength={6} />
            </div>

            {/* 注册时显示的额外字段 */}
            {isSigningUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主播昵称</label>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="你的直播名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所属国家/地区</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                    <option value="vietnam">越南 (Vietnam)</option>
                    <option value="thailand">泰国 (Thailand)</option>
                    <option value="malaysia">马来西亚 (Malaysia)</option>
                    <option value="philippines">菲律宾 (Philippines)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
              {loading ? <LoaderCircle className="animate-spin" /> : (isSigningUp ? '提交注册申请' : '立即登录')}
            </button>
          </div>

          <div className="flex justify-center">
            <button type="button" onClick={() => { setIsSigningUp(!isSigningUp); setError(null); }} className="text-sm text-purple-600 hover:text-purple-500">
              {isSigningUp ? '已有账号？去登录' : '还没有账号？申请成为主播'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

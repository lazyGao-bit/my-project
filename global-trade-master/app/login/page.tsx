'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { Database } from '../../lib/database.types';
import { LoaderCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); 
  const [country, setCountry] = useState('vietnam'); 
  const [adminCode, setAdminCode] = useState(''); // 新增：管理员验证码
  
  // UI 状态
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
        if (!username.trim()) {
            throw new Error('请输入主播名称');
        }

        // 1. 判断角色
        // 如果验证码匹配，角色为 admin，否则为 creator
        const assignedRole = adminCode.trim() === '20260574' ? 'admin' : 'creator';

        // 2. 调用 Supabase 注册 API
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          // 将元数据也存一份在 Auth 系统中，作为双重保险
          options: {
            data: {
              username: username,
              role: assignedRole,
              country: country
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // 3. 关键修复：使用 upsert 而不是 insert
          // upsert = 如果不存在则插入，如果存在则更新。这能解决数据不同步的问题。
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: email,
            username: username,
            country: country,
            role: assignedRole
          });
          
          if (profileError) {
             console.error("Profile sync failed:", profileError);
             // 即使 profile 表写入失败，Auth 表已经成功了，这算“半成功”
             // 我们记录错误，但不阻断流程，通常 Auth 元数据可以作为备用
          }
        }

        if (assignedRole === 'admin') {
            alert(`注册成功！您已通过验证，身份为：管理员`);
        } else {
            alert('注册成功！身份为：主播');
        }
        
        setIsSigningUp(false); // 切换回登录界面方便用户登录

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
            {isSigningUp ? '申请加入 YYT' : '登录工作台'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSigningUp ? '填写信息注册账号' : '全球领先的跨境直播电商平台'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
          <div className="rounded-md shadow-sm space-y-4">
            
            {/* 1. 邮箱 */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">邮箱账号</label>
               <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="you@example.com" />
            </div>

            {/* 2. 密码 */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">登录密码</label>
               <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="至少 6 位字符" minLength={6} />
            </div>

            {/* 注册时显示的额外字段 */}
            {isSigningUp && (
              <>
                {/* 3. 名称 */}
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <label className="block text-sm font-bold text-purple-900 mb-1">如何称呼您？(名称)</label>
                  <input 
                    type="text" 
                    required 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    className="appearance-none rounded relative block w-full px-3 py-2 border border-purple-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                    placeholder="例如: YYT-Anna / 直播间管理员" 
                  />
                </div>

                {/* 4. 国家 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所属/负责国家</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                    <option value="vietnam">🇻🇳 越南 (Vietnam)</option>
                    <option value="thailand">🇹🇭 泰国 (Thailand)</option>
                    <option value="malaysia">🇲🇾 马来西亚 (Malaysia)</option>
                    <option value="philippines">🇵🇭 菲律宾 (Philippines)</option>
                  </select>
                </div>

                {/* 5. 管理员验证码 (可选) */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> 管理员验证码 (选填)
                  </label>
                  <input 
                    type="text" 
                    value={adminCode} 
                    onChange={e => setAdminCode(e.target.value)} 
                    className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm" 
                    placeholder="只有管理员需要填写" 
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    * 输入正确验证码将自动注册为管理员账号，留空则注册为主播账号。
                  </p>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3 text-center">
              {error}
            </div>
          )}

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all shadow-md hover:shadow-lg">
              {loading ? <LoaderCircle className="animate-spin" /> : (isSigningUp ? '立即注册' : '登 录')}
            </button>
          </div>

          <div className="flex justify-center">
            <button type="button" onClick={() => { setIsSigningUp(!isSigningUp); setError(null); }} className="text-sm text-gray-500 hover:text-purple-600 underline transition-colors">
              {isSigningUp ? '已有账号？返回登录' : '没有账号？点击注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

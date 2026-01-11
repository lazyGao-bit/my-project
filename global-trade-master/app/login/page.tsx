'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { Database } from '../../lib/database.types';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../lib/useTranslation';
import { updateLoginTrace } from '../../lib/logger'; // 引入追踪工具

const defaultContent = {
  // ... (之前的文案保持不变)
  title_login: "登录工作台",
  title_signup: "申请加入 YYT",
  subtitle_login: "全球领先的跨境直播电商平台",
  subtitle_signup: "填写信息注册账号",
  label_email: "邮箱账号",
  label_password: "登录密码",
  placeholder_password: "至少 6 位字符",
  label_name: "如何称呼您？(名称)",
  placeholder_name: "例如: YYT-Anna / 直播间管理员",
  label_country: "所属/负责国家",
  label_admin_code: "管理员验证码 (选填)",
  placeholder_admin_code: "只有管理员需要填写",
  admin_code_tip: "* 输入正确验证码将自动注册为管理员账号，留空则注册为主播账号。",
  btn_login: "登 录",
  btn_signup: "立即注册",
  link_to_signup: "没有账号？点击注册",
  link_to_login: "已有账号？返回登录",
  msg_success_admin: "注册成功！您已通过验证，身份为：管理员",
  msg_success_creator: "注册成功！身份为：主播",
  error_name_required: "请输入主播名称"
};

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation(defaultContent);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); 
  const [country, setCountry] = useState('vietnam'); 
  const [adminCode, setAdminCode] = useState('');
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
        if (!username.trim()) throw new Error(t.error_name_required);
        const assignedRole = adminCode.trim() === '20260574' ? 'admin' : 'creator';
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email, password,
          options: { data: { username, role: assignedRole, country } }
        });
        if (authError) throw authError;
        if (authData.user) {
          await supabase.from('profiles').upsert({
            id: authData.user.id, email, username, country, role: assignedRole
          });
        }
        alert(assignedRole === 'admin' ? t.msg_success_admin : t.msg_success_creator);
        setIsSigningUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // --- 核心改动：记录登录轨迹 ---
        await updateLoginTrace(); 
        
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (UI 部分保持不变，略)
    <div className="min-h-screen flex items-center justify-center bg-[#fcfbf9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2rem] shadow-magazine border border-stone-100">
        <div>
          <h2 className="text-center text-3xl font-serif font-bold text-brand-coffee">
            {isSigningUp ? t.title_signup : t.title_login}
          </h2>
          <p className="mt-4 text-center text-sm text-stone-500 font-medium">
            {isSigningUp ? t.subtitle_signup : t.subtitle_login}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
          <div className="space-y-5">
            <div>
               <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">{t.label_email}</label>
               <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-200 placeholder-stone-300 text-brand-coffee focus:outline-none focus:ring-2" placeholder="you@example.com" />
            </div>
            <div>
               <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">{t.label_password}</label>
               <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-200 placeholder-stone-300 text-brand-coffee focus:outline-none focus:ring-2" placeholder={t.placeholder_password} minLength={6} />
            </div>
            {isSigningUp && (
              <div className="space-y-5">
                <div className="bg-brand-apricot/30 p-4 rounded-2xl border border-brand-apricot">
                  <label className="block text-xs font-bold text-brand-warm uppercase tracking-widest mb-2">{t.label_name}</label>
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-brand-apricot bg-white placeholder-stone-300 text-brand-coffee focus:outline-none" placeholder={t.placeholder_name} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">{t.label_country}</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className="block w-full px-4 py-3 border border-stone-200 bg-white rounded-xl text-brand-coffee focus:outline-none">
                    <option value="vietnam">🇻🇳 Vietnam</option>
                    <option value="thailand">🇹🇭 Thailand</option>
                    <option value="malaysia">🇲🇾 Malaysia</option>
                    <option value="philippines">🇵🇭 Philippines</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {t.label_admin_code}
                  </label>
                  <input type="text" value={adminCode} onChange={e => setAdminCode(e.target.value)} className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-100 placeholder-stone-200 text-brand-coffee focus:outline-none" placeholder={t.placeholder_admin_code} />
                </div>
              </div>
            )}
          </div>
          {error && <div className="text-accent-500 text-xs font-bold text-center bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}
          <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-brand-coffee hover:bg-stone-700 focus:outline-none shadow-xl transition-all disabled:opacity-50">
            {loading ? <LoaderCircle className="animate-spin" /> : (isSigningUp ? t.btn_signup : t.btn_login)}
          </button>
          <div className="flex justify-center">
            <button type="button" onClick={() => { setIsSigningUp(!isSigningUp); setError(null); }} className="text-xs font-bold text-stone-400 hover:text-brand-coffee uppercase tracking-widest transition-colors">
              {isSigningUp ? t.link_to_login : t.link_to_signup}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

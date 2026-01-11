'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../lib/database.types';

export default function InitAdminPage() {
  const [status, setStatus] = useState('');
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handlePromote = async () => {
    setStatus('正在处理...');
    
    // 1. 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus('错误：请先登录！');
      return;
    }

    // 2. 尝试更新 profile
    // 注意：这步可能会失败，如果 RLS 设置得太死。
    // 但通常用户是可以 update 自己的 profile 的 (我们之前的 SQL 允许了 "Users can update own profile")
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (error) {
      setStatus('失败：' + error.message);
    } else {
      setStatus('成功！你现在是数据库层面的管理员了。请返回排班表重试。');
    }
  };

  return (
    <div className="p-10 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">初始化管理员权限</h1>
      <p>点击下方按钮，将当前登录账号提升为 Admin 角色。</p>
      <button 
        onClick={handlePromote}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        提升为管理员
      </button>
      <p className="text-red-500">{status}</p>
    </div>
  );
}

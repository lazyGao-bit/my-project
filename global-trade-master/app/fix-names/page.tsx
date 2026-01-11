'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../lib/database.types';

export default function FixNamesPage() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleFix = async () => {
    addLog("开始修复...");

    const updates = [
      { email: 'gaojiaxin431@gmail.com', name: 'YYT1' },
      { email: '1771048910@qq.com', name: 'YYT2' }
    ];

    for (const item of updates) {
      // 1. 先查 ID (因为 profiles 表主键是 ID，不是 email)
      // 注意：这里假设你当前登录的用户有权限查所有 profile，或者你是 admin
      // 如果你是 admin，RLS 应该允许你 update 任何人的 profile (前提是我们之前的 SQL 给了 admin 权限)
      // 如果 RLS 卡住了，那只能去 Supabase 后台改。但我们先试试代码。
      
      // 这里的逻辑有点绕，因为 profiles 表通常没有 email 索引供我们查询 ID (email 在 auth.users 里)
      // 但我们在创建 profile 时把 email 也存进去了，所以可以查。
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', item.email)
        .single();

      if (error || !data) {
        addLog(`❌ 未找到用户: ${item.email}`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: item.name })
        .eq('id', data.id);

      if (updateError) {
        addLog(`❌ 更新失败 ${item.email}: ${updateError.message}`);
      } else {
        addLog(`✅ 更新成功: ${item.email} -> ${item.name}`);
      }
    }
    addLog("修复结束。");
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">主播名称修复工具</h1>
      <button onClick={handleFix} className="bg-blue-600 text-white px-4 py-2 rounded">
        执行修复
      </button>
      <div className="mt-4 p-4 bg-gray-100 rounded text-sm font-mono whitespace-pre-wrap">
        {logs.join('\n')}
      </div>
    </div>
  );
}

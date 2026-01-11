import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 记录系统活动日志
 * @param actionType 操作类型 (如: 'SCHEDULE_ASSIGN', 'FANS_REPORT')
 * @param description 描述性文字
 * @param metadata 详细的 JSON 数据
 */
export async function logActivity(
  actionType: string,
  description: string,
  metadata: any = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    user_email: user.email,
    action_type: actionType,
    description,
    metadata
  });
}

/**
 * 更新用户登录轨迹
 */
export async function updateLoginTrace() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 获取客户端 IP (通过第三方 API)
  let ip = 'unknown';
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    ip = data.ip;
  } catch (e) {}

  await supabase.from('profiles').update({
    last_login: new Date().toISOString(),
    last_ip: ip
  }).eq('id', user.id);

  // 记录登录日志
  await logActivity('LOGIN', `用户 ${user.email} 登录系统`, { ip });
}

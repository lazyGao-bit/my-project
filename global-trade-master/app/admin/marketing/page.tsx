'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Mail, Users, Search, CheckSquare, Square, Send, 
  FileText, Link as LinkIcon, AlertCircle, CheckCircle, ArrowLeft
} from 'lucide-react';
import type { Database } from '../../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const COUNTRIES = [
  { code: 'VN', name: '越南' },
  { code: 'TH', name: '泰国' },
  { code: 'MY', name: '马来西亚' },
  { code: 'PH', name: '菲律宾' },
  { code: 'Global', name: '全球' },
];

export default function EmailMarketingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // 存 Email
  
  // 筛选状态
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');

  // 发送表单状态
  const [emailSubject, setEmailSubject] = useState('');
  const [emailType, setEmailType] = useState<'link' | 'text'>('link');
  const [emailContent, setEmailContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{success: boolean; msg: string} | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUsers = async () => {
      // 1. 检查管理员权限 (略，假设 middleware 或 layout 已处理，为安全可再加)
      
      // 2. 获取所有主播用户 (role = creator)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'creator');
        
      if (data) setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  // 筛选逻辑
  const filteredUsers = users.filter(u => {
    const matchSearch = (u.username?.toLowerCase() || '').includes(search.toLowerCase()) || 
                        (u.email?.toLowerCase() || '').includes(search.toLowerCase());
    const matchCountry = filterCountry === 'all' || u.country === filterCountry;
    return matchSearch && matchCountry;
  });

  // 全选/反选逻辑
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.email).filter(Boolean) as string[]);
    }
  };

  const toggleUser = (email: string) => {
    if (selectedUsers.includes(email)) {
      setSelectedUsers(prev => prev.filter(e => e !== email));
    } else {
      setSelectedUsers(prev => [...prev, email]);
    }
  };

  // 发送逻辑
  const handleSend = async () => {
    if (selectedUsers.length === 0) return alert("请至少选择一位主播");
    if (!emailSubject) return alert("请输入邮件标题");
    if (!emailContent) return alert("请输入邮件内容/链接");

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedUsers,
          subject: emailSubject,
          type: emailType,
          [emailType === 'link' ? 'link' : 'content']: emailContent
        })
      });

      if (res.ok) {
        setSendResult({ success: true, msg: `邮件发送完成！已成功发送给 ${selectedUsers.length} 位主播。` });
        // 清空表单
        setEmailSubject('');
        setEmailContent('');
        setSelectedUsers([]);
      } else {
        setSendResult({ success: false, msg: '操作无法完成：邮件服务器响应错误。' });
      }
    } catch (e) {
      setSendResult({ success: false, msg: '操作无法完成：网络连接失败。' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-zinc-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 hover:bg-zinc-800 rounded-full transition">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <h1 className="text-lg font-bold tracking-tight">邮件营销中心</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* 左侧：主播列表选择器 */}
        <div className="lg:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[80vh]">
          <div className="p-6 border-b border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600"/> 
                选择主播 ({selectedUsers.length}/{filteredUsers.length})
              </h2>
              <button 
                onClick={handleSelectAll}
                className="text-sm text-purple-600 font-bold hover:underline"
              >
                {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? '取消全选' : '全选当前'}
              </button>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="搜索主播名或邮箱..."
                />
              </div>
              <select 
                value={filterCountry}
                onChange={e => setFilterCountry(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="all">所有国家</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-20 text-gray-400">未找到匹配的主播</div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    onClick={() => user.email && toggleUser(user.email)}
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedUsers.includes(user.email || '') 
                        ? 'bg-purple-50 border-purple-200' 
                        : 'bg-white border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className={selectedUsers.includes(user.email || '') ? 'text-purple-600' : 'text-gray-300'}>
                      {selectedUsers.includes(user.email || '') ? <CheckSquare className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 text-sm">{user.username || '未命名主播'}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    {user.country && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                        {COUNTRIES.find(c => c.code === user.country)?.name || user.country}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：邮件内容编辑 */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600"/> 邮件内容
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">邮件标题</label>
                <input 
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="例如: 关于最新直播规范的问卷调查"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">内容类型</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setEmailType('link')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold border ${
                      emailType === 'link' ? 'bg-purple-600 text-white border-purple-600' : 'text-gray-500 border-gray-200'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4"/> 链接/问卷
                  </button>
                  <button 
                    onClick={() => setEmailType('text')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold border ${
                      emailType === 'text' ? 'bg-purple-600 text-white border-purple-600' : 'text-gray-500 border-gray-200'
                    }`}
                  >
                    <FileText className="w-4 h-4"/> 纯文本
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {emailType === 'link' ? 'Google文档/问卷链接' : '邮件正文'}
                </label>
                {emailType === 'link' ? (
                  <input 
                    value={emailContent}
                    onChange={e => setEmailContent(e.target.value)}
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none text-blue-600 underline"
                    placeholder="https://docs.google.com/..."
                  />
                ) : (
                  <textarea 
                    value={emailContent}
                    onChange={e => setEmailContent(e.target.value)}
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none h-32 resize-none"
                    placeholder="请输入通知内容..."
                  />
                )}
              </div>

              {sendResult && (
                <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-2 ${
                  sendResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {sendResult.success ? <CheckCircle className="w-5 h-5 shrink-0"/> : <AlertCircle className="w-5 h-5 shrink-0"/>}
                  {sendResult.msg}
                </div>
              )}

              <button 
                onClick={handleSend}
                disabled={sending || selectedUsers.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? '正在发送...' : (
                  <>
                    <Send className="w-4 h-4" /> 确认发送 ({selectedUsers.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

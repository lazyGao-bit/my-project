'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, User, Shield, Package, Send, ArrowLeft,
  Truck, CheckCircle, Reply, Box 
} from 'lucide-react';
import type { Database } from '../../../lib/database.types';
import { format } from 'date-fns';

type Feedback = Database['public']['Tables']['feedbacks']['Row'] & {
  profiles: { username: string; email: string } | null;
  products: { name: any; main_image: string; sku: string } | null;
};

const COUNTRIES = [
  { code: 'VN', name: '越南' },
  { code: 'TH', name: '泰国' },
  { code: 'MY', name: '马来西亚' },
  { code: 'PH', name: '菲律宾' },
];

const CATEGORIES = [
  { id: 'all', label: '全部', icon: MessageSquare },
  { id: 'sample', label: '样品申请', icon: Box },
  { id: 'live_issue', label: '直播问题', icon: MessageSquare },
  { id: 'after_sales', label: '售后问题', icon: Shield },
  { id: 'other', label: '其他', icon: Send },
];

const ADMIN_EMAILS = ['gaojiaxin431@gmail.com', 'admin@example.com', '1771048910@qq.com'];

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  
  const [activeCountry, setActiveCountry] = useState('VN');
  const [activeCategory, setActiveCategory] = useState('all');

  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [logistics, setLogistics] = useState('');

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || (!ADMIN_EMAILS.includes(user.email || ''))) {
        router.push('/dashboard');
        return;
      }
      fetchFeedbacks();
    };
    init();
  }, [activeCountry]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feedbacks')
      .select('*, profiles(username, email), products(name, main_image, sku)')
      .eq('country', activeCountry)
      .order('created_at', { ascending: false });
    
    if (data) setFeedbacks(data as any);
    setLoading(false);
  };

  const handleReply = async (id: number) => {
    if (!replyText && !logistics) return;

    const updates: any = { reply: replyText };
    if (logistics) updates.logistics_info = logistics;

    const { error } = await supabase
      .from('feedbacks')
      .update(updates)
      .eq('id', id);

    if (error) {
      alert('回复失败: ' + error.message);
    } else {
      setReplyId(null);
      setReplyText('');
      setLogistics('');
      fetchFeedbacks();
    }
  };

  const filteredList = activeCategory === 'all' 
    ? feedbacks 
    : feedbacks.filter(f => f.category === activeCategory);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-creamy"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-coffee"></div></div>;

  return (
    <div className="min-h-screen bg-brand-creamy text-brand-coffee font-sans pb-20">
      {/* 顶部导航 - 使用深咖色背景 */}
      <header className="bg-brand-coffee text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-brand-creamy" />
            </button>
            <h1 className="text-lg font-bold tracking-wide font-serif">反馈管理中心</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          
          {/* 左侧筛选栏 - 奶油风 */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">国家 / Region</h3>
              <div className="space-y-2">
                {COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setActiveCountry(c.code)}
                    className={`w-full text-left px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                      activeCountry === c.code 
                        ? 'bg-white text-brand-coffee shadow-md border-l-4 border-brand-coffee' 
                        : 'text-stone-500 hover:bg-white/50 hover:text-stone-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">分类 / Category</h3>
              <div className="space-y-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
                      activeCategory === cat.id 
                        ? 'bg-white text-brand-coffee shadow-md border-l-4 border-brand-coffee' 
                        : 'text-stone-500 hover:bg-white/50 hover:text-stone-700'
                    }`}
                  >
                    <cat.icon className="w-4 h-4" /> {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 右侧列表 */}
          <div className="flex-1 space-y-6">
            {filteredList.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[2rem] border border-dashed border-stone-200 text-stone-400 font-medium">
                暂无相关反馈工单
              </div>
            ) : (
              filteredList.map(item => (
                <div key={item.id} className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-soft hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-start mb-6 pb-6 border-b border-stone-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center font-bold text-stone-500 font-serif text-lg">
                        {item.is_anonymous ? '?' : (item.profiles?.username?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-brand-coffee text-base">
                          {item.is_anonymous ? '匿名主播' : item.profiles?.username}
                          <span className="text-stone-400 font-normal ml-2 text-sm">{item.profiles?.email}</span>
                        </div>
                        <div className="text-xs text-stone-400 mt-1 font-medium">{format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}</div>
                      </div>
                    </div>
                    {item.reply ? (
                      <span className="bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> 已处理
                      </span>
                    ) : (
                      <span className="bg-brand-apricot text-orange-800 px-4 py-1.5 rounded-full text-xs font-bold border border-orange-200">
                        待处理
                      </span>
                    )}
                  </div>

                  {item.products && (
                    <div className="mb-6 bg-brand-creamy p-4 rounded-2xl border border-stone-200 flex items-center gap-4 max-w-md">
                      {item.products.main_image && <img src={item.products.main_image} className="w-14 h-14 rounded-xl object-cover shadow-sm" />}
                      <div>
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-0.5">申请样品</div>
                        <div className="text-sm font-bold text-brand-coffee line-clamp-1">{item.products.name?.CN || '产品'}</div>
                        <div className="text-xs text-stone-500 font-mono mt-0.5">{item.products.sku}</div>
                      </div>
                    </div>
                  )}

                  <p className="text-stone-700 leading-relaxed whitespace-pre-wrap mb-6 text-[15px]">{item.content}</p>

                  {item.images && item.images.length > 0 && (
                    <div className="flex gap-3 mb-6">
                      {item.images.map((img, idx) => (
                        <img key={idx} src={img} className="w-24 h-24 rounded-xl border border-stone-200 object-cover shadow-sm" />
                      ))}
                    </div>
                  )}

                  {/* 回复操作区 */}
                  <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
                    {item.reply ? (
                      <div className="text-sm">
                        <div className="font-bold text-brand-coffee mb-2 flex items-center gap-2">
                          <Reply className="w-4 h-4"/> 管理员回复:
                        </div>
                        <div className="text-stone-600 mb-3 bg-white p-3 rounded-lg border border-stone-100">{item.reply}</div>
                        {item.logistics_info && (
                          <div className="flex items-center gap-2 text-brand-600 font-bold bg-white px-3 py-2 rounded-lg border border-stone-200 w-fit shadow-sm">
                            <Truck className="w-4 h-4" /> {item.logistics_info}
                          </div>
                        )}
                      </div>
                    ) : (
                      replyId === item.id ? (
                        <div className="space-y-4 animate-fade-in">
                          <textarea 
                            className="w-full border border-stone-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none bg-white text-brand-coffee"
                            rows={3}
                            placeholder="请输入回复内容..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            autoFocus
                          />
                          {item.category === 'sample' && (
                            <input 
                              className="w-full border border-stone-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none bg-white"
                              placeholder="📦 请输入物流单号 (必填)"
                              value={logistics}
                              onChange={e => setLogistics(e.target.value)}
                            />
                          )}
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setReplyId(null)} className="px-4 py-2 text-sm text-stone-500 hover:bg-stone-200 rounded-lg transition-colors font-bold">取消</button>
                            <button onClick={() => handleReply(item.id)} className="px-6 py-2 text-sm bg-brand-coffee text-white rounded-lg hover:bg-stone-700 transition-all font-bold shadow-md hover:shadow-lg">
                              发送回复
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setReplyId(item.id)} 
                          className="flex items-center gap-2 text-sm text-brand-coffee font-bold hover:text-stone-600 transition-colors group"
                        >
                          <Reply className="w-4 h-4 group-hover:-scale-x-100 transition-transform"/> 
                          回复此工单
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

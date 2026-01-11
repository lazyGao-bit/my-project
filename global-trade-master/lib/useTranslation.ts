'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { translateObject } from './translation';

// 辅助函数：安全地从 Cookie 获取语言
function getLangFromCookie() {
  if (typeof document === 'undefined') return null; // 服务器端返回 null
  const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'));
  return match ? match[2] : null;
}

export function useTranslation<T extends Record<string, any>>(defaultContent: T) {
  const searchParams = useSearchParams();
  const urlLang = searchParams.get('lang');
  
  // 初始状态先设为 null，表示“未知状态”，避免 hydration mismatch
  const [lang, setLang] = useState<string>('zh');
  const [content, setContent] = useState<T>(defaultContent);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 1. 初始化语言设置 (仅在客户端执行)
  useEffect(() => {
    const cookieLang = getLangFromCookie();
    // 优先级：URL > Cookie > 默认 'zh'
    const targetLang = urlLang || cookieLang || 'zh';
    setLang(targetLang);
    setInitialized(true);
  }, [urlLang]);

  // 2. 监听语言变化并执行翻译
  useEffect(() => {
    if (!initialized) return;

    // 如果是中文，直接使用默认文案，无需请求 API
    if (lang === 'zh') {
      setContent(defaultContent);
      return;
    }

    const fetchTranslation = async () => {
      setLoading(true);
      try {
        // 调用通用翻译函数
        // 注意：这里我们传入 defaultContent 作为源文本，确保每次都是从中文翻译过去
        const translated = await translateObject(defaultContent, lang);
        setContent(translated);
      } catch (error) {
        console.error("Translation hook error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslation();
  }, [lang, initialized]); 

  // 返回加载状态，页面可以根据 loading 显示骨架屏或加载动画
  return { t: content, lang, loading: loading || !initialized };
}

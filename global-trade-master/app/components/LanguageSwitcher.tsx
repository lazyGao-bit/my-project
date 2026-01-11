'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'zh', name: '简体中文' },
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'ms', name: 'Bahasa Melayu' },
  { code: 'th', name: 'ภาษาไทย' },
];

export default function LanguageSwitcher() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // 优先从 URL 获取，如果没有则尝试从 localStorage 或默认为 zh
  const currentLang = searchParams.get('lang') || 'zh';

  const handleLanguageChange = (langCode: string) => {
    // 1. 更新 URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', langCode);
    
    // 2. 写入 Cookie (有效期30天)
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=2592000`;
    
    // 3. 触发跳转
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={switcherRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-brand-coffee bg-white/50 hover:bg-white transition-all shadow-sm border border-transparent hover:border-brand-200"
      >
        <Globe size={16} />
        <span>{languages.find(l => l.code === currentLang)?.name || 'Language'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
          <div className="py-1">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`${lang.code === currentLang ? 'bg-brand-50 text-brand-600 font-bold' : 'text-stone-600'} group flex w-full items-center px-4 py-3 text-sm hover:bg-brand-50 hover:text-brand-600 transition-colors`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

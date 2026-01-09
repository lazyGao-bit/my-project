'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const currentLang = searchParams.get('lang') || 'zh';

  const handleLanguageChange = (langCode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', langCode);
    router.push(`/?${params.toString()}`);
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
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
      >
        <Globe size={18} />
        <span>{languages.find(l => l.code === currentLang)?.name || 'Language'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`${lang.code === currentLang ? 'bg-purple-600 text-white' : 'text-zinc-300'} group flex w-full items-center px-4 py-2 text-sm hover:bg-purple-500 hover:text-white`}
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

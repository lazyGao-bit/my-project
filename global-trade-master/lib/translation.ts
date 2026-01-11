
const DEEPLX_ENDPOINT = "https://api.deeplx.org/eIWrZKBZE5N-E8C-k-tB6uwxbgBD-7sVjt45RQ16EoI/translate";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxWAorgDqTQhmAxTyJ7cbZ1JAKphJKknw3vCyrh3Zq1Gk2KHyoODXp2mYQydHvJ5hRZ/exec";

const cleanText = (text: any): string => String(text || "").trim().replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "");
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchGoogleGAS = async (text: string, targetLang: string) => {
  const t = cleanText(text); if (!t) return "";
  let g = targetLang; if (targetLang === 'ms') g = 'ms'; if (targetLang === 'tl' || targetLang === 'ph') g = 'tl';
  try {
    const params = new URLSearchParams(); params.append('text', t); params.append('target', g); params.append('source', 'zh-CN');
    const res = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: params, redirect: 'follow' });
    if (!res.ok) return ""; const data = await res.json(); return data.text || data.result || ""; 
  } catch (e) { return ""; }
};

const fetchDeepLX = async (text: string) => {
  const t = cleanText(text); if (!t) return "";
  try {
    const res = await fetch(DEEPLX_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t, source_lang: "ZH", target_lang: "EN" }) });
    if (!res.ok) return ""; const data = await res.json(); const result = data.data || data.translations?.[0]?.text;
    return (result && String(result).includes("Error")) ? "" : (result || "");
  } catch (e) { return ""; }
};

export type TranslationSet = { CN: string; VN: string; TH: string; PH: string; MY: string; EN: string; };

export const smartTranslate = async (text: string): Promise<TranslationSet> => {
  const t = cleanText(text); if (!t) return { CN:'', VN:'', TH:'', PH:'', MY:'', EN:'' };
  const isEn = /^[a-zA-Z0-9\s,.-]+$/.test(t);
  let en = t;
  if (!isEn) {
    en = await fetchDeepLX(t);
    if (!en) { await delay(200); en = await fetchGoogleGAS(t, "en"); }
  }
  const vn = await fetchGoogleGAS(t, "vi"); await delay(100);
  const th = await fetchGoogleGAS(t, "th"); await delay(100);
  const my = await fetchGoogleGAS(t, "ms");
  return { CN: t, EN: en||t, VN: vn||"", TH: th||"", PH: en||t, MY: my||"" }; 
};

// --- 通用实时翻译函数 ---

export async function translateText(text: string, targetLang: string) {
  const apiUrl = 'https://translator-api.gaojiaxin431.workers.dev';
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  const sourceLang = isChinese ? 'zh' : 'en';

  if (sourceLang === targetLang) return text;
  if (targetLang === 'zh' && isChinese) return text;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source_lang: sourceLang, target_lang: targetLang }),
      cache: 'force-cache',
    });
    if (!response.ok) return text;
    const data = await response.json();
    return data.translated_text || text;
  } catch (error) {
    return text;
  }
}

// 核心：深度递归翻译任意对象或数组
export async function translateObject<T>(data: T, lang: string): Promise<T> {
  if (lang === 'zh' || !data) return data;

  // 处理数组
  if (Array.isArray(data)) {
    const results = await Promise.all(data.map(item => translateObject(item, lang)));
    return results as any;
  }

  // 处理对象
  if (typeof data === 'object' && data !== null) {
    const translatedObj: any = { ...data };
    const promises: Promise<void>[] = [];

    for (const key in translatedObj) {
      const value = translatedObj[key];
      
      if (typeof value === 'string' && value.length > 1) {
        // 排除非文案字段
        const skipKeys = ['id', 'sku', 'image', 'url', 'link', 'code', 'category', 'date', 'author', 'color', 'bg'];
        if (skipKeys.some(sk => key.toLowerCase().includes(sk))) continue;

        promises.push(
          translateText(value, lang).then(res => {
            translatedObj[key] = res;
          })
        );
      } else if (typeof value === 'object' && value !== null) {
        promises.push(
          translateObject(value, lang).then(res => {
            translatedObj[key] = res;
          })
        );
      }
    }

    await Promise.all(promises);
    return translatedObj;
  }

  return data;
}

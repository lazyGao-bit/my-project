import { NextResponse } from 'next/server';

// 智谱或 Gemini 翻译逻辑的封装 (这里复用 Gemini)
const API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    const { text, mode } = await req.json();

    if (mode === 'batch_translate') {
      // 执行全量多语言翻译逻辑 (ZH -> EN, VN, TH, MS, PH)
      const prompt = `
        You are a professional ecommerce translator. 
        Translate the following Chinese text into English (EN), Vietnamese (VN), Thai (TH), Malay (MS).
        
        Rules:
        1. Keep the style natural for live streaming.
        2. Output only valid JSON.
        3. Use the keys: EN, VN, TH, MS.

        Text to translate: "${text}"
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // 简单清理下 AI 返回的 Markdown 标记
      const jsonString = rawText.replace(/```json|```/g, '').trim();
      const translations = JSON.parse(jsonString);
      
      return NextResponse.json({ 
        ZH: text,
        ...translations
      });
    }

    // ... (原有的 AI 文案生成逻辑保持不变)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

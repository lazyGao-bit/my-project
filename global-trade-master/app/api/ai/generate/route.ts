import { NextResponse } from 'next/server';

interface GenerateRequest {
  productName: string;
  features: string;
  size: string;
  patternName?: string; 
  targetCountry: 'CN' | 'VN' | 'MY' | 'TH' | 'US' | 'KR';
  contentType: 'live_script' | 'short_video';
}

// 细化每个国家的风格和平台偏好
const COUNTRY_CONFIG = {
  CN: { 
    lang: "中文", 
    platform: "抖音/小红书",
    style: "种草感强，强调'宿舍神器'、'提升幸福感'。语气亲切，像闺蜜安利。" 
  },
  VN: { 
    lang: "越南语", 
    platform: "TikTok Vietnam",
    style: "极其热情，强调'Biến hình phòng ngủ'(卧室大变身)、'Siêu rẻ'(超便宜)。多用 Emoji🔥😍。" 
  },
  MY: { 
    lang: "马来语(口语化)", 
    platform: "TikTok Malaysia",
    style: "强调'Bilik aesthetic'(氛围感房间)、'Privasi'(隐私)。语气真诚推荐。" 
  },
  TH: { 
    lang: "泰语", 
    platform: "TikTok Thailand",
    style: "强调'Narak'(可爱)、'Sabai'(舒适)。语气温柔，多用 Emoji✨。" 
  },
  US: { 
    lang: "英语", 
    platform: "TikTok US/Instagram",
    style: "强调'Room Makeover'(房间改造)、'Dorm Essentials'(宿舍必备)。语气自信、简短有力。" 
  },
  KR: { 
    lang: "韩语", 
    platform: "Instagram/TikTok KR",
    style: "强调'感性'(Vibe)、'极简风'、'自取向狙击'。语气精致、感性。" 
  },
};

export async function POST(req: Request) {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: "服务器配置错误：未配置 API Key" }, { status: 500 });
    }

    const body: GenerateRequest = await req.json();
    const { productName, features, size, patternName, targetCountry, contentType } = body;
    const config = COUNTRY_CONFIG[targetCountry] || COUNTRY_CONFIG.US;
    
    // --- 步骤 1: 动态探测可用模型 ---
    let selectedModel = 'gemini-1.5-flash'; 
    try {
        const listModelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        if(listModelsRes.ok){
            const d = await listModelsRes.json();
            const m = (d.models||[]).find((x:any)=>x.name.includes('gemini-1.5-flash')) || (d.models||[]).find((x:any)=>x.name.includes('gemini-pro'));
            if(m) selectedModel = m.name.replace('models/','');
        }
    } catch(e){}

    // --- 步骤 2: 构建精细化 Prompt ---
    let specificRequirements = "";

    if (contentType === 'short_video') {
      specificRequirements = `
【短视频营销文案要求（非拍摄脚本）】：
1. **角色**：你是一位热衷于分享好物的 ${config.platform} 博主，正在向粉丝强烈安利这款产品。
2. **核心目标**：写一段**直接发布在视频下方的文案（Caption）**，目的是激发购买欲。不要写镜头指导、不要写画面描述！
3. **内容策略**：
   - **痛点/场景切入**：例如“受够了宿舍没有隐私？”或“想低成本改造卧室？”
   - **产品植入**：自然引出产品，强调它如何解决问题（遮光/防蚊/美观）。
   - **情感升华**：描述使用后的美好感觉（“每天醒来心情都变好了”）。
   - **热卖话术**：加入“爆款”、“手慢无”、“提升生活质量神器”等营销词汇。
4. **格式要求**：
   - 总字数控制在 100 字以内。
   - 分 3-4 行显示，每行加一个 Emoji。
   - **必须**在文案最后一行附带 5 个该国家当下最热门的相关 Hashtags。
`;
    } else {
      specificRequirements = `
【直播带货脚本要求】：
1. **互动感**：模拟真实直播间，包含主播动作指导（如 [拿起枕套揉搓展示面料]）和话术。
2. **结构**：
   - **开场 (30s)**：话术要炸，留住划过的人（"停一下！今天这个价格..."）。
   - **产品介绍 (1min)**：结合${patternName ? `花型“${patternName}”` : '产品'}展示细节。
   - **逼单 (30s)**：强调库存少、限时优惠。
3. **语言**：口语化，不要书面语。
`;
    }

    const prompt = `
请为以下家纺产品创作内容：

【产品信息】：
- 品名：${productName}
- 尺寸：${size}
- 核心卖点：${features}
${patternName ? `- 重点推荐花型：${patternName} (请在文案中着重描述该花型的视觉美感)` : ''}

【目标受众】：${config.style}

${specificRequirements}

请直接输出最终内容，不要包含任何解释性文字。
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Google API Error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedContent) {
      return NextResponse.json({ error: "生成失败" }, { status: 500 });
    }

    return NextResponse.json({ result: generatedContent });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

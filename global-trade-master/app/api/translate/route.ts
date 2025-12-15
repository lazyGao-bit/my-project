import { NextResponse } from 'next/server';
import * as tencentcloud from "tencentcloud-sdk-nodejs";

// 1. 配置腾讯云认证信息
// ⚠️ 注意：在真实生产环境中，密钥应放在环境变量中，不要直接写在代码里。
const SECRET_ID = "BWUIDBDBAJKBSKDBKBDKQBKDQDQ";
const SECRET_KEY = "BCUIBCKBDSBJCBSKBEBANXNALNL";
const REGION = "ap-shanghai"; // 或 ap-guangzhou

const TmtClient = tencentcloud.tmt.v20180321.Client;

// 2. 初始化客户端
const clientConfig = {
  credential: {
    secretId: SECRET_ID,
    secretKey: SECRET_KEY,
  },
  region: REGION,
  profile: {
    httpProfile: {
      endpoint: "tmt.tencentcloudapi.com",
    },
  },
};

const client = new TmtClient(clientConfig);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, target } = body;

    if (!text) {
      return NextResponse.json({ result: "" });
    }

    // 3. 构造请求参数
    // 腾讯云语言代码映射: zh(中), en(英), vi(越), ms(马), th(泰)
    const params = {
      SourceText: text,
      Source: "auto",
      Target: target, 
      ProjectId: 0,
    };

    // 4. 发起请求 (将 SDK 的回调模式转为 Promise)
    const result = await new Promise((resolve, reject) => {
      client.TextTranslate(params, (err, response) => {
        if (err) {
          console.error("Tencent Cloud Error:", err);
          reject(err);
          return;
        }
        resolve(response.TargetText);
      });
    });

    return NextResponse.json({ result: result });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ result: "" }, { status: 500 });
  }
}
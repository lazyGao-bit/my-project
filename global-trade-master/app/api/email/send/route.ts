import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { recipients, subject, content, link, type } = await req.json();

    // 模拟发送过程的延时
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 在真实场景中，这里会调用 SendGrid / Resend / Nodemailer 发送邮件
    // 例如: await resend.emails.send({ to: recipients, subject, html: ... })

    console.log(`[Mock Email Server] Sending to ${recipients.length} recipients`);
    console.log(`Subject: ${subject}`);
    console.log(`Type: ${type}`);
    console.log(`Content/Link: ${link || content}`);

    // 模拟 95% 的成功率
    if (Math.random() > 0.05) {
      return NextResponse.json({ success: true, count: recipients.length });
    } else {
      return NextResponse.json({ error: "模拟发送失败：SMTP 连接超时" }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

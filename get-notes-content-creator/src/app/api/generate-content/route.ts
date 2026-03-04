import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText } from 'ai';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY || 'sk-92a4d12ea1d54884a8a1f1dbcb5c728b',
});

export async function POST(req: Request) {
    try {
        const { sourceData, topicTitle, topicReason } = await req.json();

        const result = streamText({
            model: deepseek('deepseek-chat'),
            system: `你是一个建工垂类金牌短视频编导。
你的任务是基于提供的【选题框架】和【知识库干货材料】，写一篇强转化的短视频口播脚本（约300-500字，适合1分钟左右口播）。
核心准则（结构强控制）：
1. 黄金三秒钩子：第一句话必须悬念拉满，直击痛点（例如：“干了十年工程，年底对账还是个糊涂账？”）。
2. 痛点场景化：不要干巴巴地背诵法律条文，把提取出的知识点，自然揉进具体的甲乙方博弈、讨要工程款或工地实操场景里。
3. 不说教，讲人话：用工地大哥、包工头听得懂的“接地气口语化”讲述，句式要短，语气要犀利干脆，带点江湖气或仗义感。
4. 互动留存尾巴：结尾必须引导互动或私信咨询（如：“兄弟们，你们在工地遇到过这事儿吗？评论区说说看” 或 “拿不准的主页找我看看”）。
请直接输出口播文案，不要任何多余的解释。使用 Markdown 格式加粗重读的关键点以指导播主语气。`,
            messages: [
                {
                    role: 'user',
                    content: `【知识库提取的干货素材】：\n${sourceData}\n\n【我们现在敲定的短视频标题】：${topicTitle}\n【该选题切入点与爆款逻辑】：${topicReason}\n\n请不要有多余寒暄，直接输出口播脚本的正文内容：`
                }
            ],
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('Content generation error:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate content' }), { status: 500 });
    }
}

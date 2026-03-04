import { NextResponse } from 'next/server';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateObject } from 'ai';
import { z } from 'zod';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY || 'sk-92a4d12ea1d54884a8a1f1dbcb5c728b',
});

export const maxDuration = 180; // Ensure topics generation has enough time in SCF

export async function POST(req: Request) {
    try {
        const { sourceData } = await req.json();

        if (!sourceData) {
            return NextResponse.json({ error: 'Missing source data' }, { status: 400 });
        }

        const { object } = await generateObject({
            model: deepseek('deepseek-chat'),
            system: `你是一个资深建筑工程领域千万级粉丝账号背后的操盘手和主编。
你的任务是基于我提供的【知识库干货材料】，提炼并策划出 3 个具体的、极具爆款潜质的短视频选题/标题。
要求：
1. 标题必须带情绪、悬念或反差，直指工程人痛点（如：“千万别再挂靠了！因为这个细节，工头刚赔了 200 万...”）。
2. 切入思路非常重要：通过简短两三句话明确讲出这个选题为什么能火（比如引发了底层包工头的共鸣，还是给老板提供了避坑价值，必须贴合建工地气）。
3. 弃用书面语，多用工地大白话（如：“年底对账”、“总包”、“挂靠”、“垫资”等）。
请严格按照要求的 JSON 数组格式返回，不要附带其他的解释或Markdown格式字符。`,
            prompt: `以下是从建工知识库中提取的核心干货材料：\n\n${sourceData}\n\n请策划3个爆款短视频选题：`,
            schema: z.object({
                topics: z.array(z.object({
                    id: z.number().describe("1到3的序号"),
                    title: z.string().describe("短视频口播或封面标题，要求极具吸引力"),
                    reason: z.string().describe("切入思路及爆款逻辑解析"),
                })),
            }),
        });

        return NextResponse.json({ topics: object.topics });
    } catch (error) {
        console.error('Topics generation error:', error);
        return NextResponse.json({ error: 'Failed to generate topics' }, { status: 500 });
    }
}

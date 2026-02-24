import { z } from 'zod';
import { TopicScoreSchema } from '../schemas';
import { generateObject } from 'ai';
import { getChatModel } from './provider';

// Real implementation using Vercel AI SDK and DeepSeek
export async function evaluateTopic(content: string): Promise<{ scoreData: z.infer<typeof TopicScoreSchema>, passed: boolean }> {
    try {
        const { object } = await generateObject({
            model: getChatModel(),
            schema: TopicScoreSchema,
            prompt: `
        Analyze the following content and score it from 0-10 on four dimensions:
        - trending: Is this currently a hot topic or rising trend?
        - controversy: Does it spark debate or have opposing viewpoints?
        - value: Does it provide high-density information or actionable insights?
        - relevance: Is it highly relevant for a professional tech/business audience?
        
        Calculate the 'total' as the sum of these four scores (max 40).
        
        Content to analyze:
        """
        ${content}
        """
      `,
        });

        return {
            scoreData: object,
            passed: object.total >= 28 // threshold example
        };
    } catch (error) {
        console.error("AI Evaluation failed:", error);
        // Fallback or error handling
        const zeroScore = { trending: 0, controversy: 0, value: 0, relevance: 0, total: 0 };
        return { scoreData: zeroScore, passed: false };
    }
}

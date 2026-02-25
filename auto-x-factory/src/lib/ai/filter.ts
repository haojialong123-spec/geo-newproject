import { generateObject } from 'ai';
import { z } from 'zod';
import { getChatModel } from './provider';

// Define the scoring schema
export const TopicScoreSchema = z.object({
    scores: z.object({
        trending_potential: z.number().min(0).max(10),
        controversy_factor: z.number().min(0).max(10),
        value_density: z.number().min(0).max(10),
        audience_relevance: z.number().min(0).max(10),
    }),
    passed: z.boolean(),
});

// Real implementation using Vercel AI SDK and DeepSeek
export async function evaluateTopic(content: string): Promise<{ scoreData: z.infer<typeof TopicScoreSchema>, passed: boolean }> {
    try {
        const { object } = await generateObject({
            model: getChatModel(),
            schema: TopicScoreSchema,
            prompt: `
        Analyze the following content and score it from 0-10 on four dimensions:
        - trending_potential: How likely is this to go viral or attract high engagement?
        - controversy_factor: Does it spark debate? (Higher controversial takes often get more reach)
        - value_density: Is it packed with useful information or just fluff?
        - audience_relevance: How relevant is this to developers, tech enthusiasts, or creators?

        Provide a short justification for each score.
        Calculate the total score out of 40.
        If the total score is 25 or higher, set passed to true.

        Content to analyze:
        """
        ${content}
        """
            `
        });

        return { scoreData: { scores: object.scores, passed: object.passed }, passed: object.passed };
    } catch (error) {
        console.error("AI Evaluation failed:", error);
        throw error;
    }
}

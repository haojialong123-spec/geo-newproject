import { z } from 'zod';
import { TopicScoreSchema } from '../schemas';

// Mock implementation until actual AI SDK wiring
export async function evaluateTopic(content: string): Promise<{ scoreData: z.infer<typeof TopicScoreSchema>, passed: boolean }> {
    // Simulate AI latency
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockScore = {
        trending: 8,
        controversy: 5,
        value: 9,
        relevance: 7,
        total: 29
    };

    return {
        scoreData: mockScore,
        passed: mockScore.total >= 28 // threshold example
    };
}

import { z } from 'zod';
import { TweetVariantSchema, CriticScoreSchema } from '../schemas';

export async function generateVariants(topicData: string): Promise<z.infer<typeof TweetVariantSchema>> {
    return {
        variant_a: `Hook A for ${topicData}\n\nBody here...`,
        variant_b: `Hook B for ${topicData} (controversial)\n\nBody here...`
    };
}

export async function critiqueVariants(variantA: string, variantB: string): Promise<z.infer<typeof CriticScoreSchema>[]> {
    return [
        { version: 'A', score: 8, feedback: "Good hook." },
        { version: 'B', score: 6, feedback: "Too aggressive." }
    ];
}

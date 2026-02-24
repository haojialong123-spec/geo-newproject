import { z } from 'zod';

export const TopicScoreSchema = z.object({
    trending: z.number().min(0).max(10),
    controversy: z.number().min(0).max(10),
    value: z.number().min(0).max(10),
    relevance: z.number().min(0).max(10),
    total: z.number()
});

export const TweetVariantSchema = z.object({
    variant_a: z.string(),
    variant_b: z.string()
});

export const CriticScoreSchema = z.object({
    version: z.enum(['A', 'B']),
    score: z.number().min(0).max(10),
    feedback: z.string()
});

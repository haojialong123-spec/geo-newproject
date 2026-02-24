import { z } from 'zod';
import { TweetVariantSchema, CriticScoreSchema } from '../schemas';
import { generateObject } from 'ai';
import { getChatModel } from './provider';

export async function generateVariants(topicData: string): Promise<z.infer<typeof TweetVariantSchema>> {
    try {
        const { object } = await generateObject({
            model: getChatModel(),
            schema: TweetVariantSchema,
            prompt: `
        You are an expert Twitter ghostwriter.
        Based on the following topic, write 2 distinct, highly engaging tweets.
        Variant A should be educational and value-driven.
        Variant B should be slightly provocative or contrarian to spark engagement.
        
        Keep them under 280 characters each.
        
        Topic Context:
        """
        ${topicData}
        """
      `,
        });
        return object;
    } catch (error) {
        console.error("Variant generation failed:", error);
        return { variant_a: "Error generating draft A", variant_b: "Error generating draft B" };
    }
}

export async function critiqueVariants(variantA: string, variantB: string): Promise<z.infer<typeof CriticScoreSchema>[]> {
    try {
        const { object } = await generateObject({
            model: getChatModel(),
            schema: z.array(CriticScoreSchema),
            prompt: `
        You are a harsh but fair Twitter algorithm critic.
        Evaluate the following two tweet drafts on a scale of 0-10 based on their:
        - Hook strength (does it stop the scroll?)
        - Clarity (is the message obvious?)
        - Engagement loop (does it encourage replies or retweets?)
        
        Draft A:
        """${variantA}"""
        
        Draft B:
        """${variantB}"""
        
        Return a strict evaluation for both 'A' and 'B'.
      `,
        });
        return object;
    } catch (error) {
        console.error("Critic evaluation failed:", error);
        return [
            { version: 'A', score: 0, feedback: "Error during evaluation" },
            { version: 'B', score: 0, feedback: "Error during evaluation" }
        ];
    }
}

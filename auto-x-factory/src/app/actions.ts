'use server';

import { evaluateTopic } from '@/lib/ai/filter';
import { generateVariants, critiqueVariants } from '@/lib/ai/create';
import { saveMaterial, saveTopic } from '@/lib/db/repository';

export async function searchAndEvaluate(formData: FormData) {
    const content = formData.get('content') as string;
    if (!content) return { success: false, error: "Content is required" };

    try {
        // 1. Save raw material (Mock DB)
        const materialId = await saveMaterial("Manual Input", content, "N/A");

        // 2. Evaluate using DeepSeek
        const { scoreData, passed } = await evaluateTopic(content);

        // 3. Save to topics (Mock DB)
        const topicId = await saveTopic(materialId, content.substring(0, 50), scoreData);

        return { success: true, topicId, scoreData, passed };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

export async function buildAndReviewDrafts(topicId: string, topicSnippet: string) {
    try {
        // 1. Generate Variants
        const variants = await generateVariants(topicSnippet);

        // 2. Critic Evaluates
        const scores = await critiqueVariants(variants.variant_a, variants.variant_b);

        return { success: true, variants, scores };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

'use server';
import { revalidatePath } from 'next/cache';

import { evaluateTopic } from '@/lib/ai/filter';
import { generateVariants, critiqueVariants } from '@/lib/ai/create';
import { saveMaterial, saveTopic, updateMockTopic } from '@/lib/db/repository';

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

        if (passed) {
            await updateMockTopic(topicId, { status: 'candidates' });
        }

        revalidatePath('/'); // Refresh Kanban UI

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

        // Update Database to Drafts state with Variants
        await updateMockTopic(topicId, {
            status: 'drafts',
            variants: variants,
            critique: scores
        });

        revalidatePath('/'); // Refresh Kanban UI
        return { success: true, variants, scores };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

export async function publishDraft(topicId: string, finalContent: string) {
    try {
        const { publishTweet } = await import('@/lib/publish/twitter');
        const publishResult = await publishTweet(topicId, finalContent);

        revalidatePath('/'); // Refresh Kanban UI
        return { success: true, url: publishResult.fakeUrl };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

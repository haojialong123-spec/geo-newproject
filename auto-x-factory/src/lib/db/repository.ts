import { supabase } from './client';

export async function saveMaterial(query: string, content: string, url: string): Promise<string> {
    // MOCK IMPLEMENTATION: Bypass Supabase to prevent 500 errors when env vars are missing
    console.log(`[MOCK DB] Saved Material: ${query.substring(0, 20)}...`);
    return `mock-material-${Date.now()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveTopic(materialId: string, title: string, scoreData: any): Promise<string> {
    // MOCK IMPLEMENTATION: Bypass Supabase to prevent 500 errors when env vars are missing
    console.log(`[MOCK DB] Saved Topic: ${title}`);
    return `mock-topic-${Date.now()}`;
}

export async function loadCandidates() {
    const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('status', 'candidates')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading candidates:", error);
        return [];
    }
    return data;
}

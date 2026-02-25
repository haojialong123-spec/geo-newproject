import { supabase } from './client';

export async function saveMaterial(query: string, content: string, url: string): Promise<string> {
    const { data, error } = await supabase
        .from('materials')
        .insert([{ query, content, source_url: url }])
        .select('id')
        .single();

    if (error) {
        console.error("Error saving material:", error);
        throw new Error("Failed to save material");
    }

    return data.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveTopic(materialId: string, title: string, scoreData: any): Promise<string> {
    const { data, error } = await supabase
        .from('topics')
        .insert([{
            material_id: materialId,
            title,
            score_data: scoreData,
            status: 'candidates',
        }])
        .select('id')
        .single();

    if (error) {
        console.error("Error saving topic:", error);
        throw new Error("Failed to save topic");
    }

    return data.id;
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

// Mock repository functions pending actual Supabase client setup pointing to a test DB
export async function saveMaterial(query: string, content: string, url: string): Promise<string> {
    return "mock-uuid-1234";
}

export async function saveTopic(materialId: string, title: string, scoreData: any): Promise<string> {
    return "mock-topic-uuid";
}

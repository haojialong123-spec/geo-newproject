import { supabase } from './client';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'mock-db.json');

function readDb() {
    if (!fs.existsSync(DB_PATH)) return [];
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
        return [];
    }
}

function writeDb(data: any) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function getMockTopics() {
    return readDb().sort((a: any, b: any) => b.created_at - a.created_at);
}

export async function updateMockTopic(id: string, updates: any) {
    const db = readDb();
    const index = db.findIndex((t: any) => t.id === id);
    if (index !== -1) {
        db[index] = { ...db[index], ...updates };
        writeDb(db);
    }
}

export async function saveMaterial(query: string, content: string, url: string): Promise<string> {
    console.log(`[MOCK DB] Saved Material: ${query.substring(0, 20)}...`);
    return `mock-material-${Date.now()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveTopic(materialId: string, title: string, scoreData: any): Promise<string> {
    const id = `mock-topic-${Date.now()}`;
    const db = readDb();
    db.push({
        id,
        material_id: materialId,
        title,
        score_data: scoreData,
        status: 'candidates',
        created_at: Date.now()
    });
    writeDb(db);
    console.log(`[MOCK DB] Saved Topic: ${title}`);
    return id;
}

export async function loadCandidates() {
    const db = readDb();
    return db.filter((t: any) => t.status === 'candidates').sort((a: any, b: any) => b.created_at - a.created_at);
}

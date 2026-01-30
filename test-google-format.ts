
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取环境变量
let apiKey = process.env.VITE_GEMINI_API_KEY;
let baseUrl = process.env.VITE_ANTIGRAVITY_BASE_URL || 'http://127.0.0.1:8045';

if (!apiKey) {
    const envLocalPath = join(__dirname, '.env.local');
    if (fs.existsSync(envLocalPath)) {
        const content = fs.readFileSync(envLocalPath, 'utf-8');
        const match = content.match(/VITE_GEMINI_API_KEY=(.+)/);
        if (match) {
            apiKey = match[1].trim();
        }
    }
}

console.log('----------------------------------------');
console.log('📡 API 测试 (模拟 Google Python SDK)');
console.log('----------------------------------------');

// 模拟 Python SDK: google.generativeai
// api_endpoint='http://127.0.0.1:8045'
// model.generate_content("Hello") -> POST /v1beta/models/gemini-3-flash:generateContent

async function testConnection() {
    const modelName = 'gemini-2.5-flash';
    // Python SDK 通常会拼接 /v1beta/models/...
    const url = `${baseUrl}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`Target URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'antigravity/1.15.8 darwin/arm64' // 伪装新版客户端
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hello" }]
                }]
            })
        });

        console.log(`HTTP 状态: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('🔍 原始响应:', text);

        try {
            const data = JSON.parse(text);
            if (data.candidates && data.candidates[0].content) {
                console.log(`\n✅ 测试通过!`);
                console.log(`🤖 回复: "${data.candidates[0].content.parts[0].text}"`);
            } else if (data.error) {
                console.error(`❌ API 错误: ${data.error.message}`);
            }
        } catch (e) {
            console.error('API 响应解析失败');
        }

    } catch (error: any) {
        console.error(`❌ 连接错误: ${error.message}`);
    }
}

testConnection();

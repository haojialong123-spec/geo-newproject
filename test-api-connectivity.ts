
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
console.log('📡 API 连接性测试 (基于配置截图从新调整)');
console.log('----------------------------------------');
console.log(`URL: ${baseUrl}/v1/chat/completions`);
console.log(`Key: ${apiKey?.substring(0, 10)}...`);
console.log(`Model: gemini-3-flash`);
console.log('----------------------------------------');

async function testConnection() {
    console.log('正在发送 OpenAI 格式请求...');

    try {
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // OpenAI 标准鉴权
            },
            body: JSON.stringify({
                model: 'gemini-3-flash', // 严格匹配配置截图中的 ID
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Say "Connection Successful"' }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        const status = response.status;
        console.log(`HTTP 状态: ${status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ 请求失败: ${errorText}`);
            return;
        }

        const data = await response.json();
        console.log('🔍 原始响应:', JSON.stringify(data));

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            console.log(`\n✅ 测试通过!`);
            console.log(`🤖 回复: "${data.choices[0].message.content}"`);
        } else {
            console.error('❌ 响应格式不符合 OpenAI 标准');
        }

    } catch (error: any) {
        console.error(`❌ 连接错误: ${error.message}`);
    }
}

testConnection();

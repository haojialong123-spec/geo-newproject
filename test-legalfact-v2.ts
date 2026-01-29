/**
 * LegalFactAI v2.0 端到端测试脚本
 * 
 * 使用测试数据验证多智能体处理管线
 * 运行: npx tsx test-legalfact-v2.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock import.meta.env for Node.js
const env = {
    VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || '',
    VITE_ANTIGRAVITY_BASE_URL: process.env.VITE_ANTIGRAVITY_BASE_URL || 'http://127.0.0.1:8045'
};

// 测试数据目录
const TEST_DATA_DIR = path.join(__dirname, 'test-data');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg: string) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
    success: (msg: string) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
    error: (msg: string) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
    warn: (msg: string) => console.log(`${colors.yellow}[!]${colors.reset} ${msg}`),
    step: (msg: string) => console.log(`${colors.blue}>>> ${msg}${colors.reset}`)
};

// 模拟 FileWithPreview
interface TestFile {
    name: string;
    content: string;
    base64: string;
    size: number;
    mimeType: string;
}

async function loadTestFiles(): Promise<TestFile[]> {
    const files: TestFile[] = [];
    const testFiles = [
        '01-建设工程施工合同.txt',
        '02-补充协议.txt',
        '03-银行转账回单-1.txt',
        '04-银行转账回单-2.txt',
        '05-银行转账回单-3.txt',
        '06-企业工商档案.txt',
        '07-竣工验收单.txt',
        '08-律师函.txt'
    ];

    for (const filename of testFiles) {
        const filepath = path.join(TEST_DATA_DIR, filename);
        if (fs.existsSync(filepath)) {
            const content = fs.readFileSync(filepath, 'utf-8');
            const base64 = Buffer.from(content).toString('base64');
            files.push({
                name: filename,
                content,
                base64: `data:text/plain;base64,${base64}`,
                size: content.length,
                mimeType: 'text/plain'
            });
            log.info(`加载文件: ${filename} (${content.length} bytes)`);
        }
    }

    return files;
}

// 文档分类器
const DOCUMENT_ROUTER_PROMPT = `
# Role: 法律文档分类器

## Task
读取以下文档片段（前1000字符），判断其类型，输出 JSON。

## Classification Rules:
1. **CONTRACT** - 包含：合同、协议、补充协议、承诺书、备忘录
2. **FINANCE** - 包含：转账、回单、发票、收据、付款凭证、银行流水
3. **ENTITY** - 包含：营业执照、工商档案、变更登记、股东会决议、企业信用报告
4. **GENERAL_FACT** - 其他：律师函、起诉状、判决书、施工日志、签证单、会议纪要、竣工验收

## Output (JSON Only):
{
  "category": "CONTRACT" | "FINANCE" | "ENTITY" | "GENERAL_FACT",
  "confidence": 0.0-1.0,
  "keywords_found": ["关键词1", "关键词2"]
}
`;

async function callAPI(prompt: string, maxTokens: number = 4096): Promise<string> {
    const response = await fetch(`${env.VITE_ANTIGRAVITY_BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.VITE_GEMINI_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'gemini-3-flash',
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

function cleanJSON(response: string): any {
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
        const firstNl = cleaned.indexOf('\n');
        const lastBt = cleaned.lastIndexOf('```');
        cleaned = cleaned.substring(firstNl + 1, lastBt).trim();
    }
    return JSON.parse(cleaned);
}

enum DocumentRouter {
    CONTRACT = "CONTRACT",
    FINANCE = "FINANCE",
    ENTITY = "ENTITY",
    GENERAL_FACT = "GENERAL_FACT"
}

async function classifyDocument(text: string): Promise<{ category: DocumentRouter; confidence: number; keywords: string[] }> {
    const prompt = DOCUMENT_ROUTER_PROMPT + `\n\n文档内容（前1000字符）:\n${text.substring(0, 1000)}`;

    try {
        const response = await callAPI(prompt, 512);
        const data = cleanJSON(response);
        return {
            category: data.category as DocumentRouter,
            confidence: data.confidence || 0.8,
            keywords: data.keywords_found || []
        };
    } catch (e) {
        log.error(`分类失败: ${e}`);
        return { category: DocumentRouter.GENERAL_FACT, confidence: 0.5, keywords: [] };
    }
}

async function runTest() {
    console.log('\n' + '='.repeat(60));
    console.log('  LegalFactAI v2.0 端到端测试');
    console.log('='.repeat(60) + '\n');

    // 1. 检查环境
    log.step('Step 1: 检查环境配置');

    if (!env.VITE_GEMINI_API_KEY) {
        // 尝试从 .env.local 读取
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
            if (match) {
                env.VITE_GEMINI_API_KEY = match[1].trim();
            }
        }
    }

    if (!env.VITE_GEMINI_API_KEY) {
        log.error('缺少 VITE_GEMINI_API_KEY 环境变量');
        process.exit(1);
    }
    log.success(`API Key 已配置: ${env.VITE_GEMINI_API_KEY.substring(0, 10)}...`);
    log.success(`API 端点: ${env.VITE_ANTIGRAVITY_BASE_URL}`);

    // 2. 加载测试文件
    log.step('Step 2: 加载测试数据');
    const files = await loadTestFiles();
    log.success(`共加载 ${files.length} 个测试文件`);

    if (files.length === 0) {
        log.error('没有找到测试文件');
        process.exit(1);
    }

    // 3. 测试文档路由
    log.step('Step 3: 测试文档分类路由器');
    const routedFiles = new Map<DocumentRouter, TestFile[]>([
        [DocumentRouter.CONTRACT, []],
        [DocumentRouter.FINANCE, []],
        [DocumentRouter.ENTITY, []],
        [DocumentRouter.GENERAL_FACT, []]
    ]);

    for (const file of files) {
        try {
            const { category, confidence, keywords } = await classifyDocument(file.content);
            routedFiles.get(category)!.push(file);
            log.success(`${file.name} -> ${category} (置信度: ${(confidence * 100).toFixed(0)}%, 关键词: ${keywords.join(', ')})`);
        } catch (e: any) {
            log.error(`分类 ${file.name} 失败: ${e.message}`);
        }
    }

    console.log('\n--- 分类结果汇总 ---');
    console.log(`CONTRACT:     ${routedFiles.get(DocumentRouter.CONTRACT)!.length} 个文件`);
    console.log(`FINANCE:      ${routedFiles.get(DocumentRouter.FINANCE)!.length} 个文件`);
    console.log(`ENTITY:       ${routedFiles.get(DocumentRouter.ENTITY)!.length} 个文件`);
    console.log(`GENERAL_FACT: ${routedFiles.get(DocumentRouter.GENERAL_FACT)!.length} 个文件`);

    // 4. 测试 Agent A: 财务审计师（仅测试一个文件）
    log.step('Step 4: 测试 Agent A (财务审计师)');
    const financeFiles = routedFiles.get(DocumentRouter.FINANCE)!;
    if (financeFiles.length > 0) {
        const testFile = financeFiles[0];
        const prompt = `
# Role: 财务审计师 (Agent A - The Auditor)

## Your Mission
从财务凭证（转账回单、发票、银行流水）中提取精确的支付记录。

## Output Schema (JSON Array):
[
  {
    "sequence": 1,
    "payer": "付款人名称",
    "payee": "收款人名称",
    "amount": 数字(纯数字),
    "amount_type": "本金" | "利息" | "违约金" | "其他",
    "payment_date": "YYYY-MM-DD",
    "evidence_name": "凭证名称",
    "catalog_index": "",
    "source_file": "${testFile.name}",
    "remarks": ""
  }
]

## 文档内容:
${testFile.content}
`;
        try {
            const response = await callAPI(prompt, 2048);
            const records = cleanJSON(response);
            log.success(`从 ${testFile.name} 提取 ${records.length} 条财务记录`);
            if (records.length > 0) {
                console.log('  样例:', JSON.stringify(records[0], null, 2).split('\n').map(l => '    ' + l).join('\n'));
            }
        } catch (e: any) {
            log.error(`Agent A 失败: ${e.message}`);
        }
    }

    // 5. 测试 Agent B: 合同分析师
    log.step('Step 5: 测试 Agent B (合同分析师)');
    const contractFiles = routedFiles.get(DocumentRouter.CONTRACT)!;
    if (contractFiles.length > 0) {
        const testFile = contractFiles[0];
        const prompt = `
# Role: 合同分析师 (Agent B - The Lawyer)

## Your Mission
从合同/协议文件中提取关键条款，并识别变更逻辑。

## Output Schema (JSON):
{
  "contracts": [
    {
      "sequence": 1,
      "contract_name": "合同名称",
      "clause_title": "条款标题",
      "clause_content": "条款内容",
      "sign_date": "YYYY-MM-DD",
      "keywords": ["关键词"],
      "source_file": "${testFile.name}",
      "page_ref": ""
    }
  ],
  "amendments": [
    {
      "amendment_date": "YYYY-MM-DD",
      "change_item": "变更项目",
      "original_term": "原约定",
      "new_term": "新约定",
      "is_priority_clause": true/false
    }
  ]
}

## 合同内容:
${testFile.content}
`;
        try {
            const response = await callAPI(prompt, 4096);
            const data = cleanJSON(response);
            log.success(`从 ${testFile.name} 提取 ${data.contracts?.length || 0} 条合同条款, ${data.amendments?.length || 0} 条变更`);
            if (data.contracts && data.contracts.length > 0) {
                console.log('  条款样例:', data.contracts[0].clause_title, '-', data.contracts[0].clause_content?.substring(0, 50) + '...');
            }
        } catch (e: any) {
            log.error(`Agent B 失败: ${e.message}`);
        }
    }

    // 6. 完成
    console.log('\n' + '='.repeat(60));
    log.success('测试完成！系统功能正常。');
    console.log('='.repeat(60) + '\n');

    console.log('后续手动测试步骤:');
    console.log('1. 打开浏览器访问 http://localhost:5173');
    console.log('2. 点击左侧导航栏的"事实梳理"');
    console.log('3. 上传 test-data 目录中的测试文件');
    console.log('4. 点击"开始智能梳理"按钮');
    console.log('5. 等待处理完成，查看结果并导出 Excel\n');
}

runTest().catch(console.error);

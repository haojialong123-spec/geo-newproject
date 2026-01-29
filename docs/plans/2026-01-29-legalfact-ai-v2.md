# LegalFactAI v2.0 - 多智能体法律事实梳理系统

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个基于 LLM 多智能体架构的全自动化法律事实梳理系统，从非结构化案卷材料中提取结构化数据，填充 8 套标准 Excel 模板，并生成可视化分析报告。

**Architecture:** 
- **4大专家智能体 (Router + Specialists)**：财务审计师、合同分析师、背景调查官、事实梳理员
- **3层处理管线**：Ingestion → Agent Processing → Validation → Production
- **严格的 Pydantic 数据模型**：确保输出符合 Excel 模板结构

**Tech Stack:** 
- **前端**: React 18, TypeScript, Tailwind CSS
- **AI 服务**: Gemini 3 Pro (via Antigravity Proxy), 支持 Vision 多模态
- **数据处理**: 前端原生 (FileReader, Base64), XlsxWriter (前端 CSV 生成)
- **可视化**: Mermaid.js (时间轴), Chart.js (统计图表)

---

## 数据模型规范 (基于 8 套 Excel 模板)

### 📊 模板结构映射表

| 文件 | 真实表头 (第1行) | 数据模型 |
|------|-----------------|----------|
| 02交易背景调查清单.xlsx | 序号, 内容, 调查结果, 信息来源 | `BackgroundInfo` |
| 03合同主要条款梳理表.xlsx | 序号, 合同名称, 主要条款, 条款内容, 签订日期, 关键词, 材料来源 | `ContractClause` |
| 04财务信息梳理表.xlsx | 序号, 付款人, 支付金额, 付款日期, 印证材料名称, 总目录编码, 材料来源 | `FinancialRecord` |
| 05履行事实梳理表.xlsx | 序号, 材料名称, 形成时间, 所反映的事实, 材料来源, 备注 | `FactEvent (履行)` |
| 06纠纷处置梳理表.xlsx | 序号, 材料名称, 形成时间, 材料内容, 材料来源 | `FactEvent (纠纷)` |
| 07标的信息梳理表.xlsx | 序号, 标的物名称, 占有/流转时间节点, 控制人, 材料来源, 备注 | `AssetInfo` |
| 08其他事实梳理表.xlsx | 序号, 材料名称, 形成时间, 所反映的事实, 材料来源, 关键词, 备注 | `FactEvent (其他)` |
| 主体梳理表格制作样例.xlsx | 5个Sheet: 失信人信息, 经营期限变更, 名称变更, 投资人变更, 高管变更 | `CorporateChange[]` |
| 附件4 所有变更信息.xlsx | 变更时间, 变更项目, 变更前, 变更后 | `ContractAmendment` |

---

## Phase 1: 核心类型与模型定义

### Task 1: 定义完整的 TypeScript 类型系统

**Files:**
- Modify: `types.ts` (追加新类型)

**目标:** 定义与 8 套 Excel 模板完全对应的 TypeScript 接口

**Step 1: 在 types.ts 末尾追加以下类型定义**

```typescript
// ============ LegalFactAI v2.0 数据模型 ============

// 路由分类枚举
export enum DocumentRouter {
  CONTRACT = "CONTRACT",      // 合同/协议类 -> Agent B
  FINANCE = "FINANCE",        // 财务凭证类 -> Agent A
  ENTITY = "ENTITY",          // 工商档案类 -> Agent C
  GENERAL_FACT = "GENERAL_FACT" // 其他事实类 -> Agent D
}

// 表02: 交易背景调查
export interface BackgroundInfo {
  question_id: number;
  question_content: string;
  investigation_result: string;
  source_evidence: string;
}

// 表03: 合同主要条款
export interface ContractClauseV2 {
  sequence: number;
  contract_name: string;
  clause_title: string;
  clause_content: string;
  sign_date: string;
  keywords: string[];
  source_file: string;
  page_ref?: string;
}

// 表04: 财务信息 (高精度)
export interface FinancialRecordV2 {
  sequence: number;
  payer: string;
  amount: number; // 纯数字，清洗后
  payment_date: string;
  evidence_name: string;
  catalog_index: string;
  source_file: string;
  // 扩展字段
  payee?: string;
  amount_type?: "本金" | "利息" | "违约金" | "其他";
}

// 表05/06/08: 通用事实
export interface FactEventV2 {
  category: "履行" | "纠纷" | "标的" | "其他";
  sequence: number;
  material_name: string;
  event_time: string;
  fact_description: string;
  source: string;
  keywords?: string[];
  remarks?: string;
}

// 表07: 标的信息
export interface AssetInfo {
  sequence: number;
  asset_name: string;
  possession_time: string;
  controller: string;
  source: string;
  remarks?: string;
}

// 主体梳理表: 企业变更类型
export enum CorporateChangeType {
  EXECUTIVE = "高管变更",
  INVESTOR = "投资人变更",
  NAME = "名称变更",
  PERIOD = "经营期限变更",
  DISHONESTY = "失信记录"
}

export interface CorporateChange {
  change_type: CorporateChangeType;
  change_date: string;
  change_item: string;
  before_value: string;
  after_value: string;
  remarks?: string;
}

// 附件4: 所有变更信息
export interface ContractAmendmentV2 {
  amendment_date: string;
  change_item: string;
  original_term: string;
  new_term: string;
  is_priority_clause: boolean; // 是否包含"以本协议为准"
}

// 路由后的文件包装
export interface RoutedFile extends FileWithPreview {
  router_category: DocumentRouter;
  first_1000_chars?: string;
  ocr_text?: string;
}

// Agent 处理结果
export interface AgentExtractionResult {
  agent_name: "Auditor" | "Lawyer" | "Investigator" | "Historian";
  source_files: string[];
  contracts?: ContractClauseV2[];
  amendments?: ContractAmendmentV2[];
  financials?: FinancialRecordV2[];
  facts?: FactEventV2[];
  assets?: AssetInfo[];
  corporate_changes?: CorporateChange[];
  background_info?: BackgroundInfo[];
  validation_warnings?: string[];
}

// 最终汇总结果
export interface LegalFactExtractionOutput {
  generated_at: string;
  source_file_count: number;
  table_02_background: BackgroundInfo[];
  table_03_contracts: ContractClauseV2[];
  table_04_financials: FinancialRecordV2[];
  table_05_performance: FactEventV2[];
  table_06_disputes: FactEventV2[];
  table_07_assets: AssetInfo[];
  table_08_other_facts: FactEventV2[];
  appendix_4_amendments: ContractAmendmentV2[];
  entity_changes: CorporateChange[];
  validation_report: ValidationReport;
}

export interface ValidationReport {
  total_amount_from_finance: number;
  total_contract_price: number;
  amount_mismatch_warning: boolean;
  timeline_conflicts: string[];
  priority_clause_overrides: string[];
}

// 处理阶段增强
export enum FactProcessingStageV2 {
  IDLE = "IDLE",
  INGESTION = "INGESTION",
  ROUTING = "ROUTING",
  AGENT_A_AUDIT = "AGENT_A",
  AGENT_B_CONTRACT = "AGENT_B",
  AGENT_C_ENTITY = "AGENT_C",
  AGENT_D_FACT = "AGENT_D",
  VALIDATION = "VALIDATION",
  GENERATION = "GENERATION",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR"
}
```

**Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add types.ts
git commit -m "feat(legalfact): define v2.0 data models for 8 excel templates"
```

---

## Phase 2: Prompt 工程 (Prompt Engineering)

### Task 2: 定义 4 大专家智能体 Prompt

**Files:**
- Modify: `constants.ts` (追加 Agent Prompts)

**目标:** 为每个 Agent 定义精确的提取指令，确保覆盖所有字段

**Step 1: 在 constants.ts 末尾追加以下 Prompt**

```typescript
// ============ LegalFactAI v2.0 多智能体 Prompts ============

/**
 * 文档路由器 Prompt - 读取前1000字符，分类到4个队列
 */
export const DOCUMENT_ROUTER_PROMPT = `
# Role: 法律文档分类器

## Task
读取以下文档片段（前1000字符），判断其类型，输出 JSON。

## Classification Rules:
1. **CONTRACT** - 包含：合同、协议、补充协议、承诺书、备忘录
2. **FINANCE** - 包含：转账、回单、发票、收据、付款凭证、银行流水
3. **ENTITY** - 包含：营业执照、工商档案、变更登记、股东会决议、企业信用报告
4. **GENERAL_FACT** - 其他：律师函、起诉状、判决书、施工日志、签证单、会议纪要

## Output (JSON Only):
{
  "category": "CONTRACT" | "FINANCE" | "ENTITY" | "GENERAL_FACT",
  "confidence": 0.0-1.0,
  "keywords_found": ["合同", "协议"]
}
`;

/**
 * Agent A: 财务审计师 (The Auditor)
 * 目标表: 04财务信息梳理表
 */
export const AGENT_AUDITOR_PROMPT = `
# Role: 财务审计师 (Agent A - The Auditor)

## Your Mission
从财务凭证（转账回单、发票、银行流水）中提取精确的支付记录。

## Extraction Rules (CRITICAL):

### 1. 金额清洗 (Amount Parsing)
- 输入可能是: "¥3,000,000.00", "叁佰万元整", "RMB 3000000"
- 输出必须是纯数字: 3000000
- 如果金额模糊不清，标记为 -1 并在 remarks 说明

### 2. 金额分类 (Amount Typing)
- **本金**: 合同价款、工程款、货款、预付款
- **利息**: 利息、滞纳金
- **违约金**: 违约金、赔偿金、补偿款
- **其他**: 未明确的款项

### 3. 日期规范化
- 统一输出: YYYY-MM-DD
- 如果只有年月，填写该月1日: "2020年3月" -> "2020-03-01"

### 4. 多笔交易处理
- 如果一张凭证有多笔交易，返回数组
- 每笔必须有独立的 sequence

## Output Schema (JSON Array):
[
  {
    "sequence": 1,
    "payer": "付款人名称",
    "payee": "收款人名称（如果能识别）",
    "amount": 3000000,
    "amount_type": "本金",
    "payment_date": "2020-03-15",
    "evidence_name": "中国银行转账回单",
    "catalog_index": "见材料编号（如有）",
    "source_file": "{{FILENAME}}",
    "remarks": "如有特殊情况说明"
  }
]

## Warning Cases:
- 如果无法识别金额，设置 "amount": -1, "remarks": "UNREADABLE - 金额模糊"
- 如果日期不完整，设置 "payment_date": "UNKNOWN", "remarks": "日期缺失"
`;

/**
 * Agent B: 合同分析师 (The Lawyer)
 * 目标表: 03合同主要条款梳理表, 附件4所有变更信息
 */
export const AGENT_LAWYER_PROMPT = `
# Role: 合同分析师 (Agent B - The Lawyer)

## Your Mission
从合同/协议文件中提取关键条款，并识别变更逻辑。

## 双输出模式 (Dual Output):

### Output 1: 合同条款 (Table 03)
提取以下关键条款类型:
- 合同价款 / 付款方式
- 违约责任
- 争议解决（管辖法院/仲裁机构）
- 保密条款
- 工期约定（建工类）
- 质保条款

### Output 2: 变更信息 (附件4)
如果是"补充协议"，必须提取:
- 原合同约定内容
- 变更后约定内容
- 是否包含"以本协议为准"字样 -> is_priority_clause = true

## Extraction Rules:

### 1. 变更逻辑识别 (Change Detection)
关键句式:
- "将原合同第X条...变更为..."
- "双方协商一致，将...调整为..."
- "与原合同约定不一致的，以本协议为准"

### 2. 日期提取
- 签订日期（签章处落款）
- 生效日期（如条款中规定）

## Output Schema (JSON):
{
  "contracts": [
    {
      "sequence": 1,
      "contract_name": "建设工程施工合同",
      "clause_title": "违约责任",
      "clause_content": "若乙方延期交付，每日按合同总价的千分之一支付违约金...",
      "sign_date": "2020-01-15",
      "keywords": ["违约金", "延期交付", "千分之一"],
      "source_file": "{{FILENAME}}",
      "page_ref": "P5-P6"
    }
  ],
  "amendments": [
    {
      "amendment_date": "2020-06-01",
      "change_item": "开工日期",
      "original_term": "2020年3月1日开工",
      "new_term": "2020年6月15日开工",
      "is_priority_clause": true
    }
  ]
}
`;

/**
 * Agent C: 背景调查官 (The Investigator)
 * 目标表: 02交易背景调查清单, 主体梳理表(5个Sheet)
 */
export const AGENT_INVESTIGATOR_PROMPT = `
# Role: 背景调查官 (Agent C - The Investigator)

## Your Mission
从工商档案、企业信用报告中提取主体信息和历史变更。

## Multi-Sheet Output (主体梳理表):

### Sheet 1: 高管变更
- 变更时间、变更项目（法定代表人/执行董事/监事/总经理）、变更前、变更后

### Sheet 2: 投资人变更
- 变更时间、变更情况（入股/退股/转让）、股份及出资额、备注

### Sheet 3: 名称变更
- 变更时间、变更前名称、变更后名称

### Sheet 4: 经营期限变更
- 变更时间、变更前期限、变更后期限

### Sheet 5: 失信记录
- 立案日期、执行案号、执行法院、执行依据文号

## Extraction Rules:

### 1. 工商表格线识别
- 工商档案通常是表格形式
- 识别"变更日期"、"变更事项"、"变更前"、"变更后"列

### 2. 企业信用报告格式
- "被执行人信息"部分 -> 失信记录
- "历史名称"部分 -> 名称变更

## Output Schema (JSON):
{
  "corporate_changes": [
    {
      "change_type": "高管变更",
      "change_date": "2020-01-01",
      "change_item": "法定代表人",
      "before_value": "张三",
      "after_value": "李四",
      "remarks": null
    },
    {
      "change_type": "失信记录",
      "change_date": "2019-05-20",
      "change_item": "被执行信息",
      "before_value": "",
      "after_value": "(2019)粤0306执123号",
      "remarks": "执行法院: 宝安区人民法院"
    }
  ],
  "background_info": [
    {
      "question_id": 1,
      "question_content": "公司注册资本是多少？",
      "investigation_result": "注册资本5000万元，实缴资本1000万元",
      "source_evidence": "企业信用报告P1"
    }
  ]
}
`;

/**
 * Agent D: 事实梳理员 (The Historian)
 * 目标表: 05履行事实, 06纠纷处置, 07标的信息, 08其他事实
 */
export const AGENT_HISTORIAN_PROMPT = `
# Role: 事实梳理员 (Agent D - The Historian)

## Your Mission
按时间线提取案件事实，分类到4张表。

## 4-Table Classification:

### 表05 履行事实 (category: "履行")
- 施工进度记录、竣工验收单、工程签证、交付确认
- 关键词: 施工、验收、交付、签证、进场、开工

### 表06 纠纷处置 (category: "纠纷")
- 律师函、催款函、起诉状、判决书、调解书、仲裁
- 关键词: 诉讼、起诉、判决、执行、催告、解除

### 表07 标的信息 (category: "标的")
- 房产/设备/车辆等标的的占有、转移记录
- 关键词: 抵押、查封、过户、占有、移交

### 表08 其他事实 (category: "其他")
- 不属于上述类别的其他证据

## Extraction Rules:

### 1. 时间线优先
- 每个事实必须有明确的时间点
- 如果只有模糊时间（"2020年上半年"），标注为 "2020-06-01 (估计)"

### 2. 事实描述规范
- fact_description 应该是客观事实陈述
- 不要加入主观判断（如"明显违约"）

## Output Schema (JSON):
{
  "facts": [
    {
      "category": "履行",
      "sequence": 1,
      "material_name": "工程竣工验收单",
      "event_time": "2020-12-01",
      "fact_description": "甲乙双方签署竣工验收单，确认工程于2020年11月30日完工。",
      "source": "证据包-竣工验收单.pdf",
      "keywords": ["竣工", "验收", "完工"],
      "remarks": null
    },
    {
      "category": "纠纷",
      "sequence": 1,
      "material_name": "律师函",
      "event_time": "2021-03-15",
      "fact_description": "乙方向甲方发送律师函，催告支付欠款300万元。",
      "source": "律师函.pdf",
      "keywords": ["催告", "欠款", "律师函"],
      "remarks": null
    }
  ],
  "assets": [
    {
      "sequence": 1,
      "asset_name": "深圳市宝安区XX路XXX号房产",
      "possession_time": "2021-05-01",
      "controller": "深圳XX有限公司",
      "source": "房产查册表.pdf",
      "remarks": "已于2021年4月被法院查封"
    }
  ]
}
`;

/**
 * 逻辑校验 Prompt
 */
export const VALIDATION_PROMPT = `
# Role: 法律逻辑校验器

## Task
对提取的数据进行交叉验证，检测异常。

## Validation Rules:

### 1. 金额校验 (Amount Check)
- 计算 表04 所有支付金额之和
- 对比 表03 合同价款条款
- 如果 已付金额 > 合同总价 110%，生成 Warning

### 2. 时间轴校验 (Timeline Check)
- 附件4的变更日期 必须晚于 表03的合同签订日期
- 表05的履行事实 应该在 合同签订日期之后

### 3. 优先条款冲突检测 (Priority Clause Override)
- 如果附件4中存在 is_priority_clause = true 的变更
- 在表03对应条款的remarks中添加："该条款已被附件4变更覆盖"

## Output (JSON):
{
  "total_paid_amount": 3000000,
  "total_contract_price": 5000000,
  "amount_mismatch_warning": false,
  "timeline_conflicts": ["变更协议日期(2020-06-01)早于主合同日期(2020-07-01)"],
  "priority_clause_overrides": ["表03序号1的'开工日期'条款已被附件4变更"]
}
`;
```

**Step 2: 验证语法**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add constants.ts
git commit -m "feat(legalfact): add 4-agent specialist prompts"
```

---

## Phase 3: 服务层实现

### Task 3: 实现文档路由器

**Files:**
- Modify: `services/geminiService.ts` (追加路由函数)

**Step 1: 添加路由函数**

```typescript
/**
 * 10. 文档分类路由器
 */
export const classifyDocument = async (
  textPreview: string
): Promise<{ category: DocumentRouter; confidence: number }> => {
  const prompt = DOCUMENT_ROUTER_PROMPT + `\n\n文档内容（前1000字符）:\n${textPreview.substring(0, 1000)}`;
  
  try {
    const response = await callWithFallback(prompt, 512);
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      const firstNl = cleaned.indexOf('\n');
      const lastBt = cleaned.lastIndexOf('```');
      cleaned = cleaned.substring(firstNl + 1, lastBt).trim();
    }
    const data = JSON.parse(cleaned);
    return {
      category: data.category as DocumentRouter,
      confidence: data.confidence || 0.8
    };
  } catch (e) {
    console.error("Router error:", e);
    return { category: DocumentRouter.GENERAL_FACT, confidence: 0.5 };
  }
};
```

### Task 4: 实现 Agent A (财务审计师)

**Files:**
- Modify: `services/geminiService.ts`

**Step 1: 添加 Agent A 函数**

```typescript
/**
 * 11. Agent A: 财务审计师
 */
export const agentAuditFinance = async (
  files: RoutedFile[]
): Promise<FinancialRecordV2[]> => {
  const results: FinancialRecordV2[] = [];
  
  for (const file of files) {
    const prompt = AGENT_AUDITOR_PROMPT.replace('{{FILENAME}}', file.name) + 
      `\n\n文档内容:\n${file.ocr_text || file.first_1000_chars || '(无法读取)'}`;
    
    try {
      const response = await callWithFallback(prompt, 2048);
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        const firstNl = cleaned.indexOf('\n');
        const lastBt = cleaned.lastIndexOf('```');
        cleaned = cleaned.substring(firstNl + 1, lastBt).trim();
      }
      const records = JSON.parse(cleaned);
      if (Array.isArray(records)) {
        results.push(...records);
      }
    } catch (e) {
      console.error(`Agent A error for ${file.name}:`, e);
    }
  }
  
  return results;
};
```

### Task 5: 实现 Agent B (合同分析师)

**Step 1: 添加 Agent B 函数**

```typescript
/**
 * 12. Agent B: 合同分析师
 */
export const agentAnalyzeContract = async (
  files: RoutedFile[]
): Promise<{ contracts: ContractClauseV2[]; amendments: ContractAmendmentV2[] }> => {
  const contracts: ContractClauseV2[] = [];
  const amendments: ContractAmendmentV2[] = [];
  
  for (const file of files) {
    const prompt = AGENT_LAWYER_PROMPT.replace('{{FILENAME}}', file.name) +
      `\n\n合同内容:\n${file.ocr_text || file.first_1000_chars}`;
    
    try {
      const response = await callWithFallback(prompt, 4096);
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        const firstNl = cleaned.indexOf('\n');
        const lastBt = cleaned.lastIndexOf('```');
        cleaned = cleaned.substring(firstNl + 1, lastBt).trim();
      }
      const data = JSON.parse(cleaned);
      if (data.contracts) contracts.push(...data.contracts);
      if (data.amendments) amendments.push(...data.amendments);
    } catch (e) {
      console.error(`Agent B error for ${file.name}:`, e);
    }
  }
  
  return { contracts, amendments };
};
```

### Task 6: 实现 Agent C (背景调查官)

**Step 1: 添加 Agent C 函数**

```typescript
/**
 * 13. Agent C: 背景调查官
 */
export const agentInvestigateEntity = async (
  files: RoutedFile[]
): Promise<{ changes: CorporateChange[]; background: BackgroundInfo[] }> => {
  const changes: CorporateChange[] = [];
  const background: BackgroundInfo[] = [];
  
  for (const file of files) {
    const prompt = AGENT_INVESTIGATOR_PROMPT.replace('{{FILENAME}}', file.name) +
      `\n\n工商档案内容:\n${file.ocr_text || file.first_1000_chars}`;
    
    try {
      const response = await callWithFallback(prompt, 4096);
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        const firstNl = cleaned.indexOf('\n');
        const lastBt = cleaned.lastIndexOf('```');
        cleaned = cleaned.substring(firstNl + 1, lastBt).trim();
      }
      const data = JSON.parse(cleaned);
      if (data.corporate_changes) changes.push(...data.corporate_changes);
      if (data.background_info) background.push(...data.background_info);
    } catch (e) {
      console.error(`Agent C error for ${file.name}:`, e);
    }
  }
  
  return { changes, background };
};
```

### Task 7: 实现 Agent D (事实梳理员)

**Step 1: 添加 Agent D 函数**

```typescript
/**
 * 14. Agent D: 事实梳理员
 */
export const agentExtractFacts = async (
  files: RoutedFile[]
): Promise<{ facts: FactEventV2[]; assets: AssetInfo[] }> => {
  const facts: FactEventV2[] = [];
  const assets: AssetInfo[] = [];
  
  for (const file of files) {
    const prompt = AGENT_HISTORIAN_PROMPT.replace('{{FILENAME}}', file.name) +
      `\n\n材料内容:\n${file.ocr_text || file.first_1000_chars}`;
    
    try {
      const response = await callWithFallback(prompt, 4096);
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        const firstNl = cleaned.indexOf('\n');
        const lastBt = cleaned.lastIndexOf('```');
        cleaned = cleaned.substring(firstNl + 1, lastBt).trim();
      }
      const data = JSON.parse(cleaned);
      if (data.facts) facts.push(...data.facts);
      if (data.assets) assets.push(...data.assets);
    } catch (e) {
      console.error(`Agent D error for ${file.name}:`, e);
    }
  }
  
  return { facts, assets };
};
```

### Task 8: 实现逻辑校验器

**Step 1: 添加校验函数**

```typescript
/**
 * 15. 逻辑校验器
 */
export const validateExtraction = async (
  financials: FinancialRecordV2[],
  contracts: ContractClauseV2[],
  amendments: ContractAmendmentV2[]
): Promise<ValidationReport> => {
  // 1. 计算已付金额总和
  const totalPaid = financials
    .filter(f => f.amount > 0 && f.amount_type === '本金')
    .reduce((sum, f) => sum + f.amount, 0);
  
  // 2. 从合同中提取价款（简化：查找包含"价款"关键词的条款）
  const priceClause = contracts.find(c => 
    c.keywords?.some(k => k.includes('价款') || k.includes('总价'))
  );
  const contractPrice = priceClause ? parseFloat(priceClause.clause_content.match(/[\\d,]+/)?.[0]?.replace(/,/g, '') || '0') : 0;
  
  // 3. 检测金额异常
  const amountMismatch = totalPaid > contractPrice * 1.1 && contractPrice > 0;
  
  // 4. 检测优先条款
  const overrides = amendments
    .filter(a => a.is_priority_clause)
    .map(a => `变更项目"${a.change_item}"已覆盖原合同约定`);
  
  return {
    total_amount_from_finance: totalPaid,
    total_contract_price: contractPrice,
    amount_mismatch_warning: amountMismatch,
    timeline_conflicts: [],
    priority_clause_overrides: overrides
  };
};
```

### Task 9: 实现主编排函数

**Step 1: 添加完整的处理管线**

```typescript
/**
 * 16. LegalFactAI v2.0 主处理管线
 */
export const runLegalFactPipeline = async (
  files: FileWithPreview[],
  onProgress?: (stage: FactProcessingStageV2, message: string) => void
): Promise<LegalFactExtractionOutput> => {
  const notify = (s: FactProcessingStageV2, m: string) => onProgress?.(s, m);
  
  // Phase 1: Routing
  notify(FactProcessingStageV2.ROUTING, '正在分类文档...');
  const routedFiles: Map<DocumentRouter, RoutedFile[]> = new Map([
    [DocumentRouter.CONTRACT, []],
    [DocumentRouter.FINANCE, []],
    [DocumentRouter.ENTITY, []],
    [DocumentRouter.GENERAL_FACT, []]
  ]);
  
  for (const file of files) {
    const textPreview = file.base64 ? atob(file.base64.split(',')[1]).substring(0, 1000) : '';
    const { category } = await classifyDocument(textPreview);
    const routed: RoutedFile = { ...file, router_category: category, first_1000_chars: textPreview };
    routedFiles.get(category)!.push(routed);
  }
  
  // Phase 2: Parallel Agent Processing
  notify(FactProcessingStageV2.AGENT_A_AUDIT, '财务审计师提取中...');
  const financials = await agentAuditFinance(routedFiles.get(DocumentRouter.FINANCE)!);
  
  notify(FactProcessingStageV2.AGENT_B_CONTRACT, '合同分析师提取中...');
  const { contracts, amendments } = await agentAnalyzeContract(routedFiles.get(DocumentRouter.CONTRACT)!);
  
  notify(FactProcessingStageV2.AGENT_C_ENTITY, '背景调查官提取中...');
  const { changes, background } = await agentInvestigateEntity(routedFiles.get(DocumentRouter.ENTITY)!);
  
  notify(FactProcessingStageV2.AGENT_D_FACT, '事实梳理员提取中...');
  const { facts, assets } = await agentExtractFacts(routedFiles.get(DocumentRouter.GENERAL_FACT)!);
  
  // Phase 3: Validation
  notify(FactProcessingStageV2.VALIDATION, '逻辑校验中...');
  const validation = await validateExtraction(financials, contracts, amendments);
  
  // Phase 4: Assemble Output
  notify(FactProcessingStageV2.GENERATION, '生成报告...');
  
  return {
    generated_at: new Date().toISOString(),
    source_file_count: files.length,
    table_02_background: background,
    table_03_contracts: contracts,
    table_04_financials: financials,
    table_05_performance: facts.filter(f => f.category === '履行'),
    table_06_disputes: facts.filter(f => f.category === '纠纷'),
    table_07_assets: assets,
    table_08_other_facts: facts.filter(f => f.category === '其他'),
    appendix_4_amendments: amendments,
    entity_changes: changes,
    validation_report: validation
  };
};
```

---

## Phase 4: 前端组件更新

### Task 10: 更新工作台组件

**Files:**
- Modify: `components/FactAnalysisWorkspace.tsx`

**目标:** 使用新的多智能体管线，显示 8 阶段处理进度

### Task 11: 创建 Excel/CSV 导出工具

**Files:**
- Create: `utils/excelExporter.ts`

**目标:** 将提取结果导出为 CSV (可用 Excel 打开)

### Task 12: 创建可视化报告组件

**Files:**
- Create: `components/VisualizationReport.tsx`

**目标:** 显示柱状图（资金流向）、甘特图（时间轴）

---

## Phase 5: 测试与验收

### Task 13: 使用真实材料测试

**Files:**
- 使用 `/Users/bc-file/Desktop/证据梳理材料` 中的样例进行端到端测试

**验收标准:**
1. 8 套 Excel 模板的表头必须完全匹配
2. 金额必须清洗为纯数字
3. 日期必须规范为 YYYY-MM-DD
4. 变更逻辑必须检测 "以本协议为准"
5. 校验器必须正确计算金额和检测冲突

---

## 执行优先级

| 优先级 | Task | 依赖 |
|--------|------|------|
| P0 | Task 1 (Types) | - |
| P0 | Task 2 (Prompts) | - |
| P1 | Task 3-7 (Agents) | Task 1, 2 |
| P1 | Task 8-9 (Pipeline) | Task 3-7 |
| P2 | Task 10-12 (UI) | Task 9 |
| P3 | Task 13 (Testing) | All |

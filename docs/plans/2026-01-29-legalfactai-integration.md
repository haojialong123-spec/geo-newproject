# LegalFactAI 功能集成实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 LegalFactAI（建工案件事实梳理引擎）功能完整集成到现有 GEO 营销系统中，保持 UI 风格一致（琥珀色主题、深色侧边栏），复用现有服务架构。

**Architecture:** 
- 新增 `factAnalysis` 视图状态，在侧边栏添加"事实梳理"导航入口
- 复用现有 `geminiService.ts` 的 API 调用模式，新增 4 阶段处理管线
- 创建 3 个新组件：`FactAnalysisWorkspace.tsx`（主容器）、`EvidenceUpload.tsx`（证据上传）、`FactReport.tsx`（报告展示）

**Tech Stack:** React 18, TypeScript, 现有 Gemini 服务层 (Anthropic Messages API 代理), Tailwind CSS, react-markdown

---

## Task 1: 扩展类型定义

**Files:**
- Modify: `types.ts`

**Step 1: 添加事实梳理相关类型**

在 `types.ts` 文件末尾添加以下类型定义：

```typescript
// ============ LegalFactAI 事实梳理模块类型 ============

export enum FactDocumentType {
  CONTRACT = "主合同",
  SUPPLEMENTARY = "补充协议",
  RECEIPT = "支付凭证",
  OTHER = "其他"
}

export enum FactProcessingStage {
  IDLE = "IDLE",
  INGESTION = "INGESTION",
  EXTRACTION = "EXTRACTION",
  REASONING = "REASONING",
  GENERATION = "GENERATION",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR"
}

export interface ContractClause {
  text: string;
  article_ref?: string;
  page: number;
  conditions?: string[];
  consequence?: string;
  is_priority_clause: boolean;
}

export interface KeyEntity {
  role: string;
  name: string;
}

export interface ExtractedEvidence {
  filename: string;
  evidence_id?: string;
  doc_type: FactDocumentType;
  sign_date?: string;
  is_newest?: boolean;
  key_entities?: KeyEntity[];
  summary?: string;
  clauses?: ContractClause[];
  amount_principal?: number;
  amount_compensation?: number;
  raw_text?: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  type: 'contract' | 'payment' | 'dispute' | 'breach';
  citation?: string;
}

export interface FactAnalysisResult {
  markdownReport: string;
  timeline: TimelineEvent[];
  obligationStatus: string;
}

export interface FileWithPreview extends File {
  preview?: string;
  base64?: string;
  mimeType?: string;
}
```

**Step 2: 更新 ViewState 类型**

修改现有的 `ViewState` 类型，添加 `factAnalysis`：

```typescript
export type ViewState = 'dashboard' | 'generator' | 'templates' | 'knowledge' | 'factAnalysis';
```

**Step 3: 验证**

运行 `npm run dev` 确保无 TypeScript 错误。

---

## Task 2: 添加事实梳理 Prompt 常量

**Files:**
- Modify: `constants.ts`

**Step 1: 在文件末尾添加 LegalFactAI 的 System Prompts**

```typescript
// ============ LegalFactAI 事实梳理 Prompts ============

export const FACT_EXTRACTOR_PROMPT = `
你是一名拥有10年经验的法律数据录入专家。请从用户上传的建工案卷材料中提取信息，输出为 JSON。

### 关键提取规则（必须严格遵守）：

1. **手写体校正 (Handwriting Logic)**：
   - 极其注意手写签名与打印名字的核对。如果图片中识别出的手写签名（如"王继开"）与文中打印的姓名（如"王继升"）字形相近但不同，**必须以打印字体为准**。
   - 绝不允许输出不存在的人名。

2. **多重条件提取 (Compound Conditions)**：
   - 在提取"违约/退款触发条件"时，必须识别所有并列条件。
   - 警惕连接词："及"、"且"、"同时"、"以及"。
   - 示例：如果原文是"需提供1000万资金证明及政府开工令"，提取的 clauses 中 conditions 字段必须为 ["资金证明>=1000万", "政府开工令"]，严禁只提取前半句。

3. **金额精准分类**：
   - 区分【本金/预付款】（amount_principal）和【违约金/补偿款/赔偿金】（amount_compensation）。不要把它们混在一起。

4. **日期锚定**：
   - 提取所有签署日期。对于"补充协议"，必须提取其约定的"新开工日期"，并标记为 priority clause。

### 输出格式 (JSON Only):
{
  "doc_type": "主合同" | "补充协议" | "支付凭证" | "其他",
  "sign_date": "YYYY-MM-DD",
  "key_entities": [{"role": "甲方", "name": "..."}],
  "clauses": [
     {
       "text": "原文摘录",
       "article_ref": "第X条",
       "page": 1,
       "conditions": ["条件1", "条件2"],
       "consequence": "后果描述",
       "is_priority_clause": boolean (是否包含"以本协议为准"等效力覆盖条款)
     }
  ],
  "amount_principal": number (纯数字, 单位元),
  "amount_compensation": number (纯数字, 单位元),
  "summary": "简要描述"
}
`;

export const FACT_REASONER_PROMPT = `
你是一名好胜心强的诉讼律师，代表乙方（承包方/出资方）。请基于提取的数据构建证据链。

### 核心推理法则：

1. **效力金字塔 (Hierarchy)**：
   - 扫描所有文件日期。**以最新签署的文件为最高准则。**
   - 寻找"冲突解决条款"（Extracted fields: is_priority_clause）。一旦发现，旧合同中关于工期、赔偿的约定若与新协议冲突，统统作废。
   - 在输出中明确写出："虽然主合同约定X，但根据最新补充协议第Y条，双方已变更为Z。"

2. **履约闭环 (Performance Check)**：
   - 事实 = 义务 + 履行。
   - 义务端：合同说要付60万。
   - 履行端：查找转账记录（amount_principal）。如果找到匹配金额，时间在截止日前，判定为**"完美履约"**。

3. **违约狙击 (Breach Detection)**：
   - 拿着提取出的"多重条件"（如1000万证明+开工令）去比对事实。
   - 问自己：证据包里有对方提供的"1000万存款单"吗？有"开工令"吗？
   - 如果没有，立即判定：**"条件未成就，对方根本违约"**。

### 输出逻辑流要求：
先确立由于"证据X-新协议"的存在，旧合同被覆盖 -> 再证明我方已付钱（引用证据Y-凭证） -> 最后证明对方没拿出来"开工令"和"钱"（无凭证），导致我方有权解约。
`;

export const FACT_WRITER_PROMPT = `
请基于推理结果，撰写一份《法律事实梳理与策略分析意见书》。

### 写作规范：

1. **证据引用颗粒度**：
   - 严禁模糊引用。不要只写"见证据3"。
   - 必须写：**"（见证据4-补充协议 第5条）"** 或 **"（见证据3-转账凭证 P1）"**。
   - 这里的证据编号应对应输入数据中的标识。

2. **区分款项性质**：
   - 将"返还本金"（如60万）与"赔偿损失/补偿金"（如6万）分列。不要合并为一个总数，要让客户看清楚每一笔钱的名目。

3. **语气与立场**：
   - 专业、笃定。使用"根本违约"、"先决条件未成就"、"即时解除权"等法言法语。

4. **格式**：
   - 使用标准 Markdown。
   - 包含章节：一、基础法律关系与效力分析；二、我方履约情况；三、对方违约事实认定；四、结论与诉讼策略。
`;

export const FACT_TIMELINE_PROMPT = `
基于上述法律事实分析，提取关键时间节点用于生成时间轴图表。
必须包含事件的状态（status）：是否违约、是否已履行。

输出 JSON 格式：
[
  { 
    "date": "YYYY-MM-DD", 
    "event": "事件简述", 
    "type": "contract" | "payment" | "dispute" | "breach",
    "citation": "证据X"
  }
]
`;
```

---

## Task 3: 扩展 Gemini 服务层

**Files:**
- Modify: `services/geminiService.ts`

**Step 1: 导入新的 Prompt 和类型**

在文件顶部添加导入：

```typescript
import { FACT_EXTRACTOR_PROMPT, FACT_REASONER_PROMPT, FACT_WRITER_PROMPT, FACT_TIMELINE_PROMPT } from '../constants';
import { ExtractedEvidence, FactAnalysisResult, FileWithPreview, FactDocumentType } from '../types';
```

**Step 2: 添加证据提取函数**

```typescript
/**
 * 8. 从图片/PDF中提取证据数据 (LegalFactAI)
 */
export const extractEvidenceFromFile = async (file: FileWithPreview): Promise<ExtractedEvidence> => {
  if (!file.base64 || !file.mimeType) {
    throw new Error("文件未正确处理");
  }

  const base64Data = file.base64.split(',')[1];
  
  // 构建包含图片的 prompt
  const prompt = `请提取以下文档的信息: ${file.name}

[图片内容: Base64编码的 ${file.mimeType} 文件]

${FACT_EXTRACTOR_PROMPT}

请严格按照 JSON 格式输出提取结果。`;

  try {
    const responseText = await callWithFallback(prompt, 4096);
    
    // 清理 JSON
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      const firstNewline = cleanedText.indexOf('\n');
      const lastBackticks = cleanedText.lastIndexOf('```');
      if (firstNewline !== -1 && lastBackticks > firstNewline) {
        cleanedText = cleanedText.substring(firstNewline + 1, lastBackticks).trim();
      }
    }

    const data = JSON.parse(cleanedText);
    return {
      ...data,
      filename: file.name,
      doc_type: data.doc_type || FactDocumentType.OTHER
    };
  } catch (error: any) {
    console.error("Evidence extraction error:", error);
    return {
      filename: file.name,
      doc_type: FactDocumentType.OTHER,
      summary: "提取失败: " + (error.message || "API 错误")
    };
  }
};

/**
 * 9. 执行法律推理与报告生成 (LegalFactAI)
 */
export const performFactAnalysis = async (
  evidenceList: ExtractedEvidence[]
): Promise<FactAnalysisResult> => {
  // 为证据分配编号
  const labeledEvidence = evidenceList.map((ev, index) => ({
    evidence_id: `证据${index + 1}`,
    ...ev
  }));

  const evidenceContext = JSON.stringify(labeledEvidence, null, 2);

  try {
    // Step 1: 法律推理
    const reasoningPrompt = `${FACT_REASONER_PROMPT}

这是本案的所有证据提取数据（已编号）：
${evidenceContext}

请严格遵循【效力金字塔】和【触发点锁定法则】执行推理。`;

    const reasoningLog = await callWithFallback(reasoningPrompt, 4096);

    // Step 2: 报告撰写
    const writerPrompt = `${FACT_WRITER_PROMPT}

这是推理分析流：
${reasoningLog}

请撰写《法律事实梳理意见书》。务必精准引用证据编号（如：证据1）。`;

    const reportMarkdown = await callWithFallback(writerPrompt, 4096);

    // Step 3: 提取时间轴
    const timelinePrompt = `${FACT_TIMELINE_PROMPT}

基于以下报告内容生成时间轴 JSON：
${reportMarkdown}`;

    const timelineResponse = await callWithFallback(timelinePrompt, 2048);
    
    let timelineData = [];
    try {
      let cleanedTimeline = timelineResponse.trim();
      if (cleanedTimeline.startsWith('```')) {
        const firstNewline = cleanedTimeline.indexOf('\n');
        const lastBackticks = cleanedTimeline.lastIndexOf('```');
        if (firstNewline !== -1 && lastBackticks > firstNewline) {
          cleanedTimeline = cleanedTimeline.substring(firstNewline + 1, lastBackticks).trim();
        }
      }
      timelineData = JSON.parse(cleanedTimeline);
    } catch (e) {
      console.warn("Timeline parsing failed", e);
    }

    return {
      markdownReport: reportMarkdown,
      timeline: timelineData,
      obligationStatus: "分析完成"
    };

  } catch (error: any) {
    console.error("Fact analysis error:", error);
    throw new Error(error.message || "事实梳理分析失败");
  }
};
```

---

## Task 4: 创建证据上传组件

**Files:**
- Create: `components/EvidenceUpload.tsx`

**Step 1: 创建组件文件**

```tsx
import React, { useCallback } from 'react';
import { Upload, File as FileIcon, X, Image } from 'lucide-react';
import { FileWithPreview } from '../types';

interface EvidenceUploadProps {
  files: FileWithPreview[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
  disabled: boolean;
}

const EvidenceUpload: React.FC<EvidenceUploadProps> = ({ files, setFiles, disabled }) => {

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];
      processFiles(newFiles);
    }
  };

  const processFiles = (newFiles: File[]) => {
    const processedFiles: FileWithPreview[] = [];

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const processed = Object.assign(file, {
          preview: URL.createObjectURL(file),
          base64: e.target?.result as string,
          mimeType: file.type,
        }) as FileWithPreview;
        
        processedFiles.push(processed);
        
        if (processedFiles.length === newFiles.length) {
          setFiles(prev => [...prev, ...processedFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) {
      return <Image className="w-5 h-5 text-amber-600" />;
    }
    return <FileIcon className="w-5 h-5 text-slate-600" />;
  };

  return (
    <div className="space-y-4">
      {/* 上传区域 - 使用琥珀色主题 */}
      <div className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all
        ${disabled 
          ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed' 
          : 'bg-amber-50/30 border-amber-300 hover:border-amber-500 hover:bg-amber-50/50 cursor-pointer'}
      `}>
        <input 
          type="file" 
          id="evidence-upload" 
          multiple 
          accept=".pdf,image/*,.doc,.docx"
          className="hidden" 
          onChange={handleFileSelect}
          disabled={disabled}
        />
        <label htmlFor="evidence-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">点击上传案卷材料</h3>
          <p className="text-sm text-slate-500 mt-2">支持 PDF、JPG、PNG、Word 格式 (合同、支付凭证、补充协议)</p>
        </label>
      </div>

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((file, idx) => (
            <div 
              key={`${file.name}-${idx}`} 
              className="flex items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!disabled && (
                <button 
                  onClick={() => removeFile(file.name)}
                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceUpload;
```

---

## Task 5: 创建事实报告展示组件

**Files:**
- Create: `components/FactReport.tsx`

**Step 1: 创建组件文件**

```tsx
import React from 'react';
import { FactAnalysisResult } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { Calendar, AlertTriangle, CheckCircle, XCircle, Download, Scale, FileText } from 'lucide-react';

interface FactReportProps {
  result: FactAnalysisResult;
}

const FactReport: React.FC<FactReportProps> = ({ result }) => {
  
  const getEventColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-500';
      case 'payment': return 'bg-green-500';
      case 'breach': return 'bg-red-600';
      case 'dispute': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  const handleExportWord = async () => {
    try {
      // 简单的 Markdown 转 HTML (基础实现)
      const contentHtml = result.markdownReport
        .replace(/^# (.*$)/gm, '<h1 style="font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 20px;">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 style="font-size: 16pt; font-weight: bold; margin-top: 15px; background-color: #f0f0f0; padding: 5px;">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 style="font-size: 14pt; font-weight: bold; margin-top: 10px;">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
      
      const fullHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>法律事实梳理意见书</title>
          <style>
            body { font-family: 'SimSun', 'Songti SC', serif; font-size: 12pt; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1 style="text-align: center;">法律事实梳理意见书</h1>
          ${contentHtml}
          <br/>
          <hr/>
          <p style="text-align: right; color: #888; font-size: 10pt;">Generated by AI 建工法律咨询系统</p>
        </body>
        </html>
      `;

      const blob = new Blob([fullHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `法律事实梳理意见书_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("导出失败，请重试");
    }
  };

  const hasBreach = result.timeline.some(t => t.type === 'breach');

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 animate-fade-in">
      {/* Header - 使用琥珀/深色主题 */}
      <div className="bg-slate-900 text-white p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-600 rounded-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif">法律事实梳理意见书</h2>
              <p className="text-slate-400 text-sm mt-1">AI 建工法律咨询系统 · 事实梳理引擎</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30">
              建工专版
            </span>
            <button 
              onClick={handleExportWord}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs border border-slate-600 transition-colors"
            >
              <Download className="w-3 h-3" />
              导出 Word
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* 主内容区 - Markdown 报告 */}
        <div className="lg:col-span-2 p-8 border-r border-slate-100">
          <div className="prose prose-slate max-w-none">
            <MarkdownRenderer content={result.markdownReport} />
          </div>
        </div>

        {/* 侧边栏 - 状态与时间轴 */}
        <div className="bg-slate-50 p-6 space-y-6">
          
          {/* 履行状态卡片 */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">履行状态分析</h3>
            <div className="flex items-center space-x-3">
              {hasBreach ? (
                <>
                  <div className="p-2 bg-red-100 text-red-700 rounded-full">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">存在根本违约</p>
                    <p className="text-xs text-slate-500">依据"触发点锁定法则"判定</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 bg-green-100 text-green-700 rounded-full">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">阶段性履约</p>
                    <p className="text-xs text-slate-500">依据资金闭环逻辑判定</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 关键事件轴 */}
          {result.timeline.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                关键事件轴
              </h3>
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                {result.timeline.map((item, idx) => (
                  <div key={idx} className="mb-4 ml-6 relative">
                    <span className={`
                      absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm
                      ${getEventColor(item.type)}
                    `}></span>
                    <time className="block mb-1 text-sm font-normal leading-none text-slate-400">
                      {item.date}
                    </time>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {item.event}
                    </h4>
                    {item.citation && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 mt-1 inline-block">
                        {item.citation}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 推理提示 */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-800">AI 推理引擎提示</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  已启用 <strong>Hierarchy Logic</strong> (效力金字塔)。
                  若检测到《补充协议》包含"以本协议为准"条款，系统将自动覆盖旧合同的工期与赔偿计算标准。
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FactReport;
```

---

## Task 6: 创建事实梳理工作台组件

**Files:**
- Create: `components/FactAnalysisWorkspace.tsx`

**Step 1: 创建主工作台组件**

```tsx
import React, { useState } from 'react';
import EvidenceUpload from './EvidenceUpload';
import FactReport from './FactReport';
import { FactProcessingStage, FileWithPreview, ExtractedEvidence, FactAnalysisResult } from '../types';
import { extractEvidenceFromFile, performFactAnalysis } from '../services/geminiService';
import { Scale, ChevronRight, AlertCircle, FileText, BrainCircuit, FileCheck, Loader2, CheckCircle2 } from 'lucide-react';

const FactAnalysisWorkspace: React.FC = () => {
  const [stage, setStage] = useState<FactProcessingStage>(FactProcessingStage.IDLE);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedEvidence[]>([]);
  const [finalReport, setFinalReport] = useState<FactAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startAnalysis = async () => {
    if (files.length === 0) return;

    setErrorMsg(null);
    setStage(FactProcessingStage.INGESTION);

    try {
      // 1. Ingestion -> Extraction
      setStage(FactProcessingStage.EXTRACTION);
      const extractedItems: ExtractedEvidence[] = [];
      
      for (const file of files) {
        const result = await extractEvidenceFromFile(file);
        extractedItems.push(result);
      }
      setExtractedData(extractedItems);

      // 2. Extraction -> Reasoning
      setStage(FactProcessingStage.REASONING);
      await new Promise(r => setTimeout(r, 500)); // UI pacing

      const reportResult = await performFactAnalysis(extractedItems);
      
      // 3. Reasoning -> Generation
      setStage(FactProcessingStage.GENERATION);
      await new Promise(r => setTimeout(r, 500));
      
      setFinalReport(reportResult);
      setStage(FactProcessingStage.COMPLETE);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "事实梳理过程中发生错误");
      setStage(FactProcessingStage.ERROR);
    }
  };

  const reset = () => {
    setFiles([]);
    setExtractedData([]);
    setFinalReport(null);
    setStage(FactProcessingStage.IDLE);
    setErrorMsg(null);
  };

  // Pipeline 进度展示
  const PipelineSteps = () => {
    const steps = [
      { id: FactProcessingStage.INGESTION, label: '证据摄入', icon: FileText },
      { id: FactProcessingStage.EXTRACTION, label: '智能提取', icon: BrainCircuit },
      { id: FactProcessingStage.REASONING, label: '法律推理', icon: Scale },
      { id: FactProcessingStage.GENERATION, label: '报告生成', icon: FileCheck },
    ];

    const stageOrder = [
      FactProcessingStage.IDLE,
      FactProcessingStage.INGESTION,
      FactProcessingStage.EXTRACTION,
      FactProcessingStage.REASONING,
      FactProcessingStage.GENERATION,
      FactProcessingStage.COMPLETE
    ];

    const getStepStatus = (stepId: FactProcessingStage) => {
      const currentIndex = stageOrder.indexOf(stage);
      const stepIndex = stageOrder.indexOf(stepId);

      if (stage === FactProcessingStage.COMPLETE) return 'completed';
      if (stage === FactProcessingStage.ERROR) return 'error';
      if (currentIndex === stepIndex) return 'active';
      if (currentIndex > stepIndex) return 'completed';
      return 'pending';
    };

    return (
      <div className="w-full py-6">
        <div className="flex justify-between items-center relative">
          {/* Progress Bar Background */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 transform -translate-y-1/2 rounded-full"></div>
          
          {/* Progress Bar Fill */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-amber-600 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${
                stage === FactProcessingStage.COMPLETE ? 100 :
                steps.findIndex(s => s.id === stage) !== -1 
                  ? (steps.findIndex(s => s.id === stage) / (steps.length - 1)) * 100 
                  : 0
              }%` 
            }}
          ></div>

          {steps.map((step) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-300
                  ${status === 'active' ? 'border-amber-600 text-amber-600 shadow-lg scale-110' : ''}
                  ${status === 'completed' ? 'border-amber-600 bg-amber-600 text-white' : ''}
                  ${status === 'pending' ? 'border-slate-300 text-slate-400' : ''}
                `}>
                  {status === 'active' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`
                  mt-3 text-sm font-medium transition-colors
                  ${status === 'active' ? 'text-amber-700' : ''}
                  ${status === 'completed' ? 'text-slate-800' : ''}
                  ${status === 'pending' ? 'text-slate-400' : ''}
                `}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Intro Section (only show when Idle) */}
      {stage === FactProcessingStage.IDLE && (
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 font-serif">
            建设工程案件事实梳理引擎
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            上传杂乱的合同、补充协议与转账凭证，AI 自动构建效力金字塔，
            执行资金闭环核对，生成专业级诉讼事实梳理报告。
          </p>
        </div>
      )}

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Pipeline Visualization */}
        <div className="bg-slate-50 border-b border-slate-100 px-8">
          <PipelineSteps />
        </div>

        <div className="p-8">
          {/* Error Message */}
          {stage === FactProcessingStage.ERROR && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {errorMsg || "分析失败，请检查 API Key 并重试"}
              <button onClick={reset} className="ml-auto text-sm font-semibold underline">重试</button>
            </div>
          )}

          {/* Upload Area */}
          {(stage === FactProcessingStage.IDLE || stage === FactProcessingStage.INGESTION) && (
            <div className="space-y-6">
              <EvidenceUpload 
                files={files} 
                setFiles={setFiles} 
                disabled={stage !== FactProcessingStage.IDLE}
              />
              
              <div className="flex justify-end">
                <button
                  onClick={startAnalysis}
                  disabled={files.length === 0 || stage !== FactProcessingStage.IDLE}
                  className={`
                    flex items-center px-6 py-3 rounded-lg text-white font-medium shadow-md transition-all
                    ${files.length === 0 || stage !== FactProcessingStage.IDLE 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg transform hover:-translate-y-0.5'}
                  `}
                >
                  {stage === FactProcessingStage.INGESTION ? '正在解析...' : '开始梳理事实'}
                  {stage === FactProcessingStage.IDLE && <ChevronRight className="w-5 h-5 ml-2" />}
                </button>
              </div>
            </div>
          )}

          {/* Intermediate Loading State */}
          {(stage === FactProcessingStage.EXTRACTION || 
            stage === FactProcessingStage.REASONING || 
            stage === FactProcessingStage.GENERATION) && (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {stage === FactProcessingStage.EXTRACTION && "正在提取文档要素..."}
                  {stage === FactProcessingStage.REASONING && "构建效力金字塔 & 资金核对..."}
                  {stage === FactProcessingStage.GENERATION && "撰写法律意见书..."}
                </h3>
                <p className="text-slate-500 text-sm mt-2">
                  AI 正在运用"义务-履行闭环法则"分析您的案卷
                </p>
              </div>
            </div>
          )}

          {/* Final Report */}
          {stage === FactProcessingStage.COMPLETE && finalReport && (
            <div className="animate-fade-in">
              <FactReport result={finalReport} />
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={reset}
                  className="text-slate-500 hover:text-slate-800 font-medium px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  梳理下一个案件
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactAnalysisWorkspace;
```

---

## Task 7: 更新布局组件 - 添加导航入口

**Files:**
- Modify: `components/Layout.tsx`

**Step 1: 在导航中添加"事实梳理"入口**

在 `<nav>` 部分的"场景模型库"之前添加新的导航项：

```tsx
<NavItem
  icon={<Scale size={20} />}
  label="事实梳理"
  isActive={activeView === 'factAnalysis'}
  onClick={() => onNavigate('factAnalysis')}
  isCollapsed={isCollapsed}
/>
```

**Step 2: 更新 getHeaderTitle 函数**

添加 `factAnalysis` 的标题映射：

```typescript
case 'factAnalysis': return '建工案件事实梳理';
```

**Step 3: 导入 Scale 图标**

确保从 lucide-react 导入 Scale 图标。

---

## Task 8: 更新主应用组件

**Files:**
- Modify: `App.tsx`

**Step 1: 导入新组件**

```typescript
import FactAnalysisWorkspace from './components/FactAnalysisWorkspace';
```

**Step 2: 在渲染逻辑中添加 factAnalysis 视图**

在 `<Layout>` 内部，`knowledge` 视图之后添加：

```tsx
{activeView === 'factAnalysis' && (
  <FactAnalysisWorkspace />
)}
```

---

## Task 9: 验证与测试

**Step 1: 启动开发服务器**

```bash
cd /Users/bc-file/coding/ai-建工法律咨询geo营销系统
npm run dev
```

**Step 2: 验证功能**

1. 检查侧边栏是否显示"事实梳理"导航项
2. 点击进入事实梳理模块
3. 上传测试文件（PDF 或图片）
4. 验证 4 阶段处理管线是否正常工作
5. 检查报告生成和时间轴展示
6. 测试 Word 导出功能

**Step 3: 检查样式一致性**

- 确认使用琥珀色主题 (`amber-600`)
- 确认深色侧边栏风格保持一致
- 确认动画效果正常

---

## 完成标记

所有任务完成后，更新 README.md 添加新功能说明。

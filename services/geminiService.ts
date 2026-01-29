import {
  PROMPT_EXTRACTION, PROMPT_ARTICLE_GEN, PROMPT_VIDEO_GEN, PROMPT_ZHIHU_GEN,
  PROMPT_HUMANIZED_ARTICLE_GEN, PROMPT_VISUAL_ARCHITECT, FIRM_KNOWLEDGE_BASE,
  FACT_EXTRACTOR_PROMPT, FACT_REASONER_PROMPT, FACT_WRITER_PROMPT, FACT_TIMELINE_PROMPT,
  // v2.0 Multi-Agent Prompts
  DOCUMENT_ROUTER_PROMPT, AGENT_AUDITOR_PROMPT, AGENT_LAWYER_PROMPT,
  AGENT_INVESTIGATOR_PROMPT, AGENT_HISTORIAN_PROMPT, VALIDATION_LOGIC_PROMPT
} from '../constants';
import {
  ExtractionResult, ExtractedEvidence, FactAnalysisResult, FileWithPreview, FactDocumentType,
  // v2.0 Types
  DocumentRouter, RoutedFile, FinancialRecordV2, ContractClauseV2, ContractAmendmentV2,
  CorporateChange, BackgroundInfo, FactEventV2, AssetInfo, ValidationReport,
  LegalFactExtractionOutput, FactProcessingStageV2
} from '../types';

// API 配置
const getApiConfig = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const baseUrl = import.meta.env.VITE_ANTIGRAVITY_BASE_URL || 'http://127.0.0.1:8045';

  if (!apiKey) {
    throw new Error("API Key 缺失。请在 .env.local 中设置 VITE_GEMINI_API_KEY");
  }

  return { apiKey, baseUrl };
};

// 可用的模型列表（按优先级排序）
const AVAILABLE_MODELS = [
  'gemini-3-pro-high',   // 优先 - 最强大
  'gemini-3-flash',      // 备选 - 最快
  'gemini-2.5-flash',    // 备选
  'gemini-3-pro-low'     // 最后 - 省资源
];

/**
 * 使用 Anthropic Messages API 格式调用 Gemini
 */
async function callAnthropicAPI(
  model: string,
  prompt: string,
  maxTokens: number = 4096
): Promise<string> {
  const { apiKey, baseUrl } = getApiConfig();

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    const errorMessage = error.error?.message || `HTTP ${response.status}: ${response.statusText}`;

    // 特殊错误处理
    if (response.status === 503 || response.status === 429) {
      throw new Error('API 配额已耗尽或服务暂时不可用，请稍后重试');
    }
    if (response.status === 404) {
      throw new Error(`模型 ${model} 不可用`);
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Anthropic API 响应格式
  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error('API 返回了空响应');
  }

  return data.content[0].text;
}

/**
 * 使用模型降级策略调用 API
 */
async function callWithFallback(
  prompt: string,
  maxTokens: number = 4096
): Promise<string> {
  const errors: string[] = [];

  for (const model of AVAILABLE_MODELS) {
    try {
      console.log(`尝试使用模型: ${model}`);
      const result = await callAnthropicAPI(model, prompt, maxTokens);
      console.log(`✅ 模型 ${model} 成功`);
      return result;
    } catch (error: any) {
      const errorMsg = `${model}: ${error.message}`;
      console.warn(`❌ 模型 ${model} 失败: ${error.message}`);
      errors.push(errorMsg);

      // 如果是最后一个模型，抛出错误
      if (model === AVAILABLE_MODELS[AVAILABLE_MODELS.length - 1]) {
        throw new Error(`所有模型都失败了:\n${errors.join('\n')}`);
      }

      // 否则尝试下一个模型
      continue;
    }
  }

  throw new Error('没有可用的模型');
}

/**
 * 提取痛点
 */
export const extractPainPoints = async (transcript: string): Promise<ExtractionResult> => {
  const fullPrompt = PROMPT_EXTRACTION.replace('{{RAW_TEXT}}', transcript);

  try {
    const responseText = await callWithFallback(fullPrompt, 4096);

    // 清理响应文本，移除可能的 Markdown 代码块标记
    let cleanedText = responseText.trim();

    // 移除 ```json 或 ``` 包裹
    if (cleanedText.startsWith('```')) {
      // 找到第一个换行符（代码块开始标记后）
      const firstNewline = cleanedText.indexOf('\n');
      // 找到最后一个 ``` 标记
      const lastBackticks = cleanedText.lastIndexOf('```');

      if (firstNewline !== -1 && lastBackticks > firstNewline) {
        cleanedText = cleanedText.substring(firstNewline + 1, lastBackticks).trim();
      }
    }

    // 解析 JSON 响应
    try {
      return JSON.parse(cleanedText) as ExtractionResult;
    } catch (parseError) {
      console.error('JSON 解析失败，清理后的响应:', cleanedText);
      console.error('原始响应:', responseText);
      throw new Error('AI 返回的响应格式不正确');
    }
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    // 透传原始错误信息，以便排查 (如 API Key 无效、网络错误等)
    throw new Error(error.message || "深度法律分析失败，请检查文本内容或重试。");
  }
};

/**
 * 通用内容生成函数
 */
const generateContentCommon = async (
  promptTemplate: string,
  painPoints: string[],
  selectedQuotes: string[],
  legalConcepts: string[],
  marketingDirection?: string
): Promise<string> => {
  // 注入知识库
  let prompt = promptTemplate.replace('{{FIRM_KB}}', FIRM_KNOWLEDGE_BASE);

  // 注入动态变量
  prompt = prompt.replace('{{Issue_Tags}}', painPoints.join(', '));
  prompt = prompt.replace('{{Selected_Quotes}}', selectedQuotes.join('; '));
  prompt = prompt.replace('{{Legal_Concepts}}', legalConcepts.join(', '));
  prompt = prompt.replace('{{Marketing_Direction}}', marketingDirection || '北京建工法律纠纷解决方案');

  try {
    return await callWithFallback(prompt, 4096);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    return "内容生成出错，请重试。";
  }
};

/**
 * 生成文章
 */
export const generateArticle = async (
  painPoints: string[],
  selectedQuotes: string[],
  legalConcepts: string[],
  marketingDirection?: string
) => {
  return generateContentCommon(PROMPT_ARTICLE_GEN, painPoints, selectedQuotes, legalConcepts, marketingDirection);
};

/**
 * 生成视频脚本
 */
export const generateVideoScript = async (
  painPoints: string[],
  selectedQuotes: string[],
  legalConcepts: string[],
  marketingDirection?: string
) => {
  return generateContentCommon(PROMPT_VIDEO_GEN, painPoints, selectedQuotes, legalConcepts, marketingDirection);
};

/**
 * 生成知乎回答
 */
export const generateZhihuAnswer = async (
  painPoints: string[],
  selectedQuotes: string[],
  legalConcepts: string[],
  marketingDirection?: string
) => {
  return generateContentCommon(PROMPT_ZHIHU_GEN, painPoints, selectedQuotes, legalConcepts, marketingDirection);
};

/**
 * 生成“去 AI 味”的老张风格文章
 */
export const generateHumanizedArticle = async (
  painPoints: string[],
  selectedQuotes: string[],
  legalConcepts: string[],
  marketingDirection?: string
) => {
  return generateContentCommon(PROMPT_HUMANIZED_ARTICLE_GEN, painPoints, selectedQuotes, legalConcepts, marketingDirection);
};

/**
 * 6. 生成图片提示词 (Visual Architect)
 */
export const generateImagePrompts = async (
  articleContent: string,
  marketingDirection?: string
): Promise<any> => {
  let prompt = PROMPT_VISUAL_ARCHITECT.replace('{{Article_Content}}', articleContent);
  prompt = prompt.replace('{{Marketing_Direction}}', marketingDirection || '建工纠纷');

  try {
    const responseText = await callWithFallback(prompt, 2048);
    // Parse JSON
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      const firstNewline = cleanedText.indexOf('\n');
      const lastBackticks = cleanedText.lastIndexOf('```');
      if (firstNewline !== -1 && lastBackticks > firstNewline) {
        cleanedText = cleanedText.substring(firstNewline + 1, lastBackticks).trim();
      }
    }
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Image Prompt Generation Error:", error);
    return null;
  }
};

/**
 * 7. 生成实际图片 (调用 OpenAI 自定义格式接口，由 Antigravity 代理)
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const { apiKey, baseUrl } = getApiConfig();

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(`${baseUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // Antigravity expects x-api-key
        // Standard OpenAI might expect Authorization: Bearer, but Antigravity auth is uniform
      },
      body: JSON.stringify({
        prompt: prompt,
        model: "nano-banana-pro", // Switch to Nano Banana Pro as requested
        size: "1024x1024",
        n: 1
      }),
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`Image API Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.data && data.data.length > 0 && data.data[0].url) {
      return data.data[0].url;
    } else if (data.data && data.data.length > 0 && data.data[0].b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }
    throw new Error("Invalid image response format");

  } catch (error) {
    console.error("Image Generation Failed:", error);
    throw error;
  }
};

/**
 * 8. 从图片/PDF中提取证据数据 (LegalFactAI)
 */
export const extractEvidenceFromFile = async (file: FileWithPreview): Promise<ExtractedEvidence> => {
  if (!file.base64 || !file.mimeType) {
    throw new Error("文件未正确处理");
  }

  const base64Data = file.base64.split(',')[1];

  // 构建包含文件内容描述的 prompt
  const prompt = `请提取以下文档的信息: ${file.name}

文档类型: ${file.mimeType}
文档大小: ${(file.size / 1024).toFixed(2)} KB

${FACT_EXTRACTOR_PROMPT}

请严格按照 JSON 格式输出提取结果。如果无法读取文件内容，请根据文件名推断文档类型。`;

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

// ============ LegalFactAI v2.0 多智能体服务 ============

/**
 * 文档分类路由器
 */
export const classifyDocument = async (
  textPreview: string
): Promise<{ category: DocumentRouter; confidence: number; keywords: string[] }> => {
  const prompt = DOCUMENT_ROUTER_PROMPT + `\n\n文档内容（前1000字符）:\n${textPreview.substring(0, 1000)}`;

  try {
    const response = await callWithFallback(prompt, 512);
    let cleaned = response.trim();

    // 多种 JSON 提取模式
    // 1. 移除 Markdown 代码块
    if (cleaned.startsWith('```')) {
      const firstNl = cleaned.indexOf('\n');
      const lastBt = cleaned.lastIndexOf('```');
      cleaned = cleaned.substring(firstNl + 1, lastBt).trim();
    }

    // 2. 如果响应包含非 JSON 前缀（如 thought 或解释文本），尝试提取 JSON 对象
    const jsonMatch = cleaned.match(/\{[\s\S]*"category"[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    const data = JSON.parse(cleaned);
    return {
      category: data.category as DocumentRouter,
      confidence: data.confidence || 0.8,
      keywords: data.keywords_found || []
    };
  } catch (e) {
    console.error("Router error:", e);

    // 基于关键词的 fallback 分类
    const text = textPreview.toLowerCase();
    if (text.includes('合同') || text.includes('协议') || text.includes('承诺书')) {
      return { category: DocumentRouter.CONTRACT, confidence: 0.7, keywords: ['合同'] };
    }
    if (text.includes('转账') || text.includes('回单') || text.includes('付款') || text.includes('发票')) {
      return { category: DocumentRouter.FINANCE, confidence: 0.7, keywords: ['财务凭证'] };
    }
    if (text.includes('工商') || text.includes('营业执照') || text.includes('变更登记')) {
      return { category: DocumentRouter.ENTITY, confidence: 0.7, keywords: ['工商档案'] };
    }

    return { category: DocumentRouter.GENERAL_FACT, confidence: 0.5, keywords: [] };
  }
};

/**
 * Agent A: 财务审计师
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
        results.push(...records.map((r: any, idx: number) => ({
          ...r,
          sequence: results.length + idx + 1,
          source_file: file.name
        })));
      }
    } catch (e) {
      console.error(`Agent A error for ${file.name}:`, e);
    }
  }

  return results;
};

/**
 * Agent B: 合同分析师
 */
export const agentAnalyzeContract = async (
  files: RoutedFile[]
): Promise<{ contracts: ContractClauseV2[]; amendments: ContractAmendmentV2[] }> => {
  const contracts: ContractClauseV2[] = [];
  const amendments: ContractAmendmentV2[] = [];

  for (const file of files) {
    const prompt = AGENT_LAWYER_PROMPT.replace(/\{\{FILENAME\}\}/g, file.name) +
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
      if (data.contracts) {
        contracts.push(...data.contracts.map((c: any, idx: number) => ({
          ...c,
          sequence: contracts.length + idx + 1,
          source_file: file.name
        })));
      }
      if (data.amendments) {
        amendments.push(...data.amendments);
      }
    } catch (e) {
      console.error(`Agent B error for ${file.name}:`, e);
    }
  }

  return { contracts, amendments };
};

/**
 * Agent C: 背景调查官
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

/**
 * Agent D: 事实梳理员
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
      if (data.facts) {
        facts.push(...data.facts.map((f: any, idx: number) => ({
          ...f,
          sequence: facts.filter(x => x.category === f.category).length + idx + 1,
          source: file.name
        })));
      }
      if (data.assets) {
        assets.push(...data.assets.map((a: any, idx: number) => ({
          ...a,
          sequence: assets.length + idx + 1,
          source: file.name
        })));
      }
    } catch (e) {
      console.error(`Agent D error for ${file.name}:`, e);
    }
  }

  return { facts, assets };
};

/**
 * 逻辑校验器
 */
export const validateExtractionLogic = (
  financials: FinancialRecordV2[],
  contracts: ContractClauseV2[],
  amendments: ContractAmendmentV2[]
): ValidationReport => {
  // 1. 计算已付金额总和
  const totalPaid = financials
    .filter(f => f.amount > 0 && (f.amount_type === '本金' || !f.amount_type))
    .reduce((sum, f) => sum + f.amount, 0);

  // 2. 从合同中提取价款
  const priceClause = contracts.find(c =>
    c.keywords?.some(k => k.includes('价款') || k.includes('总价') || k.includes('合同价'))
  );
  let contractPrice = 0;
  if (priceClause) {
    const match = priceClause.clause_content.match(/([\d,]+)(万|亿)?元?/g);
    if (match && match[0]) {
      let num = parseFloat(match[0].replace(/,/g, '').replace(/元/g, ''));
      if (match[0].includes('亿')) num *= 100000000;
      else if (match[0].includes('万')) num *= 10000;
      contractPrice = num;
    }
  }

  // 3. 检测金额异常
  const amountMismatch = contractPrice > 0 && totalPaid > contractPrice * 1.1;

  // 4. 检测优先条款
  const overrides = amendments
    .filter(a => a.is_priority_clause)
    .map(a => `变更项目"「${a.change_item}」"已覆盖原合同约定`);

  return {
    total_amount_from_finance: totalPaid,
    total_contract_price: contractPrice,
    amount_mismatch_warning: amountMismatch,
    timeline_conflicts: [],
    priority_clause_overrides: overrides
  };
};

/**
 * LegalFactAI v2.0 主处理管线
 */
export const runLegalFactPipelineV2 = async (
  files: FileWithPreview[],
  onProgress?: (stage: FactProcessingStageV2, message: string) => void
): Promise<LegalFactExtractionOutput> => {
  const notify = (s: FactProcessingStageV2, m: string) => onProgress?.(s, m);

  // Phase 1: 文档路由
  notify(FactProcessingStageV2.ROUTING, '正在分类文档...');
  const routedFiles: Map<DocumentRouter, RoutedFile[]> = new Map([
    [DocumentRouter.CONTRACT, []],
    [DocumentRouter.FINANCE, []],
    [DocumentRouter.ENTITY, []],
    [DocumentRouter.GENERAL_FACT, []]
  ]);

  for (const file of files) {
    // 尝试解析文本内容
    let textPreview = '';
    if (file.base64) {
      try {
        const base64Content = file.base64.split(',')[1];
        textPreview = atob(base64Content).substring(0, 2000);
      } catch (e) {
        textPreview = file.name; // 退而求其次用文件名
      }
    }

    const { category, keywords } = await classifyDocument(textPreview || file.name);
    const routed: RoutedFile = {
      ...file,
      router_category: category,
      first_1000_chars: textPreview,
      ocr_text: textPreview
    } as RoutedFile;
    routedFiles.get(category)!.push(routed);
    console.log(`[Router] ${file.name} -> ${category} (${keywords.join(', ')})`);
  }

  // Phase 2: 并行 Agent 处理
  notify(FactProcessingStageV2.AGENT_A_AUDIT, '财务审计师提取中...');
  const financials = await agentAuditFinance(routedFiles.get(DocumentRouter.FINANCE)!);

  notify(FactProcessingStageV2.AGENT_B_CONTRACT, '合同分析师提取中...');
  const { contracts, amendments } = await agentAnalyzeContract(routedFiles.get(DocumentRouter.CONTRACT)!);

  notify(FactProcessingStageV2.AGENT_C_ENTITY, '背景调查官提取中...');
  const { changes, background } = await agentInvestigateEntity(routedFiles.get(DocumentRouter.ENTITY)!);

  notify(FactProcessingStageV2.AGENT_D_FACT, '事实梳理员提取中...');
  const { facts, assets } = await agentExtractFacts(routedFiles.get(DocumentRouter.GENERAL_FACT)!);

  // Phase 3: 逻辑校验
  notify(FactProcessingStageV2.VALIDATION, '逻辑校验中...');
  const validation = validateExtractionLogic(financials, contracts, amendments);

  // Phase 4: 组装输出
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

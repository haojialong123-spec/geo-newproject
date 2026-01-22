import { PROMPT_EXTRACTION, PROMPT_ARTICLE_GEN, PROMPT_VIDEO_GEN, PROMPT_ZHIHU_GEN, FIRM_KNOWLEDGE_BASE } from '../constants';
import { ExtractionResult } from '../types';

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
    throw new Error("深度法律分析失败，请检查文本内容或重试。");
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

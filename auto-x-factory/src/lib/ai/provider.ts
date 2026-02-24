import { createOpenAI } from '@ai-sdk/openai';

// Create a custom provider pointing to DeepSeek's API
// See: https://sdk.vercel.ai/providers/openai-compatible-providers#deepseek
export const deepseek = createOpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// Helper to get the standard model
export const getChatModel = () => deepseek('deepseek-chat');

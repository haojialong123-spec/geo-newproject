import { createDeepSeek } from '@ai-sdk/deepseek';

// Create a custom provider pointing to DeepSeek's API
// See: https://sdk.vercel.ai/providers/openai-compatible-providers#deepseek
export const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// Helper to get the standard model
export const getChatModel = () => deepseek('deepseek-chat');

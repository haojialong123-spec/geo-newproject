import { NextResponse } from 'next/server';

export const maxDuration = 300; // Allow function to run up to 300 seconds (5 minutes)

export async function POST(request: Request) {
    try {
        const { question, topic_ids } = await request.json();

        const topicIds = topic_ids || [process.env.GET_NOTES_TOPIC_ID || '20jDQgxn'];
        const selectedTopicId = topicIds[0];

        // Only 20jDQgxn is supported
        let apiKey = process.env.GET_NOTES_API_KEY_2 || '9XSbyS+JayeHx+97/sQun1i7jbkzZPtEVbjKC74S/AzqE2LFMRKhUsvA0ZpcF5zk/CJvTCiWo8c98VxjYcWjen+tqBcYSIrzr85p';

        if (!apiKey) {
            return NextResponse.json({ error: 'Get Notes API key not configured' }, { status: 500 });
        }

        const requestBody = JSON.stringify({
            question,
            topic_ids: topicIds,
            deep_seek: true
        });

        console.log(`[Get Notes] Calling API via fetch stream, question: "${question}"`);

        // Use global fetch which works gracefully with Next.js App Router and EdgeOne
        const response = await fetch('https://open-api.biji.com/getnote/openapi/knowledge/search/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Authorization': `Bearer ${apiKey}`,
                'X-OAuth-Version': '1',
                'Connection': 'keep-alive'
            },
            body: requestBody,
            cache: 'no-store' // Critical for EdgeOne streaming
        });

        if (!response.ok) {
            return new Response(`\n[API 出错: ${response.status} ${response.statusText}]\n`, { status: 500 });
        }

        if (!response.body) {
            return new Response(`\n[API 错误: 响应流为空]\n`, { status: 500 });
        }

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let isThinking = false;
                let hasStartedFinal = false;
                let chunkCount = 0;

                // EdgeOne drop idle connections workaround
                const keepAlive = setInterval(() => {
                    controller.enqueue(new TextEncoder().encode(" "));
                }, 5000);

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const jsonStr = line.substring(6).trim();
                                    if (!jsonStr) continue;
                                    const parsed = JSON.parse(jsonStr);
                                    chunkCount++;

                                    // Log every chunk to diagnose actual msg_type values from API
                                    console.log(`[Get Notes] chunk #${chunkCount} msg_type=${parsed.msg_type} code=${parsed.code} preview=${String(parsed.data?.msg || '').substring(0, 60)}`);

                                    if (parsed.msg_type === 21 && parsed.data?.msg) {
                                        // Thinking / reasoning content
                                        if (!isThinking) {
                                            controller.enqueue(new TextEncoder().encode("<think>\n"));
                                            isThinking = true;
                                        }
                                        controller.enqueue(new TextEncoder().encode(parsed.data.msg));
                                    } else if (parsed.msg_type === 1 && parsed.data?.msg) {
                                        // Final answer content — always output regardless of isThinking state
                                        if (!hasStartedFinal) {
                                            if (isThinking) {
                                                controller.enqueue(new TextEncoder().encode("\n</think>\n\n"));
                                            }
                                            hasStartedFinal = true;
                                        }
                                        controller.enqueue(new TextEncoder().encode(parsed.data.msg));
                                    } else if (parsed.msg_type === 0 && parsed.code !== 200) {
                                        controller.enqueue(new TextEncoder().encode(`\n[API 异常: ${parsed.data?.msg || '未知错误'}]\n`));
                                    } else if (parsed.msg_type !== 21 && parsed.msg_type !== 1 && parsed.msg_type !== 0) {
                                        // Log unknown msg_type for debugging
                                        console.warn(`[Get Notes] Unknown msg_type=${parsed.msg_type}, full payload:`, JSON.stringify(parsed).substring(0, 200));
                                    }
                                } catch (e) {
                                    // ignore parse errors on incomplete chunks
                                }
                            }
                        }
                    }
                    console.log(`[Get Notes] Stream ended normally. Total chunks: ${chunkCount}`);
                } catch (e: any) {
                    console.error(`[Get Notes] Stream read error after ${chunkCount} chunks:`, e.message);
                    controller.enqueue(new TextEncoder().encode(`\n\n[ 流响应接收中断(说明：Get笔记在国内服务器方可稳定访问，若您开启了全局代理或国外节点，会导致传输被掐断): ${e.message} ]\n`));
                } finally {
                    clearInterval(keepAlive);
                    // Close <think> tag if we were in thinking mode but never got a final answer
                    if (isThinking && !hasStartedFinal) {
                        controller.enqueue(new TextEncoder().encode("\n</think>\n\n"));
                        hasStartedFinal = true;
                    }
                    // Flush any remaining data in the buffer
                    if (buffer.startsWith('data: ')) {
                        try {
                            const jsonStr = buffer.substring(6).trim();
                            if (jsonStr) {
                                const parsed = JSON.parse(jsonStr);
                                console.log(`[Get Notes] Flushing buffer chunk msg_type=${parsed.msg_type}`);
                                if (parsed.msg_type === 21 && parsed.data?.msg) {
                                    // Thinking content in buffer — close think tag after
                                    controller.enqueue(new TextEncoder().encode(parsed.data.msg));
                                    if (!hasStartedFinal) {
                                        controller.enqueue(new TextEncoder().encode("\n</think>\n\n"));
                                        hasStartedFinal = true;
                                    }
                                } else if (parsed.msg_type === 1 && parsed.data?.msg) {
                                    if (!hasStartedFinal && isThinking) {
                                        controller.enqueue(new TextEncoder().encode("\n</think>\n\n"));
                                    }
                                    controller.enqueue(new TextEncoder().encode(parsed.data.msg));
                                }
                            }
                        } catch (e) { }
                    }
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error: any) {
        console.error('[Get Notes API Error]', error);

        const errorMessage = `
=============================================
[ 🚨 后端网络请求中断 / Network Fetch Failed ]

失败原因: ${error.message}

【排查建议】
1. Get 笔记接口仅限国内 IP 访问，如果您当前正在使用科学上网工具（Clash/V2ray 等），请将其“全局模式”改为“规则模式”，或者将 \`open-api.biji.com\` 加入直连白名单。
2. 您的本地网络环境被阻断，但一旦您将代码部署到腾讯云 EdgeOne（国内边缘节点），该接口即可自然恢复正常！
=============================================
`;
        // We return a text response so the frontend stream parsing picks it up as raw text/error
        return new Response(errorMessage, {
            status: 200, // Return 200 so frontend renders the text into the output box smoothly
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

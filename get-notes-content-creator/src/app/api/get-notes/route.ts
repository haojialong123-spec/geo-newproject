import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

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

        console.log(`[Get Notes] Calling API via curl stream, question: "${question}"`);

        const stream = new ReadableStream({
            start(controller) {
                const curlProcess = spawn('curl', [
                    '-s', '--max-time', '180', '--connect-timeout', '30',
                    '--location', '--request', 'POST', 'https://open-api.biji.com/getnote/openapi/knowledge/search/stream',
                    '--header', 'Content-Type: application/json',
                    '--header', 'Accept: text/event-stream',
                    '--header', 'Connection: keep-alive',
                    '--header', `Authorization: Bearer ${apiKey}`,
                    '--header', 'X-OAuth-Version: 1',
                    '--data-raw', requestBody
                ]);

                // EdgeOne proxies drop idle connections after 30s. We send empty spaces periodically to keep the connection open!
                const keepAlive = setInterval(() => {
                    controller.enqueue(new TextEncoder().encode(" "));
                }, 5000);

                let buffer = '';
                let isThinking = false;
                let hasStartedFinal = false;

                curlProcess.stdout.on('data', (data) => {
                    buffer += data.toString('utf-8');
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const jsonStr = line.substring(6).trim();
                                if (!jsonStr) continue;
                                const parsed = JSON.parse(jsonStr);

                                if (parsed.msg_type === 21 && parsed.data?.msg) {
                                    if (!isThinking) {
                                        controller.enqueue(new TextEncoder().encode("<think>\n"));
                                        isThinking = true;
                                    }
                                    controller.enqueue(new TextEncoder().encode(parsed.data.msg));
                                } else if (parsed.msg_type === 1 && parsed.data?.msg) {
                                    if (isThinking && !hasStartedFinal) {
                                        controller.enqueue(new TextEncoder().encode("\n</think>\n\n"));
                                        hasStartedFinal = true;
                                    }
                                    controller.enqueue(new TextEncoder().encode(parsed.data.msg));
                                } else if (parsed.msg_type === 0 && parsed.code !== 200) {
                                    controller.enqueue(new TextEncoder().encode(`\n[API 出错: ${parsed.data?.msg || '未知错误'}]\n`));
                                }
                            } catch (e) {
                                // ignore parse errors on incomplete chunks
                            }
                        }
                    }
                });

                curlProcess.stderr.on('data', (err) => {
                    console.warn('[Get Notes Stream stderr]:', err.toString());
                });

                curlProcess.on('close', (code) => {
                    clearInterval(keepAlive);
                    if (code !== 0) {
                        controller.enqueue(new TextEncoder().encode(`\n\n[ 流中断: curl 进程意外退出 (code: ${code}) ]\n`));
                    }
                    controller.close();
                });

                curlProcess.on('error', (err) => {
                    clearInterval(keepAlive);
                    controller.enqueue(new TextEncoder().encode(`\n\n[ 流错误: ${err.message} ]\n`));
                    controller.close();
                });
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
        console.error('[Get Notes] Wrapper error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: '服务器内部请求检索失败。'
        }, { status: 500 });
    }
}

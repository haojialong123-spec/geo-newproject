import { NextResponse } from 'next/server';
import { evaluateTopic } from '@/lib/ai/filter';
import { saveMaterial, saveTopic } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const url = request.url; // Opt out of static rendering
  try {
    // 1. Fetch top stories from Hacker News
    const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topStoryIds = await topStoriesRes.json();

    const resultsProcessed = [];

    // 2. Process top 3 results
    for (const id of topStoryIds.slice(0, 3)) {
      const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const item = await itemRes.json();

      // HN Item might not have text, fallback to title + url
      const rawContent = `${item.title}\n\n${item.text || item.url || "No additional description"}`;

      // AI Evaluation
      const { scoreData, passed } = await evaluateTopic(rawContent);

      if (passed) {
        // Save to DB
        const materialId = await saveMaterial(
          "HackerNews Top Stories",
          rawContent,
          item.url || `https://news.ycombinator.com/item?id=${id}`
        );

        await saveTopic(materialId, item.title, scoreData);

        resultsProcessed.push({ title: item.title, passed: true, score: scoreData.total });
      } else {
        resultsProcessed.push({ title: item.title, passed: false, score: scoreData.total });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Daily HN collection executed",
      processed: resultsProcessed
    });

  } catch (error) {
    console.error("Cron collection failed:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}



'use client';

import React, { useState } from 'react';
import { buildAndReviewDrafts } from '../app/actions';

export function CandidateItem() {
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);

    const handleCreate = async () => {
        setLoading(true);
        const snippet = "The Vercel AI SDK provides a unified way to work with LLMs in React and Next.js.";
        const res = await buildAndReviewDrafts("mock-topic-123", snippet);
        setResult(res);
        setLoading(false);
    };

    return (
        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
            <h4 className="font-semibold mb-1">Topic: AI SDK Intro</h4>
            <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                &quot;The Vercel AI SDK provides a unified way to work with LLMs in React and Next.js.&quot;
            </p>
            
            <button 
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
                {loading ? 'Drafting & Reviewing...' : 'Autopilot: Create & Critic'}
            </button>
            
            {result && result.variants && (
                <div className="mt-3 text-xs text-gray-700 bg-white p-2 border rounded">
                    <div className="font-bold mb-1">Draft A ({result.scores?.[0]?.score}/10):</div>
                    <p className="mb-2 italic">&quot;{result.variants.variant_a}&quot;</p>
                    
                    <div className="font-bold mb-1">Draft B ({result.scores?.[1]?.score}/10):</div>
                    <p className="italic">&quot;{result.variants.variant_b}&quot;</p>
                </div>
            )}
        </div>
    );
}

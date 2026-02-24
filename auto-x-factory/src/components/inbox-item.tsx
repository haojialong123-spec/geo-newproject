'use client';

import React, { useState } from 'react';
import { searchAndEvaluate } from '../app/actions';

export function InboxItem() {
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const res = await searchAndEvaluate(formData);
        setResult(res);
        setLoading(false);
    };

    return (
        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
                <textarea
                    name="content"
                    placeholder="Paste context here..."
                    className="w-full p-2 border rounded resize-none"
                    rows={3}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Evaluating...' : 'Score with AI'}
                </button>
            </form>

            {result && (
                <div className="mt-2 text-xs text-gray-600">
                    <div>Success: {String(result.success)}</div>
                    {result.scoreData && (
                        <div className="mt-1">
                            Score: {result.scoreData.total}/40
                            <span className={result.passed ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                {result.passed ? '(Passed)' : '(Failed)'}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

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
                    placeholder="在此粘贴参考内容..."
                    className="w-full p-2 border rounded resize-none"
                    rows={3}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'AI 评估中...' : '使用 AI 智能打分'}
                </button>
            </form>

            {result && (
                <div className="mt-2 text-xs text-gray-600">
                    <div>处理状态: {result.success ? '成功' : '失败'}</div>
                    {result.scoreData && (
                        <div className="mt-1 flex items-center">
                            <span>综合评分: {result.scoreData.total}/40</span>
                            <span className={result.passed ? 'text-green-600 ml-2 font-bold' : 'text-red-600 ml-2 font-bold'}>
                                {result.passed ? '(通过)' : '(未达标)'}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

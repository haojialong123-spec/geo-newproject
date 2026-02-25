'use client';

import React from 'react';
import type { KanbanItem } from './kanban-board';

export function CandidateItem({ item }: { item: KanbanItem }) {
    const hasVariants = !!item.variants;

    return (
        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
            <h4 className="font-semibold mb-1 line-clamp-2" title={item.title || '无标题'}>
                {item.title || '无标题记录'}
            </h4>

            {item.scoreData && (
                <div className="text-xs text-indigo-700 mb-2 font-mono bg-indigo-50 p-1 rounded inline-block">
                    AI 评分: {item.scoreData.total}/40
                </div>
            )}

            {!hasVariants && (
                <div className="text-xs text-gray-500 italic mt-2">
                    拖拽至 "草稿 (创作)" 自动生成内容。
                </div>
            )}

            {item.variants && (
                <div className="mt-3 text-xs text-gray-700 bg-white p-2 border rounded shadow-inner">
                    <div className="font-bold mb-1 text-green-700">
                        草稿 A {item.critique?.[0] ? `(${item.critique[0].score}/10)` : ''}:
                    </div>
                    <p className="mb-3 italic line-clamp-3" title={item.variants.variant_a}>
                        &quot;{item.variants.variant_a}&quot;
                    </p>

                    <div className="font-bold mb-1 text-blue-700">
                        草稿 B {item.critique?.[1] ? `(${item.critique[1].score}/10)` : ''}:
                    </div>
                    <p className="italic line-clamp-3" title={item.variants.variant_b}>
                        &quot;{item.variants.variant_b}&quot;
                    </p>
                </div>
            )}
        </div>
    );
}

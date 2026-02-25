'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './kanban-column';
import { buildAndReviewDrafts, publishDraft } from '../app/actions';

export type KanbanItem = {
    id: string;
    type: string;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scoreData?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variants?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    critique?: any;
};

export type KanbanData = {
    columns: {
        [key: string]: { id: string; title: string; items: KanbanItem[] }
    };
    columnOrder: string[];
};

export default function KanbanBoard({ initialData }: { initialData: KanbanData }) {
    const [data, setData] = useState(initialData);
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    // Sync local state when server finishes Next.js revalidation
    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const startColumn = data.columns[source.droppableId as keyof typeof data.columns];
        const finishColumn = data.columns[destination.droppableId as keyof typeof data.columns];

        // Moving within the same column
        if (startColumn === finishColumn) {
            const newItems = Array.from(startColumn.items);
            const [reorderedItem] = newItems.splice(source.index, 1);
            newItems.splice(destination.index, 0, reorderedItem);

            const newColumn = { ...startColumn, items: newItems };
            setData(prev => ({ ...prev, columns: { ...prev.columns, [newColumn.id]: newColumn } }));
            return;
        }

        // Moving to a different column
        const startItems = Array.from(startColumn.items);
        const [movedItem] = startItems.splice(source.index, 1);

        // Mutate type based on column for UI demonstration
        const newItem = { ...movedItem };
        if (destination.droppableId === 'candidates') newItem.type = 'candidate';
        if (destination.droppableId === 'drafts') newItem.type = 'draft';
        if (destination.droppableId === 'ready') newItem.type = 'ready';

        const finishItems = Array.from(finishColumn.items);
        finishItems.splice(destination.index, 0, newItem);

        setData(prev => ({
            ...prev,
            columns: {
                ...prev.columns,
                [startColumn.id]: { ...startColumn, items: startItems },
                [finishColumn.id]: { ...finishColumn, items: finishItems }
            }
        }));

        // AI Logic Trigger (Generate/Critique)
        if (source.droppableId === 'candidates' && destination.droppableId === 'drafts') {
            console.log(`Triggering buildAndReviewDrafts for ${newItem.id}`);
            // In a real app we'd pass real snippet text
            await buildAndReviewDrafts(newItem.id, newItem.title || "Unknown Topic");
        }

        // Publishing Logic Trigger
        if (source.droppableId === 'drafts' && destination.droppableId === 'ready') {
            console.log(`Triggering publishDraft for ${newItem.id}`);
            // Defaulting to sending variant_a as the final content for simplicity in UI demo
            const contentToPublish = newItem.variants?.variant_a || "Fallback content";
            await publishDraft(newItem.id, contentToPublish);
        }
    };

    if (!isBrowser) return null;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex bg-gray-100 p-4 space-x-4 overflow-x-auto min-h-screen items-start">
                {data.columnOrder.map(columnId => {
                    const column = data.columns[columnId as keyof typeof data.columns];
                    return <KanbanColumn key={column.id} column={column} />;
                })}
            </div>
        </DragDropContext>
    );
}

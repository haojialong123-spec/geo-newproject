'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './kanban-column';
import { buildAndReviewDrafts } from '../app/actions';

const initialData = {
    columns: {
        'inbox': { id: 'inbox', title: 'Inbox (Collect)', items: [{ id: 'item-1', type: 'inbox', title: 'New Topic Input' }] },
        'candidates': { id: 'candidates', title: 'Candidates (Filter)', items: [{ id: 'item-2', type: 'candidate', title: 'Vercel AI SDK' }] },
        'drafts': { id: 'drafts', title: 'Drafts (Create)', items: [] },
        'ready': { id: 'ready', title: 'Ready (Publish)', items: [] }
    },
    columnOrder: ['inbox', 'candidates', 'drafts', 'ready']
};

export default function KanbanBoard() {
    const [data, setData] = useState(initialData);
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

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

        // AI Logic Trigger
        if (source.droppableId === 'candidates' && destination.droppableId === 'drafts') {
            console.log(`Triggering buildAndReviewDrafts for ${newItem.id}`);
            // In a real app we'd pass real snippet text
            await buildAndReviewDrafts(newItem.id, newItem.title);
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

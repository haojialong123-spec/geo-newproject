import React from 'react';
import { KanbanColumn } from './kanban-column';

export default function KanbanBoard() {
    return (
        <div className="flex bg-gray-100 p-4 space-x-4 overflow-x-auto min-h-screen">
            <KanbanColumn title="Inbox (Collect)" items={[]} />
            <KanbanColumn title="Candidates (Filter)" items={[]} />
            <KanbanColumn title="Drafts (Create)" items={[]} />
            <KanbanColumn title="Ready (Publish)" items={[]} />
        </div>
    );
}

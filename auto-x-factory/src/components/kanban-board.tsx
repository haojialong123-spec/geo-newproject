import React from 'react';
import { KanbanColumn } from './kanban-column';
import { InboxItem } from './inbox-item';
import { CandidateItem } from './candidate-item';

export default function KanbanBoard() {
    return (
        <div className="flex bg-gray-100 p-4 space-x-4 overflow-x-auto min-h-screen">
            <KanbanColumn title="Inbox (Collect)" items={[<InboxItem key="1" />]} />
            <KanbanColumn title="Candidates (Filter)" items={[<CandidateItem key="1" />]} />
            <KanbanColumn title="Drafts (Create)" items={[]} />
            <KanbanColumn title="Ready (Publish)" items={[]} />
        </div>
    );
}

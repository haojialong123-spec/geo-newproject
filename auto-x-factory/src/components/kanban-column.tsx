import React from 'react';

export function KanbanColumn({ title, items }: { title: string, items: React.ReactNode[] }) {
    return (
        <div className="bg-white w-80 rounded-lg shadow p-4 flex-shrink-0 flex flex-col">
            <h2 className="font-bold mb-4">{title}</h2>
            <div className="space-y-2 flex-grow">
                {items.length === 0 && <span className="text-sm text-gray-400 italic">No items</span>}
                {items}
            </div>
        </div>
    );
}

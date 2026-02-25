'use client';
import React from 'react';
import { Droppable, Draggable, DroppableProvided, DroppableStateSnapshot, DraggableProvided } from '@hello-pangea/dnd';
import { InboxItem } from './inbox-item';
import { CandidateItem } from './candidate-item';

type KanbanItem = { id: string; type: string; title?: string };

export function KanbanColumn({ column }: { column: { id: string, title: string, items: KanbanItem[] } }) {
    return (
        <div className="bg-white w-96 rounded-lg shadow p-4 flex-shrink-0 flex flex-col h-[calc(100vh-2rem)]">
            <h2 className="font-bold mb-4">{column.title}</h2>
            <Droppable droppableId={column.id}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 flex-grow overflow-y-auto p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50 border-dashed border-2' : ''}`}
                    >
                        {column.items.length === 0 && <span className="text-sm text-gray-400 italic">拖拽归档至此...</span>}
                        {column.items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided: DraggableProvided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="mb-2"
                                    >
                                        {column.id === 'inbox' ? <InboxItem /> : <CandidateItem item={item} />}
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

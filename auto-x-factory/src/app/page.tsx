import KanbanBoard, { KanbanItem } from "@/components/kanban-board";
import { supabase } from "@/lib/db/client";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch real topics from the database
  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching initial topics:", error);
  }

  // Format the data into the structure expected by the Kanban board initial state
  const formattedColumns = {
    'inbox': { id: 'inbox', title: 'Inbox (Collect)', items: [{ id: 'manual-input', type: 'inbox', title: 'Manual Input' }] as KanbanItem[] },
    'candidates': { id: 'candidates', title: 'Candidates (Filter)', items: [] as KanbanItem[] },
    'drafts': { id: 'drafts', title: 'Drafts (Create)', items: [] as KanbanItem[] },
    'ready': { id: 'ready', title: 'Ready (Publish)', items: [] as KanbanItem[] }
  };

  if (topics) {
    topics.forEach((topic) => {
      // Map DB status to column
      const status = topic.status as keyof typeof formattedColumns;
      if (formattedColumns[status]) {
        formattedColumns[status].items.push({
          id: topic.id,
          type: status,
          title: topic.title,
          scoreData: topic.score_data,
          variants: topic.variants,
          critique: topic.critique
        });
      }
    });
  }

  const initialData = {
    columns: formattedColumns,
    columnOrder: ['inbox', 'candidates', 'drafts', 'ready']
  };

  return (
    <main className="min-h-screen">
      <header className="bg-gray-900 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold tracking-tight">auto-x-factory</h1>
      </header>
      <KanbanBoard initialData={initialData} />
    </main>
  );
}

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  return (
    <div className="prose prose-slate max-w-none text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-800 mt-8 mb-3 flex items-center before:content-[''] before:w-1 before:h-5 before:bg-amber-500 before:mr-2 before:rounded" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2" {...props} />,
          p: ({ node, ...props }) => <p className="leading-7 mb-4 text-justify" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-amber-500 bg-amber-50/50 pl-4 py-3 pr-4 italic text-slate-600 rounded-r-lg my-6 shadow-sm" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
          th: ({ node, ...props }) => <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" {...props} />,
          td: ({ node, ...props }) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 border-t border-slate-100" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-8 border-slate-200" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            return !match ? (
              <code className="bg-slate-100 text-amber-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto mb-4">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

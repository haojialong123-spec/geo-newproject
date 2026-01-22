import React from 'react';

// Simplified Markdown renderer for the demo.
// In a real production app, use 'react-markdown' or 'marked'.
// This handles headers, lists, and basic formatting.

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  
  return (
    <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
      {lines.map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-3 border-b pb-2">{line.replace('# ', '')}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-bold text-gray-800 mt-5 mb-2">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-4 list-disc">{line.replace('- ', '')}</li>;
        }
        if (line.startsWith('> ')) {
          return <blockquote key={index} className="border-l-4 border-orange-500 pl-4 py-2 italic bg-gray-50 text-gray-600 my-4 rounded-r">{line.replace('> ', '')}</blockquote>;
        }
        if (line.startsWith('|')) {
           // Simple table row rendering (very basic)
           return <div key={index} className="font-mono text-xs overflow-x-auto whitespace-pre bg-gray-50 p-1 border-b border-gray-200">{line}</div>;
        }
        if (line.trim() === '---') {
            return <hr key={index} className="my-6 border-gray-200"/>
        }
        return <p key={index} className="leading-relaxed whitespace-pre-wrap">{line}</p>;
      })}
    </div>
  );
};

export default MarkdownRenderer;

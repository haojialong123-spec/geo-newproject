import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
    chart: string;
    onSvgGenerated?: (svg: string) => void;
}

mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
        primaryColor: '#9F1212', // Zhengji Red (Deep Red)
        primaryTextColor: '#ffffff', // White text for contrast on primary nodes
        primaryBorderColor: '#7F1D1D', // Darker Red border
        lineColor: '#9F1212', // Red lines
        secondaryColor: '#fef2f2', // Very light red for background/secondary
        tertiaryColor: '#ffffff',
        // Fix for edge labels (text on lines)
        edgeLabelBackground: '#ffffff', // White background for labels
        tertiaryTextColor: '#9F1212', // Red text for labels (high contrast)
    },
    securityLevel: 'loose',
});

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, onSvgGenerated }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const [isRendering, setIsRendering] = useState(true);

    useEffect(() => {
        const renderChart = async () => {
            if (!chart) return;
            setIsRendering(true);

            try {
                setError(null);
                // Generate a unique ID for this rendering
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                // mermaid.render returns an object { svg: string } in newer versions
                const { svg } = await mermaid.render(id, chart);
                setSvgContent(svg);
                if (onSvgGenerated) {
                    onSvgGenerated(svg);
                }
            } catch (err) {
                console.error("Mermaid render failed:", err);
                setError("图表渲染失败: " + (err instanceof Error ? err.message : String(err)));
            } finally {
                setIsRendering(false);
            }
        };

        renderChart();
    }, [chart, onSvgGenerated]);

    if (error) {
        return (
            <div className="w-full p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-mono whitespace-pre-wrap">
                {error}
                <div className="mt-2 text-slate-400 border-t border-red-200 pt-1">
                    Raw Code: {chart}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full min-h-[200px] overflow-x-auto flex justify-center items-center p-6 bg-white rounded-lg border border-slate-100 shadow-sm relative transition-all duration-300"
        >
            {isRendering ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-amber-600 rounded-full animate-spin"></div>
                </div>
            ) : null}
            <div dangerouslySetInnerHTML={{ __html: svgContent }} className={`transition-opacity duration-300 ${isRendering ? 'opacity-0' : 'opacity-100'}`} />
        </div>
    );
};

export default MermaidDiagram;

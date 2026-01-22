import React, { useState, useRef, useEffect } from 'react';
import { AnalysisRecord, ContentType } from '../types';
import { generateArticle, generateVideoScript, generateZhihuAnswer } from '../services/geminiService';
import { FileText, Video, RefreshCw, Copy, ArrowLeft, Loader2, Check, Sparkles, Quote, Tag, Wand2, BookOpen, ChevronDown, ChevronRight, Info, MoreVertical, FileCode } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { PRESET_PAIN_POINTS } from '../constants';

interface ContentGeneratorProps {
  record: AnalysisRecord;
  onBack: () => void;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ record, onBack }) => {
  const [activeTab, setActiveTab] = useState<ContentType>(ContentType.ARTICLE);
  const [generatedContent, setGeneratedContent] = useState<{ [key in ContentType]?: string }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for selected Tags (Pain Points)
  const [selectedIssues, setSelectedIssues] = useState<string[]>(
    record.result?.detected_issues.map(i => i.tag_name) || []
  );

  // State for selected Original Texts (Quotes)
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>(
    record.result?.detected_issues.map(i => i.original_text) || []
  );

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied_md' | 'copied_text'>('idle');
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (copyMenuRef.current && !copyMenuRef.current.contains(event.target as Node)) {
        setShowCopyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "合同签署与效力": true,
    "施工与签证管理": false,
    "资金与结算困境": false,
    "诉讼与执行难点": false
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let result = '';
      const marketingDir = record.result?.marketing_direction;
      const legalConcepts = record.result?.legal_concepts || [];

      if (activeTab === ContentType.ARTICLE) {
        result = await generateArticle(selectedIssues, selectedQuotes, legalConcepts, marketingDir);
      } else if (activeTab === ContentType.VIDEO) {
        result = await generateVideoScript(selectedIssues, selectedQuotes, legalConcepts, marketingDir);
      } else if (activeTab === ContentType.ZHIHU) {
        result = await generateZhihuAnswer(selectedIssues, selectedQuotes, legalConcepts, marketingDir);
      }

      setGeneratedContent(prev => ({ ...prev, [activeTab]: result }));
    } catch (error) {
      console.error(error);
      alert("生成失败，请检查网络或 Key");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleIssue = (tag: string) => {
    if (selectedIssues.includes(tag)) {
      setSelectedIssues(selectedIssues.filter(t => t !== tag));
    } else {
      setSelectedIssues([...selectedIssues, tag]);
    }
  };

  const toggleQuote = (quote: string) => {
    if (selectedQuotes.includes(quote)) {
      setSelectedQuotes(selectedQuotes.filter(q => q !== quote));
    } else {
      setSelectedQuotes([...selectedQuotes, quote]);
    }
  };

  const stripMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^#+\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/`{3}[\s\S]*?`{3}/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^\s*-\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n');
  };

  const handleCopyMarkdown = () => {
    const text = generatedContent[activeTab];
    if (text) {
      navigator.clipboard.writeText(text);
      setCopyStatus('copied_md');
      setShowCopyMenu(false);
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleCopyPlainText = () => {
    const text = generatedContent[activeTab];
    if (text) {
      navigator.clipboard.writeText(stripMarkdown(text));
      setCopyStatus('copied_text');
      setShowCopyMenu(false);
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const hasContent = !!generatedContent[activeTab];
  const isButtonDisabled = isGenerating || (selectedIssues.length === 0 && selectedQuotes.length === 0);

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors group text-sm font-medium">
        <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" /> 返回案源列表
      </button>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column: Configuration */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] sticky top-28 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin">
            <div className="mb-6">
               <h3 className="font-serif text-lg font-bold text-slate-900">GEO 策略配置</h3>
               <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">Brand & Context Injection</p>
            </div>
            
            {/* AI Recommendation Box */}
            {record.result?.marketing_direction && (
                <div className="mb-8 bg-gradient-to-br from-indigo-50 to-slate-50 p-5 rounded-xl border border-indigo-100/50">
                    <div className="flex items-center text-indigo-800 font-bold text-[10px] uppercase mb-2 tracking-wider">
                        <Sparkles size={10} className="mr-1" />
                        GEO Long-tail Strategy
                    </div>
                    <p className="text-slate-800 text-sm font-medium leading-relaxed font-serif">
                        {record.result.marketing_direction}
                    </p>
                </div>
            )}

            {/* Selection Area */}
            <div className="space-y-8">
                
                {/* 1. Quotes Selection (Extracted) */}
                <div>
                  <SectionHeader icon={<Quote size={12} />} title="案源提取原话" subtitle="Source Material" />
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {record.result?.detected_issues.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-2">未检测到明显痛点原话。</p>
                    ) : record.result?.detected_issues.map((issue, idx) => (
                        <label 
                            key={`q-${idx}`} 
                            className={`flex items-start p-3.5 rounded-lg border cursor-pointer transition-all group relative ${
                            selectedQuotes.includes(issue.original_text) 
                                ? 'border-amber-500 bg-amber-50/30' 
                                : 'border-slate-100 hover:border-amber-200 hover:bg-slate-50'
                            }`}
                            title={issue.original_text}
                        >
                            <input 
                                type="checkbox" 
                                className="mt-1 mr-3 accent-amber-600 shrink-0"
                                checked={selectedQuotes.includes(issue.original_text)}
                                onChange={() => toggleQuote(issue.original_text)}
                            />
                            <div className="text-xs text-slate-600 italic line-clamp-3 leading-relaxed font-serif">
                              “{issue.original_text}”
                            </div>
                        </label>
                    ))}
                  </div>
                </div>

                {/* 2. Issues Selection (Library) */}
                <div>
                  <SectionHeader icon={<Tag size={12} />} title="法律痛点库" subtitle="Pain Point Library" />
                  
                  {/* Extracted Issues Tags (Chips) */}
                  {record.result?.detected_issues.length > 0 && (
                     <div className="mb-4 pb-4 border-b border-slate-50">
                        <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wide">AI Recommended Tags</p>
                        <div className="flex flex-wrap gap-2">
                            {record.result.detected_issues.map((issue, idx) => (
                                <button
                                    key={`ai-t-${idx}`}
                                    onClick={() => toggleIssue(issue.tag_name)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    selectedIssues.includes(issue.tag_name)
                                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-700'
                                    }`}
                                >
                                    {selectedIssues.includes(issue.tag_name) && <Check size={10} className="inline mr-1"/>}
                                    {issue.tag_name}
                                </button>
                            ))}
                        </div>
                     </div>
                  )}

                  {/* Preset Library (Accordion List) */}
                  <div className="space-y-3">
                    {Object.entries(PRESET_PAIN_POINTS).map(([category, items]) => {
                        const isExpanded = expandedCategories[category];
                        return (
                            <div key={category} className="border border-slate-100 rounded-lg overflow-hidden transition-all duration-200">
                                <button 
                                    onClick={() => toggleCategory(category)}
                                    className={`w-full flex items-center justify-between p-3 transition-colors ${isExpanded ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <span className="text-xs font-bold text-slate-700">{category}</span>
                                    {isExpanded ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                                </button>
                                
                                {isExpanded && (
                                    <div className="p-3 space-y-2 bg-white border-t border-slate-50 max-h-64 overflow-y-auto scrollbar-thin">
                                        {items.map((item, idx) => (
                                            <div 
                                                key={`${category}-${idx}`} 
                                                className={`group relative p-3 rounded border cursor-pointer transition-all ${
                                                    selectedIssues.includes(item.tag)
                                                    ? 'bg-amber-50/30 border-amber-200'
                                                    : 'bg-white border-slate-100 hover:border-amber-200'
                                                }`}
                                                onClick={() => toggleIssue(item.tag)}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-xs font-bold ${selectedIssues.includes(item.tag) ? 'text-amber-800' : 'text-slate-700'}`}>
                                                        {item.tag}
                                                    </span>
                                                    {selectedIssues.includes(item.tag) && <Check size={12} className="text-amber-600"/>}
                                                </div>
                                                <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight font-serif italic">
                                                    {item.desc}
                                                </p>

                                                {/* Tooltip */}
                                                <div className="absolute left-0 bottom-full w-full mb-2 p-4 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                    <div className="font-bold mb-2 text-amber-400">{item.tag}</div>
                                                    <div className="leading-relaxed font-serif">“{item.desc}”</div>
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                  </div>

                </div>

            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
                <button 
                onClick={handleGenerate}
                disabled={isButtonDisabled}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-medium transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl active:scale-95"
                >
                {isGenerating ? <Loader2 className="animate-spin mr-2"/> : <Wand2 className="mr-2" size={18} />}
                {hasContent ? '重新生成内容' : '启动 GEO 引擎'}
                </button>
            </div>
          </div>
        </div>

        {/* Right Column: Content Output */}
        <div className="col-span-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] min-h-[800px] flex flex-col overflow-hidden">
            
            {/* Tabs - Cleaner Design */}
            <div className="flex border-b border-slate-100 bg-slate-50/30 px-6 pt-4 space-x-8">
              <TabItem 
                isActive={activeTab === ContentType.ARTICLE} 
                onClick={() => setActiveTab(ContentType.ARTICLE)}
                icon={<FileText size={16} />}
                label="深度文章 (公众号)"
              />
              <TabItem 
                isActive={activeTab === ContentType.VIDEO} 
                onClick={() => setActiveTab(ContentType.VIDEO)}
                icon={<Video size={16} />}
                label="口播脚本 (抖音)"
              />
              <TabItem 
                isActive={activeTab === ContentType.ZHIHU} 
                onClick={() => setActiveTab(ContentType.ZHIHU)}
                icon={<BookOpen size={16} />}
                label="逻辑回答 (知乎)"
              />
            </div>

            {/* Content Area */}
            <div className="flex-1 p-10 relative">
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
                   <div className="relative mb-6">
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-amber-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles size={20} className="text-amber-600 animate-pulse"/>
                        </div>
                   </div>
                   <p className="text-slate-900 font-serif font-bold text-xl tracking-tight mb-3">
                     Generating GEO Content
                   </p>
                   <div className="text-xs text-slate-500 space-y-2 text-center font-mono">
                     <p>Processing Legal Context...</p>
                     <p>Injecting Brand Assets...</p>
                     <p>Optimizing for Beijing Region...</p>
                   </div>
                </div>
              ) : generatedContent[activeTab] ? (
                <>
                  <div className="absolute top-6 right-6 z-10 flex flex-col items-end" ref={copyMenuRef}>
                    <button 
                      onClick={() => setShowCopyMenu(!showCopyMenu)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border shadow-sm transition-all active:scale-95 ${
                        copyStatus !== 'idle'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                      title="复制内容"
                    >
                      {copyStatus === 'idle' ? <Copy size={16} /> : <Check size={16} />}
                      <span className="text-sm font-medium">
                          {copyStatus === 'idle' ? '一键复制' : copyStatus === 'copied_md' ? '已复制源码' : '已复制文本'}
                      </span>
                      <ChevronDown size={14} className={`transition-transform ${showCopyMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Copy Dropdown Menu */}
                    {showCopyMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-20">
                            <button
                                onClick={handleCopyMarkdown}
                                className="w-full flex items-center px-4 py-3 text-left hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-50"
                            >
                                <FileCode size={16} className="mr-2 text-slate-400"/>
                                复制 Markdown 源码
                            </button>
                            <button
                                onClick={handleCopyPlainText}
                                className="w-full flex items-center px-4 py-3 text-left hover:bg-slate-50 text-sm text-slate-700"
                            >
                                <FileText size={16} className="mr-2 text-slate-400"/>
                                复制纯文本 (无格式)
                            </button>
                        </div>
                    )}
                  </div>
                  <div className="max-w-3xl mx-auto">
                    <MarkdownRenderer content={generatedContent[activeTab]!} />
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <Wand2 size={32} className="text-slate-200" />
                  </div>
                  <p className="font-serif text-lg text-slate-400">准备生成</p>
                  <p className="text-sm mt-2 text-slate-400">请勾选左侧配置项，AI 将为您生成高质量营销内容</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon, title, subtitle }: any) => (
    <div className="flex items-center justify-between mb-4">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
        <span className="mr-2 text-amber-600">{icon}</span> {title}
        </label>
        <span className="text-[10px] font-medium text-slate-400">{subtitle}</span>
    </div>
);

const TabItem = ({ isActive, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`pb-4 text-sm font-medium flex items-center space-x-2 border-b-2 transition-all duration-200 ${
            isActive 
            ? 'border-amber-600 text-amber-700' 
            : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export default ContentGenerator;

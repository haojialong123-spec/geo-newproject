import React, { useState } from 'react';
import { LegalScenario } from '../types';
import { ID_PREFIX_MAP } from '../constants';
import { BookOpen, BrainCircuit, Target, Search, Trash2, Edit2, Save, X, ChevronDown, ChevronUp, Quote, Layers } from 'lucide-react';

interface TemplateLibraryProps {
  templates: LegalScenario[];
  onUpdate: (template: LegalScenario) => void;
  onDelete: (id: string) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ templates, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LegalScenario | null>(null);

  const filteredTemplates = templates.filter(t => 
    t.pain_point.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.case_name && t.case_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatId = (id: string) => {
    const parts = id.split('-');
    if (parts.length > 0 && ID_PREFIX_MAP[parts[0]]) {
      return `${ID_PREFIX_MAP[parts[0]]}-${parts[1]}`;
    }
    return id;
  };

  const handleEditClick = (template: LegalScenario, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(template.id);
    setEditForm({ ...template });
    setExpandedId(template.id);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editForm) {
      onUpdate(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditForm(null);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  const toggleExpand = (id: string) => {
    if (editingId) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const handleInputChange = (field: keyof LegalScenario, value: string) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">建工法律场景知识库</h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            系统当前共沉淀 {templates.length} 个案件场景模型。新分析的案源将自动转化为标准模型，供日后检索复用。
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索案件名称、痛点、编号..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-5 py-2.5 border border-slate-200 rounded-full text-sm w-full md:w-72 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm transition-shadow hover:shadow"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        {filteredTemplates.map((template) => {
          const isEditing = editingId === template.id;
          const isExpanded = expandedId === template.id;
          const data = isEditing && editForm ? editForm : template;

          return (
            <div 
              key={template.id} 
              className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                isExpanded 
                    ? 'shadow-lg border-amber-500/30' 
                    : 'shadow-sm border-slate-100 hover:border-slate-300'
              }`}
            >
              {/* Header / Summary Row */}
              <div 
                className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-amber-50/20' : 'bg-white'}`}
                onClick={() => toggleExpand(template.id)}
              >
                <div className="flex items-center space-x-6 flex-1">
                  <div className={`w-20 text-center`}>
                       <span className={`inline-block px-3 py-1 text-[10px] font-bold tracking-wider rounded border ${
                        template.is_custom 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {formatId(template.id)}
                      </span>
                  </div>
                  
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={data.case_name || ''}
                          placeholder="案件名称"
                          onChange={(e) => handleInputChange('case_name', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-base font-bold text-slate-900 border-b border-amber-300 focus:outline-none bg-transparent placeholder-slate-300"
                        />
                        <input 
                          type="text" 
                          value={data.pain_point}
                          placeholder="核心痛点"
                          onChange={(e) => handleInputChange('pain_point', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-sm text-slate-500 border-b border-slate-200 focus:outline-none bg-transparent"
                        />
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center font-serif">
                            {data.case_name || data.pain_point}
                            {!data.case_name && <span className="ml-2 text-xs font-normal text-slate-400 italic"> (无案件名)</span>}
                        </h3>
                         <div className="flex items-center space-x-3 mt-1.5">
                             {data.case_name && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                                    {data.pain_point}
                                </span>
                             )}
                            {!isExpanded && (
                                <p className="text-xs text-slate-400 line-clamp-1 border-l border-slate-200 pl-3">
                                    {data.case_summary || data.marketing_action}
                                </p>
                            )}
                         </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pl-6">
                  {isEditing ? (
                    <>
                      <ActionButton onClick={handleSaveClick} icon={<Save size={16} />} color="text-emerald-600 bg-emerald-50 hover:bg-emerald-100" />
                      <ActionButton onClick={handleCancelClick} icon={<X size={16} />} color="text-slate-500 bg-slate-100 hover:bg-slate-200" />
                    </>
                  ) : (
                    <>
                      <ActionButton onClick={(e: any) => handleEditClick(template, e)} icon={<Edit2 size={16} />} color="text-blue-600 hover:bg-blue-50" />
                      <ActionButton onClick={(e: any) => handleDeleteClick(template.id, e)} icon={<Trash2 size={16} />} color="text-rose-500 hover:bg-rose-50" />
                      <div className="p-2 text-slate-300">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-8 border-t border-slate-100 grid grid-cols-1 gap-8 bg-white">
                  
                  <div className="space-y-8">
                    <div>
                      <SectionTitle icon={<Quote size={14} />} title="客户原话 (提取问题)" />
                      {isEditing ? (
                        <textarea
                          value={data.triggers.join('\n')}
                          onChange={(e) => handleInputChange('triggers', e.target.value.split('\n').filter(s=>s.trim()) as any)}
                          className="w-full text-sm p-4 border border-slate-200 rounded-lg bg-slate-50 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                          rows={4}
                          placeholder="每行一个问题描述..."
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {data.triggers.map((trigger, idx) => (
                            <div key={idx} className="flex items-start text-sm text-slate-600 italic bg-slate-50 p-4 rounded-lg border border-slate-100">
                              <span className="text-amber-400 font-serif text-2xl leading-none mr-3 h-4 overflow-visible">“</span>
                              <span className="font-serif leading-relaxed">{trigger}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <SectionTitle icon={<BrainCircuit size={14} />} title="AI 案情逻辑总结" />
                            {isEditing ? (
                                <textarea
                                value={data.case_summary || data.ai_logic}
                                onChange={(e) => handleInputChange('case_summary', e.target.value)}
                                className="w-full text-sm p-4 border border-slate-200 rounded-lg bg-slate-50 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                                rows={4}
                                />
                            ) : (
                                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border-l-2 border-indigo-400">
                                {data.case_summary || data.ai_logic}
                                </p>
                            )}
                        </div>
                        <div>
                            <SectionTitle icon={<Target size={14} />} title="营销转化方向" />
                            {isEditing ? (
                                <input
                                type="text"
                                value={data.marketing_action}
                                onChange={(e) => handleInputChange('marketing_action', e.target.value)}
                                className="w-full text-sm p-4 border border-slate-200 rounded-lg bg-slate-50 focus:ring-1 focus:ring-amber-500 outline-none"
                                />
                            ) : (
                                <div className="text-sm text-slate-800 font-medium bg-amber-50/50 p-4 rounded-lg border border-amber-100 flex items-start">
                                    <Layers size={16} className="text-amber-600 mr-2 mt-0.5"/>
                                    {data.marketing_action}
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredTemplates.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
            <BookOpen className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-slate-500 font-serif">没有找到匹配的场景模型。</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, icon, color = "text-slate-400 hover:bg-slate-100" }: any) => (
    <button 
    onClick={onClick}
    className={`p-2 rounded-full transition-all duration-200 ${color}`}
    >
    {icon}
    </button>
);

const SectionTitle = ({ icon, title }: any) => (
    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
        <span className="mr-2 text-slate-500">{icon}</span> {title}
    </label>
)

export default TemplateLibrary;

import React from 'react';
import { AnalysisRecord } from '../types';
import { Wand2, FileText, Loader2, AlertCircle, Calendar, Hash, Shield, ArrowRight } from 'lucide-react';

interface DashboardProps {
  records: AnalysisRecord[];
  onGenerateClick: (record: AnalysisRecord) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ records, onGenerateClick }) => {
  
  if (records.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="text-slate-300" size={32} />
        </div>
        <p className="text-slate-500 font-serif text-lg">暂无案源记录</p>
        <p className="text-slate-400 text-sm mt-1">请上传文件开始深度法律分析</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/6">案件来源</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/4">用户画像 & 法律要素</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/4">证据链状态</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/6">AI 洞察摘要</th>
              <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/6 text-right">GEO 引擎</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map((record) => {
              const result = record.result;
              return (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Column 1: Source */}
                  <td className="px-8 py-6 align-top">
                    <div className="flex items-start space-x-4">
                      <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1 text-sm mb-1" title={record.fileName}>{record.fileName}</p>
                        <div className="flex items-center text-xs text-slate-400">
                            <Calendar size={10} className="mr-1"/>
                            {record.uploadDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Column 2: Persona & Legal Concepts */}
                  <td className="px-8 py-6 align-top">
                    {result ? (
                      <div className="space-y-3">
                        {/* Persona Tags */}
                        <div className="flex flex-wrap gap-2">
                           {result.user_persona?.tags?.map((tag, idx) => (
                             <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                               {tag}
                             </span>
                           ))}
                        </div>
                        {/* Legal Terms */}
                        <div>
                             <p className="font-serif font-medium text-slate-800 text-sm mb-1">{result.case_type}</p>
                             <p className="text-xs text-slate-500 leading-relaxed">
                                {result.legal_concepts?.join('  ·  ')}
                             </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 italic text-xs">Waiting for analysis...</span>
                    )}
                  </td>

                  {/* Column 3: Evidence Analysis */}
                  <td className="px-8 py-6 align-top">
                    {result ? (
                      <div className="space-y-3">
                         <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                             result.evidence_analysis?.strength?.includes('强') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                             result.evidence_analysis?.strength?.includes('中') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                             'bg-rose-50 text-rose-700 border-rose-100'
                         }`}>
                             <Shield size={10} className="mr-1.5"/>
                             {result.evidence_analysis?.strength || '未知强度'}
                         </div>
                         <p className="text-xs text-slate-600 leading-relaxed">
                            {result.evidence_analysis?.description || '证据链待确认'}
                         </p>
                         <div className="pt-2 border-t border-slate-100 mt-2">
                             <span className="text-[10px] text-slate-400 uppercase tracking-wide">Keywords</span>
                             <p className="text-xs text-slate-500 mt-0.5">{result.evidence_analysis?.keywords?.join(', ')}</p>
                         </div>
                      </div>
                    ) : (
                      <div className="h-2 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                    )}
                  </td>

                  {/* Column 4: Summary */}
                  <td className="px-8 py-6 align-top">
                    {result ? (
                       <div className="space-y-3">
                          <p className="text-xs text-slate-600 line-clamp-3 leading-loose font-light">
                              {result.problem_summary}
                          </p>
                          {result.marketing_direction && (
                              <div className="flex items-center text-[10px] text-amber-700 bg-amber-50/50 px-2 py-1.5 rounded border border-amber-100/50">
                                  <Hash size={10} className="mr-1.5"/>
                                  <span className="truncate max-w-[150px]">{result.marketing_direction}</span>
                              </div>
                          )}
                       </div>
                    ) : (
                       <div className="space-y-2">
                          <div className="h-2 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                          <div className="h-2 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                       </div>
                    )}
                  </td>

                  {/* Column 5: Action */}
                  <td className="px-8 py-6 align-middle text-right">
                    {record.status === 'completed' && (
                      <button
                        onClick={() => onGenerateClick(record)}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 group-hover:bg-black"
                      >
                        <Wand2 size={14} />
                        <span>内容裂变</span>
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all"/>
                      </button>
                    )}
                    {record.status === 'processing' && (
                       <span className="text-amber-600 text-xs flex items-center justify-end font-medium">
                         <Loader2 size={14} className="animate-spin mr-2"/> 深度分析中
                       </span>
                    )}
                    {record.status === 'failed' && (
                       <span className="text-rose-500 text-xs flex items-center justify-end">
                         <AlertCircle size={14} className="mr-1"/> 分析失败
                       </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;

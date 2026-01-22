import React from 'react';
import { FIRM_KNOWLEDGE_BASE } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';
import { ShieldCheck, Info, MapPin } from 'lucide-react';

const KnowledgeBaseView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Intro Card - Premium Dark */}
      <div className="bg-slate-900 rounded-2xl p-10 text-white shadow-xl relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-serif font-bold mb-3 tracking-wide">北京正己律师事务所</h1>
                <div className="flex items-center space-x-6 text-slate-400 text-sm mb-8 font-medium">
                    <span className="flex items-center"><MapPin size={16} className="mr-2 text-amber-600"/> 北京朝阳区</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>建工法律专家</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>300+ 团队成员</span>
                </div>
                <p className="max-w-2xl text-slate-300 leading-relaxed text-sm">
                    本模块展示系统当前加载的“品牌资产知识库”。AI 在生成所有公众号文章、视频脚本及回答时，
                    将严格依据以下信息进行 <strong className="text-white">GEO (Generative Engine Optimization)</strong> 优化，确保品牌一致性与专业度。
                </p>
            </div>
            <div className="hidden md:block">
                <div className="w-20 h-20 border-2 border-amber-600/30 rounded-full flex items-center justify-center">
                    <span className="font-serif text-amber-600 text-3xl font-bold">ZJ</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Stats */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] col-span-1 h-fit">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center font-serif text-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2"/>
                  核心服务承诺
              </h3>
              <ul className="space-y-4 text-sm text-slate-600">
                  <ListItem text="重大节点 24小时主动告知" />
                  <ListItem text="无隐形消费，杜绝中途加价" />
                  <ListItem text="利益冲突强制检索" />
                  <ListItem text="全员投保执业责任险" />
              </ul>
          </div>

          {/* Main Content */}
          <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] col-span-2">
            <div className="flex items-center mb-8 pb-4 border-b border-slate-100">
                <Info className="w-5 h-5 text-slate-400 mr-2"/>
                <h3 className="font-bold text-slate-900 font-serif">系统知识库详情 (Raw Context)</h3>
            </div>
            <div className="bg-slate-50/50 rounded-xl p-8 border border-slate-100/50">
                <MarkdownRenderer content={FIRM_KNOWLEDGE_BASE} />
            </div>
          </div>
      </div>
    </div>
  );
};

const ListItem = ({ text }: { text: string }) => (
    <li className="flex items-center">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3"></span>
        <span>{text}</span>
    </li>
);

export default KnowledgeBaseView;

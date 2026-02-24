"use client";

import { useState } from 'react';
import { Sparkles, Database, BookOpen, PenTool, Search, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  const mockTopics = [
    { id: 1, title: "为什么普通人越努力越穷？核心原因是这个动作做错了", reason: "痛点切入，制造反差感，解答用户的焦虑，容易引发共鸣。" },
    { id: 2, title: "2026搞钱新趋势：被忽视的赛道，已经有人闷声发财", reason: "趋势+案例，满足用户对“信息差”的渴求和好奇心。" },
    { id: 3, title: "我关注了100个赚钱博主，发现他们的底层逻辑只有这3条", reason: "盘点总结式标题，干货密度高，收藏率极高。" }
  ];

  const handleStartAnalysis = () => {
    setIsProcessing(true);
    // Simulate API call step 1 -> step 2
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(2);
    }, 2000);
  };

  const handleSelectTopic = (id: number) => {
    setSelectedTopic(id);
    setCurrentStep(3);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full glass-panel z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">AI Content Creator</h1>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2 font-medium">Get笔记强力驱动</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-6">
          {[
            { step: 1, label: "捞取干货", icon: <Database className="w-4 h-4" /> },
            { step: 2, label: "智能选题", icon: <BookOpen className="w-4 h-4" /> },
            { step: 3, label: "生成文章", icon: <PenTool className="w-4 h-4" /> }
          ].map((s, idx) => (
            <div key={s.step} className={`flex items-center space-x-2 font-medium ${currentStep >= s.step ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <div className={`flex items-center justify-center w-7 h-7 rounded-full ${currentStep >= s.step ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-slate-200 dark:bg-slate-800'}`}>
                {currentStep > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.icon}
              </div>
              <span className="text-sm">{s.label}</span>
              {idx < 2 && <ChevronRight className="w-4 h-4 text-slate-300 mx-2" />}
            </div>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto grid grid-cols-12 gap-8">

        {/* Left Panel: Configuration */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-500" />
              知识源配置
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">目标知识库</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option>抖音商业笔记博主精选 (ID: xxxx)</option>
                  <option>个人日常灵感库</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">提取提示词 (Prompt)</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                  placeholder="例如：请总结最近一个月内，知识库中所有博主反复提及的 3 个核心商业趋势，并列出对应的具体案例。"
                  defaultValue="检索博主们分享的关于‘变现/搞钱’遇到的最大痛点是什么？他们分别给出了哪些独特的解决方案？"
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-full px-3 py-1 transition-colors">🔥 爆款痛点</button>
                <button className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-full px-3 py-1 transition-colors">💡 趋势总结</button>
                <button className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-full px-3 py-1 transition-colors">💬 金句提取</button>
              </div>
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={isProcessing || currentStep > 1}
              className={`w-full mt-6 py-3 rounded-xl font-bold text-white flex justify-center items-center transition-all ${isProcessing || currentStep > 1 ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30'}`}
            >
              {isProcessing ? (
                <span className="flex items-center"><Search className="w-4 h-4 mr-2 animate-spin" /> 执行分析中...</span>
              ) : currentStep > 1 ? (
                <span>已完成数据提取</span>
              ) : (
                <span className="flex items-center"><Sparkles className="w-4 h-4 mr-2" /> 开始分析并生成选题</span>
              )}
            </button>
          </div>

          {/* Raw Data Accordion - Mocked */}
          {currentStep > 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-500 flex justify-between items-center cursor-pointer">
                <span>📚 知识库提纯素材</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">检索成功</span>
              </h3>
              <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-h-40 overflow-y-auto">
                <p>根据知识库检索，目前博主们提到的最大痛点在于：1. 流量红利消失，获客成本激增；2. 内容同质化严重，无法建立个人IP壁垒。</p>
                <p className="mt-2">解法建议：...</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Working Area */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6">

          {/* Step 1: Blank state */}
          {currentStep === 1 && (
            <div className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
              <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">准备就绪</h2>
              <p className="text-slate-500 max-w-md">配置好左侧的知识库和提示词，点击“开始分析”，AI 将自动为您从海量笔记中提取干货并策划选题。</p>
            </div>
          )}

          {/* Step 2: Topics Selection */}
          {currentStep === 2 && (
            <div className="flex-1 animate-fade-in space-y-6">
              <h2 className="text-2xl font-bold flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-blue-500" />
                选题策划完毕，请挑选
              </h2>
              <p className="text-slate-500">基于您知识库的干货，AI 主编为您策划了以下 {mockTopics.length} 个最具爆款潜质的选题框架：</p>

              <div className="grid grid-cols-1 gap-4 mt-6">
                {mockTopics.map(topic => (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic.id)}
                    className="group bg-white dark:bg-slate-800 border-2 border-transparent hover:border-blue-500 p-6 rounded-2xl shadow-sm cursor-pointer transition-all hover:shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                        {topic.title}
                      </h3>
                      <button className="hidden group-hover:block text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">使用此选题</button>
                    </div>
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <p className="text-sm text-slate-500 font-medium mb-1">💡 切入思路：</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{topic.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Content Generation (Mocked for now) */}
          {currentStep === 3 && (
            <div className="flex flex-col h-full animate-fade-in space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium">当前发力点</span>
                  <h3 className="font-bold text-slate-700">{mockTopics.find(t => t.id === selectedTopic)?.title}</h3>
                </div>
                <button className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition">一键复制全文</button>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-8 min-h-[500px]">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="flex items-center text-blue-500 font-medium mb-4">
                    <PenTool className="w-4 h-4 mr-2 animate-pulse" /> AI 撰稿人正在为您火速码字中...
                  </p>
                  <p className="text-slate-400 italic">（此处稍后将展示真实的流式打字机效果输出的文章，结合预设的语料和选题框架自动生成...）</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { Sparkles, Database, BookOpen, PenTool, Search, ChevronRight, CheckCircle2 } from 'lucide-react';

type TopicType = { id: number; title: string; reason: string };

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [sourceData, setSourceData] = useState<string>('');
  const [topics, setTopics] = useState<TopicType[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicType | null>(null);

  // State for prompt input
  const [promptText, setPromptText] = useState("请全面检索建工知识库中关于‘工程款拖欠’、‘资质挂靠风险’、‘盲目垫资’等核心痛点的高级实操解决对策。重点关注那些能让工程老板、包工头产生强烈共鸣的真实维权方法。不要只列举枯燥的法律条文，需要总结出博主们在视频中反复强烈的‘避坑关键点’，例如如何在合同签订初期规避风险，如何收集合格的证据链条用于后续索赔，以及遇到老赖发包方时的谈判和施压技巧。收集的素材必须具备强烈的实操指导意义，能够直接转化为短视频的干货建议。");
  const [targetKnowledgeBase, setTargetKnowledgeBase] = useState("MJaQWmoJ");

  // Predefined prompt categories
  const promptPresets = [
    { label: "🔥 痛点对策", value: "请全面检索建工知识库中关于‘工程款拖欠’、‘资质挂靠风险’、‘盲目垫资’等核心痛点的高级实操解决对策。重点关注那些能让工程老板、包工头产生强烈共鸣的真实维权方法。不要只列举枯燥的法律条文，需要总结出博主们在视频中反复强烈的‘避坑关键点’，例如如何在合同签订初期规避风险，如何收集合格的证据链条用于后续索赔，以及遇到老赖发包方时的谈判和施压技巧。收集的素材必须具备强烈的实操指导意义，能够直接转化为短视频的干货建议。" },
    { label: "📈 行业风向", value: "请深入分析近期建工领域新规政策（如新《公司法》对建工企业注册资本实缴的冲击、各地打击挂靠的最新专项行动）、以及EPC总承包模式大范围普及对传统中小包工头生存空间的挤压。总结这些宏观趋势在短视频平台上引发了哪些流量爆款观点和激烈讨论？提取博主们对于‘未来建筑人出路在哪里’的核心洞察，包括转型做专业分包、劳务升级、或是抱团取暖的切实建议，为制作紧跟时代脉搏、引发行业人深度焦虑与共鸣的短视频提供详实素材。" },
    { label: "💡 真实案例", value: "从知识库中挖掘并梳理出最具代表性和戏剧冲突的建工纠纷真实案例。具体包括：包工头历经千辛万苦拿到工程款的绝地反击、因轻信口头承诺导致几百万血本无归的惨痛教训、或是挂靠期间发生重大安全事故后的连带赔偿官司。请提炼出案例中的核心人物背景、矛盾爆发点、令人意想不到的反转环节，以及最终法院的判决依据或实务调解结果。这些案例素材将用于制作‘普法故事流’短视频，必须具备引人入胜的故事性和发人深省的警示作用。" },
    { label: "⚖️ 避坑指南", value: "针对建工行业的初入行者或经验不足的班组长，全面检索并提炼他们在施工合同签署、进场施工、工程决算等各个环节最容易踩中的‘致命大坑’。涵盖内容包括但不限于：被忽悠签订阴阳合同、霸王条款的识别、材料款被挪用、隐蔽工程签证不规范导致的不认账等。不仅要列举这些常见陷阱的表现形式，还得结合知识库中大佬们的经验，整理出一套‘防忽悠防扯皮的保姆级排雷指南’，必须语言通俗、接地气，能立刻用在工地上，用于制作干货满满的避坑教学短视频。" }
  ];

  // AI Content Streaming Hook
  const { completion, complete, isLoading: isStreaming } = useCompletion({
    api: '/api/generate-content',
  });

  const handleStartAnalysis = async () => {
    setIsProcessing(true);
    try {
      // Step 1: Call Get Notes Proxy
      const notesRes = await fetch('/api/get-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: promptText,
          topic_ids: [targetKnowledgeBase]
        })
      });

      if (!notesRes.ok) {
        let errorText = `[ 🚨 Get 笔记 API 请求失败 ]\n\n状态码: ${notesRes.status}\n`;
        try {
          const notesData = await notesRes.json();
          errorText += `错误概要: ${notesData.error || '未知错误'}\n详细日志: ${notesData.details || '无'}\n\n👉 完整的返回报文：\n${JSON.stringify(notesData, null, 2)}`;
        } catch (e) {
          errorText += `服务器返回了非 JSON 格式的异常甚至被安全网关拦截。`;
        }
        setSourceData(errorText);
        setIsProcessing(false);
        return;
      }

      // Read the stream chunk-by-chunk to keep connection active!
      const reader = notesRes.body?.getReader();
      const decoder = new TextDecoder();
      let rawText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawText += decoder.decode(value, { stream: true });
          setSourceData(rawText || "引擎运转中，正在提取...");
        }
      }

      if (!rawText.trim()) {
        rawText = "未能从 Get 笔记抽取到有效信息";
        setSourceData(rawText);
      }

      // Step 2: Call generate-topics using DeepSeek
      const topicsRes = await fetch('/api/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceData: rawText })
      });

      const topicsData = await topicsRes.json();

      if (topicsData.topics && Array.isArray(topicsData.topics)) {
        setTopics(topicsData.topics);
        setCurrentStep(2);
      } else {
        alert("向 DeepSeek 请求生成选题失败：" + JSON.stringify(topicsData));
      }
    } catch (err) {
      console.error(err);
      alert("执行过程中发生网络或逻辑错误，详看控制台");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectTopic = (topic: TopicType) => {
    setSelectedTopic(topic);
    setCurrentStep(3);
    complete('', {
      body: {
        sourceData,
        topicTitle: topic.title,
        topicReason: topic.reason
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full glass-panel z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight leading-none">AI 爆款短视频引擎</h1>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 flex items-center h-6 rounded-full ml-3 font-medium border border-orange-200">建工垂类版</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 flex items-center h-6 rounded-full ml-2 font-medium border border-blue-200">Get笔记+DeepSeek内核</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-6">
          {[
            { step: 1, label: "捞取干货", icon: <Database className="w-4 h-4" /> },
            { step: 2, label: "智能选题", icon: <BookOpen className="w-4 h-4" /> },
            { step: 3, label: "脚本生成", icon: <PenTool className="w-4 h-4" /> }
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
              知识提取引擎
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">目标知识库</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={targetKnowledgeBase}
                  onChange={(e) => setTargetKnowledgeBase(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="MJaQWmoJ">建工领域优质短视频库 (MJaQWmoJ)</option>
                  <option value="20jDQgxn">建工法律咨询检索库 (20jDQgxn)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">一键打捞指令 (Prompt)</label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {promptPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setPromptText(preset.value)}
                      className={`text-xs border rounded-full px-3 py-1.5 transition-colors ${promptText === preset.value
                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none leading-relaxed"
                  placeholder="例如：请总结最近一个月内，建工知识库中所有博主反复提及的核心趋势..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  disabled={isProcessing}
                ></textarea>
              </div>
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={isProcessing || currentStep > 1}
              className={`w-full mt-6 py-3 rounded-xl font-bold text-white flex justify-center items-center transition-all ${isProcessing || currentStep > 1 ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30'}`}
            >
              {isProcessing ? (
                <span className="flex items-center"><Search className="w-4 h-4 mr-2 animate-spin" /> 引擎全速运转中 (API 调度中)...</span>
              ) : currentStep > 1 ? (
                <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> 已完成数据提取与分析</span>
              ) : (
                <span className="flex items-center"><Sparkles className="w-4 h-4 mr-2" /> 开始分析并策划选题</span>
              )}
            </button>
            <button
              className={`text-xs w-full mt-2 text-slate-400 underline decoration-slate-300 ${currentStep > 1 && !isStreaming ? 'block' : 'hidden'}`}
              onClick={() => { setCurrentStep(1); setTopics([]); setSelectedTopic(null); }}
            >
              重新开始 (清空当前任务)
            </button>
          </div>

          {/* Raw Data Accordion */}
          {(currentStep > 1 || sourceData) && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in mt-6">
              <h3 className="text-sm font-bold text-slate-500 flex justify-between items-center cursor-pointer">
                <span>📚 Get笔记返回报文 (Source)</span>
                {sourceData.startsWith("[ 🚨") ? (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-mono">API Error</span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 font-mono">200 OK</span>
                )}
              </h3>
              <div className="mt-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-h-96 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-3 rounded-lg font-mono whitespace-pre-wrap">
                {sourceData}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Working Area */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6">

          {/* Step 1: Blank state */}
          {currentStep === 1 && (
            <div className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
              <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Search className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">百大建工博主为您赋能</h2>
              <p className="text-slate-500 max-w-md">左侧已绑定获取 Get 笔记 <b>建工垂类</b> 知识库。<br />点击开始，将通过 DeepSeek 深度整合 Get 笔记语料，自动为您提炼实务经验，并由主编智能体策划爆款选题。</p>
            </div>
          )}

          {/* Step 2: Topics Selection */}
          {currentStep === 2 && (
            <div className="flex-1 animate-fade-in space-y-6">
              <h2 className="text-2xl font-bold flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-blue-500" />
                选题策划完毕，请主编定夺！
              </h2>
              <p className="text-slate-500">基于您知识库打捞出的真实干货，DeepSeek <span className="text-xs bg-slate-200 rounded px-1.5 py-0.5">deepseek-chat</span> 为您量身定制了以下 {topics.length} 个爆款选题池：</p>

              <div className="grid grid-cols-1 gap-4 mt-6">
                {topics.map(topic => (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    className="group bg-white dark:bg-slate-800 border-2 border-transparent hover:border-blue-500 p-6 rounded-2xl shadow-sm cursor-pointer transition-all hover:shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                        🎬 {topic.title}
                      </h3>
                      <button className="hidden group-hover:block text-sm bg-blue-50 text-blue-600 border border-blue-200 px-4 py-1.5 rounded-full font-medium shadow-sm transition-transform active:scale-95">
                        一键撰写正文脚本
                      </button>
                    </div>
                    <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 rounded-l-xl"></div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1.5 uppercase tracking-wider flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" /> 选题策略解析
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{topic.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Content Generation (DeepSeek Stream) */}
          {currentStep === 3 && selectedTopic && (
            <div className="flex flex-col h-full animate-fade-in space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium tracking-wide border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5">当前流式生成任务：</span>
                  <h3 className="font-bold text-slate-700 mt-2 text-lg"> {selectedTopic.title}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  {isStreaming && <span className="text-sm text-blue-500 flex items-center"><PenTool className="w-4 h-4 mr-2 animate-bounce" /> DeepSeek 笔耕不辍中...</span>}
                  <button onClick={() => { navigator.clipboard.writeText(completion) }} className="text-sm bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition font-medium shadow-sm active:scale-95">
                    复制本文
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 min-h-[500px] relative">
                {/* Background watermark */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                  <PenTool className="w-64 h-64" />
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none relative z-10 whitespace-pre-wrap leading-loose">
                  {completion || (
                    <p className="text-slate-400 italic flex items-center">
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mr-2"></span> 正在请求 DeepSeek 流式生成通道...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

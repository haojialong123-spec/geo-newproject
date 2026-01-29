import React, { useState } from 'react';
import EvidenceUpload from './EvidenceUpload';
import FactReport from './FactReport';
import { FactProcessingStage, FileWithPreview, ExtractedEvidence, FactAnalysisResult } from '../types';
import { extractEvidenceFromFile, performFactAnalysis } from '../services/geminiService';
import { Scale, ChevronRight, AlertCircle, FileText, BrainCircuit, FileCheck, Loader2, CheckCircle2 } from 'lucide-react';

const FactAnalysisWorkspace: React.FC = () => {
    const [stage, setStage] = useState<FactProcessingStage>(FactProcessingStage.IDLE);
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [extractedData, setExtractedData] = useState<ExtractedEvidence[]>([]);
    const [finalReport, setFinalReport] = useState<FactAnalysisResult | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const startAnalysis = async () => {
        if (files.length === 0) return;

        setErrorMsg(null);
        setStage(FactProcessingStage.INGESTION);

        try {
            // 1. Ingestion -> Extraction
            setStage(FactProcessingStage.EXTRACTION);
            const extractedItems: ExtractedEvidence[] = [];

            for (const file of files) {
                const result = await extractEvidenceFromFile(file);
                extractedItems.push(result);
            }
            setExtractedData(extractedItems);

            // 2. Extraction -> Reasoning
            setStage(FactProcessingStage.REASONING);
            await new Promise(r => setTimeout(r, 500)); // UI pacing

            const reportResult = await performFactAnalysis(extractedItems);

            // 3. Reasoning -> Generation
            setStage(FactProcessingStage.GENERATION);
            await new Promise(r => setTimeout(r, 500));

            setFinalReport(reportResult);
            setStage(FactProcessingStage.COMPLETE);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "事实梳理过程中发生错误");
            setStage(FactProcessingStage.ERROR);
        }
    };

    const reset = () => {
        setFiles([]);
        setExtractedData([]);
        setFinalReport(null);
        setStage(FactProcessingStage.IDLE);
        setErrorMsg(null);
    };

    // Pipeline 进度展示
    const PipelineSteps = () => {
        const steps = [
            { id: FactProcessingStage.INGESTION, label: '证据摄入', icon: FileText },
            { id: FactProcessingStage.EXTRACTION, label: '智能提取', icon: BrainCircuit },
            { id: FactProcessingStage.REASONING, label: '法律推理', icon: Scale },
            { id: FactProcessingStage.GENERATION, label: '报告生成', icon: FileCheck },
        ];

        const stageOrder = [
            FactProcessingStage.IDLE,
            FactProcessingStage.INGESTION,
            FactProcessingStage.EXTRACTION,
            FactProcessingStage.REASONING,
            FactProcessingStage.GENERATION,
            FactProcessingStage.COMPLETE
        ];

        const getStepStatus = (stepId: FactProcessingStage) => {
            const currentIndex = stageOrder.indexOf(stage);
            const stepIndex = stageOrder.indexOf(stepId);

            if (stage === FactProcessingStage.COMPLETE) return 'completed';
            if (stage === FactProcessingStage.ERROR) return 'error';
            if (currentIndex === stepIndex) return 'active';
            if (currentIndex > stepIndex) return 'completed';
            return 'pending';
        };

        return (
            <div className="w-full py-6">
                <div className="flex justify-between items-center relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 transform -translate-y-1/2 rounded-full"></div>

                    {/* Progress Bar Fill */}
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-amber-600 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${stage === FactProcessingStage.COMPLETE ? 100 :
                                    steps.findIndex(s => s.id === stage) !== -1
                                        ? (steps.findIndex(s => s.id === stage) / (steps.length - 1)) * 100
                                        : 0
                                }%`
                        }}
                    ></div>

                    {steps.map((step) => {
                        const status = getStepStatus(step.id);
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-300
                  ${status === 'active' ? 'border-amber-600 text-amber-600 shadow-lg scale-110' : ''}
                  ${status === 'completed' ? 'border-amber-600 bg-amber-600 text-white' : ''}
                  ${status === 'pending' ? 'border-slate-300 text-slate-400' : ''}
                `}>
                                    {status === 'active' ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : status === 'completed' ? (
                                        <CheckCircle2 className="w-6 h-6" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span className={`
                  mt-3 text-sm font-medium transition-colors
                  ${status === 'active' ? 'text-amber-700' : ''}
                  ${status === 'completed' ? 'text-slate-800' : ''}
                  ${status === 'pending' ? 'text-slate-400' : ''}
                `}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Intro Section (only show when Idle) */}
            {stage === FactProcessingStage.IDLE && (
                <div className="text-center mb-8 animate-fade-in">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4 font-serif">
                        建设工程案件事实梳理引擎
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        上传杂乱的合同、补充协议与转账凭证，AI 自动构建效力金字塔，
                        执行资金闭环核对，生成专业级诉讼事实梳理报告。
                    </p>
                </div>
            )}

            {/* Main Workspace Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">

                {/* Pipeline Visualization */}
                <div className="bg-slate-50 border-b border-slate-100 px-8">
                    <PipelineSteps />
                </div>

                <div className="p-8">
                    {/* Error Message */}
                    {stage === FactProcessingStage.ERROR && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {errorMsg || "分析失败，请检查 API Key 并重试"}
                            <button onClick={reset} className="ml-auto text-sm font-semibold underline">重试</button>
                        </div>
                    )}

                    {/* Upload Area */}
                    {(stage === FactProcessingStage.IDLE || stage === FactProcessingStage.INGESTION) && (
                        <div className="space-y-6">
                            <EvidenceUpload
                                files={files}
                                setFiles={setFiles}
                                disabled={stage !== FactProcessingStage.IDLE}
                            />

                            <div className="flex justify-end">
                                <button
                                    onClick={startAnalysis}
                                    disabled={files.length === 0 || stage !== FactProcessingStage.IDLE}
                                    className={`
                    flex items-center px-6 py-3 rounded-lg text-white font-medium shadow-md transition-all
                    ${files.length === 0 || stage !== FactProcessingStage.IDLE
                                            ? 'bg-slate-400 cursor-not-allowed'
                                            : 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg transform hover:-translate-y-0.5'}
                  `}
                                >
                                    {stage === FactProcessingStage.INGESTION ? '正在解析...' : '开始梳理事实'}
                                    {stage === FactProcessingStage.IDLE && <ChevronRight className="w-5 h-5 ml-2" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Intermediate Loading State */}
                    {(stage === FactProcessingStage.EXTRACTION ||
                        stage === FactProcessingStage.REASONING ||
                        stage === FactProcessingStage.GENERATION) && (
                            <div className="py-16 text-center space-y-4">
                                <div className="relative w-20 h-20 mx-auto">
                                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">
                                        {stage === FactProcessingStage.EXTRACTION && "正在提取文档要素..."}
                                        {stage === FactProcessingStage.REASONING && "构建效力金字塔 & 资金核对..."}
                                        {stage === FactProcessingStage.GENERATION && "撰写法律意见书..."}
                                    </h3>
                                    <p className="text-slate-500 text-sm mt-2">
                                        AI 正在运用"义务-履行闭环法则"分析您的案卷
                                    </p>
                                </div>
                            </div>
                        )}

                    {/* Final Report */}
                    {stage === FactProcessingStage.COMPLETE && finalReport && (
                        <div className="animate-fade-in">
                            <FactReport result={finalReport} />
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={reset}
                                    className="text-slate-500 hover:text-slate-800 font-medium px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    梳理下一个案件
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FactAnalysisWorkspace;

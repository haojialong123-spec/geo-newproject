import React, { useState, useEffect } from 'react';
import EvidenceUpload from './EvidenceUpload';
import {
    FactProcessingStageV2, FileWithPreview, LegalFactExtractionOutput
} from '../types';
import { runLegalFactPipelineV2 } from '../services/geminiService';
import { exportAllTables } from '../utils/excelExporter';
import {
    Scale, ChevronRight, AlertCircle, FileText, BrainCircuit, FileCheck,
    Loader2, CheckCircle2, Download, AlertTriangle, Users, FileSpreadsheet,
    Landmark, ClipboardList, Router
} from 'lucide-react';

const FactAnalysisWorkspaceV2: React.FC = () => {
    const [stage, setStage] = useState<FactProcessingStageV2>(FactProcessingStageV2.IDLE);
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [result, setResult] = useState<LegalFactExtractionOutput | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');

    // 防护逻辑：如果 COMPLETE 状态但没有有效数据，重置到 IDLE
    useEffect(() => {
        if (stage === FactProcessingStageV2.COMPLETE) {
            // 检查 result 是否有效（至少有一项数据）
            const hasData = result && (
                result.table_03_contracts.length > 0 ||
                result.table_04_financials.length > 0 ||
                result.table_05_performance.length > 0 ||
                result.table_06_disputes.length > 0 ||
                result.table_07_assets.length > 0 ||
                result.entity_changes.length > 0 ||
                result.appendix_4_amendments.length > 0 ||
                result.table_02_background.length > 0
            );

            if (!hasData) {
                console.warn('[FactAnalysisV2] COMPLETE 状态无有效数据，重置到 IDLE');
                setStage(FactProcessingStageV2.IDLE);
                setResult(null);
            }
        }
    }, [stage, result]);

    const startAnalysis = async () => {
        if (files.length === 0) return;

        setErrorMsg(null);
        setStage(FactProcessingStageV2.INGESTION);

        try {
            const output = await runLegalFactPipelineV2(files, (s, m) => {
                setStage(s);
                setProgressMessage(m);
            });

            setResult(output);
            setStage(FactProcessingStageV2.COMPLETE);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "事实梳理过程中发生错误");
            setStage(FactProcessingStageV2.ERROR);
        }
    };

    const reset = () => {
        setFiles([]);
        setResult(null);
        setStage(FactProcessingStageV2.IDLE);
        setErrorMsg(null);
        setProgressMessage('');
    };

    // 8阶段 Pipeline 展示
    const PipelineSteps = () => {
        const steps = [
            { id: FactProcessingStageV2.ROUTING, label: '文档路由', icon: Router },
            { id: FactProcessingStageV2.AGENT_A_AUDIT, label: '财务审计', icon: FileSpreadsheet },
            { id: FactProcessingStageV2.AGENT_B_CONTRACT, label: '合同分析', icon: FileText },
            { id: FactProcessingStageV2.AGENT_C_ENTITY, label: '背景调查', icon: Users },
            { id: FactProcessingStageV2.AGENT_D_FACT, label: '事实梳理', icon: ClipboardList },
            { id: FactProcessingStageV2.VALIDATION, label: '逻辑校验', icon: Scale },
            { id: FactProcessingStageV2.GENERATION, label: '报告生成', icon: FileCheck },
        ];

        const stageOrder = [
            FactProcessingStageV2.IDLE,
            FactProcessingStageV2.INGESTION,
            FactProcessingStageV2.ROUTING,
            FactProcessingStageV2.AGENT_A_AUDIT,
            FactProcessingStageV2.AGENT_B_CONTRACT,
            FactProcessingStageV2.AGENT_C_ENTITY,
            FactProcessingStageV2.AGENT_D_FACT,
            FactProcessingStageV2.VALIDATION,
            FactProcessingStageV2.GENERATION,
            FactProcessingStageV2.COMPLETE
        ];

        const getStepStatus = (stepId: FactProcessingStageV2) => {
            const currentIndex = stageOrder.indexOf(stage);
            const stepIndex = stageOrder.indexOf(stepId);

            if (stage === FactProcessingStageV2.COMPLETE) return 'completed';
            if (stage === FactProcessingStageV2.ERROR) return 'error';
            if (currentIndex === stepIndex) return 'active';
            if (currentIndex > stepIndex) return 'completed';
            return 'pending';
        };

        return (
            <div className="w-full py-4 overflow-x-auto">
                <div className="flex justify-between items-center relative min-w-[700px]">
                    {/* Progress Bar Background */}
                    <div className="absolute top-6 left-0 w-full h-0.5 bg-slate-200 -z-10"></div>

                    {/* Progress Bar Fill */}
                    <div
                        className="absolute top-6 left-0 h-0.5 bg-amber-600 -z-10 transition-all duration-500 ease-out"
                        style={{
                            width: `${stage === FactProcessingStageV2.COMPLETE ? 100 :
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
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : status === 'completed' ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span className={`
                  mt-2 text-xs font-medium transition-colors whitespace-nowrap
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

    // 结果统计卡片
    const ResultStats = ({ data }: { data: LegalFactExtractionOutput }) => {
        const stats = [
            { label: '合同条款', value: data.table_03_contracts.length, color: 'bg-blue-500' },
            { label: '财务记录', value: data.table_04_financials.length, color: 'bg-green-500' },
            { label: '履行事实', value: data.table_05_performance.length, color: 'bg-purple-500' },
            { label: '纠纷处置', value: data.table_06_disputes.length, color: 'bg-red-500' },
            { label: '标的信息', value: data.table_07_assets.length, color: 'bg-amber-500' },
            { label: '主体变更', value: data.entity_changes.length, color: 'bg-slate-500' },
        ];

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white mb-2`}>
                            <span className="text-lg font-bold">{stat.value}</span>
                        </div>
                        <p className="text-sm text-slate-600">{stat.label}</p>
                    </div>
                ))}
            </div>
        );
    };

    // 校验报告卡片
    const ValidationCard = ({ report }: { report: LegalFactExtractionOutput['validation_report'] }) => (
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Scale className="w-5 h-5 mr-2 text-amber-600" />
                逻辑校验报告
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">已付金额总计</p>
                    <p className="text-2xl font-bold text-slate-800">
                        ¥{report.total_amount_from_finance.toLocaleString()}
                    </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">合同约定价款</p>
                    <p className="text-2xl font-bold text-slate-800">
                        ¥{report.total_contract_price.toLocaleString()}
                    </p>
                </div>
            </div>

            {report.amount_mismatch_warning && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">
                        ⚠️ 已付金额超过合同总价 110%，请核实
                    </span>
                </div>
            )}

            {report.priority_clause_overrides.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 mb-2">优先条款覆盖提示</p>
                    <ul className="text-sm text-amber-700 list-disc list-inside">
                        {report.priority_clause_overrides.map((msg, i) => (
                            <li key={i}>{msg}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );

    // 数据表格预览
    const DataTablePreview = ({
        title,
        data,
        columns
    }: {
        title: string;
        data: any[];
        columns: { key: string; label: string }[]
    }) => {
        if (data.length === 0) return null;

        return (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-medium text-slate-700">{title} ({data.length} 条)</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                            <tr>
                                {columns.map(col => (
                                    <th key={col.key} className="px-4 py-2 text-left text-slate-600 font-medium">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 5).map((row, i) => (
                                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                    {columns.map(col => (
                                        <td key={col.key} className="px-4 py-2 text-slate-800 max-w-xs truncate">
                                            {Array.isArray(row[col.key])
                                                ? row[col.key].join('、')
                                                : row[col.key] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.length > 5 && (
                        <div className="px-4 py-2 text-center text-sm text-slate-500 bg-slate-50">
                            还有 {data.length - 5} 条记录...
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Intro Section */}
            {stage === FactProcessingStageV2.IDLE && (
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium mb-4">
                        <BrainCircuit className="w-4 h-4 mr-1" />
                        v2.0 多智能体架构
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4 font-serif">
                        法律证据智能梳理系统
                    </h2>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                        上传案卷材料（合同、转账凭证、工商档案），4 大专家智能体并行处理，
                        自动填充 8 套标准 Excel 模板，一键导出结构化数据。
                    </p>
                </div>
            )}

            {/* Main Workspace Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">

                {/* Pipeline Visualization */}
                <div className="bg-slate-50 border-b border-slate-100 px-8 py-4">
                    <PipelineSteps />
                </div>

                <div className="p-8">
                    {/* Error Message */}
                    {stage === FactProcessingStageV2.ERROR && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {errorMsg || "分析失败，请检查 API Key 并重试"}
                            <button onClick={reset} className="ml-auto text-sm font-semibold underline">重试</button>
                        </div>
                    )}

                    {/* Upload Area */}
                    {stage === FactProcessingStageV2.IDLE && (
                        <div className="space-y-6">
                            <EvidenceUpload
                                files={files}
                                setFiles={setFiles}
                                disabled={false}
                            />

                            <div className="flex justify-end">
                                <button
                                    onClick={startAnalysis}
                                    disabled={files.length === 0}
                                    className={`
                    flex items-center px-6 py-3 rounded-lg text-white font-medium shadow-md transition-all
                    ${files.length === 0
                                            ? 'bg-slate-400 cursor-not-allowed'
                                            : 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg transform hover:-translate-y-0.5'}
                  `}
                                >
                                    开始智能梳理
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Processing State */}
                    {stage !== FactProcessingStageV2.IDLE &&
                        stage !== FactProcessingStageV2.COMPLETE &&
                        stage !== FactProcessingStageV2.ERROR && (
                            <div className="py-16 text-center space-y-4">
                                <div className="relative w-20 h-20 mx-auto">
                                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{progressMessage}</h3>
                                    <p className="text-slate-500 text-sm mt-2">
                                        4 大专家智能体正在协同处理您的案卷材料
                                    </p>
                                </div>
                            </div>
                        )}

                    {/* Results */}
                    {stage === FactProcessingStageV2.COMPLETE && result && (
                        <div className="animate-fade-in">
                            {/* Stats */}
                            <ResultStats data={result} />

                            {/* Validation */}
                            <ValidationCard report={result.validation_report} />

                            {/* Export Button */}
                            <div className="flex justify-center mb-6">
                                <button
                                    onClick={() => exportAllTables(result)}
                                    className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition-all"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    一键导出全部 Excel 表格
                                </button>
                            </div>

                            {/* Data Previews */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800">数据预览</h3>

                                <DataTablePreview
                                    title="表03 合同主要条款"
                                    data={result.table_03_contracts}
                                    columns={[
                                        { key: 'contract_name', label: '合同名称' },
                                        { key: 'clause_title', label: '条款标题' },
                                        { key: 'clause_content', label: '条款内容' },
                                        { key: 'sign_date', label: '签订日期' },
                                    ]}
                                />

                                <DataTablePreview
                                    title="表04 财务信息"
                                    data={result.table_04_financials}
                                    columns={[
                                        { key: 'payer', label: '付款人' },
                                        { key: 'amount', label: '金额' },
                                        { key: 'payment_date', label: '付款日期' },
                                        { key: 'evidence_name', label: '印证材料' },
                                    ]}
                                />

                                <DataTablePreview
                                    title="附件4 变更信息"
                                    data={result.appendix_4_amendments}
                                    columns={[
                                        { key: 'amendment_date', label: '变更时间' },
                                        { key: 'change_item', label: '变更项目' },
                                        { key: 'original_term', label: '变更前' },
                                        { key: 'new_term', label: '变更后' },
                                    ]}
                                />
                            </div>

                            {/* Reset */}
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

export default FactAnalysisWorkspaceV2;

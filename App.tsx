import React, { useState } from 'react';
import Layout from './components/Layout';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import ContentGenerator from './components/ContentGenerator';
import TemplateLibrary from './components/TemplateLibrary';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import { AnalysisRecord, ViewState, ExtractionResult, LegalScenario } from './types';
import { INITIAL_LEGAL_SCENARIOS } from './constants';
import { extractPainPoints } from './services/geminiService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Manage Templates State
  const [templates, setTemplates] = useState<LegalScenario[]>(INITIAL_LEGAL_SCENARIOS);

  // Helper to read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (file.name.toLowerCase().endsWith('.docx')) {
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          // Use mammoth.js from global scope (injected via index.html)
          // @ts-ignore
          if (window.mammoth) {
            // @ts-ignore
            window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
              .then((result: any) => resolve(result.value))
              .catch((err: any) => reject(new Error("Word 解析失败: " + err.message)));
          } else {
            reject(new Error("Docx 解析库未加载，请刷新页面重试"));
          }
        };
        reader.onerror = () => reject(new Error("文件读取失败"));
        reader.readAsArrayBuffer(file);
      } else {
        // Assume text-based for other supported formats (.txt, .md, etc)
        // Note: Actual audio binary processing usually requires backend or different API usage.
        // Currently prioritizing the "Word/Text" transcript workflow.
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("文件读取失败"));
        reader.readAsText(file);
      }
    });
  };

  // Handle File Upload
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    let extractedText = "";

    try {
      // 1. Read REAL file content
      if (file.name.match(/\.(mp3|wav|m4a)$/i)) {
        alert("目前版本仅支持 Word (.docx) 或 文本 (.txt) 格式的录音整理稿分析。\n音频直接分析功能即将上线。");
        setIsProcessing(false);
        return;
      }
      
      extractedText = await readFileContent(file);

      if (!extractedText || extractedText.trim().length < 5) {
        throw new Error("文件内容为空或无法提取文字");
      }

      // 2. Create a temporary record
      const newRecord: AnalysisRecord = {
        id: Date.now().toString(),
        fileName: file.name,
        uploadDate: new Date().toLocaleTimeString('zh-CN'),
        status: 'processing',
        rawText: extractedText, // Save the ACTUAL text
      };

      setRecords(prev => [newRecord, ...prev]);

      // 3. Call Gemini for extraction with REAL text
      const result: ExtractionResult = await extractPainPoints(newRecord.rawText);

      // 4. Update record with success
      setRecords(prev => prev.map(rec => 
        rec.id === newRecord.id 
          ? { ...rec, status: 'completed', result: result } 
          : rec
      ));

      // 5. AUTOMATICALLY ADD TO TEMPLATE LIBRARY
      const newTemplate: LegalScenario = {
        id: `CASE-${Date.now().toString().slice(-4)}`,
        case_name: file.name.replace(/\.[^/.]+$/, "") || "未命名建工案件",
        pain_point: result.detected_issues?.[0]?.tag_name || "未知建工纠纷",
        triggers: result.detected_issues?.map(i => i.original_text) || [],
        ai_logic: result.evidence_analysis 
          ? `[${result.case_type}] 证据分析: ${result.evidence_analysis.description}` 
          : result.problem_summary,
        case_summary: result.problem_summary,
        follow_up: result.recommended_follow_up || "暂无建议",
        marketing_action: result.marketing_direction || "暂无建议",
        is_custom: true,
        generated_article: "", 
        generated_video_script: "", 
        created_at: new Date().toLocaleDateString('zh-CN')
      };

      setTemplates(prev => [newTemplate, ...prev]);

    } catch (error: any) {
      console.error(error);
      // If we created a record, mark it as failed
      setRecords(prev => {
        // Check if we added a record for this file (hacky check by filename/time or assume latest)
        // Better: we have the logic flow above. If error happens BEFORE record creation, we just alert.
        // If AFTER, we update.
        // Simplification: Just alert for now if reading failed.
        return prev.map(rec => rec.fileName === file.name && rec.status === 'processing' ? {...rec, status: 'failed'} : rec);
      });
      alert(`分析失败: ${error.message || "请检查 API Key 或文件内容"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateClick = (record: AnalysisRecord) => {
    setSelectedRecord(record);
    setActiveView('generator');
  };

  const handleBackToDashboard = () => {
    setSelectedRecord(null);
    setActiveView('dashboard');
  };

  // Template Actions
  const handleUpdateTemplate = (updated: LegalScenario) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm("确定要删除这个模板吗？")) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {activeView === 'dashboard' && (
        <>
          <FileUpload onUpload={handleFileUpload} isProcessing={isProcessing} />
          <h3 className="text-lg font-semibold text-gray-800 mb-4 px-1">最近分析记录</h3>
          <Dashboard records={records} onGenerateClick={handleGenerateClick} />
        </>
      )}

      {activeView === 'generator' && selectedRecord && (
        <ContentGenerator record={selectedRecord} onBack={handleBackToDashboard} />
      )}

      {activeView === 'templates' && (
        <TemplateLibrary 
          templates={templates} 
          onUpdate={handleUpdateTemplate}
          onDelete={handleDeleteTemplate}
        />
      )}

      {activeView === 'knowledge' && (
        <KnowledgeBaseView />
      )}
    </Layout>
  );
};

export default App;
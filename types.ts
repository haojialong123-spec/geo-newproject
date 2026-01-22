// Data Models

// 1. 法律语义与案情分析结果
export interface LegalExtraction {
  legal_concepts: string[]; // 法律名词 (e.g. 表见代理)
  case_type: string; // 案由归类 (e.g. 建设工程施工合同纠纷)
  key_elements: {
    timeline: string; // 时间线
    dispute_amount: string; // 争议金额
    contract_status: string; // 合同签订情况
    payment_status: string; // 已付/欠款
  };
  evidence_analysis: {
    keywords: string[]; // 证据关键词 (e.g. 微信记录, 录音)
    strength: "强 (直接证据)" | "中 (补强证据)" | "弱 (孤证/无书面)"; // 证据强弱
    description: string;
  };
  user_persona: {
    tags: string[]; // 用户标签 (e.g. #北京中小建企 #急需现金流)
    explicit_pain: string[]; // 显性痛点
    implicit_needs: string[]; // 隐性需求
  };
}

export interface PainPoint {
  tag_id: string; // Keep for compatibility or legacy mapping
  tag_name: string;
  original_text: string;
  confidence: "High" | "Medium" | "Low";
}

export interface ExtractionResult extends LegalExtraction {
  status: string;
  detected_issues: PainPoint[]; // Legacy support for UI list
  problem_summary: string;
  urgency_level: "S级(极急)" | "A级(正常)" | "B级(观望)";
  marketing_direction?: string;
  primary_scenario_id?: string;
  recommended_follow_up?: string;
}

export interface AnalysisRecord {
  id: string;
  fileName: string; // Or "Text Paste"
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
  rawText: string;
  result?: ExtractionResult;
  generatedArticle?: string;
  generatedVideoScript?: string;
}

export interface LegalScenario {
  id: string;
  case_name?: string;
  pain_point: string;
  triggers: string[];
  ai_logic: string;
  case_summary?: string;
  follow_up: string;
  marketing_action: string;
  generated_article?: string;
  generated_video_script?: string;
  is_custom?: boolean;
  created_at?: string;
}

export type ViewState = 'dashboard' | 'generator' | 'templates' | 'knowledge';

export enum ContentType {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  ZHIHU = 'ZHIHU' // New format
}

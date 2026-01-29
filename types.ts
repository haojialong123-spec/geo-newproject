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

export type ViewState = 'dashboard' | 'generator' | 'templates' | 'knowledge' | 'factAnalysis';

export enum ContentType {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  ZHIHU = 'ZHIHU',
  HUMANIZED_ARTICLE = 'HUMANIZED_ARTICLE'
}

// ============ LegalFactAI 事实梳理模块类型 ============

export enum FactDocumentType {
  CONTRACT = "主合同",
  SUPPLEMENTARY = "补充协议",
  RECEIPT = "支付凭证",
  OTHER = "其他"
}

export enum FactProcessingStage {
  IDLE = "IDLE",
  INGESTION = "INGESTION",
  EXTRACTION = "EXTRACTION",
  REASONING = "REASONING",
  GENERATION = "GENERATION",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR"
}

export interface ContractClause {
  text: string;
  article_ref?: string;
  page: number;
  conditions?: string[];
  consequence?: string;
  is_priority_clause: boolean;
}

export interface KeyEntity {
  role: string;
  name: string;
}

export interface ExtractedEvidence {
  filename: string;
  evidence_id?: string;
  doc_type: FactDocumentType;
  sign_date?: string;
  is_newest?: boolean;
  key_entities?: KeyEntity[];
  summary?: string;
  clauses?: ContractClause[];
  amount_principal?: number;
  amount_compensation?: number;
  raw_text?: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  type: 'contract' | 'payment' | 'dispute' | 'breach';
  citation?: string;
}

export interface FactAnalysisResult {
  markdownReport: string;
  timeline: TimelineEvent[];
  obligationStatus: string;
}

export interface FileWithPreview extends File {
  preview?: string;
  base64?: string;
  mimeType?: string;
}

// ============ LegalFactAI v2.0 数据模型 ============

// 路由分类枚举
export enum DocumentRouter {
  CONTRACT = "CONTRACT",      // 合同/协议类 -> Agent B
  FINANCE = "FINANCE",        // 财务凭证类 -> Agent A
  ENTITY = "ENTITY",          // 工商档案类 -> Agent C
  GENERAL_FACT = "GENERAL_FACT" // 其他事实类 -> Agent D
}

// 表02: 交易背景调查
export interface BackgroundInfo {
  question_id: number;
  question_content: string;
  investigation_result: string;
  source_evidence: string;
}

// 表03: 合同主要条款
export interface ContractClauseV2 {
  sequence: number;
  contract_name: string;
  clause_title: string;
  clause_content: string;
  sign_date: string;
  keywords: string[];
  source_file: string;
  page_ref?: string;
}

// 表04: 财务信息 (高精度)
export interface FinancialRecordV2 {
  sequence: number;
  payer: string;
  amount: number; // 纯数字，清洗后
  payment_date: string;
  evidence_name: string;
  catalog_index: string;
  source_file: string;
  // 扩展字段
  payee?: string;
  amount_type?: "本金" | "利息" | "违约金" | "其他";
  remarks?: string;
}

// 表05/06/08: 通用事实
export interface FactEventV2 {
  category: "履行" | "纠纷" | "标的" | "其他";
  sequence: number;
  material_name: string;
  event_time: string;
  fact_description: string;
  source: string;
  keywords?: string[];
  remarks?: string;
}

// 表07: 标的信息
export interface AssetInfo {
  sequence: number;
  asset_name: string;
  possession_time: string;
  controller: string;
  source: string;
  remarks?: string;
}

// 主体梳理表: 企业变更类型
export enum CorporateChangeType {
  EXECUTIVE = "高管变更",
  INVESTOR = "投资人变更",
  NAME = "名称变更",
  PERIOD = "经营期限变更",
  DISHONESTY = "失信记录"
}

export interface CorporateChange {
  change_type: CorporateChangeType;
  change_date: string;
  change_item: string;
  before_value: string;
  after_value: string;
  remarks?: string;
}

// 附件4: 所有变更信息
export interface ContractAmendmentV2 {
  amendment_date: string;
  change_item: string;
  original_term: string;
  new_term: string;
  is_priority_clause: boolean; // 是否包含"以本协议为准"
}

// 路由后的文件包装
export interface RoutedFile extends FileWithPreview {
  router_category: DocumentRouter;
  first_1000_chars?: string;
  ocr_text?: string;
}

// Agent 处理结果
export interface AgentExtractionResult {
  agent_name: "Auditor" | "Lawyer" | "Investigator" | "Historian";
  source_files: string[];
  contracts?: ContractClauseV2[];
  amendments?: ContractAmendmentV2[];
  financials?: FinancialRecordV2[];
  facts?: FactEventV2[];
  assets?: AssetInfo[];
  corporate_changes?: CorporateChange[];
  background_info?: BackgroundInfo[];
  validation_warnings?: string[];
}

// 最终汇总结果
export interface LegalFactExtractionOutput {
  generated_at: string;
  source_file_count: number;
  table_02_background: BackgroundInfo[];
  table_03_contracts: ContractClauseV2[];
  table_04_financials: FinancialRecordV2[];
  table_05_performance: FactEventV2[];
  table_06_disputes: FactEventV2[];
  table_07_assets: AssetInfo[];
  table_08_other_facts: FactEventV2[];
  appendix_4_amendments: ContractAmendmentV2[];
  entity_changes: CorporateChange[];
  validation_report: ValidationReport;
}

export interface ValidationReport {
  total_amount_from_finance: number;
  total_contract_price: number;
  amount_mismatch_warning: boolean;
  timeline_conflicts: string[];
  priority_clause_overrides: string[];
}

// 处理阶段增强
export enum FactProcessingStageV2 {
  IDLE = "IDLE",
  INGESTION = "INGESTION",
  ROUTING = "ROUTING",
  AGENT_A_AUDIT = "AGENT_A",
  AGENT_B_CONTRACT = "AGENT_B",
  AGENT_C_ENTITY = "AGENT_C",
  AGENT_D_FACT = "AGENT_D",
  VALIDATION = "VALIDATION",
  GENERATION = "GENERATION",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR"
}

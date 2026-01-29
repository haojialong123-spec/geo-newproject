/**
 * Excel/CSV 导出工具
 * 将 LegalFactExtractionOutput 导出为多个 CSV 文件
 */

import {
    LegalFactExtractionOutput,
    ContractClauseV2,
    FinancialRecordV2,
    FactEventV2,
    AssetInfo,
    CorporateChange,
    BackgroundInfo,
    ContractAmendmentV2
} from '../types';

/**
 * 将数据数组转换为 CSV 字符串
 */
function arrayToCSV(headers: string[], rows: any[][]): string {
    const escape = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headerLine = headers.map(escape).join(',');
    const dataLines = rows.map(row => row.map(escape).join(','));
    return [headerLine, ...dataLines].join('\n');
}

/**
 * 下载 CSV 文件
 */
function downloadCSV(filename: string, content: string): void {
    // 添加 BOM 以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 导出表02: 交易背景调查清单
 */
export function exportTable02(data: BackgroundInfo[]): void {
    const headers = ['序号', '内容', '调查结果', '信息来源'];
    const rows = data.map(item => [
        item.question_id,
        item.question_content,
        item.investigation_result,
        item.source_evidence
    ]);
    downloadCSV('02交易背景调查清单.csv', arrayToCSV(headers, rows));
}

/**
 * 导出表03: 合同主要条款梳理表
 */
export function exportTable03(data: ContractClauseV2[]): void {
    const headers = ['序号', '合同名称', '主要条款', '条款内容', '签订日期', '关键词', '材料来源'];
    const rows = data.map(item => [
        item.sequence,
        item.contract_name,
        item.clause_title,
        item.clause_content,
        item.sign_date,
        (item.keywords || []).join('、'),
        item.source_file
    ]);
    downloadCSV('03合同主要条款梳理表.csv', arrayToCSV(headers, rows));
}

/**
 * 导出表04: 财务信息梳理表
 */
export function exportTable04(data: FinancialRecordV2[]): void {
    const headers = ['序号', '付款人', '支付金额', '付款日期', '印证材料名称', '总目录编码', '材料来源'];
    const rows = data.map(item => [
        item.sequence,
        item.payer,
        item.amount,
        item.payment_date,
        item.evidence_name,
        item.catalog_index,
        item.source_file
    ]);
    downloadCSV('04财务信息梳理表.csv', arrayToCSV(headers, rows));
}

/**
 * 导出表05: 履行事实梳理表
 */
export function exportTable05(data: FactEventV2[]): void {
    const headers = ['序号', '材料名称', '形成时间', '所反映的事实', '材料来源', '备注'];
    const rows = data.map(item => [
        item.sequence,
        item.material_name,
        item.event_time,
        item.fact_description,
        item.source,
        item.remarks || ''
    ]);
    downloadCSV('05履行事实梳理表.csv', arrayToCSV(headers, rows));
}

/**
 * 导出表06: 纠纷处置梳理表
 */
export function exportTable06(data: FactEventV2[]): void {
    const headers = ['序号', '材料名称', '形成时间', '材料内容', '材料来源'];
    const rows = data.map(item => [
        item.sequence,
        item.material_name,
        item.event_time,
        item.fact_description,
        item.source
    ]);
    downloadCSV('06纠纷处置梳理表.csv', arrayToCSV(headers, rows));
}

/**
 * 导出表07: 标的信息梳理表
 */
export function exportTable07(data: AssetInfo[]): void {
    const headers = ['序号', '标的物名称', '占有/流转时间节点', '控制人', '材料来源', '备注'];
    const rows = data.map(item => [
        item.sequence,
        item.asset_name,
        item.possession_time,
        item.controller,
        item.source,
        item.remarks || ''
    ]);
    downloadCSV('07标的信息梳理表.csv', arrayToCSV(headers, rows));
}

/**
 * 导出表08: 其他事实梳理表
 */
export function exportTable08(data: FactEventV2[]): void {
    const headers = ['序号', '材料名称', '形成时间', '所反映的事实', '材料来源', '关键词', '备注'];
    const rows = data.map(item => [
        item.sequence,
        item.material_name,
        item.event_time,
        item.fact_description,
        item.source,
        (item.keywords || []).join('、'),
        item.remarks || ''
    ]);
    downloadCSV('08其他事实梳理表.csv', arrayToCSV(headers, rows));
}

/**
 * 导出附件4: 所有变更信息
 */
export function exportAppendix4(data: ContractAmendmentV2[]): void {
    const headers = ['变更时间', '变更项目', '变更前', '变更后'];
    const rows = data.map(item => [
        item.amendment_date,
        item.change_item,
        item.original_term,
        item.new_term
    ]);
    downloadCSV('附件4 所有变更信息.csv', arrayToCSV(headers, rows));
}

/**
 * 导出主体梳理表（多Sheet合并为多个CSV）
 */
export function exportEntityChanges(data: CorporateChange[]): void {
    // 按类型分组
    const grouped: Record<string, CorporateChange[]> = {};
    data.forEach(item => {
        const type = item.change_type;
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(item);
    });

    // 导出每个类型
    Object.entries(grouped).forEach(([type, items]) => {
        let headers: string[];
        let rows: any[][];

        if (type === '失信记录') {
            headers = ['立案日期', '执行案号', '执行法院', '执行依据文号'];
            rows = items.map(item => [
                item.change_date,
                item.after_value, // 执行案号
                item.remarks?.split(';')[0]?.replace('执行法院:', '') || '',
                item.remarks?.split(';')[1]?.replace('执行依据:', '') || ''
            ]);
        } else if (type === '投资人变更') {
            headers = ['变更时间', '变更情况', '股份及出资额', '备注'];
            rows = items.map(item => [
                item.change_date,
                item.change_item,
                item.after_value,
                item.remarks || ''
            ]);
        } else {
            headers = ['变更时间', '变更项目', '变更前', '变更后'];
            rows = items.map(item => [
                item.change_date,
                item.change_item,
                item.before_value,
                item.after_value
            ]);
        }

        downloadCSV(`主体梳理_${type}.csv`, arrayToCSV(headers, rows));
    });
}

/**
 * 一键导出所有表格
 */
export function exportAllTables(output: LegalFactExtractionOutput): void {
    if (output.table_02_background.length > 0) exportTable02(output.table_02_background);
    if (output.table_03_contracts.length > 0) exportTable03(output.table_03_contracts);
    if (output.table_04_financials.length > 0) exportTable04(output.table_04_financials);
    if (output.table_05_performance.length > 0) exportTable05(output.table_05_performance);
    if (output.table_06_disputes.length > 0) exportTable06(output.table_06_disputes);
    if (output.table_07_assets.length > 0) exportTable07(output.table_07_assets);
    if (output.table_08_other_facts.length > 0) exportTable08(output.table_08_other_facts);
    if (output.appendix_4_amendments.length > 0) exportAppendix4(output.appendix_4_amendments);
    if (output.entity_changes.length > 0) exportEntityChanges(output.entity_changes);
}

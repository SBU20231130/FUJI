import type { ColumnMapping, ImportType, ParsedRow } from './types.ts';

export type ImportField = {
  name: string;
  targetColumn: string;
  aliases: string[];
  required?: boolean;
  dataType: 'text' | 'number' | 'date' | 'boolean';
  reference?: 'item' | 'supplier';
};

export type ImportSchema = {
  type: ImportType;
  label: string;
  targetTable: string;
  fields: ImportField[];
  naturalKey: string[];
  dateRules: Array<[string, string]>;
};

const field = (name: string, targetColumn: string, aliases: string[], dataType: ImportField['dataType'], extra: Partial<ImportField> = {}): ImportField => ({ name, targetColumn, aliases, dataType, ...extra });

export const IMPORT_SCHEMAS: Record<ImportType, ImportSchema> = {
  usage_history: {
    type: 'usage_history', label: '사용 이력', targetTable: 'raw.usage_history', naturalKey: ['usage_id'], dateRules: [],
    fields: [
      field('사용이력 ID', 'usage_id', ['usage_id', 'usage id', '사용이력id', '사용이력번호'], 'text', { required: true }),
      field('품목', 'item_id', ['item_id', 'item id', '품목코드', '품목', '자재코드'], 'text', { required: true, reference: 'item' }),
      field('사용일', 'use_date', ['use_date', 'use date', '사용일', '사용일자', '일자'], 'date', { required: true }),
      field('사용수량', 'qty', ['qty', 'quantity', '수량', '사용수량'], 'number', { required: true }),
      field('창고', 'warehouse', ['warehouse', '창고'], 'text'),
      field('비고', 'note', ['note', '비고', '메모'], 'text'),
    ],
  },
  inventory: {
    type: 'inventory', label: '재고', targetTable: 'raw.inventory', naturalKey: ['품목코드', '창고', '기준일자'], dateRules: [],
    fields: [
      field('품목', '품목코드', ['item_id', 'item id', '품목코드', '품목'], 'text', { required: true, reference: 'item' }),
      field('창고', '창고', ['warehouse', '창고'], 'text', { required: true }),
      field('현재고', '현재고', ['current_stock', 'stock', '현재고', '재고'], 'number', { required: true }),
      field('기준일', '기준일자', ['snapshot_date', 'date', '기준일자', '기준일'], 'date', { required: true }),
      field('안전재고', '안전재고', ['safety_stock', '안전재고'], 'number'),
    ],
  },
  item_master: {
    type: 'item_master', label: '품목 마스터', targetTable: 'raw.item_master', naturalKey: ['품목코드'], dateRules: [],
    fields: [
      field('품목코드', '품목코드', ['item_id', 'item id', '품목코드', '품목'], 'text', { required: true }),
      field('품목명', '품목명', ['item_name', 'item name', '품목명', '자재명'], 'text', { required: true }),
      field('품목구분', '품목구분', ['item_type', 'type', '품목구분'], 'text'),
      field('단위', '단위', ['unit', '단위'], 'text'),
      field('표준단가', '표준단가', ['standard_price', 'price', '표준단가'], 'number'),
      field('사용여부', '사용여부', ['active', 'is_active', '사용여부'], 'text'),
      field('공급업체', 'supplier_id', ['supplier_id', 'supplier id', '공급업체코드', '공급업체'], 'text', { reference: 'supplier' }),
    ],
  },
  supplier_master: {
    type: 'supplier_master', label: '공급업체 마스터', targetTable: 'raw.supplier_master', naturalKey: ['공급업체코드'], dateRules: [],
    fields: [
      field('공급업체코드', '공급업체코드', ['supplier_id', 'supplier id', '공급업체코드', '공급업체'], 'text', { required: true }),
      field('공급업체명', '공급업체명', ['supplier_name', 'supplier name', '공급업체명'], 'text', { required: true }),
      field('국가', '국가', ['country', '국가'], 'text'),
      field('표준 리드타임', '표준리드타임(일)', ['standard_lead_time', 'lead_time', '표준리드타임', '표준리드타임(일)'], 'number'),
      field('담당자', '담당자', ['contact', '담당자'], 'text'),
      field('사용여부', '사용여부', ['active', 'is_active', '사용여부'], 'text'),
    ],
  },
  purchase_order: {
    type: 'purchase_order', label: '발주', targetTable: 'raw.purchase_order', naturalKey: ['발주번호', '품목코드'], dateRules: [['발주일', '납기예정일']],
    fields: [
      field('발주번호', '발주번호', ['po_no', 'po no', '발주번호'], 'text', { required: true }),
      field('발주일', '발주일', ['order_date', 'order date', '발주일', '발주일자'], 'date', { required: true }),
      field('공급업체', '공급업체', ['supplier_id', 'supplier', '공급업체', '공급업체코드'], 'text', { required: true, reference: 'supplier' }),
      field('품목', '품목코드', ['item_id', 'item id', '품목코드', '품목'], 'text', { required: true, reference: 'item' }),
      field('발주수량', '발주수량', ['ordered_qty', 'quantity', '발주수량'], 'number', { required: true }),
      field('단가', '단가', ['unit_price', 'price', '단가'], 'number'),
      field('납기예정일', '납기예정일', ['requested_delivery_date', 'delivery date', '납기예정일', '납기일'], 'date'),
      field('발주담당', '발주담당', ['buyer', 'buyer name', '발주담당'], 'text'),
    ],
  },
  goods_receipt: {
    type: 'goods_receipt', label: '입고', targetTable: 'raw.goods_receipt', naturalKey: ['입고번호'], dateRules: [],
    fields: [
      field('입고번호', '입고번호', ['receipt_no', 'receipt no', '입고번호'], 'text', { required: true }),
      field('발주번호', '발주번호', ['po_no', 'po no', '발주번호'], 'text', { required: true }),
      field('품목', '품목코드', ['item_id', 'item id', '품목코드', '품목'], 'text', { required: true, reference: 'item' }),
      field('입고수량', '입고수량', ['received_qty', 'quantity', '입고수량'], 'number', { required: true }),
      field('입고일', '입고일', ['receipt_date', 'received date', '입고일', '입고일자'], 'date', { required: true }),
      field('입고창고', '입고창고', ['warehouse', '입고창고', '창고'], 'text'),
    ],
  },
  sales_order: {
    type: 'sales_order', label: '판매 주문', targetTable: 'raw.sales_order', naturalKey: ['sales_order_no', 'line_no'], dateRules: [['order_date', 'requested_delivery_date']],
    fields: [
      field('판매주문번호', 'sales_order_no', ['sales_order_no', 'sales order no', '판매주문번호', '주문번호'], 'text', { required: true }),
      field('라인번호', 'line_no', ['line_no', 'line no', '라인번호'], 'text', { required: true }),
      field('주문일', 'order_date', ['order_date', 'order date', '주문일', '주문일자'], 'date', { required: true }),
      field('품목', 'item_id', ['item_id', 'item id', '품목코드', '품목'], 'text', { required: true, reference: 'item' }),
      field('공급업체', 'supplier_id', ['supplier_id', 'supplier id', '공급업체코드', '공급업체'], 'text', { reference: 'supplier' }),
      field('고객', 'customer_id', ['customer_id', 'customer id', '고객코드'], 'text'),
      field('주문수량', 'ordered_qty', ['ordered_qty', 'quantity', '주문수량'], 'number', { required: true }),
      field('납기희망일', 'requested_delivery_date', ['requested_delivery_date', 'delivery date', '납기희망일', '납기예정일'], 'date'),
      field('상태', 'status', ['status', '상태'], 'text'),
    ],
  },
  business_event: {
    type: 'business_event', label: '업무 이벤트', targetTable: 'raw.business_event', naturalKey: ['event_id'], dateRules: [],
    fields: [
      field('이벤트 ID', 'event_id', ['event_id', 'event id', '이벤트id', '이벤트번호'], 'text', { required: true }),
      field('이벤트 유형', 'event_type', ['event_type', 'event type', '이벤트유형'], 'text', { required: true }),
      field('이벤트일', 'event_date', ['event_date', 'event date', '이벤트일', '이벤트일자'], 'date', { required: true }),
      field('품목', 'item_id', ['item_id', 'item id', '품목코드', '품목'], 'text', { reference: 'item' }),
      field('수량', 'quantity', ['quantity', 'qty', '수량'], 'number'),
      field('설명', 'description', ['description', 'description', '설명', '내용'], 'text'),
      field('상태', 'status', ['status', '상태'], 'text'),
    ],
  },
  item_substitute: {
    type: 'item_substitute', label: '대체 품목', targetTable: 'raw.item_substitute', naturalKey: ['item_id', 'substitute_item_id', 'valid_from'], dateRules: [['valid_from', 'valid_to']],
    fields: [
      field('품목', 'item_id', ['item_id', 'item id', '품목코드', '품목'], 'text', { required: true, reference: 'item' }),
      field('대체 품목', 'substitute_item_id', ['substitute_item_id', 'substitute item id', '대체품목코드', '대체 품목'], 'text', { required: true, reference: 'item' }),
      field('우선순위', 'priority', ['priority', '우선순위'], 'number'),
      field('시작일', 'valid_from', ['valid_from', 'valid from', '시작일', '적용시작일'], 'date', { required: true }),
      field('종료일', 'valid_to', ['valid_to', 'valid to', '종료일', '적용종료일'], 'date'),
      field('사유', 'reason', ['reason', '사유'], 'text'),
      field('활성', 'active', ['active', 'is_active', '활성'], 'boolean'),
    ],
  },
};

export function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s_\-()/]/g, '');
}

export function inferColumnMapping(headers: string[], schema: ImportSchema): ColumnMapping {
  const available = new Set(headers);
  const used = new Set<string>();
  return Object.fromEntries(schema.fields.map((fieldDefinition) => {
    const candidates = [fieldDefinition.targetColumn, fieldDefinition.name, ...fieldDefinition.aliases];
    const matched = headers.find((header) => !used.has(header) && candidates.some((candidate) => normalizeHeader(candidate) === normalizeHeader(header)));
    if (matched) used.add(matched);
    return [fieldDefinition.targetColumn, matched ?? null];
  }).filter(([, source]) => source === null || available.has(source)));
}

export function buildRawRow(schema: ImportSchema, canonical: Record<string, unknown>, batchId: string, rowNumber: number, loadedAt: string) {
  const row: Record<string, unknown> = {};
  for (const fieldDefinition of schema.fields) {
    if (canonical[fieldDefinition.targetColumn] !== undefined && canonical[fieldDefinition.targetColumn] !== null) {
      const value = canonical[fieldDefinition.targetColumn];
      row[fieldDefinition.targetColumn] = fieldDefinition.dataType === 'date' ? String(value) : value;
    }
  }
  const sourceKey = schema.naturalKey.map((key) => String(canonical[key] ?? '')).join('|');
  row.batch_id = batchId;
  row.source_type = 'FILE_IMPORT';
  row.loaded_at = loadedAt;
  row.source_record_id = sourceKey || `${batchId}:${rowNumber}`;
  return row;
}

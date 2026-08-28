import test from 'node:test';
import assert from 'node:assert/strict';
import { IMPORT_SCHEMAS } from './schema.ts';
import { parseDate, parseNumber, validateRows } from './validate.ts';

const refs = { itemIds: new Set(['ITEM001']), supplierIds: new Set(['SUP001']) };
const at = '2026-08-28T00:00:00.000Z';

test('날짜와 숫자를 엄격하게 파싱한다', () => {
  assert.equal(parseDate('2026-02-28'), '2026-02-28');
  assert.equal(parseDate('2026-02-30'), null);
  assert.equal(parseDate('2026/08/28'), '2026-08-28');
  assert.equal(parseNumber('1,234.50'), 1234.5);
  assert.equal(parseNumber('숫자 아님'), null);
});

test('필수값과 미등록 품목을 오류로 표시한다', () => {
  const result = validateRows([{ rowNumber: 2, values: { usage_id: 'U1', item_id: 'UNKNOWN', use_date: '', qty: '3' } }], IMPORT_SCHEMAS.usage_history, { usage_id: 'usage_id', item_id: 'item_id', use_date: 'use_date', qty: 'qty' }, refs, 'batch', at);
  assert.equal(result[0].status, 'ERROR');
  assert.deepEqual(result[0].issues.map((issue) => issue.code).sort(), ['REQUIRED_VALUE_MISSING', 'UNKNOWN_ITEM']);
});

test('파일 내부 중복과 날짜 순서 오류를 표시한다', () => {
  const schema = IMPORT_SCHEMAS.purchase_order;
  const mapping = Object.fromEntries(schema.fields.map((field) => [field.targetColumn, field.targetColumn]));
  const result = validateRows([
    { rowNumber: 2, values: { '발주번호': 'PO1', '발주일': '2026-09-02', '공급업체': 'SUP001', '품목코드': 'ITEM001', '발주수량': '2', '납기예정일': '2026-09-01' } },
    { rowNumber: 3, values: { '발주번호': 'PO1', '발주일': '2026-09-02', '공급업체': 'SUP001', '품목코드': 'ITEM001', '발주수량': '4', '납기예정일': '2026-09-03' } },
  ], schema, mapping, refs, 'batch', at);
  assert.ok(result[0].issues.some((issue) => issue.code === 'INVALID_DATE_ORDER'));
  assert.ok(result[1].issues.some((issue) => issue.code === 'DUPLICATE_ROW'));
});

test('음수 수량은 적재를 막지 않고 경고로 남긴다', () => {
  const result = validateRows([{ rowNumber: 2, values: { usage_id: 'U1', item_id: 'ITEM001', use_date: '2026-08-28', qty: '-2' } }], IMPORT_SCHEMAS.usage_history, { usage_id: 'usage_id', item_id: 'item_id', use_date: 'use_date', qty: 'qty' }, refs, 'batch', at);
  assert.equal(result[0].status, 'WARNING');
  assert.equal(result[0].issues[0].code, 'NEGATIVE_VALUE');
  assert.equal(result[0].mappedData.source_type, 'FILE_IMPORT');
});

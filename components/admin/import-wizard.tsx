'use client';

import { useEffect, useMemo, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Button from '@/components/ui/button';
import Panel from '@/components/ui/panel';
import { IMPORT_SCHEMAS } from '@/lib/import/schema';
import type { ColumnMapping, ImportMode, ImportType } from '@/lib/import/types';
import { importBatchAction, prepareImportAction, validateImportAction, type ImportActionState } from '@/app/(admin)/admin/data-management/actions';

function SubmitButton({ children, variant = 'primary' }: { children: string; variant?: 'primary' | 'secondary' | 'ghost' }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending}>{pending ? '처리 중...' : children}</Button>;
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export default function ImportWizard() {
  const [prepareState, prepareAction] = useActionState<ImportActionState, FormData>(prepareImportAction, {});
  const [validationState, validationAction] = useActionState<ImportActionState, FormData>(validateImportAction, {});
  const [importState, importAction] = useActionState<ImportActionState, FormData>(importBatchAction, {});
  const [importType, setImportType] = useState<ImportType>('usage_history');
  const [importMode, setImportMode] = useState<ImportMode>('append');
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const batch = validationState.batch ?? importState.batch ?? prepareState.batch;
  const validation = validationState.validation;
  const schema = batch ? IMPORT_SCHEMAS[batch.importType] : IMPORT_SCHEMAS[importType];
  const headers = batch?.headers ?? [];
  const preview = batch?.preview ?? [];
  const selectedMapping = useMemo(() => mapping, [mapping]);

  useEffect(() => {
    if (prepareState.batch?.mapping) setMapping(prepareState.batch.mapping);
  }, [prepareState.batch]);
  useEffect(() => {
    if (validationState.batch?.mapping) setMapping(validationState.batch.mapping);
  }, [validationState.batch]);

  const updateMapping = (targetColumn: string, sourceColumn: string) => setMapping((current) => ({ ...current, [targetColumn]: sourceColumn || null }));
  const error = importState.error ?? validationState.error ?? prepareState.error;
  const isValidated = batch && ['VALIDATED', 'VALIDATED_WITH_ERRORS'].includes(batch.status ?? '');
  const isImported = batch?.status === 'IMPORTED';

  return (
    <div className="import-wizard">
      <Panel title="1. 파일 선택" description="서버에서 CSV/Excel을 읽고 원본 행을 staging에 보관합니다.">
        <form action={prepareAction} className="import-form">
          <div className="import-form__grid">
            <label>파일<input type="file" name="file" accept=".csv,.xlsx,.xls" required /></label>
            <label>적재 유형<select name="import_type" value={importType} onChange={(event) => setImportType(event.target.value as ImportType)}>{Object.values(IMPORT_SCHEMAS).map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select></label>
            <label>적재 모드<select name="import_mode" value={importMode} onChange={(event) => setImportMode(event.target.value as ImportMode)}><option value="append">Append · 기존 데이터 유지</option><option value="upsert">Upsert · source key 기준 갱신</option><option value="replace">Replace · 기존 데이터 교체</option></select></label>
          </div>
          <p className="form-help">허용 확장자 CSV, XLSX, XLS · 최대 25MB · 원본 RAW는 검증 완료 후에만 변경됩니다.</p>
          <SubmitButton>업로드 후 미리보기</SubmitButton>
        </form>
      </Panel>

      {batch ? (
        <Panel className="section" title="2. 컬럼 매핑" description={`${batch.fileName} · ${batch.totalRows}개 행 · ${schema.label}`}>
          <div className="import-summary"><span className="tag blue">BATCH {batch.batchId.slice(0, 8)}</span><span className="muted">현재 상태: {batch.status ?? 'STAGED'}</span></div>
          <div className="mapping-grid">
            {schema.fields.map((field) => (
              <label key={field.targetColumn} className="mapping-field"><span>{field.name}{field.required ? <em>필수</em> : null}</span><select value={selectedMapping[field.targetColumn] ?? ''} onChange={(event) => updateMapping(field.targetColumn, event.target.value)}><option value="">— 매핑 안 함 —</option>{headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label>
            ))}
          </div>
          <form action={validationAction} className="button-row import-action-row">
            <input type="hidden" name="batch_id" value={batch.batchId} />
            <input type="hidden" name="mapping" value={JSON.stringify(mapping)} readOnly />
            <SubmitButton>매핑 검증 실행</SubmitButton>
          </form>
        </Panel>
      ) : null}

      {batch ? <Panel className="section" title="미리보기" description="처음 20행만 표시합니다. 오류 행은 적재 대상에서 제외됩니다.">
        <div className="data-table-wrap import-preview-wrap"><table className="data-table import-preview-table"><thead><tr><th>행</th>{headers.slice(0, 8).map((header) => <th key={header}>{header}</th>)}{validation ? <th>상태</th> : null}</tr></thead><tbody>{preview.map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td>{headers.slice(0, 8).map((header) => <td key={`${row.rowNumber}-${header}`}>{displayValue(row.values[header])}</td>)}{validation ? <td><span className={`tag ${row.status === 'ERROR' ? 'red' : row.status === 'WARNING' ? 'amber' : 'green'}`}>{row.status}</span></td> : null}</tr>)}</tbody></table></div>
      </Panel> : null}

      {validation ? <Panel className="section" title="3. 검증 결과" description="SUCCESS/WARNING 행만 확정 적재할 수 있습니다.">
        <div className="import-result-grid"><div><strong>{validation.successRows}</strong><span>정상</span></div><div><strong>{validation.warningRows}</strong><span>경고 포함</span></div><div><strong>{validation.errorRows}</strong><span>오류 제외</span></div></div>
        {validation.errorRows + validation.warningRows > 0 ? <p className="form-help"><a href={`/api/admin/import-errors?batch_id=${batch?.batchId}`} target="_blank" rel="noreferrer">검증 오류 CSV 다운로드</a>에서 행별 사유를 확인하세요.</p> : null}
        {!isImported ? <form action={importAction} className="import-confirm-form">
          <input type="hidden" name="batch_id" value={batch?.batchId} />
          <label className="check-row"><input type="checkbox" name="confirm_import" value="true" checked={confirmImport} onChange={(event) => setConfirmImport(event.target.checked)} /> 검증된 정상/경고 행만 적재하는 것을 확인했습니다.</label>
          {batch?.importMode === 'replace' ? <label className="check-row warning-check"><input type="checkbox" name="confirm_replace" value="true" checked={confirmReplace} onChange={(event) => setConfirmReplace(event.target.checked)} /> Replace 모드로 기존 대상 데이터를 교체하는 것을 확인했습니다.</label> : null}
          <SubmitButton>적재 확정</SubmitButton>
        </form> : <p className="text-good">이 배치는 이미 적재되었습니다.</p>}
      </Panel> : null}

      {error ? <p className="import-error" role="alert">{error}</p> : null}
      {importState.message ? <p className="import-success" role="status">{importState.message}</p> : null}
    </div>
  );
}

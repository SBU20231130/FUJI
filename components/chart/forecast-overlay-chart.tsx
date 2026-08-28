'use client';

import { useMemo, useState } from 'react';
import type { ComparisonPoint } from '@/lib/scm-model';
import { toggleModelVisibility } from '@/lib/model-comparison';

type NumericKey = 'actualQty' | 'forecastValue' | 'p50' | 'p80' | 'p90' | 'predictionLower' | 'predictionUpper';

const WIDTH = 860;
const HEIGHT = 320;
const LEFT = 48;
const RIGHT = 18;
const TOP = 24;
const BOTTOM = 42;

function buildPath(dates: string[], values: Map<string, number | null>, x: (date: string) => number, y: (value: number) => number) {
  let path = '';
  let open = false;
  for (const date of dates) {
    const value = values.get(date);
    if (value === null || value === undefined || !Number.isFinite(value)) {
      open = false;
      continue;
    }
    path += `${open ? 'L' : 'M'} ${x(date).toFixed(1)} ${y(value).toFixed(1)} `;
    open = true;
  }
  return path.trim();
}

function toDateLabel(value: string) {
  return value.length > 10 ? value.slice(5, 10) : value.slice(5);
}

export default function ForecastOverlayChart({ points }: { points: ComparisonPoint[] }) {
  const modelIds = useMemo(() => Array.from(new Set(points.map((point) => point.modelId))), [points]);
  const [visibleModelIds, setVisibleModelIds] = useState<string[]>(modelIds);
  const visible = useMemo(() => new Set(visibleModelIds), [visibleModelIds]);
  const dates = useMemo(() => Array.from(new Set(points.map((point) => point.forecastDate))).sort(), [points]);
  const modelNames = useMemo(() => new Map(points.map((point) => [point.modelId, point.modelName ?? point.modelId])), [points]);
  const series = useMemo(() => {
    const output = new Map<string, Map<string, Record<NumericKey, number | null>>>();
    for (const point of points) {
      if (!output.has(point.modelId)) output.set(point.modelId, new Map());
      output.get(point.modelId)?.set(point.forecastDate, {
        actualQty: point.actualQty,
        forecastValue: point.forecastValue,
        p50: point.p50,
        p80: point.p80,
        p90: point.p90,
        predictionLower: point.predictionLower,
        predictionUpper: point.predictionUpper,
      });
    }
    return output;
  }, [points]);
  const actualValues = useMemo(() => {
    const values = new Map<string, number | null>();
    for (const point of points) if (!values.has(point.forecastDate) || point.actualQty !== null) values.set(point.forecastDate, point.actualQty);
    return values;
  }, [points]);
  const values = useMemo(() => {
    const all: number[] = [];
    for (const value of Array.from(actualValues.values())) if (value !== null) all.push(value);
    for (const [modelId, modelSeries] of Array.from(series.entries())) {
      if (!visible.has(modelId)) continue;
      for (const row of Array.from(modelSeries.values())) for (const key of ['forecastValue', 'p50', 'p80', 'p90', 'predictionLower', 'predictionUpper'] as NumericKey[]) {
        const value = row[key];
        if (value !== null) all.push(value);
      }
    }
    return all;
  }, [actualValues, series, visible]);

  if (points.length === 0) return <p className="data-table__empty">표시할 비교 데이터가 없습니다. 저장된 Forecast Result와 선택한 Run을 확인하세요.</p>;
  if (dates.length === 0 || values.length === 0) return <p className="data-table__empty">차트를 그릴 수 있는 값이 없습니다. <span className="reason-code">+ CALCULATION_UNAVAILABLE</span></p>;

  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const yMin = min - spread * 0.08;
  const yMax = max + spread * 0.08;
  const x = (date: string) => LEFT + (dates.length === 1 ? plotWidth / 2 : dates.indexOf(date) / (dates.length - 1)) * plotWidth;
  const y = (value: number) => TOP + ((yMax - value) / (yMax - yMin)) * plotHeight;
  const intervalModel = modelIds.find((modelId) => visible.has(modelId));
  const intervalSeries = intervalModel ? series.get(intervalModel) : undefined;
  const intervalUpper = intervalSeries ? new Map(dates.map((date) => [date, intervalSeries.get(date)?.predictionUpper ?? null])) : new Map<string, number | null>();
  const intervalLower = intervalSeries ? new Map(dates.map((date) => [date, intervalSeries.get(date)?.predictionLower ?? null])) : new Map<string, number | null>();
  const hasInterval = Array.from(intervalUpper.values()).some((value) => value !== null) && Array.from(intervalLower.values()).some((value) => value !== null);
  const labelStep = Math.max(1, Math.ceil(dates.length / 8));

  return (
    <div className="forecast-chart" aria-label="실제값과 모델 Forecast 비교 차트">
      <div className="forecast-chart__toolbar">
        <span className="muted">모델 표시</span>
        {modelIds.map((modelId, index) => (
          <label key={modelId} className="chart-toggle">
            <input type="checkbox" checked={visible.has(modelId)} onChange={() => setVisibleModelIds((current) => toggleModelVisibility(current, modelId))} />
            <span className={`chart-dot chart-dot--${index % 4}`} />
            {modelNames.get(modelId)}
          </label>
        ))}
      </div>
      <svg className="forecast-chart__svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img">
        <rect className="chart-validation-region" x={LEFT} y={TOP} width={plotWidth} height={plotHeight} rx="8" />
        <line className="chart-axis" x1={LEFT} y1={TOP + plotHeight} x2={LEFT + plotWidth} y2={TOP + plotHeight} />
        {hasInterval ? <path className="chart-interval" d={`${buildPath(dates, intervalUpper, x, y)} ${[...dates].reverse().map((date) => {
          const value = intervalLower.get(date);
          return value === null || value === undefined ? '' : `L ${x(date).toFixed(1)} ${y(value).toFixed(1)}`;
        }).join(' ')} Z`} /> : null}
        <path className="chart-series chart-series--actual" d={buildPath(dates, actualValues, x, y)} />
        {modelIds.map((modelId, index) => {
          if (!visible.has(modelId)) return null;
          const modelSeries = series.get(modelId) ?? new Map();
          const line = (key: NumericKey, className: string) => <path key={`${modelId}-${key}`} className={`chart-series ${className} chart-series--model-${index % 4}`} d={buildPath(dates, new Map(dates.map((date) => [date, modelSeries.get(date)?.[key] ?? null])), x, y)} />;
          return <g key={modelId}>{line('forecastValue', 'chart-series--forecast')}{line('p50', 'chart-series--p50')}{line('p80', 'chart-series--p80')}{line('p90', 'chart-series--p90')}</g>;
        })}
        {dates.map((date, index) => index % labelStep === 0 ? <text key={date} className="chart-label" x={x(date)} y={HEIGHT - 14} textAnchor="middle">{toDateLabel(date)}</text> : null)}
      </svg>
      <div className="chart-legend">
        <span><i className="chart-legend__line chart-legend__line--actual" /> Actual</span>
        <span><i className="chart-legend__line chart-legend__line--forecast" /> Forecast</span>
        <span><i className="chart-legend__line chart-legend__line--interval" /> Prediction interval</span>
        <span><i className="chart-legend__shade" /> 검증 구간</span>
        <span className="muted">P50 / P80 / P90은 저장 결과가 있을 때 표시됩니다.</span>
      </div>
    </div>
  );
}

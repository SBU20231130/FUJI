import 'server-only';

export type PythonForecastRequest = {
  run_id: string;
  horizon: number;
  models?: Array<{ model_id: string; model_version?: string; params?: Record<string, unknown> }>;
  item_ids?: string[];
};

export type PythonForecastResponse = {
  run_id: string;
  status: 'READY' | 'FAILED' | string;
  model_count: number;
  result_count: number;
  errors?: Array<{ item_id?: string; model_id?: string; code?: string }>;
};

export type PythonBacktestResponse = {
  run_id: string;
  backtest_run_id: string | null;
  status: 'COMPLETED' | 'FAILED' | string;
};

function getServiceEnv() {
  const url = process.env.PYTHON_FORECAST_SERVICE_URL?.trim();
  const token = process.env.PYTHON_FORECAST_SERVICE_TOKEN?.trim();
  if (!url || !token) {
    throw new Error('PYTHON_FORECAST_SERVICE_URL 과 PYTHON_FORECAST_SERVICE_TOKEN을 서버 환경변수에 설정하세요.');
  }
  return { url: url.replace(/\/$/, ''), token };
}

export async function requestPythonForecast(input: PythonForecastRequest, accessToken: string): Promise<PythonForecastResponse> {
  const env = getServiceEnv();
  const response = await fetch(`${env.url}/forecast/run`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forecast-service-token': env.token,
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
    cache: 'no-store',
    signal: AbortSignal.timeout(120_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.detail;
    const message = typeof detail === 'object' ? detail.message : detail;
    throw new Error(String(message ?? `Python Forecast Service 요청 실패 (${response.status})`));
  }
  return body as PythonForecastResponse;
}

export async function requestPythonBacktest(runId: string, accessToken: string): Promise<PythonBacktestResponse> {
  const env = getServiceEnv();
  const response = await fetch(`${env.url}/backtest/run`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forecast-service-token': env.token,
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ run_id: runId }),
    cache: 'no-store',
    signal: AbortSignal.timeout(120_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.detail;
    const message = typeof detail === 'object' ? detail.message : detail;
    throw new Error(String(message ?? `Python Backtest Service 요청 실패 (${response.status})`));
  }
  return body as PythonBacktestResponse;
}

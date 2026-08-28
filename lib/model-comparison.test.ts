import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleModelVisibility } from './model-comparison.ts';

test('모델 토글은 표시 목록만 바꾼다', () => {
  const initial = ['NAIVE', 'MOVING_AVERAGE'];
  assert.deepEqual(toggleModelVisibility(initial, 'NAIVE'), ['MOVING_AVERAGE']);
  assert.deepEqual(toggleModelVisibility(initial, 'SEASONAL_NAIVE'), ['NAIVE', 'MOVING_AVERAGE', 'SEASONAL_NAIVE']);
  assert.deepEqual(initial, ['NAIVE', 'MOVING_AVERAGE']);
});

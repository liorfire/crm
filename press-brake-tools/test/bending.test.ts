import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bendAllowance, bendDeduction, outsideSetback, flatLength, kFactorFromTest } from '../src/bending.js';

const close = (a: number, b: number, tol = 1e-3) => assert.ok(Math.abs(a - b) < tol, `${a} !~ ${b}`);

test('bend allowance for 90°, t=2, R=2, K=0.44', () => {
  // BA = (π/2)·(2 + 0.44·2) = 1.5708·2.88 = 4.5239
  close(bendAllowance({ thickness: 2, insideRadius: 2, bendAngle: 90, kFactor: 0.44 }), 4.5239);
});

test('outside setback for 90° equals R + t', () => {
  close(outsideSetback({ thickness: 2, insideRadius: 2, bendAngle: 90, kFactor: 0.44 }), 4);
});

test('bend deduction = 2·OSSB − BA', () => {
  const b = { thickness: 2, insideRadius: 2, bendAngle: 90, kFactor: 0.44 };
  close(bendDeduction(b), 2 * 4 - 4.5239);
});

test('flat length of an L bracket', () => {
  const b = { thickness: 2, insideRadius: 2, bendAngle: 90, kFactor: 0.44 };
  // 50 + 30 outside flanges, one bend
  close(flatLength([50, 30], [b]), 80 - bendDeduction(b));
});

test('kFactorFromTest round-trips', () => {
  const b = { thickness: 3, insideRadius: 3, bendAngle: 90, kFactor: 0.42 };
  const flat = flatLength([40, 60], [b]);
  close(kFactorFromTest(flat, 40, 60, 3, 3, 90), 0.42, 1e-6);
});

test('rejects bad inputs', () => {
  assert.throws(() => bendAllowance({ thickness: 0, insideRadius: 1, bendAngle: 90, kFactor: 0.4 }));
  assert.throws(() => flatLength([10], [{ thickness: 1, insideRadius: 1, bendAngle: 90, kFactor: 0.4 }]));
});

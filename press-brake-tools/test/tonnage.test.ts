import { test } from 'node:test';
import assert from 'node:assert/strict';
import { airBendForceKN, airBendForcePerMetre, recommendedVOpening, minimumFlange, airBendInsideRadius } from '../src/tonnage.js';
import { kNToMetricTons } from '../src/units.js';

const close = (a: number, b: number, tol = 1e-2) => assert.ok(Math.abs(a - b) < tol, `${a} !~ ${b}`);

test('mild steel 2 mm in V12, 1 m: ≈ 199 kN (≈ 20 t)', () => {
  // 1.42 · 420 · 4 · 1000 / 12 = 198 800 N
  const kN = airBendForcePerMetre({ thickness: 2, vOpening: 12, material: 'mildSteel' });
  close(kN, 198.8);
  close(kNToMetricTons(kN), 20.27);
});

test('force scales linearly with length', () => {
  const a = airBendForceKN({ thickness: 3, vOpening: 24, length: 500, material: 'mildSteel' });
  const b = airBendForceKN({ thickness: 3, vOpening: 24, length: 1000, material: 'mildSteel' });
  close(b / a, 2);
});

test('explicit tensile strength override', () => {
  const a = airBendForcePerMetre({ thickness: 2, vOpening: 12, material: { tensileStrength: 840 } });
  const b = airBendForcePerMetre({ thickness: 2, vOpening: 12, material: 'mildSteel' });
  close(a / b, 2);
});

test('recommended V ranges', () => {
  assert.deepEqual(recommendedVOpening(2), { min: 12, nominal: 16, max: 16 });
  assert.deepEqual(recommendedVOpening(6), { min: 48, nominal: 60, max: 60 });
  assert.deepEqual(recommendedVOpening(12), { min: 120, nominal: 144, max: 144 });
});

test('minimum flange ≈ 0.7·V at 90°, grows for acute bends', () => {
  close(minimumFlange(16), 11.2);
  assert.ok(minimumFlange(16, 120) > minimumFlange(16, 90));
});

test('inside radius ≈ V/6 for mild steel', () => {
  close(airBendInsideRadius(12), 2);
  assert.ok(airBendInsideRadius(12, 'stainless304') > 2);
});

test('rejects V ≤ t', () => {
  assert.throws(() => airBendForcePerMetre({ thickness: 5, vOpening: 5, material: 'mildSteel' }));
});

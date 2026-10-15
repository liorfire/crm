import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog, selectTooling } from '../src/catalog.js';

test('catalog loads with punches and dies', () => {
  const c = loadCatalog();
  assert.ok(c.punches.length > 0);
  assert.ok(c.dies.length > 0);
});

test('selects a V16 die for 2 mm mild steel at 90°', () => {
  const c = loadCatalog();
  const results = selectTooling(c, { thickness: 2, bendAngle: 90, material: 'mildSteel', system: 'european' });
  assert.ok(results.length > 0);
  assert.equal(results[0].die.vOpening, 16);
  assert.equal(results[0].punch.angle, 88);
  assert.ok(results[0].withinToolLoad);
  assert.equal(results[0].withinMachineLoad, null);
});

test('flags machine overload', () => {
  const c = loadCatalog();
  const results = selectTooling(c, { thickness: 10, bendAngle: 90, material: 'hardox400', machineMaxKNm: 500 });
  assert.ok(results.length > 0);
  assert.equal(results[0].withinMachineLoad, false);
});

test('acute bend requires an acute die and punch', () => {
  const c = loadCatalog();
  const results = selectTooling(c, { thickness: 1.5, bendAngle: 150, material: 'mildSteel' });
  for (const r of results) {
    assert.ok(r.die.angle <= 30);
    assert.ok(r.punch.angle <= 30);
  }
});

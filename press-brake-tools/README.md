# press-brake-tools

Calculation and catalog library for press brake tooling: punch/die selection,
air-bending tonnage, V-die sizing, bend allowance and bend deduction.

Zero runtime dependencies. TypeScript, Node 20+.

## What's in it

| Module | Purpose |
| --- | --- |
| `src/bending.ts` | Bend allowance, outside setback, bend deduction, flat-blank length, K-factor back-solve from a test bend |
| `src/tonnage.ts` | Air-bend force (kN, kN/m), recommended V opening, resulting inside radius, minimum flange |
| `src/catalog.ts` | Punch / V-die data model, catalog loader, `selectTooling()` that picks a die/punch pair and checks tool and machine load |
| `src/materials.ts` | Reference tensile strengths and default K-factors |
| `src/units.ts` | mm/inch and kN/ton conversions |
| `data/tooling.json` | Sample European-style tooling catalog to replace with your own |

## Quick start

```bash
npm install
npm test
```

```ts
import { airBendForcePerMetre, bendDeduction, loadCatalog, selectTooling, kNToMetricTons } from 'press-brake-tools';

// 2 mm mild steel in a V16 die
const kN = airBendForcePerMetre({ thickness: 2, vOpening: 16, material: 'mildSteel' });
console.log(kNToMetricTons(kN).toFixed(1), 't/m');

// Bend deduction for a 90° bend, R = 2.5 mm, K = 0.44
console.log(bendDeduction({ thickness: 2, insideRadius: 2.5, bendAngle: 90, kFactor: 0.44 }));

// Pick tooling from the catalog
const catalog = loadCatalog();
const [best] = selectTooling(catalog, { thickness: 2, bendAngle: 90, material: 'mildSteel', machineMaxKNm: 1000 });
console.log(best.die.id, best.punch.id, best.forcePerMetreKN.toFixed(0), 'kN/m');
```

## Formulas

- Bend allowance: `BA = θ · (R + K·t)` with θ in radians
- Outside setback: `OSSB = tan(θ/2) · (R + t)`
- Bend deduction: `BD = 2·OSSB − BA`
- Air-bend force: `F = 1.42 · UTS · t² · L / V`
- Recommended V: 6–8t under 3 mm, 8–10t to 10 mm, 10–12t above
- Inside radius from air bending: `R ≈ V / 6` (mild steel)
- Minimum flange: `≈ 0.7 · V` at 90°

These are the standard shop-floor approximations. Use the tooling supplier's
chart and a test bend for production numbers.

## Roadmap

- [ ] Bottoming and coining tonnage
- [ ] Springback compensation per material
- [ ] Tool segmentation planner (split lengths to reach a target bend length)
- [ ] Import real supplier catalogs (CSV)
- [ ] Web UI / CLI for the calculators
- [ ] Machine profiles (tonnage, daylight, stroke, throat depth)

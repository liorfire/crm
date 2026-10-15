import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { airBendForcePerMetre, recommendedVOpening } from './tonnage.js';

/** Clamping / tang systems commonly found on press brakes. */
export type ToolingSystem = 'european' | 'newStandard' | 'american' | 'wilaTrumpf';

export interface Punch {
  kind: 'punch';
  id: string;
  system: ToolingSystem;
  /** Included tip angle, degrees (e.g. 88, 60, 30). */
  angle: number;
  /** Tip radius, mm. */
  tipRadius: number;
  /** Working height, mm. */
  height: number;
  /** Max load, kN per metre. */
  maxLoadKNm: number;
  profile: 'straight' | 'gooseneck' | 'acute' | 'sash';
  segmented?: boolean;
  notes?: string;
}

export interface VDie {
  kind: 'die';
  id: string;
  system: ToolingSystem;
  /** V opening, mm. */
  vOpening: number;
  /** Included V angle, degrees. */
  angle: number;
  /** Shoulder radius, mm. */
  shoulderRadius: number;
  height: number;
  maxLoadKNm: number;
  notes?: string;
}

export type Tool = Punch | VDie;

export interface Catalog {
  punches: Punch[];
  dies: VDie[];
}

export function loadCatalog(path?: string): Catalog {
  const here = dirname(fileURLToPath(import.meta.url));
  const file = path ?? join(here, '..', '..', 'data', 'tooling.json');
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Catalog;
  return raw;
}

export interface SelectionInput {
  thickness: number;
  bendAngle: number;
  /** Material id from MATERIALS. */
  material: string;
  system?: ToolingSystem;
  /** Machine tonnage limit, kN per metre, if known. */
  machineMaxKNm?: number;
}

export interface SelectionResult {
  die: VDie;
  punch: Punch;
  forcePerMetreKN: number;
  withinToolLoad: boolean;
  withinMachineLoad: boolean | null;
}

/**
 * Pick a die/punch pair for an air bend:
 * 1. Dies whose V is inside the recommended range for the thickness.
 * 2. Die included angle must be ≤ the target (allowing springback).
 * 3. Punch tip angle must fit inside the die.
 * 4. Both tools must carry the required force.
 * Results are sorted by how close the V is to the nominal recommendation.
 */
export function selectTooling(catalog: Catalog, input: SelectionInput): SelectionResult[] {
  const rec = recommendedVOpening(input.thickness);
  const targetIncluded = 180 - input.bendAngle;

  const dies = catalog.dies
    .filter((d) => (input.system ? d.system === input.system : true))
    .filter((d) => d.vOpening >= rec.min && d.vOpening <= rec.max)
    .filter((d) => d.angle <= targetIncluded)
    .sort((a, b) => Math.abs(a.vOpening - rec.nominal) - Math.abs(b.vOpening - rec.nominal));

  const results: SelectionResult[] = [];
  for (const die of dies) {
    const force = airBendForcePerMetre({
      thickness: input.thickness,
      vOpening: die.vOpening,
      material: input.material,
    });
    const punches = catalog.punches
      .filter((p) => p.system === die.system)
      .filter((p) => p.angle <= die.angle)
      .filter((p) => p.tipRadius <= input.thickness * 1.5)
      .sort((a, b) => b.maxLoadKNm - a.maxLoadKNm);
    for (const punch of punches) {
      results.push({
        die,
        punch,
        forcePerMetreKN: force,
        withinToolLoad: force <= die.maxLoadKNm && force <= punch.maxLoadKNm,
        withinMachineLoad: input.machineMaxKNm === undefined ? null : force <= input.machineMaxKNm,
      });
    }
  }
  return results;
}

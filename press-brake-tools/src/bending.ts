import { degToRad } from './units.js';

/**
 * Bend geometry formulas (metric, mm, degrees).
 *
 * `bendAngle` is the angle the material is bent THROUGH (complement of the
 * included angle). A 90° bend has bendAngle = 90 and includedAngle = 90; a 60°
 * included angle (acute part) has bendAngle = 120.
 */

export interface BendInput {
  /** Material thickness, mm. */
  thickness: number;
  /** Inside bend radius, mm. */
  insideRadius: number;
  /** Angle bent through, degrees (90 for a right-angle bend). */
  bendAngle: number;
  /** Neutral-axis position as a fraction of thickness (0–0.5 typical). */
  kFactor: number;
}

function assertBend(b: BendInput): void {
  if (b.thickness <= 0) throw new RangeError('thickness must be > 0');
  if (b.insideRadius < 0) throw new RangeError('insideRadius must be >= 0');
  if (b.bendAngle <= 0 || b.bendAngle >= 180) throw new RangeError('bendAngle must be in (0, 180)');
  if (b.kFactor <= 0 || b.kFactor > 1) throw new RangeError('kFactor must be in (0, 1]');
}

/** Arc length of the neutral axis through the bend: BA = θ·(R + K·t). */
export function bendAllowance(b: BendInput): number {
  assertBend(b);
  return degToRad(b.bendAngle) * (b.insideRadius + b.kFactor * b.thickness);
}

/** Outside setback: OSSB = tan(θ/2)·(R + t). */
export function outsideSetback(b: BendInput): number {
  assertBend(b);
  return Math.tan(degToRad(b.bendAngle) / 2) * (b.insideRadius + b.thickness);
}

/** Bend deduction: BD = 2·OSSB − BA. */
export function bendDeduction(b: BendInput): number {
  return 2 * outsideSetback(b) - bendAllowance(b);
}

/**
 * Flat blank length for a part given its outside flange dimensions
 * (mold-line to mold-line) and the bends between them.
 */
export function flatLength(outsideFlanges: number[], bends: BendInput[]): number {
  if (outsideFlanges.length !== bends.length + 1) {
    throw new RangeError('flatLength needs one more flange than bends');
  }
  const flanges = outsideFlanges.reduce((s, f) => s + f, 0);
  const deductions = bends.reduce((s, b) => s + bendDeduction(b), 0);
  return flanges - deductions;
}

/**
 * Back-solve a K-factor from a measured test bend.
 * Bend a coupon, measure both outside flanges and the flat length, and feed
 * them here to calibrate your material/tooling combination.
 */
export function kFactorFromTest(
  measuredFlat: number,
  outsideFlangeA: number,
  outsideFlangeB: number,
  thickness: number,
  insideRadius: number,
  bendAngle: number,
): number {
  const ossb = Math.tan(degToRad(bendAngle) / 2) * (insideRadius + thickness);
  const ba = measuredFlat - (outsideFlangeA + outsideFlangeB - 2 * ossb);
  const k = (ba / degToRad(bendAngle) - insideRadius) / thickness;
  if (!Number.isFinite(k)) throw new RangeError('could not solve K-factor from inputs');
  return k;
}

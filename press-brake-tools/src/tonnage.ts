import { getMaterial } from './materials.js';

/**
 * Air-bending estimates. These are the standard shop-floor rules of thumb;
 * use the tooling supplier's chart for the final number.
 */

export interface AirBendInput {
  /** Material thickness, mm. */
  thickness: number;
  /** Die V opening, mm. */
  vOpening: number;
  /** Bend length, mm. */
  length: number;
  /** Material id from MATERIALS, or an explicit tensile strength (N/mm²). */
  material: string | { tensileStrength: number };
}

/**
 * Required force in kN for an air bend:
 *   F = 1.42 · UTS · t² · L / V   (N, with t, L, V in mm and UTS in N/mm²)
 * The constant 1.42 absorbs friction and the die-shoulder lever arm and is
 * the figure used in most supplier tonnage charts for mild steel.
 */
export function airBendForceKN(input: AirBendInput): number {
  const { thickness: t, vOpening: v, length: L } = input;
  if (t <= 0 || v <= 0 || L <= 0) throw new RangeError('thickness, vOpening and length must be > 0');
  if (v <= t) throw new RangeError('vOpening must be larger than thickness');
  const uts = typeof input.material === 'string'
    ? getMaterial(input.material).tensileStrength
    : input.material.tensileStrength;
  const forceN = (1.42 * uts * t * t * L) / v;
  return forceN / 1000;
}

/** Force per metre, kN/m, which is how most tool load ratings are expressed. */
export function airBendForcePerMetre(input: Omit<AirBendInput, 'length'>): number {
  return airBendForceKN({ ...input, length: 1000 });
}

/**
 * Recommended V opening for air bending as a multiple of thickness.
 * Common practice: 6–8t for thin sheet, 8–10t for mid plate, 10–12t for heavy plate.
 */
export function recommendedVOpening(thickness: number): { min: number; nominal: number; max: number } {
  if (thickness <= 0) throw new RangeError('thickness must be > 0');
  let factor: [number, number, number];
  if (thickness < 3) factor = [6, 8, 8];
  else if (thickness <= 10) factor = [8, 10, 10];
  else factor = [10, 12, 12];
  return {
    min: factor[0] * thickness,
    nominal: factor[1] * thickness,
    max: factor[2] * thickness,
  };
}

/** Approximate inside radius produced by air bending in a given V: R ≈ V/6 (mild steel). */
export function airBendInsideRadius(vOpening: number, materialId = 'mildSteel'): number {
  const m = getMaterial(materialId);
  // Harder/stronger materials spring back more and form a larger radius.
  const scale = Math.max(1, m.tensileStrength / 420);
  return (vOpening / 6) * scale;
}

/**
 * Minimum flange that can sit on the die shoulders during an air bend.
 * Rule of thumb for an 88°/90° V die with standard shoulder radii: ≈ 0.7·V
 * for 90°; acute bends need more.
 */
export function minimumFlange(vOpening: number, bendAngle = 90): number {
  if (vOpening <= 0) throw new RangeError('vOpening must be > 0');
  const base = 0.7 * vOpening;
  if (bendAngle <= 90) return base;
  // Beyond 90° the sheet slides down the V face; scale by 1/sin of the half-included angle.
  const includedHalf = ((180 - bendAngle) / 2) * (Math.PI / 180);
  return base / Math.max(Math.sin(includedHalf), 0.5);
}

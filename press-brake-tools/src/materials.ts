/**
 * Reference material properties used by the tonnage calculator.
 * Tensile strengths are typical mid-range values; override per job when the
 * mill certificate is available.
 */
export interface Material {
  id: string;
  name: string;
  /** Ultimate tensile strength, N/mm² (MPa). */
  tensileStrength: number;
  /** Multiplier relative to mild steel for quick comparisons. */
  tonnageFactor: number;
  /** Default K-factor for air bending at R ≈ t. */
  defaultKFactor: number;
  /** Suggested minimum inside radius as a multiple of thickness. */
  minInsideRadiusFactor: number;
}

export const MATERIALS: Record<string, Material> = {
  mildSteel: {
    id: 'mildSteel',
    name: 'Mild steel (S235 / A36)',
    tensileStrength: 420,
    tonnageFactor: 1.0,
    defaultKFactor: 0.44,
    minInsideRadiusFactor: 0.8,
  },
  stainless304: {
    id: 'stainless304',
    name: 'Stainless steel 304',
    tensileStrength: 620,
    tonnageFactor: 1.5,
    defaultKFactor: 0.45,
    minInsideRadiusFactor: 1.0,
  },
  aluminum5052: {
    id: 'aluminum5052',
    name: 'Aluminum 5052-H32',
    tensileStrength: 230,
    tonnageFactor: 0.55,
    defaultKFactor: 0.42,
    minInsideRadiusFactor: 1.0,
  },
  aluminum6061T6: {
    id: 'aluminum6061T6',
    name: 'Aluminum 6061-T6',
    tensileStrength: 310,
    tonnageFactor: 0.75,
    defaultKFactor: 0.40,
    minInsideRadiusFactor: 2.5,
  },
  hardox400: {
    id: 'hardox400',
    name: 'Abrasion-resistant steel (Hardox 400 class)',
    tensileStrength: 1250,
    tonnageFactor: 3.0,
    defaultKFactor: 0.46,
    minInsideRadiusFactor: 3.0,
  },
};

export function getMaterial(id: string): Material {
  const m = MATERIALS[id];
  if (!m) throw new Error(`Unknown material: ${id}`);
  return m;
}

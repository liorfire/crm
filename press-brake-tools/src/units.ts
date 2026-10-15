/** Unit helpers. All internal math is metric: mm, kN, N/mm² (MPa). */

export const MM_PER_INCH = 25.4;
export const KN_PER_US_TON = 8.896443230521;
export const KN_PER_METRIC_TON = 9.80665;

export const inToMm = (inches: number): number => inches * MM_PER_INCH;
export const mmToIn = (mm: number): number => mm / MM_PER_INCH;
export const kNToUsTons = (kN: number): number => kN / KN_PER_US_TON;
export const kNToMetricTons = (kN: number): number => kN / KN_PER_METRIC_TON;
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

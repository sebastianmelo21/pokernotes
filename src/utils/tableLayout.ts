// Reference canvas: 320 x 540 px  →  portrait oval (taller than wide)
const REF_W = 320;
const REF_H = 540;
const CX = REF_W / 2; // 160
const CY = REF_H / 2; // 270

// Seat ellipse — seats sit ON the rail edge (same as PokerStars avatars)
const RX = 138;
const RY = 232;

/**
 * CSS left/top percentages for seat at `index` out of `total`,
 * with optional `offsetDeg` rotation (from top, clockwise).
 */
export function getSeatPosition(
  index: number,
  total: number,
  offsetDeg = 0
): { left: string; top: string } {
  const angleDeg = (index / total) * 360 + offsetDeg;
  const angleRad = -Math.PI / 2 + (angleDeg * Math.PI) / 180;
  const x = CX + RX * Math.cos(angleRad);
  const y = CY + RY * Math.sin(angleRad);
  return {
    left: `${(x / REF_W) * 100}%`,
    top: `${(y / REF_H) * 100}%`,
  };
}

/**
 * Position of the dealer chip — midpoint between the last seat and seat 1.
 * Uses a slightly smaller ellipse so the chip sits inside the rail.
 */
export function getDealerPosition(
  total: number,
  offsetDeg = 0
): { left: string; top: string } {
  const RX_D = 112;
  const RY_D = 190;
  const naturalDeg = ((2 * total - 1) / (2 * total)) * 360;
  const angleDeg = naturalDeg + offsetDeg;
  const angleRad = -Math.PI / 2 + (angleDeg * Math.PI) / 180;
  const x = CX + RX_D * Math.cos(angleRad);
  const y = CY + RY_D * Math.sin(angleRad);
  return {
    left: `${(x / REF_W) * 100}%`,
    top: `${(y / REF_H) * 100}%`,
  };
}

/**
 * Rotation offset (degrees) so that `seatIndex` ends up at
 * bottom-left (225° in the "from top, clockwise" system).
 * Normalized to (-180, 180] for shortest-path animation.
 */
export function getRotationOffset(seatIndex: number, total: number): number {
  const naturalAngle = (seatIndex / total) * 360;
  const targetAngle = 225; // bottom-left (between 6 o'clock and 9 o'clock)
  let offset = targetAngle - naturalAngle;
  offset = ((offset % 360) + 360) % 360;
  if (offset > 180) offset -= 360;
  return offset;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

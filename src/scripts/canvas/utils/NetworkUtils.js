/**
 * Calculates a strict orthogonal Manhattan-like path for grid connections.
 * @param {number} x1 - Start X coordinate
 * @param {number} y1 - Start Y coordinate
 * @param {number} x2 - End X coordinate
 * @param {number} y2 - End Y coordinate
 * @returns {object} The orthogonal path coordinates and distances
 */
export function getCircuitPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  let mx, my, d1, d2;

  if (adx > ady) {
    mx = x1 + ady * Math.sign(dx);
    my = y1 + ady * Math.sign(dy);
    d1 = Math.sqrt(2) * ady;
    d2 = adx - ady;
  } else {
    mx = x1 + adx * Math.sign(dx);
    my = y1 + adx * Math.sign(dy);
    d1 = Math.sqrt(2) * adx;
    d2 = ady - adx;
  }
  return { mx, my, d1, d2, totalDist: d1 + d2 };
}

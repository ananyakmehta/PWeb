// Generates a "flies in, loops once, settles" dotted trail as a polyline path, plus
// the tangent angle at the end point so the plane icon can be rotated to face its own
// direction of travel. Sampled as short straight segments rather than true bezier
// curves — deliberate: the trail renders with stroke-dasharray (dots/dashes), so a
// finely-sampled polyline reads just as smooth as a curve once dashed, without needing
// real curve math.
export interface LoopTrailConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  loopRadius: number;
  loopTurns: number;
  loopDirection?: 1 | -1;
  loopCenterT?: number; // 0-1, where along the straight-line path the loop sits
  loopWidthT?: number; // 0-1, how much of the path's t-range the loop occupies
  samples?: number;
}

export interface LoopTrailResult {
  pathD: string;
  endAngleDeg: number;
}

export function buildLoopTrail(cfg: LoopTrailConfig): LoopTrailResult {
  const {
    startX,
    startY,
    endX,
    endY,
    loopRadius,
    loopTurns,
    loopDirection = 1,
    loopCenterT = 0.5,
    loopWidthT = 0.3,
    samples = 40,
  } = cfg;

  const half = loopWidthT / 2;
  const lo = loopCenterT - half;
  const hi = loopCenterT + half;

  const pts: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const bx = startX + (endX - startX) * t;
    const by = startY + (endY - startY) * t;

    let ox = 0;
    let oy = 0;
    if (t >= lo && t <= hi) {
      const u = (t - lo) / (hi - lo);
      const envelope = Math.sin(u * Math.PI); // 0 -> 1 -> 0, blends the loop in/out
      const angle = u * Math.PI * 2 * loopTurns * loopDirection;
      ox = Math.cos(angle) * loopRadius * envelope;
      oy = Math.sin(angle) * loopRadius * envelope;
    }
    pts.push([bx + ox, by + oy]);
  }

  const pathD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const [lx, ly] = pts[pts.length - 2];
  const [ex, ey] = pts[pts.length - 1];
  const endAngleDeg = (Math.atan2(ey - ly, ex - lx) * 180) / Math.PI;

  return { pathD, endAngleDeg };
}

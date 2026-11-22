// MOONSHIFT guards: waypoint patrols with smooth turns, vision cones occluded by cover, and
// a per-guard suspicion meter. Suspicion rises while the courier is inside the cone — faster
// when close, moving at full pace, or standing in lamplight — and drains while unseen, so a
// glimpse is recoverable. A full meter makes the guard shout: the archive ALARM gains a chunk
// and the guard gives chase for a few seconds before falling back to the patrol.
import { inLamplight } from './levels.js';

export const CONE_RANGE = 196;
export const CONE_HALF_ANGLE = 0.56; // about 32 degrees each side of the facing
const TURN_RATE = 3.4; // radians per second a guard can swing round
const CHASE_SECONDS = 2.6;
const SHOUT_ALARM = 0.34;

/** Smallest signed turn from angle a to angle b, in (-pi, pi]. */
export function angleDelta(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Does segment (x1,y1)-(x2,y2) cross segment (x3,y3)-(x4,y4)? Returns t along the first, or null. */
function segmentCrossT(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1x = x2 - x1;
  const d1y = y2 - y1;
  const d2x = x4 - x3;
  const d2y = y4 - y3;
  const denom = d1x * d2y - d1y * d2x;
  if (denom === 0) return null;
  const t = ((x3 - x1) * d2y - (y3 - y1) * d2x) / denom;
  const u = ((x3 - x1) * d1y - (y3 - y1) * d1x) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

/** True when a solid rectangle blocks the straight line between two points. */
export function lineBlocked(x1, y1, x2, y2, solids) {
  for (const s of solids) {
    const edges = [
      [s.x, s.y, s.x + s.w, s.y],
      [s.x + s.w, s.y, s.x + s.w, s.y + s.h],
      [s.x + s.w, s.y + s.h, s.x, s.y + s.h],
      [s.x, s.y + s.h, s.x, s.y],
    ];
    for (const e of edges) {
      if (segmentCrossT(x1, y1, x2, y2, e[0], e[1], e[2], e[3]) !== null) return true;
    }
  }
  return false;
}

/** Distance from (x, y) along the ray at `angle` until it meets a solid or the cone range ends. */
export function rayDistance(x, y, angle, solids) {
  const x2 = x + Math.cos(angle) * CONE_RANGE;
  const y2 = y + Math.sin(angle) * CONE_RANGE;
  let best = 1;
  for (const s of solids) {
    const edges = [
      [s.x, s.y, s.x + s.w, s.y],
      [s.x + s.w, s.y, s.x + s.w, s.y + s.h],
      [s.x + s.w, s.y + s.h, s.x, s.y + s.h],
      [s.x, s.y + s.h, s.x, s.y],
    ];
    for (const e of edges) {
      const t = segmentCrossT(x, y, x2, y2, e[0], e[1], e[2], e[3]);
      if (t !== null && t < best) best = t;
    }
  }
  return best * CONE_RANGE;
}

/** The cone outline as a fan of ray endpoints, so cover bites real notches out of the light. */
export function conePolygon(guard, solids) {
  const steps = 26;
  const points = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= steps; i += 1) {
    const angle = guard.facing - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / steps;
    const d = rayDistance(guard.x, guard.y, angle, solids);
    points.push({ x: guard.x + Math.cos(angle) * d, y: guard.y + Math.sin(angle) * d });
  }
  return points;
}

/** Is the courier visible to this guard right now? Returns 0 (hidden) to 1 (point blank). */
export function visibility(guard, player, solids) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return 0;
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDelta(guard.facing, toPlayer)) > CONE_HALF_ANGLE) return 0;
  if (lineBlocked(guard.x, guard.y, player.x, player.y, solids)) return 0;
  return 1 - dist / (CONE_RANGE * 1.25);
}

export class Guard {
  constructor(definition) {
    this.path = definition.path;
    this.speed = definition.speed;
    this.pauseTime = definition.pause;
    this.x = definition.path[0][0];
    this.y = definition.path[0][1];
    const next = definition.path[1];
    this.facing = Math.atan2(next[1] - this.y, next[0] - this.x);
    this.targetIndex = 1;
    this.pauseLeft = 0;
    this.suspicion = 0;
    this.seesPlayer = false;
    this.chaseLeft = 0;
    this.stepTimer = Math.random() * 0.4;
  }

  /** Advance the patrol (or the chase) by dt seconds. Returns 'shout' on the frame suspicion fills. */
  update(dt, player, level, solids, events) {
    let event = null;
    // Vision first: suspicion is what turns a patrol into a chase.
    const seen = visibility(this, player, solids);
    this.seesPlayer = seen > 0;
    if (seen > 0) {
      let rate = 0.55 + seen * 0.85;
      if (!player.creeping) rate *= 1.45; // a courier at full pace is easy to clock
      if (inLamplight(level, player.x, player.y)) rate *= 1.5;
      if (player.creeping) rate *= 0.55; // creeping low and slow buys real time
      this.suspicion = Math.min(1, this.suspicion + rate * dt);
      if (this.suspicion >= 1 && this.chaseLeft <= 0) {
        this.chaseLeft = CHASE_SECONDS;
        this.suspicion = 0.45;
        event = 'shout';
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * 0.38);
    }

    if (this.chaseLeft > 0) {
      this.chaseLeft -= dt;
      const want = Math.atan2(player.y - this.y, player.x - this.x);
      this.facing += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, angleDelta(this.facing, want)));
      this.x += Math.cos(this.facing) * this.speed * 1.65 * dt;
      this.y += Math.sin(this.facing) * this.speed * 1.65 * dt;
      this.resolveCollisions(solids);
      return event;
    }

    if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      // While paused at a waypoint the guard looks along the next leg, turning smoothly.
      const next = this.path[this.targetIndex];
      const want = Math.atan2(next[1] - this.y, next[0] - this.x);
      this.facing += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, angleDelta(this.facing, want)));
      return event;
    }

    const target = this.path[this.targetIndex];
    const dx = target[0] - this.x;
    const dy = target[1] - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      this.targetIndex = (this.targetIndex + 1) % this.path.length;
      this.pauseLeft = this.pauseTime;
      return event;
    }
    const want = Math.atan2(dy, dx);
    this.facing += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, angleDelta(this.facing, want)));
    const step = Math.min(dist, this.speed * dt);
    this.x += Math.cos(this.facing) * step;
    this.y += Math.sin(this.facing) * step;
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.stepTimer = 0.38;
      events.push({ type: 'guardStep', x: this.x, y: this.y });
    }
    return event;
  }

  /** Keep the guard out of solid cover: patrol paths are clear, a chase may not be. */
  resolveCollisions(solids) {
    const r = 13;
    for (const s of solids) {
      const nx = Math.max(s.x, Math.min(this.x, s.x + s.w));
      const ny = Math.max(s.y, Math.min(this.y, s.y + s.h));
      const dx = this.x - nx;
      const dy = this.y - ny;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        const d = Math.sqrt(d2) || 0.001;
        this.x = nx + (dx / d) * r;
        this.y = ny + (dy / d) * r;
      }
    }
  }
}

export { CHASE_SECONDS, SHOUT_ALARM };

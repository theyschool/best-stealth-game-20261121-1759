// MOONSHIFT game state: the courier, the alarm, the intel, and the flow between floors.
// One Game object owns a run — three floors, a running clock, a count of intel folders
// lifted and times spotted. Being caught (a chasing guard lays a hand on the courier, or
// the ALARM meter fills) restarts the current floor; reaching the green door banks the
// floor's intel and moves up. After floor 3 the run ends on a score panel.
import { LEVELS, solidsOf } from './levels.js';
import { Guard, SHOUT_ALARM } from './guards.js';

export const PLAYER_SPEED = 150;
export const CREEP_SPEED = 74;
export const PLAYER_RADIUS = 12;

export class Game {
  constructor(audio) {
    this.audio = audio;
    this.levelIndex = 0;
    this.totalTime = 0;
    this.totalIntel = 0;
    this.timesSpotted = 0;
    this.alarm = 0;
    this.phase = 'play'; // play | caught | clear | done
    this.phaseTimer = 0;
    this.rings = []; // footstep rings, the courier's loud ones and the guards' faint ones
    this.flash = 0; // red edge flash on a shout
    this.loadLevel(0);
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.solids = solidsOf(this.level);
    this.player = {
      x: this.level.playerStart.x,
      y: this.level.playerStart.y,
      creeping: false,
      moving: false,
      facing: 0,
      stepTimer: 0,
    };
    this.guards = this.level.guards.map((definition) => new Guard(definition));
    this.intelTaken = this.level.intel.map(() => false);
    this.levelTime = 0;
    this.phase = 'play';
    this.phaseTimer = 0;
  }

  /** The one-line state the HUD shows: how exposed the courier is right now. */
  exposure() {
    let worst = 0;
    for (const guard of this.guards) worst = Math.max(worst, guard.suspicion);
    if (this.guards.some((g) => g.chaseLeft > 0)) return { label: 'SPOTTED — RUN!', tone: 'danger' };
    if (worst > 0.55) return { label: 'SEEN? — break line of sight!', tone: 'warn' };
    if (worst > 0.05) return { label: 'A glance your way…', tone: 'warn' };
    return { label: 'UNSEEN', tone: 'safe' };
  }

  intelThisLevel() {
    return this.intelTaken.filter(Boolean).length;
  }

  /** Move the courier by (dx, dy) * speed * dt, sliding along solid cover. */
  movePlayer(dx, dy, dt) {
    const p = this.player;
    const speed = p.creeping ? CREEP_SPEED : PLAYER_SPEED;
    p.moving = dx !== 0 || dy !== 0;
    if (!p.moving) return;
    const len = Math.hypot(dx, dy);
    const vx = (dx / len) * speed * dt;
    const vy = (dy / len) * speed * dt;
    p.facing = Math.atan2(dy, dx);
    p.x += vx;
    this.resolveCollisions(p, vx, 0);
    p.y += vy;
    this.resolveCollisions(p, 0, vy);
    // Footsteps: creeping is silent; a full pace sheds a soft ring every third of a second.
    p.stepTimer -= dt;
    if (!p.creeping && p.stepTimer <= 0) {
      p.stepTimer = 0.34;
      this.rings.push({ x: p.x, y: p.y, r: 6, alpha: 0.5, guard: false });
      this.audio.footstep(false);
    }
  }

  resolveCollisions(p, vx, vy) {
    for (const s of this.solids) {
      const nx = Math.max(s.x, Math.min(p.x, s.x + s.w));
      const ny = Math.max(s.y, Math.min(p.y, s.y + s.h));
      const dx = p.x - nx;
      const dy = p.y - ny;
      const d2 = dx * dx + dy * dy;
      if (d2 < PLAYER_RADIUS * PLAYER_RADIUS) {
        if (d2 === 0) {
          p.x -= vx;
          p.y -= vy;
        } else {
          const d = Math.sqrt(d2);
          p.x = nx + (dx / d) * PLAYER_RADIUS;
          p.y = ny + (dy / d) * PLAYER_RADIUS;
        }
      }
    }
  }

  /** Advance the whole game by dt seconds under the given input {dx, dy, creep}. */
  update(dt, input) {
    this.totalTime += dt;
    this.flash = Math.max(0, this.flash - dt * 1.4);
    for (const ring of this.rings) {
      ring.r += dt * 46;
      ring.alpha -= dt * 0.9;
    }
    this.rings = this.rings.filter((ring) => ring.alpha > 0);

    if (this.phase === 'caught' || this.phase === 'clear') {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        if (this.phase === 'caught') {
          this.alarm = 0;
          this.loadLevel(this.levelIndex);
        } else if (this.levelIndex + 1 < LEVELS.length) {
          this.loadLevel(this.levelIndex + 1);
        } else {
          this.phase = 'done';
        }
      }
      return;
    }
    if (this.phase !== 'play') return;

    this.levelTime += dt;
    this.player.creeping = input.creep;
    this.movePlayer(input.dx, input.dy, dt);

    const events = [];
    for (const guard of this.guards) {
      const event = guard.update(dt, this.player, this.level, this.solids, events);
      if (event === 'shout') {
        this.alarm = Math.min(1, this.alarm + SHOUT_ALARM);
        this.timesSpotted += 1;
        this.flash = 1;
        this.audio.alert();
      }
      const dist = Math.hypot(guard.x - this.player.x, guard.y - this.player.y);
      if (guard.chaseLeft > 0 && dist < 22) this.caught('A guard caught you.');
    }
    for (const event of events) {
      if (event.type === 'guardStep') {
        this.rings.push({ x: event.x, y: event.y, r: 5, alpha: 0.3, guard: true });
        this.audio.footstep(true);
      }
    }
    if (this.alarm >= 1) this.caught('The alarm filled — the archive locks down.');

    // Intel folders: walk over a glowing folder to lift it.
    this.level.intel.forEach((folder, i) => {
      if (!this.intelTaken[i] && Math.hypot(folder.x - this.player.x, folder.y - this.player.y) < 24) {
        this.intelTaken[i] = true;
        this.totalIntel += 1;
        this.audio.pickup();
      }
    });

    // The exit door: step into the green doorway to clear the floor.
    const e = this.level.exit;
    if (
      this.player.x > e.x - 6 && this.player.x < e.x + e.w &&
      this.player.y > e.y && this.player.y < e.y + e.h
    ) {
      this.phase = 'clear';
      this.phaseTimer = 1.6;
      this.audio.clear();
    }
  }

  caught(reason) {
    if (this.phase !== 'play') return;
    this.phase = 'caught';
    this.phaseTimer = 1.8;
    this.caughtReason = reason;
    this.audio.caught();
  }

  /** Final score for the end panel: quicker, richer in intel, and less spotted is better. */
  score() {
    return Math.max(0, Math.round(1200 - this.totalTime * 2 + this.totalIntel * 150 - this.timesSpotted * 120));
  }
}

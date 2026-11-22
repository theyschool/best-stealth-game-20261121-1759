// MOONSHIFT rendering: everything is drawn in code on one canvas — the night archive from
// above. Dark blue-grey floors, warm pools of lamplight, shelving and crates with a lighter
// top edge so cover reads at a glance, guards in dark red under soft amber vision cones that
// deepen to orange-red as suspicion fills, a courier in a pale coat carrying a parcel, and
// a HUD with the ALARM meter and the UNSEEN / SEEN? state line.
import { WORLD } from './levels.js';
import { conePolygon } from './guards.js';

const FLOOR_A = '#171d2c';
const FLOOR_B = '#1a2133';
const TILE = 64;

/** Blend two #rrggbb colours, t from 0 (a) to 1 (b). */
function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function drawFloor(ctx, level) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = FLOOR_B;
  for (let y = WORLD.hudHeight; y < WORLD.height; y += TILE) {
    for (let x = 0; x < WORLD.width; x += TILE) {
      if (((x + y) / TILE) % 2 === 0) ctx.fillRect(x, y, TILE, TILE);
    }
  }
  // A worn carpet runner down the middle: the bold, lamplit way through.
  ctx.fillStyle = 'rgba(94, 52, 60, 0.35)';
  ctx.fillRect(0, 372, WORLD.width, 56);
  ctx.fillStyle = 'rgba(214, 178, 106, 0.25)';
  ctx.fillRect(0, 372, WORLD.width, 2);
  ctx.fillRect(0, 426, WORLD.width, 2);
}

function drawLamps(ctx, level, t) {
  for (const lamp of level.lamps) {
    const flicker = 1 + Math.sin(t * 7 + lamp.x) * 0.02;
    const grad = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r * flicker);
    grad.addColorStop(0, 'rgba(255, 196, 110, 0.34)');
    grad.addColorStop(0.6, 'rgba(255, 178, 92, 0.16)');
    grad.addColorStop(1, 'rgba(255, 178, 92, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r * flicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd9a0';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 217, 160, 0.6)';
    ctx.strokeRect(lamp.x - 9, lamp.y - 9, 18, 18);
  }
}

function drawExit(ctx, level, t) {
  const e = level.exit;
  const pulse = 0.65 + Math.sin(t * 3) * 0.2;
  ctx.fillStyle = `rgba(46, 220, 130, ${0.25 * pulse})`;
  ctx.fillRect(e.x - 16, e.y - 10, e.w + 26, e.h + 20);
  ctx.fillStyle = '#123527';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = `rgba(64, 255, 160, ${pulse})`;
  ctx.fillRect(e.x + 6, e.y + 6, e.w - 12, e.h - 12);
  ctx.fillStyle = '#06281a';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 - 2);
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillText('➜', e.x + e.w / 2, e.y + e.h / 2 + 18);
}

function drawIntel(ctx, game, t) {
  game.level.intel.forEach((folder, i) => {
    if (game.intelTaken[i]) return;
    const bob = Math.sin(t * 2.4 + i * 2) * 3;
    ctx.fillStyle = 'rgba(255, 214, 90, 0.22)';
    ctx.beginPath();
    ctx.arc(folder.x, folder.y + bob, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(folder.x - 13, folder.y - 8 + bob, 26, 16);
    ctx.fillStyle = '#c98f1b';
    ctx.fillRect(folder.x - 13, folder.y - 12 + bob, 11, 5);
    ctx.fillStyle = '#5c3d05';
    ctx.font = '700 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('INTEL', folder.x, folder.y + 3 + bob);
  });
}

function drawCover(ctx, level) {
  for (const c of level.cover) {
    if (c.kind === 'shelf') {
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#6d5133'; // lighter top edge: cover reads at a glance
      ctx.fillRect(c.x, c.y, c.w, 6);
      // Book spines along the shelf, running along its long axis.
      const colours = ['#7a4a3a', '#3a5a7a', '#6a7a3a', '#7a6a2e', '#54427a'];
      const vertical = c.h > c.w;
      const start = vertical ? c.y + 12 : c.x + 6;
      const end = vertical ? c.y + c.h - 10 : c.x + c.w - 8;
      let pos = start;
      let k = 0;
      while (pos < end) {
        ctx.fillStyle = colours[k % colours.length];
        const bw = 5 + ((k * 7) % 4);
        if (vertical) ctx.fillRect(c.x + 6, pos, c.w - 12, bw);
        else ctx.fillRect(pos, c.y + 12, bw, c.h - 18);
        pos += bw + 3;
        k += 1;
      }
    } else if (c.kind === 'crate') {
      ctx.fillStyle = '#8a6b3d';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#a8844e';
      ctx.fillRect(c.x, c.y, c.w, 6);
      ctx.strokeStyle = '#5f4725';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
      ctx.beginPath();
      ctx.moveTo(c.x + 3, c.y + 3);
      ctx.lineTo(c.x + c.w - 3, c.y + c.h - 3);
      ctx.moveTo(c.x + c.w - 3, c.y + 3);
      ctx.lineTo(c.x + 3, c.y + c.h - 3);
      ctx.stroke();
    } else if (c.kind === 'planter') {
      ctx.fillStyle = '#5c4632';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#77593d';
      ctx.fillRect(c.x, c.y, c.w, 6);
      ctx.fillStyle = '#3f7a44';
      for (let px = c.x + 10; px < c.x + c.w - 4; px += 15) {
        ctx.beginPath();
        ctx.arc(px, c.y + c.h / 2 + ((px * 13) % 7) - 3, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (c.kind === 'statue') {
      ctx.fillStyle = '#5a6274';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#79839a';
      ctx.fillRect(c.x, c.y, c.w, 6);
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Outer walls and the HUD rail.
  ctx.fillStyle = '#0b0e16';
  ctx.fillRect(0, 0, WORLD.width, WORLD.hudHeight);
  ctx.fillRect(0, 0, WORLD.wall, WORLD.height);
  ctx.fillRect(WORLD.width - WORLD.wall, 0, WORLD.wall, WORLD.height);
  ctx.fillRect(0, WORLD.height - WORLD.wall, WORLD.width, WORLD.wall);
  ctx.fillStyle = 'rgba(150, 170, 210, 0.35)';
  ctx.fillRect(0, WORLD.hudHeight - 2, WORLD.width, 2);
}

function drawCone(ctx, guard, solids) {
  const points = conePolygon(guard, solids);
  const colour = mix('#ffb84d', '#ff3b26', guard.suspicion);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  const grad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, 200);
  grad.addColorStop(0, guard.suspicion > 0.55 ? 'rgba(255, 90, 50, 0.42)' : 'rgba(255, 184, 77, 0.34)');
  grad.addColorStop(1, 'rgba(255, 150, 60, 0.05)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawGuard(ctx, guard) {
  // Facing tick.
  ctx.strokeStyle = '#e8b4a0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * 17, guard.y + Math.sin(guard.facing) * 17);
  ctx.stroke();
  // Dark red uniform body, bright enough to read against the floor.
  ctx.fillStyle = '#a12633';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c93a48';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b0d12';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 4, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion pips above the head: an arc that fills amber, then red.
  if (guard.suspicion > 0.03 || guard.chaseLeft > 0) {
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 22, 9, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();
    ctx.strokeStyle = guard.chaseLeft > 0 ? '#ff3b26' : mix('#ffb84d', '#ff3b26', guard.suspicion);
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 22, 9, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * guard.suspicion);
    ctx.stroke();
  }
  if (guard.chaseLeft > 0) {
    ctx.fillStyle = '#ff5040';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 30);
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  // The parcel, carried on the back.
  ctx.fillStyle = '#b07a3f';
  ctx.fillRect(p.x - 5, p.y - 2, 13, 10);
  ctx.strokeStyle = '#7a5225';
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x - 5, p.y - 2, 13, 10);
  // Pale coat: the brightest figure on the floor.
  ctx.fillStyle = '#e9e4d2';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9bfa4';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff8e2';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.facing) * 14, p.y + Math.sin(p.facing) * 14);
  ctx.stroke();
  if (p.creeping) {
    ctx.strokeStyle = 'rgba(233, 228, 210, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawRings(ctx, game) {
  for (const ring of game.rings) {
    ctx.strokeStyle = ring.guard
      ? `rgba(230, 120, 110, ${ring.alpha})`
      : `rgba(220, 228, 245, ${ring.alpha})`;
    ctx.lineWidth = ring.guard ? 1.5 : 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, game) {
  const state = game.exposure();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2ead2';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText('MOONSHIFT', 24, 40);
  ctx.fillStyle = '#9fb2d8';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(game.level.name, 196, 40);

  // ALARM meter: the heart of the HUD.
  ctx.fillStyle = '#8d99b5';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('ALARM', 470, 26);
  ctx.fillStyle = '#232a3d';
  ctx.fillRect(470, 32, 300, 16);
  ctx.fillStyle = game.alarm > 0.66 ? '#ff3b26' : game.alarm > 0.33 ? '#ff8a3c' : '#ffb84d';
  if (game.alarm > 0) ctx.fillRect(472, 34, 296 * game.alarm, 12);
  ctx.strokeStyle = '#4b5878';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(470, 32, 300, 16);

  // State line, intel and clock.
  ctx.fillStyle = state.tone === 'danger' ? '#ff5040' : state.tone === 'warn' ? '#ffb84d' : '#57e6a3';
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.fillText(state.label, 800, 41);
  ctx.fillStyle = '#f5c542';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`INTEL ${game.totalIntel}`, 1152, 41);
  ctx.fillStyle = '#9fb2d8';
  const secs = Math.floor(game.totalTime);
  ctx.fillText(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 1240, 41);
  ctx.textAlign = 'left';

  // Hint line along the bottom wall.
  ctx.fillStyle = 'rgba(190, 202, 228, 0.85)';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText(`${game.level.hint}  ·  WASD/arrows move · hold SHIFT to creep (silent)`, 24, 776);
}

function drawPanel(ctx, game) {
  if (game.phase === 'play') return;
  ctx.fillStyle = 'rgba(5, 7, 12, 0.62)';
  ctx.fillRect(0, WORLD.hudHeight, WORLD.width, WORLD.height - WORLD.hudHeight);
  ctx.textAlign = 'center';
  if (game.phase === 'caught') {
    ctx.fillStyle = '#ff5040';
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillText('CAUGHT', WORLD.width / 2, 380);
    ctx.fillStyle = '#e8ecf6';
    ctx.font = '600 19px system-ui, sans-serif';
    ctx.fillText(game.caughtReason || 'The archive keeps its secrets tonight.', WORLD.width / 2, 420);
    ctx.fillText('The floor restarts — the alarm resets.', WORLD.width / 2, 450);
  } else if (game.phase === 'clear') {
    ctx.fillStyle = '#57e6a3';
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillText('FLOOR CLEAR', WORLD.width / 2, 380);
    ctx.fillStyle = '#e8ecf6';
    ctx.font = '600 19px system-ui, sans-serif';
    ctx.fillText(`Intel lifted on this floor: ${game.intelThisLevel()} of 3 — up the stairs…`, WORLD.width / 2, 420);
  } else if (game.phase === 'done') {
    ctx.fillStyle = '#f2ead2';
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillText('DELIVERED UNSEEN', WORLD.width / 2, 330);
    ctx.fillStyle = '#e8ecf6';
    ctx.font = '600 20px system-ui, sans-serif';
    const secs = Math.floor(game.totalTime);
    ctx.fillText(`Time ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}   ·   Intel ${game.totalIntel} of 9   ·   Spotted ${game.timesSpotted} times`, WORLD.width / 2, 385);
    ctx.fillStyle = '#f5c542';
    ctx.font = '900 30px system-ui, sans-serif';
    ctx.fillText(`SCORE ${game.score()}`, WORLD.width / 2, 435);
    ctx.fillStyle = '#9fb2d8';
    ctx.font = '600 17px system-ui, sans-serif';
    ctx.fillText('Press R to run the archive again.', WORLD.width / 2, 480);
  }
  ctx.textAlign = 'left';
}

/** Draw the whole game. `t` is a clock in seconds used only for gentle pulses and flicker. */
export function render(ctx, game, t) {
  drawFloor(ctx, game.level);
  drawLamps(ctx, game.level, t);
  drawExit(ctx, game.level, t);
  drawIntel(ctx, game, t);
  for (const guard of game.guards) drawCone(ctx, guard, game.solids);
  drawCover(ctx, game.level);
  drawRings(ctx, game);
  for (const guard of game.guards) drawGuard(ctx, guard);
  if (game.phase !== 'done') drawPlayer(ctx, game);
  if (game.flash > 0) {
    ctx.strokeStyle = `rgba(255, 45, 30, ${game.flash * 0.8})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, WORLD.hudHeight + 5, WORLD.width - 10, WORLD.height - WORLD.hudHeight - 10);
  }
  drawHud(ctx, game);
  drawPanel(ctx, game);
}

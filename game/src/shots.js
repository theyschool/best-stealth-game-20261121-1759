// MOONSHIFT screenshot scenes behind ?shot=cover|nearmiss|intel|exit&level=n&alarm=x.
// Each scene loads the real level, then poses the courier and the guards mid-play — real
// positions, real cones, real suspicion values — and freezes the frame, so a screenshot is
// the game itself caught in a genuine moment: hiding at a shelf edge as a cone sweeps past,
// a near miss with the alarm half full, a creep toward an intel folder on the dark route,
// and the crossed cones at the last exit. Normal play without parameters never calls this.

/** Place a guard at a point on its patrol with an exact facing and suspicion. */
function poseGuard(guard, x, y, facing, suspicion) {
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.suspicion = suspicion;
  guard.pauseLeft = 2;
}

/** Freeze `game` into the named posed scene. Returns true when a shot was requested. */
export function applyShot(game, params) {
  const name = params.get('shot');
  if (!name) return false;
  const levelParam = Number(params.get('level') ?? '1');
  const levelIndex = Math.min(2, Math.max(0, (Number.isFinite(levelParam) ? levelParam : 1) - 1));
  game.loadLevel(levelIndex);
  game.alarm = Math.min(1, Math.max(0, Number(params.get('alarm') ?? '0') || 0));
  game.totalTime = 47;

  if (name === 'nearmiss') {
    // Level 1, south shelves: the courier stands tall at the cover edge, caught in the
    // edge of a cone — suspicion nearly full, ALARM at 55%, a shout a breath away.
    game.loadLevel(0);
    const p = game.player;
    game.alarm = 0.55;
    p.x = 600; p.y = 452; p.facing = -0.4; p.creeping = false;
    poseGuard(game.guards[0], 902, 200, Math.PI, 0.05);
    poseGuard(game.guards[1], 428, 428, 0.12, 0.88);
    game.flash = 0.35;
    game.rings.push({ x: 470, y: 430, r: 26, alpha: 0.3, guard: true });
  } else if (name === 'intel') {
    // Level 2, the dark route: creeping low between the stacks toward a glowing folder,
    // one guard's cone far off down the lamplit row.
    game.loadLevel(1);
    const p = game.player;
    game.alarm = 0.15;
    game.totalIntel = 2;
    p.x = 246; p.y = 692; p.facing = -0.8; p.creeping = true;
    poseGuard(game.guards[0], 402, 122, 0, 0);
    poseGuard(game.guards[1], 720, 662, Math.PI, 0.1);
    poseGuard(game.guards[2], 1052, 402, -Math.PI / 2, 0);
    game.rings.push({ x: 700, y: 662, r: 30, alpha: 0.28, guard: true });
  } else if (name === 'exit') {
    // Level 3, the vault door: two cones cross in front of the glowing exit while the
    // courier waits in the dark beside the last shelf, unseen and a dash away.
    game.loadLevel(2);
    const p = game.player;
    game.alarm = 0.3;
    game.totalIntel = 5;
    p.x = 1086; p.y = 428; p.facing = 0.15; p.creeping = true;
    poseGuard(game.guards[0], 880, 224, 0.5, 0);
    poseGuard(game.guards[1], 1120, 246, 1.95, 0.12);
    poseGuard(game.guards[2], 500, 702, 0, 0);
    poseGuard(game.guards[3], 622, 380, -0.7, 0);
  } else {
    // 'cover' (and any other name): level 1, tucked behind the reading-room shelves as a
    // cone sweeps along the shelf line and washes past the courier's hiding place.
    game.loadLevel(0);
    const p = game.player;
    game.alarm = Number(params.get('alarm') ?? '0.1') || 0.1;
    p.x = 445; p.y = 388; p.facing = -1.2; p.creeping = true;
    poseGuard(game.guards[0], 610, 262, 2.85, 0.3);
    poseGuard(game.guards[1], 800, 452, 0, 0);
    game.rings.push({ x: 566, y: 300, r: 24, alpha: 0.3, guard: true });
    game.rings.push({ x: 776, y: 452, r: 34, alpha: 0.24, guard: true });
  }
  return true;
}

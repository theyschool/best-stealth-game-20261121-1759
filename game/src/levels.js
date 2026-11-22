// MOONSHIFT level layouts: the three floors of the night archive, described as plain data.
// Every level offers two ways through — a bold route across the lamplit floor, quick but easy
// to spot on, and a slow dark route threading behind the shelving. Cover blocks are solid:
// they stop the courier, stop the guards, and stop a guard's line of sight. Lamps are pools
// of warm light where a moving courier is noticed faster. Coordinates are canvas pixels on a
// 1280x800 floor; the top 64 pixels are the HUD band, fenced off by the archive's rail.

export const WORLD = { width: 1280, height: 800, hudHeight: 64, wall: 16 };

/** The solid rectangles of a level: its cover plus the outer walls and the HUD rail. */
export function solidsOf(level) {
  const w = WORLD.wall;
  const walls = [
    { x: 0, y: 0, w: WORLD.width, h: WORLD.hudHeight, kind: 'wall' },
    { x: 0, y: 0, w, h: WORLD.height, kind: 'wall' },
    { x: WORLD.width - w, y: 0, w, h: WORLD.height, kind: 'wall' },
    { x: 0, y: WORLD.height - w, w: WORLD.width, h: w, kind: 'wall' },
  ];
  return walls.concat(level.cover);
}

/** True when the point (x, y) stands inside any lamp's pool of light on this level. */
export function inLamplight(level, x, y) {
  for (const lamp of level.lamps) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy < lamp.r * lamp.r) return true;
  }
  return false;
}

export const LEVELS = [
  {
    name: 'Floor 1 · The Reading Room',
    hint: 'Cross to the green door. Shelves block sight — stay behind them when a cone sweeps by.',
    playerStart: { x: 92, y: 692 },
    exit: { x: 1196, y: 108, w: 68, h: 98 },
    lamps: [
      { x: 330, y: 262, r: 118 },
      { x: 772, y: 412, r: 132 },
      { x: 1062, y: 190, r: 102 },
    ],
    cover: [
      { x: 180, y: 180, w: 300, h: 36, kind: 'shelf' },
      { x: 180, y: 330, w: 300, h: 36, kind: 'shelf' },
      { x: 620, y: 180, w: 300, h: 36, kind: 'shelf' },
      { x: 620, y: 480, w: 300, h: 36, kind: 'shelf' },
      { x: 520, y: 300, w: 44, h: 44, kind: 'crate' },
      { x: 980, y: 300, w: 96, h: 40, kind: 'planter' },
      { x: 700, y: 330, w: 40, h: 40, kind: 'statue' },
      { x: 180, y: 520, w: 120, h: 36, kind: 'planter' },
      { x: 980, y: 520, w: 180, h: 36, kind: 'shelf' },
    ],
    guards: [
      { path: [[300, 138], [902, 138], [902, 252], [300, 252]], speed: 56, pause: 1.1 },
      { path: [[1052, 622], [402, 622], [402, 452], [1052, 452]], speed: 50, pause: 1.4 },
    ],
    intel: [
      { x: 205, y: 432 },
      { x: 762, y: 566 },
      { x: 1122, y: 238 },
    ],
  },
  {
    name: 'Floor 2 · The Stacks',
    hint: 'Three guards walk the stacks. The dark gaps between shelves are slow, but safe.',
    playerStart: { x: 84, y: 700 },
    exit: { x: 1196, y: 108, w: 68, h: 98 },
    lamps: [
      { x: 382, y: 432, r: 118 },
      { x: 812, y: 272, r: 118 },
      { x: 152, y: 142, r: 98 },
    ],
    cover: [
      { x: 260, y: 140, w: 36, h: 220, kind: 'shelf' },
      { x: 480, y: 300, w: 36, h: 220, kind: 'shelf' },
      { x: 700, y: 140, w: 36, h: 220, kind: 'shelf' },
      { x: 920, y: 300, w: 36, h: 220, kind: 'shelf' },
      { x: 150, y: 560, w: 260, h: 36, kind: 'shelf' },
      { x: 560, y: 600, w: 260, h: 36, kind: 'shelf' },
      { x: 380, y: 180, w: 44, h: 44, kind: 'crate' },
      { x: 830, y: 520, w: 44, h: 44, kind: 'crate' },
      { x: 1080, y: 160, w: 110, h: 36, kind: 'planter' },
      { x: 620, y: 430, w: 40, h: 40, kind: 'statue' },
    ],
    guards: [
      { path: [[200, 242], [622, 242], [622, 122], [200, 122]], speed: 54, pause: 1.0 },
      { path: [[1102, 422], [562, 422], [562, 662], [1102, 662]], speed: 52, pause: 1.2 },
      { path: [[1052, 702], [1052, 242], [882, 242], [882, 702]], speed: 47, pause: 0.9 },
    ],
    intel: [
      { x: 292, y: 646 },
      { x: 642, y: 182 },
      { x: 1150, y: 566 },
    ],
  },
  {
    name: 'Floor 3 · The Vault Gallery',
    hint: 'Four guards, and their cones cross at the vault door. Patience opens the last gap.',
    playerStart: { x: 84, y: 402 },
    exit: { x: 1196, y: 342, w: 68, h: 98 },
    lamps: [
      { x: 292, y: 302, r: 124 },
      { x: 882, y: 302, r: 124 },
      { x: 642, y: 122, r: 104 },
      { x: 152, y: 682, r: 98 },
    ],
    cover: [
      { x: 170, y: 170, w: 240, h: 36, kind: 'shelf' },
      { x: 170, y: 420, w: 240, h: 36, kind: 'shelf' },
      { x: 520, y: 260, w: 36, h: 240, kind: 'shelf' },
      { x: 760, y: 170, w: 240, h: 36, kind: 'shelf' },
      { x: 760, y: 470, w: 240, h: 36, kind: 'shelf' },
      { x: 1060, y: 300, w: 36, h: 200, kind: 'shelf' },
      { x: 460, y: 140, w: 44, h: 44, kind: 'crate' },
      { x: 640, y: 560, w: 44, h: 44, kind: 'crate' },
      { x: 360, y: 600, w: 40, h: 40, kind: 'statue' },
      { x: 900, y: 330, w: 40, h: 40, kind: 'statue' },
      { x: 520, y: 640, w: 180, h: 36, kind: 'planter' },
    ],
    guards: [
      { path: [[242, 112], [702, 112], [702, 224], [242, 224]], speed: 55, pause: 1.0 },
      { path: [[1150, 182], [1150, 562], [982, 562], [982, 182]], speed: 53, pause: 1.1 },
      { path: [[302, 702], [902, 702], [902, 582], [302, 582]], speed: 51, pause: 1.3 },
      { path: [[622, 472], [622, 302], [432, 302], [432, 472]], speed: 46, pause: 0.8 },
    ],
    intel: [
      { x: 202, y: 542 },
      { x: 702, y: 382 },
      { x: 1122, y: 662 },
    ],
  },
];

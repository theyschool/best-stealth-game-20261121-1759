// MOONSHIFT boot: canvas, keyboard, and the frame loop. The game auto-starts straight
// into floor 1 — no title screen in the way. WASD and arrow keys move, Shift creeps
// (slower, silent, harder to spot), R restarts after a finished run. With a ?shot=
// parameter the loop renders one frozen posed scene instead of playing, which is how
// the screenshots in screenshots/ were taken; without it, this is the whole game.
import { Game } from './game.js';
import { AudioKit } from './audio.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const audio = new AudioKit();
const game = new Game(audio);
const frozen = applyShot(game, new URLSearchParams(window.location.search));

const keys = new Set();
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  audio.unlock();
  keys.add(event.key.toLowerCase());
  if (event.key.toLowerCase() === 'r' && game.phase === 'done') {
    game.totalTime = 0;
    game.totalIntel = 0;
    game.timesSpotted = 0;
    game.alarm = 0;
    game.loadLevel(0);
  }
});
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

function readInput() {
  let dx = 0;
  let dy = 0;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  return { dx, dy, creep: keys.has('shift') };
}

let last = performance.now();
let lastStatus = '';
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (frozen) {
    render(ctx, game, 2.2);
  } else {
    game.update(dt, readInput());
    render(ctx, game, now / 1000);
    const label = `${game.level.name} — ${game.exposure().label} — alarm ${Math.round(game.alarm * 100)} percent`;
    if (label !== lastStatus) {
      lastStatus = label;
      status.textContent = label;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

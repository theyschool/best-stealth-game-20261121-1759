// MOONSHIFT sound: a tiny WebAudio kit with no audio files — soft footstep ticks (the
// courier's, and fainter lower ones for the guards, so an approach can be heard before it
// is seen), a two-note alert sting when a guard shouts, a bright blip for intel, a low
// thud for being caught, and a small rising arpeggio on clearing a floor. Sound starts on
// the first key press, as browsers require a gesture before any audio may play.

export class AudioKit {
  constructor() {
    this.context = null;
    this.lastGuardStep = 0;
  }

  /** Create/resume the context from a user gesture (the first key press). Until then the
      game stays silent, so no autoplay warning ever reaches the console. */
  unlock() {
    if (this.context === null) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) this.context = new Ctor();
    }
    if (this.context && this.context.state === 'suspended') this.context.resume();
    return this.context;
  }

  /** The live context, or null before the first gesture: sounds simply do not play yet. */
  ensure() {
    return this.context;
  }

  /** One short enveloped tone. */
  tone(freq, seconds, type, gain, when = 0, slideTo = null) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t + seconds);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  /** A filtered noise tap for footsteps: soft for the courier, lower and quieter for guards. */
  footstep(isGuard) {
    const ctx = this.ensure();
    if (!ctx) return;
    if (isGuard) {
      // Guard steps are felt more than heard: throttle them and keep them faint.
      const now = performance.now();
      if (now - this.lastGuardStep < 240) return;
      this.lastGuardStep = now;
      this.tone(82, 0.07, 'sine', 0.05);
    } else {
      this.tone(140, 0.05, 'sine', 0.035);
    }
  }

  alert() {
    this.tone(392, 0.14, 'square', 0.06);
    this.tone(587, 0.2, 'square', 0.06, 0.1);
  }

  pickup() {
    this.tone(880, 0.09, 'triangle', 0.07, 0, 1320);
  }

  caught() {
    this.tone(196, 0.4, 'sawtooth', 0.08, 0, 65);
  }

  clear() {
    this.tone(523, 0.12, 'triangle', 0.07);
    this.tone(659, 0.12, 'triangle', 0.07, 0.1);
    this.tone(784, 0.22, 'triangle', 0.07, 0.2);
  }
}

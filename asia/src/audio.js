// A small procedural soundscape. No network audio, and nothing plays until asked.
export class GardenAudio {
  constructor() { this.context = null; this.enabled = false; this.birdTimer = null; }
  async toggle() {
    if (!this.context) this.create();
    await this.context.resume();
    this.enabled = !this.enabled;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.enabled ? .28 : 0, now, .45);
    if (this.enabled) this.scheduleBird();
    else clearTimeout(this.birdTimer);
    return this.enabled;
  }
  create() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Web Audio is not supported in this browser.');
    const ctx = this.context = new AudioContext();
    this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate), data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) { last = (last + Math.random() * .035 - .0175) / 1.014; data[i] = last * 5; }
    const noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
    const lowpass = ctx.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 850;
    const water = ctx.createGain(); water.gain.value = .60; noise.connect(lowpass); lowpass.connect(water); water.connect(this.master); noise.start();
    const lfo = ctx.createOscillator(), amount = ctx.createGain(); lfo.frequency.value = .17; amount.gain.value = .10; lfo.connect(amount); amount.connect(water.gain); lfo.start();
  }
  scheduleBird() {
    clearTimeout(this.birdTimer);
    this.birdTimer = setTimeout(() => {
      if (!this.enabled) return;
      const ctx = this.context, time = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const oscillator = ctx.createOscillator(), gain = ctx.createGain();
        const start = time + i * .19, frequency = 2400 + Math.random() * 650;
        oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, start); oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.32, start + .045); oscillator.frequency.exponentialRampToValueAtTime(frequency * .85, start + .13);
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.028, start + .02); gain.gain.exponentialRampToValueAtTime(.0001, start + .15);
        oscillator.connect(gain); gain.connect(this.master); oscillator.start(start); oscillator.stop(start + .17);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }
      this.scheduleBird();
    }, 4000 + Math.random() * 7500);
  }
  suspend() { if (this.context?.state === 'running') this.context.suspend(); }
  resume() { if (this.enabled) this.context?.resume(); }
}

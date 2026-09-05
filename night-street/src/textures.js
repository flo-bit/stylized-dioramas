import * as THREE from 'three';

export function rng(seed = 27) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const random = rng(917);
export const between = (a, b) => a + random() * (b - a);

export function canvasTexture(w, h, paint, color = true) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  paint(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function noise(ctx, w, h, base, amount, seed) {
  const r = rng(seed), data = ctx.createImageData(w, h);
  for (let i = 0; i < data.data.length; i += 4) {
    const n = (r() - .5) * amount;
    data.data[i] = base[0] + n; data.data[i + 1] = base[1] + n; data.data[i + 2] = base[2] + n; data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
}

export function plasterTexture(base, seed = 3) {
  const r = rng(seed);
  return canvasTexture(768, 1024, (ctx, w, h) => {
    noise(ctx, w, h, base, 18, seed);
    // Broad, painterly variations in the plaster rather than uniform noise.
    for (let i = 0; i < 950; i++) {
      const x = r() * w, y = r() * h, s = 5 + r() * 95;
      ctx.fillStyle = r() > .45 ? `rgba(12,23,30,${r() * .075})` : `rgba(184,188,170,${r() * .06})`;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) ctx.lineTo(x + Math.cos(j * Math.PI / 3) * s * (.4 + r() * .6), y + Math.sin(j * Math.PI / 3) * s * (.3 + r() * .7));
      ctx.fill();
    }
    // Uneven masonry seams, interrupted by old repairs.
    for (let y = 98; y < h; y += 110 + r() * 60) {
      ctx.strokeStyle = 'rgba(18,25,28,.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 22) ctx.lineTo(x, y + (r() - .5) * 7);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200,196,174,.12)'; ctx.lineWidth = 2; ctx.translate(0, 3); ctx.stroke(); ctx.translate(0, -3);
      for (let x = r() * 170; x < w; x += 130 + r() * 190) {
        ctx.strokeStyle = 'rgba(20,29,30,.32)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y - 32); ctx.lineTo(x - 2, y - 68); ctx.lineTo(x + 3, y - 118); ctx.stroke();
      }
    }
    for (let i = 0; i < 80; i++) {
      const x = r() * w, y = r() * h, height = 20 + r() * 200;
      const g = ctx.createLinearGradient(0, y, 0, y + height); g.addColorStop(0, 'rgba(9,19,23,.16)'); g.addColorStop(1, 'rgba(9,19,23,0)');
      ctx.fillStyle = g; ctx.fillRect(x, y, 1 + r() * 7, height);
    }
    for (let i = 0; i < 250; i++) {
      const x = r() * w, y = r() * h;
      ctx.fillStyle = 'rgba(190,188,166,.2)'; ctx.fillRect(x, y, 3 + r() * 10, 1 + r() * 3);
      ctx.fillStyle = 'rgba(8,15,19,.25)'; ctx.fillRect(x, y + 3, 2 + r() * 6, 2);
    }
    const g = ctx.createLinearGradient(0, h * .7, 0, h); g.addColorStop(0, 'transparent'); g.addColorStop(1, '#16251f80'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

export function asphaltTexture() {
  const r = rng(96);
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    noise(ctx, w, h, [73, 83, 91], 25, 14);
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = r() > .45 ? `rgba(12,22,31,${r() * .2})` : `rgba(133,145,150,${r() * .13})`;
      ctx.beginPath(); ctx.ellipse(r() * w, r() * h, r() * 60 + 2, r() * 25 + 2, r() * 6, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 70; i++) {
      let x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 8; j++) { x += (r() - .3) * 40; y += (r() - .5) * 55; ctx.lineTo(x, y); }
      ctx.strokeStyle = '#121d2480'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.translate(1.5, 2); ctx.strokeStyle = '#83918b35'; ctx.lineWidth = 1; ctx.stroke(); ctx.translate(-1.5, -2);
    }
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = r() > .4 ? '#cad0c522' : '#080f1533'; ctx.fillRect(r() * w, r() * h, r() * 2 + .5, r() * 2 + .5); }
  });
}

export function puddleTexture() {
  const r = rng(129);
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 65; i++) {
      const x = r() * w, y = r() * h, sx = 25 + r() * 90, sy = 15 + r() * 52;
      ctx.beginPath();
      for (let j = 0; j <= 30; j++) { const a = j / 30 * Math.PI * 2, f = .73 + r() * .27; ctx.lineTo(x + Math.cos(a) * sx * f, y + Math.sin(a) * sy * f); }
      ctx.closePath(); ctx.fillStyle = `rgb(${170 + r() * 80},${170 + r() * 80},${170 + r() * 80})`; ctx.shadowColor = '#bbbbbb'; ctx.shadowBlur = 8; ctx.fill();
    }
    ctx.shadowBlur = 0;
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = '#00000020'; ctx.fillRect(r() * w, r() * h, 1 + r() * 12, 1 + r() * 4); }
  }, false);
}

export function textTexture(text, { w = 256, h = 512, color = '#fff', bg, vertical = false, fontSize = 80, family = '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif', weight = '600' } = {}) {
  return canvasTexture(w, h, (ctx) => {
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = color; ctx.font = `${weight} ${fontSize}px ${family}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (vertical) { const chars = [...text], spacing = h / (chars.length + .65); chars.forEach((c, i) => ctx.fillText(c, w / 2, spacing * (i + .82))); }
    else ctx.fillText(text, w / 2, h / 2);
  });
}

export function posterTexture(kind) {
  return canvasTexture(256, 384, (ctx, w, h) => {
    ctx.fillStyle = kind === 'mountain' ? '#262b52' : '#d5c6a0'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = kind === 'mountain' ? '#7284a0' : '#645949'; ctx.lineWidth = 7; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.textAlign = 'center';
    if (kind === 'mountain') {
      ctx.fillStyle = '#c6cad5'; ctx.font = 'bold 65px sans-serif'; ctx.fillText('未来', 128, 90);
      ctx.fillStyle = '#dbae7d'; ctx.beginPath(); ctx.arc(154, 173, 41, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#886787'; ctx.beginPath(); ctx.moveTo(9, 302); ctx.lineTo(104, 164); ctx.lineTo(247, 305); ctx.fill();
      ctx.fillStyle = '#515578'; ctx.beginPath(); ctx.moveTo(12, 305); ctx.lineTo(154, 215); ctx.lineTo(247, 291); ctx.lineTo(247, 350); ctx.lineTo(12, 350); ctx.fill();
      ctx.fillStyle = '#bbc4ce'; ctx.font = '13px sans-serif'; ctx.fillText('A PLACE BEYOND THE CITY', 128, 333); ctx.font = '10px sans-serif'; ctx.fillText('夜行列車   •   1986', 128, 359);
    } else {
      ctx.fillStyle = '#aa443c'; ctx.font = 'bold 98px sans-serif'; ctx.fillText('24', 128, 140); ctx.font = 'bold 42px sans-serif'; ctx.fillText('時間', 128, 204); ctx.fillStyle = '#605e4f'; ctx.font = '19px sans-serif'; ctx.fillText('年中無休', 128, 274); ctx.font = '13px sans-serif'; ctx.fillText('HOT NOODLES · COLD BEER', 128, 323);
    }
    const r = rng(37);
    for (let i = 0; i < 3500; i++) { ctx.fillStyle = r() > .5 ? '#ddddbb12' : '#100e181c'; ctx.fillRect(r() * w, r() * h, 1 + r() * 5, 1 + r() * 3); }
  });
}

export function graffitiTexture() {
  return canvasTexture(512, 320, (ctx) => {
    ctx.save(); ctx.translate(40, 245); ctx.rotate(-.12); ctx.font = 'italic 900 142px sans-serif'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#4b695280'; ctx.lineWidth = 12; ctx.strokeText('夜猫', 0, 0); ctx.strokeStyle = '#8b519997'; ctx.lineWidth = 4; ctx.strokeText('夜猫', -9, -12);
    ctx.beginPath(); ctx.moveTo(5, 17); ctx.bezierCurveTo(240, 43, 340, -60, 352, -21); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 8; i++) { ctx.fillStyle = '#80539070'; ctx.fillRect(70 + i * 44, 224, 2, 10 + random() * 28); }
  });
}

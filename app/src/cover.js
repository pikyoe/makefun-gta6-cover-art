// Vice Cover Studio — cover renderer.
//
// Everything on the poster is painted here with the 2D canvas API: the photo
// panels for each layout, the colour grade wash, the big gradient title, the
// glowing subtitle, the five-star heat meter, the badge ribbon, film grain
// and the vignette. No image assets, no web fonts, no Rockstar material —
// the lettering is system fonts and every shape is drawn from scratch.

const GUTTER = 0.008; // gap between panels, as a fraction of cover width

// ---------------------------------------------------------------- layouts
// Every layout returns an array of panel rects in cover pixels. A panel may
// carry `rot` (degrees, for the tilted snapshots) or `poly` (a polygon,
// for the diagonal split). `titleCell` on the array marks the centre cell
// of the nine-panel grid, which holds the title instead of a photo.
export function panelsFor(layout, W, H) {
  const g = Math.max(4, W * GUTTER);
  const out = [];
  const box = (x, y, w, h, rot = 0) => ({ x, y, w, h, rot });
  switch (layout) {
    case 'poster': {
      // The classic: one hero, two vignettes on the right, two along the foot.
      out.push(box(g, g, W * 0.62 - g * 1.5, H * 0.7 - g * 1.5));
      out.push(box(W * 0.62 + g * 0.5, g, W * 0.38 - g * 1.5, H * 0.35 - g * 1.5));
      out.push(box(W * 0.62 + g * 0.5, H * 0.35 + g * 0.5, W * 0.38 - g * 1.5, H * 0.35 - g * 1.5));
      out.push(box(g, H * 0.7 + g * 0.5, W * 0.5 - g * 1.5, H * 0.3 - g * 1.5));
      out.push(box(W * 0.5 + g * 0.5, H * 0.7 + g * 0.5, W * 0.5 - g * 1.5, H * 0.3 - g * 1.5));
      break;
    }
    case 'hero3': {
      // One tall hero on the left, three stories stacked on the right.
      out.push(box(g, g, W * 0.6 - g * 1.5, H - g * 2));
      for (let i = 0; i < 3; i++) {
        out.push(box(W * 0.6 + g * 0.5, g + (i * H) / 3, W * 0.4 - g * 1.5, H / 3 - g * 1.5));
      }
      break;
    }
    case 'grid9': {
      // Three-by-three; the middle cell becomes the title block.
      const cw = W / 3;
      const ch = H / 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue;
          out.push(box(c * cw + g, r * ch + g, cw - g * 2, ch - g * 2));
        }
      }
      out.titleCell = { x: cw + g, y: ch + g, w: cw - g * 2, h: ch - g * 2 };
      break;
    }
    case 'split': {
      // Two panels meeting on a slanted seam, title riding the seam.
      out.push({ poly: [[0, 0], [W, 0], [W, H * 0.42], [0, H * 0.58]], x: 0, y: 0, w: W, h: H * 0.58, rot: 0 });
      out.push({ poly: [[0, H * 0.58], [W, H * 0.42], [W, H], [0, H]], x: 0, y: H * 0.42, w: W, h: H * 0.58, rot: 0 });
      break;
    }
    case 'tilt': {
      // Loose snapshots scattered over a painted sunset sky.
      out.push(box(W * 0.06, H * 0.3, W * 0.52, H * 0.44, -4));
      out.push(box(W * 0.5, H * 0.24, W * 0.44, H * 0.4, 5));
      out.push(box(W * 0.28, H * 0.58, W * 0.46, H * 0.36, -2));
      break;
    }
    default: {
      // Triple strip: three tall panels side by side.
      for (let i = 0; i < 3; i++) {
        out.push(box(g + (i * W) / 3, g, W / 3 - g * 1.5, H - g * 2));
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------ grades
// Each grade is a canvas filter applied to the photos plus the tints washed
// over the cover and the three-stop gradient used for the title lettering.
export const GRADES = {
  sunset: {
    label: 'Sunset', filter: 'saturate(1.3) contrast(1.08) brightness(1.03)',
    top: 'rgba(255,170,60,0.10)', bottom: 'rgba(255,45,120,0.34)',
    wash: 'rgba(255,110,40,0.10)', accent: '#ff5e8a', title: ['#ffffff', '#ffd166', '#ff5e8a'],
  },
  neon: {
    label: 'Neon Night', filter: 'saturate(1.45) contrast(1.12) brightness(0.98)',
    top: 'rgba(0,220,255,0.16)', bottom: 'rgba(255,0,150,0.36)',
    wash: 'rgba(120,40,255,0.12)', accent: '#4de8ff', title: ['#ffffff', '#7df9ff', '#ff4fd8'],
  },
  golden: {
    label: 'Golden Hour', filter: 'saturate(1.25) contrast(1.05) brightness(1.08)',
    top: 'rgba(255,200,90,0.16)', bottom: 'rgba(255,120,20,0.30)',
    wash: 'rgba(255,180,60,0.12)', accent: '#ffc93c', title: ['#fffbe8', '#ffd166', '#ff8a3d'],
  },
  vice: {
    label: 'Vice Pink', filter: 'saturate(1.4) contrast(1.1) brightness(1.0)',
    top: 'rgba(255,120,220,0.14)', bottom: 'rgba(150,40,255,0.36)',
    wash: 'rgba(255,80,200,0.10)', accent: '#ff9de2', title: ['#ffffff', '#ff9de2', '#b967ff'],
  },
  noir: {
    label: 'Noir', filter: 'grayscale(0.85) contrast(1.18) brightness(1.02)',
    top: 'rgba(200,200,220,0.06)', bottom: 'rgba(255,60,140,0.22)',
    wash: 'rgba(120,120,140,0.08)', accent: '#ff5e8a', title: ['#ffffff', '#e8e8f0', '#ff5e8a'],
  },
};

export const LAYOUTS = [
  ['poster', 'Poster'],
  ['hero3', 'Hero + 3'],
  ['grid9', 'Nine Panel'],
  ['split', 'Vice Split'],
  ['tilt', 'Snapshots'],
  ['strip', 'Triple Strip'],
];

export const SIZES = [
  ['1080x1080', 'Square', 1080, 1080],
  ['1080x1350', 'Portrait', 1080, 1350],
  ['1920x1080', 'Wide', 1920, 1080],
];

// ------------------------------------------------------------ small helpers
let noiseTile = null;
function grainTile(ctx) {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const pixels = tctx.createImageData(140, 140);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const v = Math.random() * 255;
    pixels.data[i] = v;
    pixels.data[i + 1] = v;
    pixels.data[i + 2] = v;
    pixels.data[i + 3] = Math.random() * 90;
  }
  tctx.putImageData(pixels, 0, 0);
  noiseTile = ctx.createPattern(tile, 'repeat');
  return noiseTile;
}

function roundedPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// Traces a panel's outline on the current context (no fill, no stroke).
function tracePanel(ctx, panel) {
  ctx.beginPath();
  if (panel.poly) {
    ctx.moveTo(panel.poly[0][0], panel.poly[0][1]);
    for (let i = 1; i < panel.poly.length; i++) ctx.lineTo(panel.poly[i][0], panel.poly[i][1]);
    ctx.closePath();
  } else if (panel.rot) {
    const cx = panel.x + panel.w / 2;
    const cy = panel.y + panel.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.rect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
  } else {
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
  }
}

// ------------------------------------------------------------- panel photos
function paintPanel(ctx, panel, img, grade, transform) {
  const t = transform || { zoom: 1, ox: 0, oy: 0 };
  const pw = panel.w;
  const ph = panel.h;
  ctx.save();
  tracePanel(ctx, panel);
  ctx.clip();
  if (img) {
    ctx.filter = grade.filter;
    // Cover-fit the photo, then apply the user's zoom and pan.
    const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * t.zoom;
    const dw = img.naturalWidth * base;
    const dh = img.naturalHeight * base;
    if (panel.rot) {
      // Inside a rotated clip the origin is the panel centre.
      ctx.drawImage(img, -dw / 2 + t.ox * pw, -dh / 2 + t.oy * ph, dw, dh);
    } else {
      const cx = panel.x + pw / 2 + t.ox * pw;
      const cy = panel.y + ph / 2 + t.oy * ph;
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    }
    ctx.filter = 'none';
  } else {
    // No photo yet: a painted mini-sunset so the cover never looks empty.
    const sky = panel.rot
      ? ctx.createLinearGradient(0, -ph / 2, 0, ph / 2)
      : ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + ph);
    sky.addColorStop(0, '#ff9a3d');
    sky.addColorStop(0.55, '#ff4f7a');
    sky.addColorStop(1, '#5b2a86');
    ctx.fillStyle = sky;
    const sunX = panel.rot ? 0 : panel.x + pw / 2;
    const sunY = panel.rot ? -ph * 0.08 : panel.y + ph * 0.42;
    const labelY = panel.rot ? ph * 0.28 : panel.y + ph * 0.78;
    if (panel.rot) ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    else ctx.fillRect(panel.x, panel.y, pw, ph);
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.min(pw, ph) * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `bold ${Math.max(14, pw * 0.045)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR PHOTO', panel.rot ? 0 : panel.x + pw / 2, labelY);
  }
  ctx.restore();
  // White poster keyline around the panel.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = Math.max(2, panel.w * 0.006);
  tracePanel(ctx, panel);
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------ painted skies
function paintPalm(ctx, x, y, s) {
  ctx.save();
  ctx.strokeStyle = '#1c0630';
  ctx.fillStyle = '#1c0630';
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.6, x + s * 0.22, y - s * 0.95);
  ctx.stroke();
  const tx = x + s * 0.22;
  const ty = y - s * 0.95;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 6 - (i * Math.PI) / 7;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * s * 0.4, ty + Math.sin(a) * s * 0.25 - s * 0.12,
      tx + Math.cos(a) * s * 0.62, ty + Math.sin(a) * s * 0.45 + s * 0.18,
    );
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * s * 0.35, ty + Math.sin(a) * s * 0.3,
      tx, ty,
    );
    ctx.fill();
  }
  ctx.restore();
}

function paintSunsetSky(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2b0f4d');
  sky.addColorStop(0.35, '#c22a6e');
  sky.addColorStop(0.62, '#ff6a3d');
  sky.addColorStop(0.8, '#ffb347');
  sky.addColorStop(1, '#ffd166');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Low sun and its glow.
  const sx = W * 0.5;
  const sy = H * 0.52;
  const sr = W * 0.13;
  const glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.4);
  glow.addColorStop(0, 'rgba(255,240,170,0.85)');
  glow.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - sr * 2.4, sy - sr * 2.4, sr * 4.8, sr * 4.8);
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
  // Short skyline silhouette along the horizon.
  ctx.fillStyle = '#2a0a3a';
  ctx.fillRect(0, H * 0.86, W, H * 0.14);
  let bx = 0;
  while (bx < W) {
    const bw = W * (0.06 + Math.random() * 0.08);
    const bh = H * (0.03 + Math.random() * 0.06);
    ctx.fillRect(bx, H * 0.86 - bh, bw, bh + H * 0.14);
    bx += bw + W * 0.03;
  }
  paintPalm(ctx, W * 0.08, H * 0.86, H * 0.2);
  paintPalm(ctx, W * 0.94, H * 0.88, H * 0.17);
}

// ---------------------------------------------------------------- lettering
function titleFontSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  const apply = () => {
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
    try { ctx.letterSpacing = `${size * 0.04}px`; } catch { /* canvas without letterSpacing */ }
  };
  apply();
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    apply();
  }
  return size;
}

function paintTitle(ctx, text, cx, baselineY, size, grade) {
  const fill = ctx.createLinearGradient(0, baselineY - size, 0, baselineY + size * 0.15);
  grade.title.forEach((c, i) => fill.addColorStop(i / (grade.title.length - 1), c));
  ctx.save();
  ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  try { ctx.letterSpacing = `${size * 0.04}px`; } catch { /* ignore */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160826';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.04;
  ctx.strokeText(text, cx, baselineY);
  ctx.fillStyle = fill;
  ctx.fillText(text, cx, baselineY);
  ctx.restore();
}

function paintSubtitle(ctx, text, cx, y, size, grade) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `italic 700 ${size}px Georgia, "Times New Roman", serif`;
  try { ctx.letterSpacing = `${size * 0.32}px`; } catch { /* ignore */ }
  ctx.fillStyle = grade.accent;
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = size * 0.9;
  ctx.fillText(text.toUpperCase(), cx, y);
  ctx.restore();
}

function paintStars(ctx, cx, y, size) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `${size}px Arial, sans-serif`;
  ctx.fillStyle = '#ffd166';
  ctx.shadowColor = '#ff9a3d';
  ctx.shadowBlur = size * 0.6;
  ctx.fillText('★★★★★', cx, y);
  ctx.restore();
}

function paintBadge(ctx, W, H, grade) {
  const bw = W * 0.21;
  const bh = H * 0.045;
  const bx = W - bw - W * 0.03;
  const by = H * 0.028;
  ctx.save();
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.rotate(0.1);
  ctx.fillStyle = grade.accent;
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  roundedPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#160826';
  ctx.font = `900 ${bh * 0.52}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ VICE CITY ★', 0, bh * 0.02);
  ctx.restore();
}

/** Greedy word wrap for the centre-cell title. */
export function wrapTitle(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

// -------------------------------------------------------------- the cover
/**
 * Paints the full cover onto `canvas`.
 * `state` carries layout, grade, title, subtitle, grain, per-panel photo
 * indexes and per-panel transforms; `images` is the loaded photo list.
 * `opts.selected` outlines one panel in the preview; `opts.forExport`
 * hides that outline.
 */
export function drawCover(canvas, state, images, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const panels = panelsFor(state.layout, W, H);

  // Backdrop: painted sky for the snapshot layout, deep violet otherwise.
  if (state.layout === 'tilt') {
    paintSunsetSky(ctx, W, H);
  } else {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1d0b33');
    bg.addColorStop(0.5, '#12061f');
    bg.addColorStop(1, '#0a0313');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glowA = ctx.createRadialGradient(W * 0.15, H * 0.1, 0, W * 0.15, H * 0.1, W * 0.5);
    glowA.addColorStop(0, 'rgba(255,90,140,0.20)');
    glowA.addColorStop(1, 'rgba(255,90,140,0)');
    ctx.fillStyle = glowA;
    ctx.fillRect(0, 0, W, H);
    const glowB = ctx.createRadialGradient(W * 0.9, H * 0.9, 0, W * 0.9, H * 0.9, W * 0.55);
    glowB.addColorStop(0, 'rgba(255,150,60,0.16)');
    glowB.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = glowB;
    ctx.fillRect(0, 0, W, H);
  }

  // Photo panels.
  panels.forEach((panel, i) => {
    const photoIdx = state.panelPhotos && state.panelPhotos[i] != null
      ? state.panelPhotos[i]
      : (images.length ? i % images.length : -1);
    const img = photoIdx >= 0 ? images[photoIdx] : null;
    const t = state.transforms ? state.transforms[i] : null;
    paintPanel(ctx, panel, img, grade, t);
  });

  // The grade wash over the photos.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.55, 'rgba(0,0,0,0)');
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = grade.wash;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  // Lettering.
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  if (panels.titleCell) {
    // Nine-panel: the title lives in the centre cell.
    const c = panels.titleCell;
    const cellGrad = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h);
    cellGrad.addColorStop(0, '#ff9a3d');
    cellGrad.addColorStop(0.5, '#ff4f7a');
    cellGrad.addColorStop(1, '#7b2ff7');
    ctx.fillStyle = cellGrad;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = Math.max(2, c.w * 0.01);
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    if (title) {
      // Wrap first, then shrink until the longest line fits — a long title
      // goes big across two lines instead of tiny on one.
      let size = c.h * 0.26;
      const setFont = () => {
        ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
        try { ctx.letterSpacing = `${size * 0.04}px`; } catch { /* ignore */ }
      };
      setFont();
      let lines = wrapTitle(ctx, title, c.w * 0.88);
      while (size > 10 && lines.some((l) => ctx.measureText(l).width > c.w * 0.88)) {
        size -= 2;
        setFont();
        lines = wrapTitle(ctx, title, c.w * 0.88);
      }
      const lineH = size * 1.05;
      let y = c.y + c.h / 2 - ((lines.length - 1) * lineH) / 2 + size * 0.36;
      lines.forEach((line) => {
        paintTitle(ctx, line, c.x + c.w / 2, y, size, grade);
        y += lineH;
      });
    }
    paintStars(ctx, c.x + c.w / 2, c.y + c.h * 0.9, c.h * 0.09);
  } else if (title || subtitle) {
    const bandTop = state.layout === 'tilt' ? 0 : H * 0.74;
    if (state.layout !== 'tilt') {
      const scrim = ctx.createLinearGradient(0, bandTop - H * 0.08, 0, H);
      scrim.addColorStop(0, 'rgba(10,4,20,0)');
      scrim.addColorStop(0.45, 'rgba(10,4,20,0.72)');
      scrim.addColorStop(1, 'rgba(10,4,20,0.88)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, bandTop - H * 0.08, W, H - bandTop + H * 0.08);
    }
    const titleY = state.layout === 'tilt' ? H * 0.15 : H * 0.9;
    const subY = state.layout === 'tilt' ? H * 0.21 : H * 0.955;
    const starY = state.layout === 'tilt' ? H * 0.075 : H * 0.79;
    paintStars(ctx, W / 2, starY, H * 0.032);
    if (title) {
      const size = titleFontSize(ctx, title, W * 0.92, H * 0.105);
      ctx.save();
      ctx.translate(W / 2, titleY);
      ctx.rotate(state.layout === 'tilt' ? -0.02 : 0);
      ctx.translate(-W / 2, -titleY);
      paintTitle(ctx, title, W / 2, titleY, size, grade);
      ctx.restore();
    }
    if (subtitle) paintSubtitle(ctx, subtitle, W / 2, subY, H * 0.03, grade);
  }

  if (state.layout !== 'grid9') paintBadge(ctx, W, H, grade);

  // Grain, vignette and the outer poster frame.
  if (state.grain !== false) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainTile(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(5, W * 0.007);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);

  // Preview-only selection outline around the chosen panel.
  if (!opts.forExport && opts.selected != null && panels[opts.selected]) {
    const p = panels[opts.selected];
    ctx.save();
    ctx.strokeStyle = '#4de8ff';
    ctx.lineWidth = Math.max(3, W * 0.005);
    ctx.setLineDash([W * 0.02, W * 0.012]);
    tracePanel(ctx, p);
    ctx.stroke();
    ctx.restore();
  }
}

// Vice Cover Studio — editor wiring.
//
// Connects the page to the cover engine: photo slots, panel picking and
// dragging, layout / grade / size pickers, caption editing, undo and redo,
// and one-click PNG export. A `?shot=` query builds a fixed scene for a
// screenshot instead (see shots.js).
import { drawCover, panelsFor, GRADES, LAYOUTS, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const zoomSlider = document.getElementById('zoom');
const panelPhotoRow = document.getElementById('panelPhotos');
const panelLabel = document.getElementById('panelLabel');

/** The editable cover state; the photos themselves live in `images`. */
export const state = {
  layout: 'poster',
  grade: 'sunset',
  size: '1080x1080',
  title: 'Sunset Heist',
  subtitle: 'Vice City · One last job',
  grain: true,
  panelPhotos: [],
  transforms: [],
};
export const images = [];
let selectedPanel = 0;

// ---------------------------------------------------------------- undo/redo
const undoStack = [];
const redoStack = [];

function snapshotState() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, size: state.size,
    title: state.title, subtitle: state.subtitle, grain: state.grain,
    panelPhotos: state.panelPhotos, transforms: state.transforms,
  });
}

function pushUndo() {
  undoStack.push(snapshotState());
  if (undoStack.length > 50) undoStack.shift();
  redoStack.length = 0;
  syncUndoButtons();
}

function restoreSnapshot(json) {
  Object.assign(state, JSON.parse(json));
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  syncControls();
  redraw();
}

function undoCover() {
  if (!undoStack.length) return;
  redoStack.push(snapshotState());
  restoreSnapshot(undoStack.pop());
  syncUndoButtons();
}

function redoCover() {
  if (!redoStack.length) return;
  undoStack.push(snapshotState());
  restoreSnapshot(redoStack.pop());
  syncUndoButtons();
}

function syncUndoButtons() {
  document.getElementById('undo').disabled = !undoStack.length;
  document.getElementById('redo').disabled = !redoStack.length;
}

// ------------------------------------------------------------------ drawing
function sizeDims() {
  return SIZES.find((s) => s[0] === state.size) || SIZES[0];
}

function panelCount() {
  const [, , w, h] = sizeDims();
  return panelsFor(state.layout, w, h).length;
}

// Keeps the per-panel arrays in step with the current layout's panel count.
function ensurePanels() {
  const n = panelCount();
  while (state.panelPhotos.length < n) {
    state.panelPhotos.push(images.length ? state.panelPhotos.length % images.length : -1);
  }
  while (state.transforms.length < n) state.transforms.push({ zoom: 1, ox: 0, oy: 0 });
  state.panelPhotos.length = n;
  state.transforms.length = n;
  if (selectedPanel >= n) selectedPanel = 0;
}

/** Re-sizes the preview canvas to the chosen export aspect and repaints. */
export function redraw() {
  ensurePanels();
  const [, , w, h] = sizeDims();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state, images, {
    selected: document.body.classList.contains('shot-cover') ? null : selectedPanel,
  });
  syncPanelRow();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// -------------------------------------------------------------------- photos
async function addPhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (images.length >= 4) {
    status.textContent = 'Four photos is the most — remove one first.';
    return;
  }
  const img = await loadImage(URL.createObjectURL(file));
  images.push(img);
  // The new photo fills any empty panel first, then takes the last panel.
  ensurePanels();
  let placed = false;
  for (let i = 0; i < state.panelPhotos.length; i++) {
    if (state.panelPhotos[i] < 0) {
      state.panelPhotos[i] = images.length - 1;
      placed = true;
    }
  }
  if (!placed && state.panelPhotos.length) {
    state.panelPhotos[state.panelPhotos.length - 1] = images.length - 1;
  }
  pushUndo();
  renderSlots();
  redraw();
  status.textContent = `Photo ${images.length} loaded — click a panel, drag to crop it.`;
}

function renderSlots() {
  const slots = document.getElementById('slots');
  slots.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (images[i] ? ' filled' : '');
    if (images[i]) {
      const thumb = document.createElement('canvas');
      thumb.width = 96;
      thumb.height = 96;
      const tctx = thumb.getContext('2d');
      const s = Math.max(96 / images[i].naturalWidth, 96 / images[i].naturalHeight);
      tctx.drawImage(
        images[i],
        (96 - images[i].naturalWidth * s) / 2, (96 - images[i].naturalHeight * s) / 2,
        images[i].naturalWidth * s, images[i].naturalHeight * s,
      );
      slot.appendChild(thumb);
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'slot-remove';
      rm.textContent = '×';
      rm.title = 'Remove photo';
      rm.addEventListener('click', (e) => {
        e.stopPropagation();
        pushUndo();
        images.splice(i, 1);
        state.panelPhotos = state.panelPhotos.map((p) => (p === i ? -1 : p > i ? p - 1 : p));
        renderSlots();
        redraw();
      });
      slot.appendChild(rm);
    } else {
      slot.textContent = `Photo ${i + 1}`;
    }
    slot.addEventListener('click', () => {
      if (images[i]) {
        pushUndo();
        state.panelPhotos[selectedPanel] = i;
        redraw();
      }
    });
    slots.appendChild(slot);
  }
}

function syncPanelRow() {
  const n = panelCount();
  panelLabel.textContent = `Panel ${selectedPanel + 1} of ${n}`;
  panelPhotoRow.innerHTML = '';
  for (let i = 0; i < images.length; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mini' + (state.panelPhotos[selectedPanel] === i ? ' active' : '');
    b.textContent = `Photo ${i + 1}`;
    b.addEventListener('click', () => {
      pushUndo();
      state.panelPhotos[selectedPanel] = i;
      redraw();
    });
    panelPhotoRow.appendChild(b);
  }
  const t = state.transforms[selectedPanel];
  if (t) zoomSlider.value = String(Math.round(t.zoom * 100));
}

// -------------------------------------------------------------------- export
/** Renders the cover at its full export size and downloads it as a PNG. */
export function exportCover() {
  const [key, , w, h] = sizeDims();
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state, images, { forExport: true });
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vice-cover-${key}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      status.textContent = `Saved vice-cover-${key}.png (${w} × ${h}).`;
      resolve({ width: w, height: h, bytes: blob ? blob.size : 0, type: blob ? blob.type : '' });
    }, 'image/png');
  });
}

// ------------------------------------------------------------------ controls
function buildPicker(containerId, items, current, onPick) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  items.forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (key === current ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      pushUndo();
      onPick(key);
      box.querySelectorAll('.pick').forEach((el) => el.classList.remove('active'));
      b.classList.add('active');
      redraw();
    });
    box.appendChild(b);
  });
}

function syncControls() {
  buildPicker('layouts', LAYOUTS, state.layout, (k) => { state.layout = k; });
  buildPicker('grades', Object.entries(GRADES).map(([k, v]) => [k, v.label]), state.grade, (k) => { state.grade = k; });
  buildPicker('sizes', SIZES.map(([k, label]) => [k, `${label} ${k}`]), state.size, (k) => { state.size = k; });
  document.getElementById('grain').checked = state.grain !== false;
}

document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  await addPhotoFile(file);
});

document.getElementById('loadSamples').addEventListener('click', async () => {
  status.textContent = 'Loading the two sample photos…';
  for (const name of ['pier', 'boulevard']) {
    if (images.length >= 4) break;
    try {
      images.push(await loadImage(`samples/${name}.jpg`));
    } catch { /* a missing sample leaves the panel's painted sunset */ }
  }
  pushUndo();
  state.panelPhotos = state.panelPhotos.map((_, i) => (images.length ? i % images.length : -1));
  renderSlots();
  redraw();
  status.textContent = 'Sample photos loaded — try the layouts and grades.';
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
titleInput.addEventListener('change', pushUndo);
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
subtitleInput.addEventListener('change', pushUndo);

document.getElementById('grain').addEventListener('change', (e) => {
  pushUndo();
  state.grain = e.target.checked;
  redraw();
});

document.getElementById('fillPanels').addEventListener('click', () => {
  if (!images.length) { status.textContent = 'Load a photo first.'; return; }
  pushUndo();
  state.panelPhotos = state.panelPhotos.map((_, i) => i % images.length);
  redraw();
  status.textContent = 'Panels filled from your photos.';
});

document.getElementById('shufflePhotos').addEventListener('click', () => {
  if (!images.length) { status.textContent = 'Load a photo first.'; return; }
  pushUndo();
  state.panelPhotos = state.panelPhotos.map(() => Math.floor(Math.random() * images.length));
  redraw();
});

document.getElementById('export').addEventListener('click', exportCover);
document.getElementById('undo').addEventListener('click', undoCover);
document.getElementById('redo').addEventListener('click', redoCover);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redoCover(); else undoCover();
  }
});

zoomSlider.addEventListener('input', () => {
  const t = state.transforms[selectedPanel];
  if (t) {
    t.zoom = Number(zoomSlider.value) / 100;
    redraw();
  }
});
zoomSlider.addEventListener('change', pushUndo);

// ------------------------------------------- panel picking, pan and zoom
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const panels = panelsFor(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (p.poly) {
      if (pointInPoly(x, y, p.poly)) return i;
    } else if (p.rot) {
      // Undo the panel's rotation and test against the upright rect.
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const a = (-p.rot * Math.PI) / 180;
      const dx = x - cx;
      const dy = y - cy;
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(lx) <= p.w / 2 && Math.abs(ly) <= p.h / 2) return i;
    } else if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
      return i;
    }
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  selectedPanel = i;
  const t = state.transforms[i];
  drag = { x: e.clientX, y: e.clientY, ox: t.ox, oy: t.oy, moved: false };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const panels = panelsFor(state.layout, canvas.width, canvas.height);
  const p = panels[selectedPanel];
  const dx = ((e.clientX - drag.x) / rect.width) * canvas.width;
  const dy = ((e.clientY - drag.y) / rect.height) * canvas.height;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const t = state.transforms[selectedPanel];
  t.ox = Math.max(-0.6, Math.min(0.6, drag.ox + dx / p.w));
  t.oy = Math.max(-0.6, Math.min(0.6, drag.oy + dy / p.h));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag && drag.moved) pushUndo();
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const t = state.transforms[selectedPanel];
  if (!t) return;
  t.zoom = Math.max(1, Math.min(3, t.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// ---------------------------------------------------------------------- boot
syncControls();
renderSlots();
syncUndoButtons();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadImage, images, state, redraw, exportCover, canvas, syncControls, renderSlots,
    setStatus: (t) => { status.textContent = t; },
  });
} else {
  redraw();
}

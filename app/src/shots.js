// Fixed scenes for screenshots.
//
// `?shot=editor` shows the editor with sample photos loaded; `?shot=cover`
// shows the exported cover alone, full frame. `photo` picks the first
// sample, `caption` the title, `layout`, `grade` and `size` pick the cover's
// look, and `exporttest=<size>` runs a real PNG export and writes its result
// into #testout so a headless check can read it. window.__shotReady is set
// once the scene is painted.
export async function runShot(shot, query, app) {
  const { loadImage, images, state, redraw, exportCover, canvas, syncControls, renderSlots } = app;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Vice City · One last job';
  state.title = caption;
  state.subtitle = subtitle;
  state.layout = query.get('layout') ?? 'poster';
  state.grade = query.get('grade') ?? 'sunset';
  state.size = query.get('size') ?? '1080x1080';
  const titleInput = document.getElementById('title');
  const subtitleInput = document.getElementById('subtitle');
  if (titleInput) titleInput.value = caption;
  if (subtitleInput) subtitleInput.value = subtitle;
  // Both samples, so a multi-panel cover fills every panel with a real photo.
  const first = query.get('photo') ?? 'pier';
  const second = first === 'pier' ? 'boulevard' : 'pier';
  for (const name of [first, second]) {
    try {
      images.push(await loadImage(`samples/${name}.jpg`));
    } catch { /* a missing sample leaves the panel's painted sunset */ }
  }
  state.panelPhotos = [];
  state.transforms = [];
  renderSlots();
  syncControls();
  redraw();
  const exportTest = query.get('exporttest');
  if (exportTest) {
    state.size = exportTest;
    redraw();
    const result = await exportCover();
    const out = document.createElement('div');
    out.id = 'testout';
    out.textContent = JSON.stringify(result);
    document.body.appendChild(out);
  }
  // In cover shots the preview canvas fills the whole window.
  if (shot === 'cover') {
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.objectFit = 'contain';
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

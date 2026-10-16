(() => {
  const MAX_SIDE = 4096;
  const $ = id => document.getElementById(id);
  const canvas = $('canvas'), ctx = canvas.getContext('2d');
  const sliders = ['cols', 'rows', 'thick', 'contrast', 'brightness', 'saturation'];
  const PAPERS = { A8: [52, 74], A7: [74, 105], A6: [105, 148], A5: [148, 210], A4: [210, 297], A3: [297, 420] };
  const defaults = {
    cols: 4, rows: 4, thick: 2, contrast: 0, brightness: 0, saturation: 0,
    color: '#ffffff', labels: false, gray: false, showDims: false, paper: 'A4'
  };

  let img = null;      // source image element
  let base = null;     // canvas with the processed (scaled/grey/tone-adjusted) image
  let saveName = 'grid-pic';
  let align = 'center'; // center | tr | bl

  const colName = n => { // 0 -> A, 25 -> Z, 26 -> AA
    let s = '';
    for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
    return s;
  };
  const fmt = v => String(Math.round(v * 10) / 10).replace('.', ',');

  /* ---------- paper ---------- */
  const paper = () => ({ w: +$('pw').value, h: +$('ph').value });

  function setPaper(w, h) { $('pw').value = w; $('ph').value = h; }

  function updatePaperInfo() {
    const { w, h } = paper();
    const name = $('paper').value === 'custom' ? 'Własny' : $('paper').value;
    const cols = +$('cols').value, rows = +$('rows').value;
    $('paperInfo').innerHTML =
      `<b>${name}</b>: wysokość ${fmt(h)} mm × szerokość ${fmt(w)} mm<br>` +
      `Jedna kratka: ${fmt(w / cols)} × ${fmt(h / rows)} mm`;
  }

  $('paper').addEventListener('change', () => {
    const p = PAPERS[$('paper').value];
    if (p) setPaper(...p);
    updatePaperInfo(); draw();
  });
  ['pw', 'ph'].forEach(id => $(id).addEventListener('input', () => {
    if (!(+$(id).value > 0)) return;
    $('paper').value = 'custom';   // temporary custom size, not persisted
    updatePaperInfo(); draw();
  }));
  $('swap').addEventListener('click', () => {
    const { w, h } = paper();
    setPaper(h, w);
    const match = Object.entries(PAPERS).find(([, [a, b]]) => a === h && b === w);
    $('paper').value = match ? match[0] : 'custom';
    updatePaperInfo(); draw();
  });

  /* ---------- image processing ---------- */
  function buildBase() {
    if (!img) return;
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    base = document.createElement('canvas');
    base.width = w; base.height = h;
    const b = base.getContext('2d', { willReadFrequently: true });
    b.drawImage(img, 0, 0, w, h);
    const gray = $('gray').checked, c = +$('contrast').value;
    const br = +$('brightness').value * 2.55, sat = 1 + +$('saturation').value / 100;
    if (gray || c !== 0 || br !== 0 || sat !== 1) {
      const d = b.getImageData(0, 0, w, h), p = d.data;
      const f = (259 * (c + 255)) / (255 * (259 - c));
      for (let i = 0; i < p.length; i += 4) {
        let r = p[i], g = p[i + 1], bl = p[i + 2];
        if (gray) r = g = bl = 0.299 * r + 0.587 * g + 0.114 * bl;
        else if (sat !== 1) {
          const l = 0.299 * r + 0.587 * g + 0.114 * bl;
          r = l + (r - l) * sat; g = l + (g - l) * sat; bl = l + (bl - l) * sat;
        }
        p[i] = f * (r + br - 128) + 128;
        p[i + 1] = f * (g + br - 128) + 128;
        p[i + 2] = f * (bl + br - 128) + 128;
      }
      b.putImageData(d, 0, 0);
    }
  }

  /* ---------- drawing ---------- */
  function dimensionLine(x1, y1, x2, y2, color, outline, lw) {
    const cap = lw * 3, vert = x1 === x2;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      if (vert) { ctx.moveTo(x1 - cap, y1); ctx.lineTo(x1 + cap, y1); ctx.moveTo(x2 - cap, y2); ctx.lineTo(x2 + cap, y2); }
      else { ctx.moveTo(x1, y1 - cap); ctx.lineTo(x1, y1 + cap); ctx.moveTo(x2, y2 - cap); ctx.lineTo(x2, y2 + cap); }
      ctx.stroke();
    };
    ctx.lineCap = 'butt';
    ctx.strokeStyle = outline; ctx.lineWidth = lw * 2.4; path();
    ctx.strokeStyle = color; ctx.lineWidth = lw; path();
  }

  function outlinedText(t, x, y, fs, color, outline) {
    ctx.lineWidth = fs * 0.22;
    ctx.strokeStyle = outline; ctx.strokeText(t, x, y);
    ctx.fillStyle = color; ctx.fillText(t, x, y);
  }

  function draw() {
    if (!base) return;
    const w = base.width, h = base.height;
    canvas.width = w; canvas.height = h;
    ctx.drawImage(base, 0, 0);
    const cols = +$('cols').value, rows = +$('rows').value;
    const lw = Math.max(1, Math.round(+$('thick').value * Math.max(w, h) / 1000));
    const color = $('color').value;
    const n = parseInt(color.slice(1), 16);
    const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    const outline = lum > 140 ? '#000' : '#fff';

    // grid area: paper proportions, as large as fits inside the image
    const { w: pw, h: ph } = paper();
    const k = Math.min(w / pw, h / ph);
    const gw = Math.round(pw * k), gh = Math.round(ph * k);
    const gx = align === 'tr' ? w - gw : align === 'bl' ? 0 : Math.round((w - gw) / 2);
    const gy = align === 'tr' ? 0 : align === 'bl' ? h - gh : Math.round((h - gh) / 2);
    ctx.save();
    ctx.translate(gx, gy);

    ctx.fillStyle = color;
    for (let i = 0; i <= cols; i++) ctx.fillRect(Math.round(i * (gw - lw) / cols), 0, lw, gh);
    for (let j = 0; j <= rows; j++) ctx.fillRect(0, Math.round(j * (gh - lw) / rows), gw, lw);

    const cw = gw / cols, ch = gh / rows;
    ctx.lineJoin = 'round';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    if ($('labels').checked) {
      const fs = Math.max(10, Math.min(cw, ch) * 0.2);
      ctx.font = `600 ${fs}px system-ui, sans-serif`;
      const pad = lw + fs * 0.25;
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++)
          outlinedText(colName(i) + (j + 1), i * cw + pad, j * ch + pad, fs, color, outline);
    }
    if ($('showDims').checked) {
      // dimensions of the top-left cell, drawn with dimension lines
      const fs = Math.max(10, Math.min(cw, ch) * 0.13);
      const dl = Math.max(1.5, fs * 0.08);
      const m = Math.max(lw + 2, fs * 0.6);
      const yl = ch * 0.72, xl = cw * 0.72;
      dimensionLine(m, yl, cw - m, yl, color, outline, dl);
      dimensionLine(xl, m, xl, ch - m, color, outline, dl);
      ctx.font = `600 ${fs}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      outlinedText(fmt(pw / cols) + ' mm', cw / 2, yl - fs * 0.35, fs, color, outline);
      ctx.save();
      ctx.translate(xl - fs * 0.35, ch / 2);
      ctx.rotate(-Math.PI / 2);
      outlinedText(fmt(ph / rows) + ' mm', 0, 0, fs, color, outline);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------- controls ---------- */
  const syncOutputs = () => sliders.forEach(id => $(id + 'Out').textContent = $(id).value);
  const syncSwatch = () => { $('swatch').style.background = $('color').value; };
  const redraw = () => { syncOutputs(); updatePaperInfo(); draw(); };
  const rebuild = () => { syncOutputs(); buildBase(); draw(); };

  ['cols', 'rows', 'thick', 'labels', 'showDims'].forEach(id => $(id).addEventListener('input', redraw));
  $('color').addEventListener('input', () => { syncSwatch(); draw(); });
  ['gray', 'contrast', 'brightness', 'saturation'].forEach(id => $(id).addEventListener('input', rebuild));

  function setAlign(pos) {
    align = pos;
    document.querySelectorAll('#align .btn').forEach(b => b.classList.toggle('active', b.dataset.pos === pos));
    draw();
  }
  $('align').addEventListener('click', e => { if (e.target.dataset.pos) setAlign(e.target.dataset.pos); });

  $('reset').addEventListener('click', () => {
    setAlign('center');
    for (const [k, v] of Object.entries(defaults)) {
      const el = $(k);
      if (typeof v === 'boolean') el.checked = v; else el.value = v;
    }
    setPaper(...PAPERS.A4);
    syncSwatch(); updatePaperInfo(); rebuild();
  });

  /* ---------- loading files ---------- */
  function loadFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    saveName = f.name.replace(/\.[^.]+$/, '') + '-grid';
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      img = im;
      $('stage').classList.add('has-img');
      $('save').disabled = false;
      buildBase(); draw();
    };
    im.onerror = () => { URL.revokeObjectURL(url); alert('Nie udało się wczytać tego pliku.'); };
    im.src = url;
  }

  $('file').addEventListener('change', e => { loadFile(e.target.files[0]); e.target.value = ''; });

  // drag & drop anywhere in the window
  let depth = 0;
  const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  window.addEventListener('dragenter', e => { if (!hasFiles(e)) return; e.preventDefault(); depth++; document.body.classList.add('dragging'); });
  window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('dragleave', e => { if (!hasFiles(e)) return; if (--depth <= 0) { depth = 0; document.body.classList.remove('dragging'); } });
  window.addEventListener('drop', e => {
    if (!hasFiles(e)) return;
    e.preventDefault(); depth = 0; document.body.classList.remove('dragging');
    loadFile([...e.dataTransfer.files].find(f => f.type.startsWith('image/')));
  });

  /* ---------- saving ---------- */
  $('save').addEventListener('click', () => {
    canvas.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], saveName + '.png', { type: 'image/png' });
      // On phones the share sheet allows "Save image" straight to the gallery.
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return; }
        catch (err) { if (err.name === 'AbortError') return; }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  });

  setPaper(...PAPERS.A4);
  syncSwatch(); syncOutputs(); updatePaperInfo();
})();

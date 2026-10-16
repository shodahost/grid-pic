(() => {
  const MAX_SIDE = 4096;
  const $ = id => document.getElementById(id);
  const canvas = $('canvas'), ctx = canvas.getContext('2d');
  const ids = ['cols', 'rows', 'thick', 'contrast'];
  const defaults = { cols: 4, rows: 4, thick: 2, contrast: 0, color: '#ffffff', labels: false, gray: false };

  let img = null;      // source image element
  let base = null;     // canvas holding the processed (scaled/grey/contrast) image
  let saveName = 'grid-pic';

  const colName = n => { // 0 -> A, 25 -> Z, 26 -> AA
    let s = '';
    for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
    return s;
  };

  function buildBase() {
    if (!img) return;
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    base = document.createElement('canvas');
    base.width = w; base.height = h;
    const b = base.getContext('2d', { willReadFrequently: true });
    b.drawImage(img, 0, 0, w, h);
    const gray = $('gray').checked, c = +$('contrast').value;
    if (gray || c !== 0) {
      const d = b.getImageData(0, 0, w, h), p = d.data;
      const f = (259 * (c + 255)) / (255 * (259 - c));
      for (let i = 0; i < p.length; i += 4) {
        let r = p[i], g = p[i + 1], bl = p[i + 2];
        if (gray) r = g = bl = 0.299 * r + 0.587 * g + 0.114 * bl;
        p[i] = f * (r - 128) + 128;
        p[i + 1] = f * (g - 128) + 128;
        p[i + 2] = f * (bl - 128) + 128;
      }
      b.putImageData(d, 0, 0);
    }
  }

  function draw() {
    if (!base) return;
    const w = base.width, h = base.height;
    canvas.width = w; canvas.height = h;
    ctx.drawImage(base, 0, 0);
    const cols = +$('cols').value, rows = +$('rows').value;
    const lw = Math.max(1, Math.round(+$('thick').value * Math.max(w, h) / 1000));
    const color = $('color').value;
    ctx.fillStyle = color;
    for (let i = 0; i <= cols; i++) {
      const x = Math.round(i * (w - lw) / cols);
      ctx.fillRect(x, 0, lw, h);
    }
    for (let j = 0; j <= rows; j++) {
      const y = Math.round(j * (h - lw) / rows);
      ctx.fillRect(0, y, w, lw);
    }
    if ($('labels').checked) {
      const cw = w / cols, ch = h / rows;
      const fs = Math.max(10, Math.min(cw, ch) * 0.2);
      ctx.font = `600 ${fs}px system-ui, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.lineJoin = 'round';
      ctx.lineWidth = fs * 0.22;
      const n = parseInt(color.slice(1), 16);
      const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
      ctx.strokeStyle = lum > 140 ? '#000' : '#fff';
      const pad = lw + fs * 0.25;
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const t = colName(i) + (j + 1);
          ctx.strokeText(t, i * cw + pad, j * ch + pad);
          ctx.fillText(t, i * cw + pad, j * ch + pad);
        }
    }
  }

  function syncOutputs() {
    ids.forEach(id => $(id + 'Out').textContent = $(id).value);
  }

  ['cols', 'rows', 'thick', 'color', 'labels'].forEach(id =>
    $(id).addEventListener('input', () => { syncOutputs(); draw(); }));
  ['gray', 'contrast'].forEach(id =>
    $(id).addEventListener('input', () => { syncOutputs(); buildBase(); draw(); }));

  $('reset').addEventListener('click', () => {
    for (const [k, v] of Object.entries(defaults)) {
      const el = $(k);
      if (typeof v === 'boolean') el.checked = v; else el.value = v;
    }
    syncOutputs(); buildBase(); draw();
  });

  $('file').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
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
  });

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

  syncOutputs();
})();

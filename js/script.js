// script.js riscritto per includere testo editabile nel canvas

window.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const canvas = $('stage');
  const ctx = canvas.getContext('2d');
  const textInput = $('textInput');

  // Loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loadingIndicator';
  loadingIndicator.innerHTML = '<div class="spinner"></div><p>Caricamento cornice...</p>';
  document.body.appendChild(loadingIndicator);

  // State variables
  let charImg = null;
  let frameImg = null;
  let overlayText = '';
  let scale = 1, offsetX = 0, offsetY = 0;
  let dragging = false, dragStart = { x: 0, y: 0 }, startOffset = { x: 0, y: 0 };
  let lastTouchDistance = null, isTouchDragging = false;

  const sliders = { brightness:100, contrast:100, saturate:100, gamma:100, white:255, black:0 };
  const framePaths = [
    'frames/frame1.png','frames/frame2.png','frames/frame3.png',
    'frames/frame4.png','frames/frame5.png','frames/frame6.png',
    'frames/frame7.png'
  ];
  let currentFrameIndex = 0;

  // Helpers
  function showLoading(show){
    loadingIndicator.style.display = show ? 'flex' : 'none';
  }
  function getTouchDistance(t){
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.hypot(dx, dy);
  }

  // Load image file into Image object
  function loadImageFile(file, cb){
    const img = new Image();
    img.onload = () => cb(img);
    img.src = URL.createObjectURL(file);
  }

  // Load a frame from framePaths by index
  function loadFrame(index){
    showLoading(true);
    const img = new Image();
    img.onload = () => {
      frameImg = img;
      showLoading(false);
      drawStage();
    };
    img.src = framePaths[index];
  }

  // Set up event listeners
  $('charUpload')?.addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    loadImageFile(f, img => {
      charImg = img;
      scale = 1; offsetX = 0; offsetY = 0;
      drawStage();
    });
  });

  Object.keys(sliders).forEach(id => {
    const range = $(id), num = $(id + 'Val');
    if (!range || !num) return;
    range.addEventListener('input', () => {
      num.value = id === 'gamma' ? (range.value/100).toFixed(2) : range.value;
      drawStage();
    });
    num.addEventListener('input', () => {
      let v = num.value;
      if (id === 'gamma') v = v * 100;
      range.value = v;
      drawStage();
    });
  });

  $('resetBtn')?.addEventListener('click', () => {
    for (const [k, v] of Object.entries(sliders)){
      $(k).value = v;
      $(k+'Val').value = k==='gamma' ? (v/100).toFixed(2) : v;
    }
    overlayText = '';
    textInput.value = '';
    drawStage();
  });

  $('downloadBtn')?.addEventListener('click', () => {
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'immagine_editata.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  });

  $('nextFrameBtn')?.addEventListener('click', () => {
    currentFrameIndex = (currentFrameIndex + 1) % framePaths.length;
    loadFrame(currentFrameIndex);
  });

  $('prevFrameBtn')?.addEventListener('click', () => {
    currentFrameIndex = (currentFrameIndex - 1 + framePaths.length) % framePaths.length;
    loadFrame(currentFrameIndex);
  });

  // Text overlay
  textInput.addEventListener('input', () => {
    overlayText = textInput.value;
    drawStage();
  });

  // Mouse drag & zoom
  canvas.addEventListener('mousedown', e => {
    if (!charImg) return;
    dragging = true;
    dragStart = { x: e.offsetX, y: e.offsetY };
    startOffset = { x: offsetX, y: offsetY };
  });
  window.addEventListener('mouseup', () => dragging = false);
  canvas.addEventListener('mousemove', e => {
    if (dragging){
      offsetX = startOffset.x + (e.offsetX - dragStart.x);
      offsetY = startOffset.y + (e.offsetY - dragStart.y);
      drawStage();
    }
  });
  canvas.addEventListener('wheel', e => {
    if (!charImg) return;
    e.preventDefault();
    const z = e.deltaY < 0 ? 1.05 : 0.95;
    const mx = e.offsetX, my = e.offsetY;
    offsetX = mx - (mx - offsetX) * z;
    offsetY = my - (my - offsetY) * z;
    scale *= z;
    drawStage();
  }, { passive: false });

  // Touch support: drag & pinch
  canvas.addEventListener('touchstart', e => {
    if (!charImg) return;
    if (e.touches.length === 1) {
      isTouchDragging = true;
      dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startOffset = { x: offsetX, y: offsetY };
    } else if (e.touches.length === 2) {
      lastTouchDistance = getTouchDistance(e.touches);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    if (!charImg) return;
    e.preventDefault();
    if (e.touches.length === 1 && isTouchDragging) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      offsetX = startOffset.x + dx;
      offsetY = startOffset.y + dy;
      drawStage();
    } else if (e.touches.length === 2) {
      const nd = getTouchDistance(e.touches);
      if (lastTouchDistance) {
        const z = nd / lastTouchDistance;
        const mx = (e.touches[0].clientX + e.touches[1].clientX)/2;
        const my = (e.touches[0].clientY + e.touches[1].clientY)/2;
        offsetX = mx - (mx - offsetX) * z;
        offsetY = my - (my - offsetY) * z;
        scale *= z;
        drawStage();
      }
      lastTouchDistance = nd;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    isTouchDragging = false;
    lastTouchDistance = null;
  });
// riferimenti globali
const canvas      = document.getElementById('stage');
const ctx         = canvas.getContext('2d');
const container   = document.querySelector('.canvas-container');
const textInput   = document.getElementById('textInput');
let baseImg, frameImg;  // valorizza questi Image() dove vuoi nel tuo flow

// ─── 1) Imposta dimensione e DPI ─────────────────────────────────────────────
function setCanvasSize() {
  if (!container) {
    console.error('Manca .canvas-container!');
    return;
  }

  // dimensione CSS-pixel
  const { width: cssW, height: cssH } = container.getBoundingClientRect();
  // fattore di scala per devicePixelRatio
  const ratio = window.devicePixelRatio || 1;

  // buffer interno (backing store)
  canvas.width  = Math.round(cssW * ratio);
  canvas.height = Math.round(cssH * ratio);

  // CSS-size per il DOM
  canvas.style.width  = `${Math.round(cssW)}px`;
  canvas.style.height = `${Math.round(cssH)}px`;

  // reset trasform e scala per DPI
  ctx.resetTransform();
  ctx.scale(ratio, ratio);
}

// ─── 2) Disegna tutto il “stage” a piena estensione ──────────────────────────
function drawStage() {
  // 2.1 Pulizia in backing-store-pixel
  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2.2 Riapplica la scala DPI
  const ratio = window.devicePixelRatio || 1;
  ctx.scale(ratio, ratio);

  // dimensioni visibili in CSS-pixel
  const cw = canvas.width  / ratio;
  const ch = canvas.height / ratio;

  // 2.3 Disegna la base (se presente)
  if (charImg && charImg.complete) {
    ctx.drawImage(
      charImg,
      0, 0, charImg.naturalWidth, charImg.naturalHeight, // src full
      0, 0, cw, ch                                      // dest full canvas
    );
  }

  // 2.4 Disegna il frame (senza margini)
  if (frameImg && frameImg.complete) {
    ctx.drawImage(
      frameImg,
      0, 0, frameImg.naturalWidth, frameImg.naturalHeight,
      0, 0, cw, ch
    );
  }

  // 2.5 Disegna eventuale testo in basso
  if (textInput && textInput.value) {
    ctx.font      = '24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(textInput.value, cw / 2, ch - 20);
  }
}

// ─── 3) Hook di resize e avvio ───────────────────────────────────────────────
window.addEventListener('resize', () => {
  setCanvasSize();
  drawStage();
});

// all’avvio della pagina
setCanvasSize();
drawStage();

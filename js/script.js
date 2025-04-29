
const $ = id => document.getElementById(id);

const canvas = $('stage');
const ctx = canvas.getContext('2d');
let charImg = null;
let frameImg = null;

let scale = 1, offsetX = 0, offsetY = 0;
let dragging = false, dragStart = { x: 0, y: 0 }, startOffset = { x: 0, y: 0 };

const sliders = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  gamma: 100,
  white: 255,
  black: 0
};

const framePaths = [
  'frames/frame1.png',
  'frames/frame2.png',
  'frames/frame3.png'
];
let currentFrameIndex = 0;

function loadImageFile(file, cb) {
  const img = new Image();
  img.onload = () => cb(img);
  img.src = URL.createObjectURL(file);
}

function loadFrame(index) {
  const img = new Image();
  img.onload = () => { frameImg = img; drawStage(); };
  img.src = framePaths[index];
}

$('charUpload').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  loadImageFile(f, img => { charImg = img; scale = 1; offsetX = offsetY = 0; drawStage(); });
});

Object.keys(sliders).forEach(id => {
  const range = $(id);
  const number = $(id + 'Val');

  range.addEventListener('input', () => {
    number.value = id === 'gamma' ? (range.value / 100).toFixed(2) : range.value;
    drawStage();
  });

  number.addEventListener('input', () => {
    let v = number.value;
    if (id === 'gamma') v = v * 100;
    range.value = v;
    drawStage();
  });
});

$('resetBtn').addEventListener('click', () => {
  for (const [k, v] of Object.entries(sliders)) {
    $(k).value = v;
    $(k + 'Val').value = k === 'gamma' ? (v / 100).toFixed(2) : v;
  }
  drawStage();
});

$('downloadBtn').addEventListener('click', () => {
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'immagine-editata.png';
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
});

canvas.addEventListener('mousedown', e => {
  if (!charImg) return;
  dragging = true;
  dragStart = { x: e.offsetX, y: e.offsetY };
  startOffset = { x: offsetX, y: offsetY };
});
window.addEventListener('mouseup', () => dragging = false);
canvas.addEventListener('mousemove', e => {
  if (dragging) {
    offsetX = startOffset.x + (e.offsetX - dragStart.x);
    offsetY = startOffset.y + (e.offsetX - dragStart.y);
    drawStage();
  }
});
canvas.addEventListener('wheel', e => {
  if (!charImg) return;
  e.preventDefault();
  const z = e.deltaY < 0 ? 1.05 : 0.95,
        mx = e.offsetX,
        my = e.offsetY;
  offsetX = mx - (mx - offsetX) * z;
  offsetY = my - (my - offsetY) * z;
  scale *= z;
  drawStage();
}, { passive: false });

// Pulsanti per cambiare cornice
const nextBtn = document.createElement('button');
nextBtn.textContent = '➡ Cornice Successiva';
nextBtn.style.margin = '10px';
nextBtn.onclick = () => {
  currentFrameIndex = (currentFrameIndex + 1) % framePaths.length;
  loadFrame(currentFrameIndex);
};

const prevBtn = document.createElement('button');
prevBtn.textContent = '⬅ Cornice Precedente';
prevBtn.style.margin = '10px';
prevBtn.onclick = () => {
  currentFrameIndex = (currentFrameIndex - 1 + framePaths.length) % framePaths.length;
  loadFrame(currentFrameIndex);
};

canvas.parentElement.insertBefore(prevBtn, canvas);
canvas.parentElement.insertBefore(nextBtn, canvas);

function drawStage() {
  if (!charImg) return;

  const b = $('brightness').value,
        c = $('contrast').value,
        s = $('saturate').value,
        g = $('gamma').value / 100,
        w = $('white').value,
        k = $('black').value,
        amp = (w - k) / 255,
        ofs = k / 255;

  const filterStr = `brightness(${b}%) contrast(${c}%) saturate(${s}%) url(#tonefilter)`;
  canvas.style.filter = filterStr;

  const funcR = $('funcR'), funcG = $('funcG'), funcB = $('funcB');
  [funcR, funcG, funcB].forEach(f => {
    f.setAttribute('exponent', g);
    f.setAttribute('amplitude', amp);
    f.setAttribute('offset', ofs);
  });

  const cw = canvas.width;
  const ch = canvas.height;
  ctx.clearRect(0, 0, cw, ch);

  const w = charImg.width * scale;
  const h = charImg.height * scale;
  ctx.drawImage(charImg, 0, 0, charImg.width, charImg.height,
    offsetX - w / 2 + cw / 2,
    offsetY - h / 2 + ch / 2,
    w, h);

  if (frameImg) {
    ctx.drawImage(frameImg, 0, 0, frameImg.width, frameImg.height, 0, 0, cw, ch);
  }
}

function setCanvasSize(viewW) {
  const rect = canvas.getBoundingClientRect();
  const availH = window.innerHeight - rect.top - 24;
  const cssSize = Math.min(viewW, availH);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = cssSize * ratio;
  canvas.height = cssSize * ratio;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawStage();
}

const ro = new ResizeObserver(entries => {
  for (const e of entries) if (e.target === canvas) setCanvasSize(e.contentRect.width);
});
ro.observe(canvas);
window.addEventListener('resize', () => setCanvasSize(canvas.parentElement.clientWidth));

// Prima inizializzazione
setCanvasSize(canvas.parentElement.clientWidth);
loadFrame(currentFrameIndex);

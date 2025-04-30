// script.js aggiornato per canvas responsive mobile tramite CSS e JS semplificato

window.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const canvas = $('stage');
  const ctx = canvas.getContext('2d');

  // Loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loadingIndicator';
  loadingIndicator.innerHTML = '<div class="spinner"></div><p>Caricamento cornice...</p>';
  document.body.appendChild(loadingIndicator);

  // State
  let charImg = null;
  let frameImg = null;
  let scale = 1, offsetX = 0, offsetY = 0;
  let dragging = false, dragStart = { x: 0, y: 0 }, startOffset = { x: 0, y: 0 };
  let lastTouchDistance = null, isTouchDragging = false;

  const sliders = { brightness:100, contrast:100, saturate:100, gamma:100, white:255, black:0 };
  const framePaths = [
    'frames/frame1.png','frames/frame2.png','frames/frame3.png',
    'frames/frame4.png','frames/frame5.png','frames/frame6.png'
  ];
  let currentFrameIndex = 0;

  // Helpers
  function showLoading(show){ loadingIndicator.style.display = show ? 'flex' : 'none'; }
  function getTouchDistance(t){ const dx=t[0].clientX-t[1].clientX, dy=t[0].clientY-t[1].clientY; return Math.hypot(dx,dy); }

  function loadImageFile(f, cb){
    const img = new Image(); img.onload = () => cb(img);
    img.src = URL.createObjectURL(f);
  }

  function loadFrame(i){
    showLoading(true);
    const img=new Image();
    img.onload = () => { frameImg=img; showLoading(false); drawStage(); };
    img.src = framePaths[i];
  }

  // Events
  $('charUpload')?.addEventListener('change', e => {
    const f=e.target.files[0]; if(!f) return;
    loadImageFile(f, img=>{ charImg=img; scale=1; offsetX=0; offsetY=0; drawStage(); });
  });

  Object.keys(sliders).forEach(id=>{
    const r=$(id), n=$(id+'Val'); if(!r||!n) return;
    r.addEventListener('input',()=>{ n.value = id==='gamma'? (r.value/100).toFixed(2) : r.value; drawStage(); });
    n.addEventListener('input',()=>{ let v=n.value; if(id==='gamma') v= v*100; r.value=v; drawStage(); });
  });

  $('resetBtn')?.addEventListener('click',()=>{ for(const[k,v] of Object.entries(sliders)){ $(k).value=v; $(k+'Val').value = k==='gamma'? (v/100).toFixed(2):v;} drawStage(); });
  $('downloadBtn')?.addEventListener('click',()=>{ canvas.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='immagine-editata.png'; a.click(); URL.revokeObjectURL(a.href); },'image/png'); });
  $('nextFrameBtn')?.addEventListener('click',()=>{ currentFrameIndex=(currentFrameIndex+1)%framePaths.length; loadFrame(currentFrameIndex); });
  $('prevFrameBtn')?.addEventListener('click',()=>{ currentFrameIndex=(currentFrameIndex-1+framePaths.length)%framePaths.length; loadFrame(currentFrameIndex); });

  // Drag & zoom (mouse)
  canvas.addEventListener('mousedown',e=>{ if(!charImg) return; dragging=true; dragStart={x:e.offsetX,y:e.offsetY}; startOffset={x:offsetX,y:offsetY}; });
  window.addEventListener('mouseup',()=>dragging=false);
  canvas.addEventListener('mousemove',e=>{ if(dragging){ offsetX=startOffset.x+(e.offsetX-dragStart.x); offsetY=startOffset.y+(e.offsetY-dragStart.y); drawStage(); }});
  canvas.addEventListener('wheel',e=>{ if(!charImg)return; e.preventDefault(); const z=e.deltaY<0?1.05:0.95, mx=e.offsetX, my=e.offsetY; offsetX=mx-(mx-offsetX)*z; offsetY=my-(my-offsetY)*z; scale*=z; drawStage(); },{passive:false});

  // Touch support
  canvas.addEventListener('touchstart',e=>{ if(!charImg)return; if(e.touches.length===1){ isTouchDragging=true; dragStart={x:e.touches[0].clientX,y:e.touches[0].clientY}; startOffset={x:offsetX,y:offsetY}; } else if(e.touches.length===2){ lastTouchDistance=getTouchDistance(e.touches);} },{passive:false});
  canvas.addEventListener('touchmove',e=>{ if(!charImg)return; e.preventDefault(); if(e.touches.length===1&&isTouchDragging){ const dx=e.touches[0].clientX-dragStart.x, dy=e.touches[0].clientY-dragStart.y; offsetX=startOffset.x+dx; offsetY=startOffset.y+dy; drawStage(); } else if(e.touches.length===2){ const nd=getTouchDistance(e.touches); if(lastTouchDistance){ const z=nd/lastTouchDistance, mx=(e.touches[0].clientX+e.touches[1].clientX)/2, my=(e.touches[0].clientY+e.touches[1].clientY)/2; offsetX=mx-(mx-offsetX)*z; offsetY=my-(my-offsetY)*z; scale*=z; drawStage(); } lastTouchDistance=nd; }} ,{passive:false});
  canvas.addEventListener('touchend',()=>{ isTouchDragging=false; lastTouchDistance=null; });

  // Draw
  function drawStage(){
    const b=$('brightness')?.value||100, c=$('contrast')?.value||100, s=$('saturate')?.value||100;
    const g=($('gamma')?.value/100)||1, w=$('white')?.value||255, k=$('black')?.value||0;
    const amp=(w-k)/255, ofs=k/255;
    canvas.style.filter=`brightness(${b}%) contrast(${c}%) saturate(${s}%) url(#tonefilter)`;
    [$('funcR'),$('funcG'),$('funcB')].forEach(f=>{ if(f){ f.setAttribute('exponent',g); f.setAttribute('amplitude',amp); f.setAttribute('offset',ofs);} });
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(charImg){ const rw=charImg.width*scale, rh=charImg.height*scale; ctx.drawImage(charImg,0,0,charImg.width,charImg.height, offsetX-rw/2+canvas.width/2, offsetY-rh/2+canvas.height/2, rw,rh);}   
    if(frameImg?.complete){ ctx.drawImage(frameImg,0,0,frameImg.width,frameImg.height,0,0,canvas.width,canvas.height);}  }

  // Responsive sizing: use CSS width, JS height
  function setCanvasSize(){
    const cw=canvas.parentElement.clientWidth;
    const ratio=window.devicePixelRatio||1;
    canvas.style.width=`${cw}px`;
    canvas.style.height=`${cw}px`;
    canvas.width=cw*ratio;
    canvas.height=cw*ratio;
    ctx.setTransform(ratio,0,0,ratio,0,0);
    drawStage();
  }

  window.addEventListener('resize', setCanvasSize);
  setCanvasSize();
  loadFrame(currentFrameIndex);
});

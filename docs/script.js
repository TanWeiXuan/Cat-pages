const canvas = document.getElementById("catCanvas");
const ctx = canvas.getContext("2d");
const img = new Image();
const brushSize = document.getElementById("brushSize");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const modeBtn = document.getElementById("modeBtn");

let drawing = false;
let eraseMode = false;

// stacks for undo/redo
const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 40;

// Zoom and pan state
let scale = 1;
let translateX = 0;
let translateY = 0;
let isPanning = false;
let lastPanPos = null;

// Touch state for pinch zoom
let lastTouchDistance = null;

img.src = "cat_sitting_template.png";

img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  saveState(); // initial template state
  updateButtons();
};

// --- State Management ---
function saveState() {
  if (undoStack.length >= MAX_HISTORY) undoStack.shift();
  undoStack.push(canvas.toDataURL());
  redoStack.length = 0; // Clear redo history whenever a new action happens
  updateButtons();
}

// Apply zoom and pan transformation to the canvas
function applyTransform() {
  canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  canvas.style.transformOrigin = '0 0';
}

function undo() {
  // Need at least two states: current + a previous one to go back to
  if (undoStack.length <= 1) return;
  const popped = undoStack.pop();   // remove current
  redoStack.push(popped);           // save it so redo can restore
  const imgData = new Image();
  imgData.src = undoStack[undoStack.length - 1]; // restore the previous state
  imgData.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgData, 0, 0);
  };
  updateButtons();
}

function redo() {
  // Redo when there's at least one state in redoStack
  if (redoStack.length === 0) return;
  const state = redoStack.pop(); // restore this state
  undoStack.push(state);
  const imgData = new Image();
  imgData.src = state;
  imgData.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgData, 0, 0);
  };
  updateButtons();
}

function updateButtons() {
  undoBtn.disabled = undoStack.length <= 1;
  redoBtn.disabled = redoStack.length === 0;
}


// --- Drawing logic ---
function startDraw(e) {
  drawing = true;
  lastPos = getPos(e);
  // For draw mode we want to begin a path
  if (!eraseMode) {
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
  }
  draw(e); // draw first point immediately
}

function endDraw() {
  if (drawing) saveState();
  drawing = false;
  lastPos = null;
  ctx.beginPath();
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  // Convert from screen coordinates to canvas coordinates
  // accounting for the CSS transform (scale and translate)
  const x = (clientX - rect.left) / scale * (canvas.width / (rect.width / scale));
  const y = (clientY - rect.top) / scale * (canvas.height / (rect.height / scale));
  return { x, y };
}

function draw(e) {
  if (!drawing) return;
  const pos = getPos(e);
  const size = parseInt(brushSize.value, 10);

  if (eraseMode) {
    if (!lastPos) lastPos = pos;

    const dx = pos.x - lastPos.x;
    const dy = pos.y - lastPos.y;
    const dist = Math.hypot(dx, dy);
    const step = Math.max(1, Math.floor(size / 2));
    const steps = Math.max(1, Math.ceil(dist / step));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ix = lastPos.x + dx * t;
      const iy = lastPos.y + dy * t;

      ctx.save();
      ctx.beginPath();
      ctx.arc(ix, iy, size / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }

    lastPos = pos;
  } else {
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    lastPos = pos;
  }

  e.preventDefault();
}

// --- Zoom and Pan Functions ---
function getTouchDistance(e) {
  if (e.touches.length < 2) return null;
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.hypot(dx, dy);
}

function handleWheel(e) {
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Zoom factor
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.min(Math.max(0.5, scale * zoomFactor), 5);
  
  // Adjust translation to zoom towards mouse position
  translateX = mouseX - (mouseX - translateX) * (newScale / scale);
  translateY = mouseY - (mouseY - translateY) * (newScale / scale);
  
  scale = newScale;
  applyTransform();
}

function handleTouchStart(e) {
  if (e.touches.length === 2) {
    // Two fingers - start pinch zoom
    e.preventDefault();
    lastTouchDistance = getTouchDistance(e);
    isPanning = false;
    drawing = false;
  } else if (e.touches.length === 1) {
    // Single finger - start drawing
    lastTouchDistance = null;
    startDraw(e);
  }
}

function handleTouchMove(e) {
  if (e.touches.length === 2) {
    // Two fingers - pinch zoom and pan
    e.preventDefault();
    
    const currentDistance = getTouchDistance(e);
    if (lastTouchDistance && currentDistance) {
      // Pinch zoom
      const zoomFactor = currentDistance / lastTouchDistance;
      const newScale = Math.min(Math.max(0.5, scale * zoomFactor), 5);
      
      // Get center point between two touches
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect = canvas.getBoundingClientRect();
      const localX = centerX - rect.left;
      const localY = centerY - rect.top;
      
      // Adjust translation to zoom towards center of pinch
      translateX = localX - (localX - translateX) * (newScale / scale);
      translateY = localY - (localY - translateY) * (newScale / scale);
      
      scale = newScale;
      lastTouchDistance = currentDistance;
      applyTransform();
    }
    
    // Two-finger pan
    if (!lastPanPos) {
      lastPanPos = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
    } else {
      const currentX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      translateX += currentX - lastPanPos.x;
      translateY += currentY - lastPanPos.y;
      
      lastPanPos = { x: currentX, y: currentY };
      applyTransform();
    }
  } else if (e.touches.length === 1 && drawing) {
    // Single finger - continue drawing
    draw(e);
  }
}

function handleTouchEnd(e) {
  if (e.touches.length < 2) {
    lastTouchDistance = null;
    lastPanPos = null;
  }
  
  if (e.touches.length === 0) {
    endDraw();
  }
}

// Desktop pan with middle mouse button or Ctrl+drag
function handleMouseDown(e) {
  if (e.button === 1 || (e.ctrlKey && e.button === 0)) {
    // Middle mouse button or Ctrl+Left click for panning
    e.preventDefault();
    isPanning = true;
    lastPanPos = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grab';
  } else if (!e.ctrlKey && e.button === 0) {
    // Left click for drawing
    startDraw(e);
  }
}

function handleMouseMove(e) {
  if (isPanning) {
    e.preventDefault();
    translateX += e.clientX - lastPanPos.x;
    translateY += e.clientY - lastPanPos.y;
    lastPanPos = { x: e.clientX, y: e.clientY };
    applyTransform();
    canvas.style.cursor = 'grabbing';
  } else {
    draw(e);
  }
}

function handleMouseUp(e) {
  if (isPanning) {
    isPanning = false;
    lastPanPos = null;
    canvas.style.cursor = 'crosshair';
  } else {
    endDraw();
  }
}

// --- Event Listeners ---
canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mousemove", handleMouseMove);

// Prevent context menu on middle mouse button
canvas.addEventListener("contextmenu", (e) => {
  if (e.button === 1) e.preventDefault();
});

// Wheel event for zoom
canvas.addEventListener("wheel", handleWheel, { passive: false });

// Touch events
canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

modeBtn.addEventListener("click", () => {
  eraseMode = !eraseMode;
  modeBtn.textContent = eraseMode ? "Switch to Draw" : "Switch to Erase";
});

document.getElementById("clearBtn").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  saveState(); // after clearing, save the blank template
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  const random = Math.random().toString(36).substring(2, 7);
  link.download = `cat_sitting_${random}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "y")) {
    e.preventDefault();

    if (e.key === "z") {
      undo(); // ctrl+z or cmd+z for undo
    } else if (e.key === "y") {
      redo(); // ctrl+y or cmd+y for redo
    }
  }
});
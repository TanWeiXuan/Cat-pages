const canvas = document.getElementById("catCanvas");
const ctx = canvas.getContext("2d");
const img = new Image();
const brushSize = document.getElementById("brushSize");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

let drawing = false;

// stacks for undo/redo
const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 40;

img.src = "cat_sitting_template.png";

img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  saveState(); // initial template state
};

// --- State Management ---
function saveState() {
  if (undoStack.length >= MAX_HISTORY) undoStack.shift();
  undoStack.push(canvas.toDataURL());
  // Clear redo history whenever a new action happens
  redoStack.length = 0;
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
  draw(e);
}

function endDraw() {
  if (drawing) saveState(); // save after each stroke
  drawing = false;
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

  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  return { x, y };
}

function draw(e) {
  if (!drawing) return;
  const pos = getPos(e);

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);

  e.preventDefault();
}

// --- Event Listeners ---
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchmove", draw);

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

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

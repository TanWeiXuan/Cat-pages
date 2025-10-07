const canvas = document.getElementById("catCanvas");
const ctx = canvas.getContext("2d");
const img = new Image();
const brushSize = document.getElementById("brushSize");

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
  saveState(); // save initial template
};

// --- State Management ---
function saveState() {
  if (undoStack.length >= MAX_HISTORY) undoStack.shift();
  undoStack.push(canvas.toDataURL());
  // Clear redo history whenever a new action happens
  redoStack.length = 0;
}

function restoreState(stackFrom, stackTo) {
  if (stackFrom.length > 1) {
    // Move current state to the opposite stack
    stackTo.push(stackFrom.pop());
    const imgData = new Image();
    imgData.src = stackFrom[stackFrom.length - 1];
    imgData.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgData, 0, 0);
    };
  }
}

// --- Drawing logic ---
function startDraw(e) {
  drawing = true;
  draw(e);
}

function endDraw() {
  if (drawing) saveState(); // Save state when stroke ends
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

// --- Event listeners ---
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchmove", draw);

document.getElementById("undoBtn").addEventListener("click", () => {
  restoreState(undoStack, redoStack);
});

document.getElementById("redoBtn").addEventListener("click", () => {
  restoreState(redoStack, undoStack);
});

document.getElementById("clearBtn").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  saveState(); // Save the cleared template
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  const random = Math.random().toString(36).substring(2, 7);
  link.download = `cat_sitting_${random}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});
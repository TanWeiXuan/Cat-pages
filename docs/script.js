const canvas = document.getElementById("catCanvas");
const ctx = canvas.getContext("2d");
const img = new Image();
const brushSize = document.getElementById("brushSize");
let drawing = false;

// 🪣 keep track of undo history
const history = [];
const MAX_HISTORY = 20; // optional limit to prevent memory issues

img.src = "cat_sitting_template.png";

img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  saveState(); // initial template state
};

function saveState() {
  if (history.length >= MAX_HISTORY) history.shift(); // drop oldest
  history.push(canvas.toDataURL());
}

function restoreState() {
  if (history.length > 1) {
    history.pop(); // remove current state
    const imgData = new Image();
    imgData.src = history[history.length - 1];
    imgData.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgData, 0, 0);
    };
  }
}

function startDraw(e) {
  drawing = true;
  draw(e);
}

function endDraw() {
  if (drawing) saveState(); // 🧠 save after each stroke
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

// Event listeners
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchmove", draw);

document.getElementById("undoBtn").addEventListener("click", restoreState);

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

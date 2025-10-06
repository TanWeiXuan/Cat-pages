const canvas = document.getElementById("catCanvas");
const ctx = canvas.getContext("2d");
const img = new Image();
const brushSizeInput = document.getElementById("brushSize");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");

let drawing = false;

// Load the base image
img.src = "cat_sitting_template.png";
img.onload = () => {
  // Match canvas size to image pixel size (no scaling)
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
};

// -------- Drawing logic --------
function startDraw(e) {
  drawing = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  e.preventDefault();
}

function endDraw(e) {
  drawing = false;
  ctx.beginPath();
  e.preventDefault();
}

function draw(e) {
  if (!drawing) return;
  const pos = getPos(e);

  ctx.lineWidth = brushSizeInput.value;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);

  e.preventDefault(); // stop scrolling while drawing
}

// -------- Coordinate mapping --------
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

  // Scale touch/mouse coordinates to match actual canvas pixels
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  return { x, y };
}

// -------- Event listeners --------
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseleave", endDraw);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startDraw, { passive: false });
canvas.addEventListener("touchend", endDraw, { passive: false });
canvas.addEventListener("touchcancel", endDraw, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });

// -------- Buttons --------
clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
});

saveBtn.addEventListener("click", () => {
  const random = Math.random().toString(36).substring(2, 7);
  const filename = `cat_sitting_${random}.png`;
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

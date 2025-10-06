const canvas = document.getElementById("catCanvas");
const ctx = canvas.getContext("2d");
const img = new Image();
const brushSize = document.getElementById("brushSize");
let drawing = false;

img.src = "cat_sitting_template.png";

img.onload = () => {
  // Set canvas size to match image exactly (no scaling)
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
};

function startDraw(e) {
  drawing = true;
  draw(e);
}

function endDraw() {
  drawing = false;
  ctx.beginPath();
}

function getPos(e) {
  if (e.touches && e.touches[0]) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
      y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
    };
  } else {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }
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

  e.preventDefault(); // stop scrolling on touch
}

// Event listeners (mouse + touch)
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchmove", draw);

document.getElementById("clearBtn").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  const random = Math.random().toString(36).substring(2, 7);
  link.download = `cat_sitting_${random}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const templateImage = new Image();

templateImage.src = 'cat_sitting_template.png';

templateImage.onload = () => {
  // Set canvas size to image natural size
  canvas.width = templateImage.naturalWidth;
  canvas.height = templateImage.naturalHeight;

  // Draw the template image once loaded
  ctx.drawImage(templateImage, 0, 0);
};

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Drawing function
function drawLine(x, y) {
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  [lastX, lastY] = [x, y];
}

// Mouse Events
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  drawLine(e.offsetX, e.offsetY);
});

canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);

// Touch Events
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  isDrawing = true;

  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  lastX = touch.clientX - rect.left;
  lastY = touch.clientY - rect.top;
});

canvas.addEventListener('touchmove', (e) => {
  if (!isDrawing) return;
  e.preventDefault();

  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  drawLine(x, y);
});

canvas.addEventListener('touchend', () => isDrawing = false);
canvas.addEventListener('touchcancel', () => isDrawing = false);

// Clear Button
document.getElementById('clearBtn').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImage, 0, 0);
});

// Save Button
document.getElementById('saveBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'cat_sitting_xxxxx.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

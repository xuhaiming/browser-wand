const fs = require('fs');

// Simple function to create a minimal PNG with a solid color
function createSimplePNG(size, filename) {
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  
  // Draw rounded rectangle
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw wand shape (diamond)
  ctx.fillStyle = 'white';
  ctx.beginPath();
  const cx = size / 2;
  const top = size * 0.15;
  const bottom = size * 0.65;
  const width = size * 0.2;
  ctx.moveTo(cx, top);
  ctx.lineTo(cx + width, (top + bottom) / 2);
  ctx.lineTo(cx, bottom);
  ctx.lineTo(cx - width, (top + bottom) / 2);
  ctx.closePath();
  ctx.fill();
  
  // Draw circle at bottom
  ctx.beginPath();
  ctx.arc(cx, size * 0.8, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
}

[16, 48, 128].forEach(size => {
  createSimplePNG(size, \`icon\${size}.png\`);
});

console.log('Icons created successfully');

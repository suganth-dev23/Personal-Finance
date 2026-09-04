const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
function makeCRCTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = makeCRCTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(width, height, isMaskable = false) {
  // Build raw uncompressed scanlines
  // Filter byte (0) + RGBA per pixel
  const scanlineSize = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.48 : 0.42);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineSize;
    rawData[rowOffset] = 0; // Filter: none

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: #020617 (slate-950)
      let r = 2;
      let g = 6;
      let b = 23;
      let a = 255;

      // Outer badge / circular gradient
      if (dist <= radius) {
        // Emerald to teal gradient
        const t = (x + y) / (width + height);
        r = Math.round(5 + t * (13 - 5));     // 5 -> 13 (emerald to teal)
        g = Math.round(150 + t * (185 - 150)); // 150 -> 185
        b = Math.round(105 + t * (150 - 105)); // 105 -> 150
      } else if (!isMaskable) {
        // Soft rounded corners outside badge
        const cornerDist = Math.max(Math.abs(dx), Math.abs(dy));
        if (cornerDist > width * 0.46) {
          // Transparent outside bounds
          a = 0;
        }
      }

      // Render stylized Indian Rupee symbol silhouette in center
      // Grid coordinates mapped to -1..1
      const nx = (x - cx) / (radius * 0.65);
      const ny = (y - cy) / (radius * 0.65);

      let isSymbol = false;

      // Top bar: y in [-0.65, -0.48], x in [-0.5, 0.5]
      if (ny >= -0.65 && ny <= -0.48 && nx >= -0.5 && nx <= 0.5) {
        isSymbol = true;
      }
      // Second bar: y in [-0.38, -0.21], x in [-0.5, 0.4]
      if (ny >= -0.38 && ny <= -0.21 && nx >= -0.5 && nx <= 0.4) {
        isSymbol = true;
      }
      // Vertical stem: x in [-0.48, -0.30], y in [-0.65, 0.1]
      if (nx >= -0.48 && nx <= -0.30 && ny >= -0.65 && ny <= 0.1) {
        isSymbol = true;
      }
      // Top loop: center (0, -0.2), inner R ~ 0.2, outer R ~ 0.35, right half
      const loopDx = nx - -0.30;
      const loopDy = ny - -0.20;
      const loopDist = Math.sqrt(loopDx * loopDx + loopDy * loopDy);
      if (loopDist >= 0.18 && loopDist <= 0.38 && loopDx >= 0 && ny <= 0.15) {
        isSymbol = true;
      }
      // Diagonal slash leg: y in [0.05, 0.70], nx approx -0.30 + (ny - 0.05) * 1.15
      const legCenter = -0.30 + (ny - 0.05) * 1.15;
      if (ny >= 0.05 && ny <= 0.70 && Math.abs(nx - legCenter) <= 0.11) {
        isSymbol = true;
      }

      if (isSymbol) {
        // Pure crisp white symbol with slight glow
        r = 255;
        g = 255;
        b = 255;
        a = 255;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, false));
// 2. 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, false));
// 3. Maskable 512x512
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.png'), createPNG(512, 512, true));
// 4. Apple Touch Icon 180x180
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, true));

console.log('Successfully generated PWA icons in public/');

/* Read intrinsic pixel dimensions straight out of a PNG/JPEG/WebP header.

   Why this exists: the site previously declared width="1400" height="500" on a
   997x356 image. The browser reserves the wrong box and the page jumps as the
   image loads. Reading the real numbers at build time means a declared size can
   never drift from the file again.

   No dependencies — just the file header. */
'use strict';
const fs = require('fs');

function imgSize(file) {
  let fd;
  try { fd = fs.openSync(file, 'r'); } catch (e) { return null; }
  try {
    const head = Buffer.alloc(64);
    fs.readSync(fd, head, 0, 64, 0);

    // PNG: 8-byte signature, then IHDR whose width/height are at bytes 16..24
    if (head.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return { w: head.readUInt32BE(16), h: head.readUInt32BE(20) };
    }

    // WebP: "RIFF"...."WEBP", then a VP8/VP8L/VP8X chunk
    if (head.slice(0, 4).toString() === 'RIFF' && head.slice(8, 12).toString() === 'WEBP') {
      const kind = head.slice(12, 16).toString();
      if (kind === 'VP8X') return { w: (head.readUIntLE(24, 3) & 0xffffff) + 1,
                                    h: (head.readUIntLE(27, 3) & 0xffffff) + 1 };
      if (kind === 'VP8 ') return { w: head.readUInt16LE(26) & 0x3fff,
                                    h: head.readUInt16LE(28) & 0x3fff };
      if (kind === 'VP8L') {
        const b = head.readUInt32LE(21);
        return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
      }
      return null;
    }

    // JPEG: walk the marker segments until a Start-Of-Frame carries the size
    if (head[0] === 0xff && head[1] === 0xd8) {
      const size = fs.fstatSync(fd).size;
      const buf = Buffer.alloc(Math.min(size, 512 * 1024));
      fs.readSync(fd, buf, 0, buf.length, 0);
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        // SOF0..SOF15, excluding the DHT/JPG/DAC markers at C4/C8/CC
        if (marker >= 0xc0 && marker <= 0xcf &&
            marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    return null;
  } catch (e) {
    return null;
  } finally {
    try { fs.closeSync(fd); } catch (e) {}
  }
}

module.exports = { imgSize };

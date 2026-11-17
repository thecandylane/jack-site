// Reads the metadata a JPEG carries in its EXIF block (APP1): camera, software, times and GPS position.
// Enough for /you's photo check; not a general EXIF library. HEIC, PNG and WebP return null.
const TAGS = {
  0x010f: 'make', 0x0110: 'model', 0x0131: 'software', 0x0132: 'modified', 0x013b: 'artist',
  0x9003: 'taken', 0xa431: 'serial', 0xa434: 'lens', 0xa430: 'owner',
};
const SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

function readIfd(v, tiff, at, le, out) {
  const n = v.getUint16(tiff + at, le);
  for (let i = 0; i < n; i++) {
    const e = tiff + at + 2 + i * 12;
    const tag = v.getUint16(e, le), type = v.getUint16(e + 2, le), count = v.getUint32(e + 4, le);
    const bytes = (SIZE[type] ?? 1) * count;
    const p = bytes > 4 ? tiff + v.getUint32(e + 8, le) : e + 8;
    if (p + bytes > v.byteLength) continue;
    let val;
    if (type === 2) val = new TextDecoder().decode(new Uint8Array(v.buffer, v.byteOffset + p, count)).replace(/\0+$/, '').trim();
    else if (type === 3) val = v.getUint16(p, le);
    else if (type === 4) val = v.getUint32(p, le);
    else if (type === 5) val = Array.from({ length: count }, (_, k) => v.getUint32(p + k * 8, le) / (v.getUint32(p + k * 8 + 4, le) || 1));
    else if (type === 1 || type === 7) val = new Uint8Array(v.buffer, v.byteOffset + p, count)[0];
    out.set(tag, val);
  }
}

export function readExif(buffer) {
  const v = new DataView(buffer);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null;
  let o = 2;
  while (o + 4 <= v.byteLength) {
    const marker = v.getUint16(o), len = v.getUint16(o + 2);
    if (marker === 0xffe1 && v.getUint32(o + 4) === 0x45786966) { // "Exif"
      const tiff = o + 10, le = v.getUint16(tiff) === 0x4949;
      const ifd0 = new Map(), sub = new Map(), gps = new Map();
      readIfd(v, tiff, v.getUint32(tiff + 4, le), le, ifd0);
      if (ifd0.has(0x8769)) readIfd(v, tiff, ifd0.get(0x8769), le, sub);
      if (ifd0.has(0x8825)) readIfd(v, tiff, ifd0.get(0x8825), le, gps);
      const out = {};
      for (const m of [ifd0, sub]) for (const [tag, val] of m) if (TAGS[tag] && val !== '') out[TAGS[tag]] = val;
      const deg = (a) => (Array.isArray(a) && a.length === 3 ? a[0] + a[1] / 60 + a[2] / 3600 : null);
      const lat = deg(gps.get(2)), lon = deg(gps.get(4));
      if (lat !== null && lon !== null) {
        out.lat = +(gps.get(1) === 'S' ? -lat : lat).toFixed(6);
        out.lon = +(gps.get(3) === 'W' ? -lon : lon).toFixed(6);
        if (Array.isArray(gps.get(6))) out.altitude = Math.round(gps.get(6)[0]);
      }
      return out;
    }
    if (marker === 0xffda || (marker & 0xff00) !== 0xff00) break; // image data starts: no EXIF
    o += 2 + len;
  }
  return null;
}

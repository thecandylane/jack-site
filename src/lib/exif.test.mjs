import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readExif } from './exif.js';

// Builds a little-endian JPEG with IFD0 (Make, Model, GPS pointer) and a GPS IFD, the way a phone writes one.
function jpeg() {
  const t = new DataView(new ArrayBuffer(200));
  const le = true;
  t.setUint16(0, 0x4949); t.setUint16(2, 42, le); t.setUint32(4, 8, le);
  // IFD0 at 8: 3 entries
  t.setUint16(8, 3, le);
  const entry = (at, tag, type, count, value) => { t.setUint16(at, tag, le); t.setUint16(at + 2, type, le); t.setUint32(at + 4, count, le); t.setUint32(at + 8, value, le); };
  entry(10, 0x010f, 2, 6, 120); // Make -> "Apple\0" at 120
  entry(22, 0x0110, 2, 4, 0); new Uint8Array(t.buffer).set([...'X15\0'].map((c) => c.charCodeAt(0)), 30); // Model inline
  entry(34, 0x8825, 4, 1, 50); // GPS IFD at 50
  new Uint8Array(t.buffer).set([...'Apple\0'].map((c) => c.charCodeAt(0)), 120);
  // GPS IFD at 50: LatRef N, Lat, LonRef W, Lon
  t.setUint16(50, 4, le);
  entry(52, 1, 2, 2, 0); new Uint8Array(t.buffer).set([78, 0], 60); // "N"
  entry(64, 2, 5, 3, 130);
  entry(76, 3, 2, 2, 0); new Uint8Array(t.buffer).set([87, 0], 84); // "W"
  entry(88, 4, 5, 3, 154);
  const rat = (at, ...pairs) => pairs.forEach(([n, d], i) => { t.setUint32(at + i * 8, n, le); t.setUint32(at + i * 8 + 4, d, le); });
  rat(130, [30, 1], [24, 1], [3600, 100]); // 30°24'36" = 30.41
  rat(154, [91, 1], [10, 1], [0, 1]); // 91°10'
  const tiff = new Uint8Array(t.buffer);
  const app1 = [0xff, 0xe1, 0, tiff.length + 8, 0x45, 0x78, 0x69, 0x66, 0, 0];
  return new Uint8Array([0xff, 0xd8, ...app1, ...tiff, 0xff, 0xd9]).buffer;
}

test('reads camera and GPS from a phone photo', () => {
  assert.deepEqual(readExif(jpeg()), { make: 'Apple', model: 'X15', lat: 30.41, lon: -91.166667 });
});

test('returns null for files without EXIF', () => {
  assert.equal(readExif(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer), null);
  assert.equal(readExif(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]).buffer), null);
});

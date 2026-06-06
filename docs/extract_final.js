const fs = require('fs');
const zlib = require('zlib');

const path = process.argv[2];
const buf = fs.readFileSync(path);

const streams = [];
{
  const streamKw = Buffer.from('stream');
  const endKw = Buffer.from('endstream');
  let idx = 0;
  while (true) {
    const s = buf.indexOf(streamKw, idx);
    if (s === -1) break;
    let dataStart = s + streamKw.length;
    if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) dataStart += 2;
    else if (buf[dataStart] === 0x0a) dataStart += 1;
    else if (buf[dataStart] === 0x0d) dataStart += 1;
    const e = buf.indexOf(endKw, dataStart);
    if (e === -1) break;
    let dataEnd = e;
    if (buf[dataEnd - 1] === 0x0a) dataEnd--;
    if (buf[dataEnd - 1] === 0x0d) dataEnd--;
    streams.push(buf.slice(dataStart, dataEnd));
    idx = e + endKw.length;
  }
}

function unescape(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if (c === 0x5c) { // backslash
      const n = bytes[i + 1];
      if (n === 0x6e) { out.push(0x0a); i++; }
      else if (n === 0x72) { out.push(0x0d); i++; }
      else if (n === 0x74) { out.push(0x09); i++; }
      else if (n === 0x62) { out.push(0x08); i++; }
      else if (n === 0x66) { out.push(0x0c); i++; }
      else if (n === 0x28 || n === 0x29 || n === 0x5c) { out.push(n); i++; }
      else if (n >= 0x30 && n <= 0x37) { // octal up to 3 digits
        let oct = '';
        let k = i + 1;
        while (k < bytes.length && oct.length < 3 && bytes[k] >= 0x30 && bytes[k] <= 0x37) { oct += String.fromCharCode(bytes[k]); k++; }
        out.push(parseInt(oct, 8) & 0xff);
        i = k - 1;
      } else { out.push(n); i++; }
    } else {
      out.push(c);
    }
  }
  return Buffer.from(out);
}

function decodeGlyphs(bytes) {
  let s = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = (bytes[i] << 8) | bytes[i + 1];
    const real = code + 29;
    s += String.fromCharCode(real);
  }
  return s;
}

let allPages = [];

for (const raw of streams) {
  let data;
  try { data = zlib.inflateSync(raw); }
  catch (e1) { try { data = zlib.inflateRawSync(raw); } catch (e2) { continue; } }

  // Skip image streams (JPEG).
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8) continue;
  const head = data.slice(0, 64).toString('latin1');
  if (head.includes('JFIF')) continue;

    const text = data; // Buffer
  let i = 0;
  let page = '';
  let prevWasPositioning = false;

  function readString(start) {
    let j = start + 1;
    let depth = 1;
    const collected = [];
    while (j < text.length && depth > 0) {
      const c = text[j];
      if (c === 0x5c) { collected.push(c, text[j + 1]); j += 2; continue; }
      if (c === 0x28) { depth++; collected.push(c); j++; continue; }
      if (c === 0x29) { depth--; if (depth === 0) { j++; break; } collected.push(c); j++; continue; }
      collected.push(c); j++;
    }
    return { bytes: unescape(Buffer.from(collected)), end: j };
  }

  while (i < text.length) {
    const c = text[i];
    if (c === 0x28) { // (
      const r = readString(i);
      page += decodeGlyphs(r.bytes);
      i = r.end;
    } else if (c === 0x5b) { // [ start of TJ array
      // collect strings inside until matching ]
      let j = i + 1;
      let arrText = '';
      while (j < text.length && text[j] !== 0x5d) {
        if (text[j] === 0x28) {
          const r = readString(j);
          arrText += decodeGlyphs(r.bytes);
          j = r.end;
        } else {
          j++;
        }
      }
      page += arrText;
      i = j + 1;
    } else if (c === 0x54) { // 'T'
      const n = text[i + 1];
      if (n === 0x64 || n === 0x44 || n === 0x2a) { // Td TD T*
        page += '\n';
        i += 2;
      } else if (n === 0x6d) { // Tm -> new positioning, likely new line
        page += '\n';
        i += 2;
      } else {
        i++;
      }
    } else if (c === 0x27 || c === 0x22) { // ' or "  (next line + show)
      page += '\n';
      i++;
    } else {
      i++;
    }
  }

  const letters = (page.match(/[A-Za-z]/g) || []).length;
  if (letters < 20) continue;
  const printable = (page.match(/[\x20-\x7e\n]/g) || []).length;
  if (printable / Math.max(page.length, 1) < 0.6) continue;

  allPages.push(page);
}

let out = allPages.join('\n\n----------PAGE BREAK----------\n\n');
out = out.replace(/[ \t]+/g, ' ');
out = out.replace(/ *\n */g, '\n');
out = out.replace(/\n{3,}/g, '\n\n');

console.log(out);

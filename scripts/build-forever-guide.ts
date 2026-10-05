import { readFileSync, writeFileSync } from "fs";
import { inflateRaw } from "pako";
import { encryptForBattletag, decryptGuideFile } from "../lib/rxp-crypto";

const SOURCE_TAG = "player#1234";
const VERSION = 40000;

const savedVarsPath = process.argv[2];
const outPath = process.argv[3];

if (!savedVarsPath || !outPath) {
  console.error(
    "usage: tsx scripts/build-forever-guide.ts <RXPGuides.lua> <out.txt>",
  );
  process.exit(1);
}

function luaUnescape(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "\\") {
      out.push(s.charCodeAt(i) & 0xff);
      continue;
    }
    const n = s[++i];
    if (n === "n") out.push(10);
    else if (n === "r") out.push(13);
    else if (n === "t") out.push(9);
    else if (n >= "0" && n <= "9") {
      let d = n;
      while (d.length < 3 && s[i + 1] >= "0" && s[i + 1] <= "9") d += s[++i];
      out.push(parseInt(d, 10) & 0xff);
    } else out.push(s.charCodeAt(i) & 0xff);
  }
  return Uint8Array.from(out);
}

const raw = readFileSync(savedVarsPath, "latin1");
const marker = '["groupOrContent"] = "';
const guides: string[] = [];
let pos = 0;

while ((pos = raw.indexOf(marker, pos)) !== -1) {
  let i = pos + marker.length;
  let j = i;
  while (j < raw.length) {
    if (raw[j] === "\\") {
      j += 2;
      continue;
    }
    if (raw[j] === '"') break;
    j++;
  }
  const literal = raw.slice(i, j);
  pos = j + 1;

  let text: string;
  try {
    text = new TextDecoder("latin1").decode(inflateRaw(luaUnescape(literal)));
  } catch {
    continue;
  }

  text = text.replace(/^--\d+\r?\n/, "");
  if (!text.includes("#name")) continue;
  guides.push(text);
}

if (guides.length === 0) {
  console.error("No cached guides found in", savedVarsPath);
  process.exit(2);
}

const plaintext = guides.join("\x00");
const encrypted = encryptForBattletag(plaintext, SOURCE_TAG, VERSION);
writeFileSync(outPath, encrypted, "utf-8");

const check = decryptGuideFile(encrypted, SOURCE_TAG);
if (check.guideCount !== guides.length) {
  console.error(
    `Roundtrip mismatch: wrote ${guides.length}, read ${check.guideCount}`,
  );
  process.exit(3);
}

console.log(`Wrote ${guides.length} guides to ${outPath} for ${SOURCE_TAG}`);

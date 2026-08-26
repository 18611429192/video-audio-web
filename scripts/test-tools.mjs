import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = await readFile(resolve('src/standalone-app.js'), 'utf8');

const requiredTools = [
  'videoToAudio', 'audioFormat', 'videoToMp4', 'removeAudio', 'replaceAudio',
  'videoTrim', 'audioTrim', 'videoConcat', 'audioConcat', 'videoCompress',
  'audioCompress', 'videoResize', 'videoRatio', 'videoRotate', 'videoMirror',
  'videoSpeed', 'audioSpeed', 'volume', 'batch', 'folderBatch',
];

const missing = requiredTools.filter((key) => !new RegExp(`\\b${key}\\s*:`).test(source));
if (missing.length) throw new Error(`Missing tool definitions/processors: ${missing.join(', ')}`);

for (let i = 1; i <= 20; i++) {
  if (!source.includes(`n: ${i},`)) throw new Error(`Missing visible tool number ${i}`);
}

const requiredMarkers = [
  'WORKERFS', 'parseTracksFromLogs', 'libmp3lame', 'libx264', 'webkitdirectory',
  'webkitGetAsEntry', 'filter_complex', 'concat=n=', 'atempo=', 'volume=',
  'transpose=', 'hflip', 'scale=', 'force_original_aspect_ratio=decrease',
];
for (const marker of requiredMarkers) {
  if (!source.includes(marker)) throw new Error(`Missing implementation marker: ${marker}`);
}

const processorBlock = source.match(/const PROCESSORS\s*=\s*\{([\s\S]*?)\};/m)?.[1] || '';
for (const key of requiredTools) {
  if (!new RegExp(`\\b${key}\\s*:`).test(processorBlock)) throw new Error(`Tool not wired to processor: ${key}`);
}

console.log(`Validated ${requiredTools.length} media tools and shared FFmpeg execution paths.`);

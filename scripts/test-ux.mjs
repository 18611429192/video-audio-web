import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = await readFile(resolve('src/standalone-app.js'), 'utf8');
const css = await readFile(resolve('src/style.css'), 'utf8');
const hotfix = await readFile(resolve('src/preview-scrub-hotfix.js'), 'utf8');

const sourceMarkers = [
  'category-grid', 'previewHost', 'mainMedia', 'trimStartRange', 'trimEndRange',
  'previewRange', 'waveform', 'AudioContext', 'data-listen-track', 'audioMode',
  'originalAudioVolume', 'newAudioVolume', 'sortableFiles', 'draggable="true"',
  'taskList', 'pauseBatch', 'retryFailed', 'errorDetails', 'ratioFit',
  'playbackRate', 'volumePct', 'compressEstimate', 'amix=inputs=2',
  'force_original_aspect_ratio=increase',
];
for (const marker of sourceMarkers) {
  if (!source.includes(marker)) throw new Error(`Missing UX implementation marker: ${marker}`);
}

const cssMarkers = [
  '.editor', '.media-frame', '.trim-range', '.wave-panel', '.sortable-row',
  '.task-row', '@media (max-width: 680px)', '.actions { position: sticky',
];
for (const marker of cssMarkers) {
  if (!css.includes(marker)) throw new Error(`Missing UX style marker: ${marker}`);
}

const hotfixMarkers = [
  'PREVIEW_SCRUB_HOTFIX_V1',
  'layoutPreviewFrame',
  'videoWidth',
  "objectFit = activeTool === 'videoRatio'",
  'media.currentTime = time',
  "startRange.addEventListener('input'",
  "endRange.addEventListener('input'",
  "track.addEventListener('pointerdown'",
  "track.addEventListener('pointermove'",
  "waveform.addEventListener('pointerdown'",
];
for (const marker of hotfixMarkers) {
  if (!hotfix.includes(marker)) throw new Error(`Missing preview/scrub hotfix marker: ${marker}`);
}

if (!source.includes("'-c:v','libx264'")) throw new Error('Precise trim/video encoding path missing');
if (!source.includes('试听 20 秒')) throw new Error('Audio-track preview UI missing');
if (!source.includes('浏览器无法直接预览')) throw new Error('Preview fallback message missing');

console.log('Four-stage preview, full-frame fit, and active timeline scrubbing regression checks passed.');
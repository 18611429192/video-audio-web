import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('.');
const htmlPath = resolve(root, 'dist/index.html');
const patchPath = resolve(root, 'src/input-track-parser-override.js');

const html = await readFile(htmlPath, 'utf8');
const patch = await readFile(patchPath, 'utf8');
const marker = '<script id="ffmpeg-core-wasm-b64"';

if (!html.includes(marker)) {
  throw new Error('无法注入音轨解析修复：未找到 FFmpeg WASM 标记');
}
if (html.includes('id="input-track-parser-fix"')) {
  throw new Error('无法注入音轨解析修复：修复脚本已经存在');
}

const safePatch = patch.replace(/<\/script/gi, '<\\/script');
const injected = html.replace(
  marker,
  `<script id="input-track-parser-fix">${safePatch}</script>\n  ${marker}`,
);

await writeFile(htmlPath, injected);
console.log('Injected input-only audio track parser into dist/index.html');

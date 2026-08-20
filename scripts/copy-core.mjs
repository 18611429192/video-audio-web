import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = resolve('node_modules/@ffmpeg/core/dist/esm');
const dest = resolve('public/ffmpeg-core');
await mkdir(dest, { recursive: true });
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  await cp(resolve(src, file), resolve(dest, file));
}
console.log('Copied ffmpeg core assets to public/ffmpeg-core');

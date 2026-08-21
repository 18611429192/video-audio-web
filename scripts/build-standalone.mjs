import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('.');
const css = await readFile(resolve(root, 'src/style.css'), 'utf8');
const app = await readFile(resolve(root, 'src/standalone-app.js'), 'utf8');
const coreJS = await readFile(resolve(root, 'node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js'));
const coreWasm = await readFile(resolve(root, 'node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm'));

const workerSource = String.raw`
let core = null;
async function load({ coreURL, wasmURL }) {
  importScripts(coreURL);
  const response = await fetch(wasmURL);
  if (!response.ok) throw new Error('内置 WASM Blob 读取失败');
  const wasmBinary = new Uint8Array(await response.arrayBuffer());
  const factory = typeof createFFmpegCore === 'function' ? createFFmpegCore : self.createFFmpegCore;
  if (typeof factory !== 'function') throw new Error('内置 FFmpeg core 没有正确加载');
  const encodedLocations = btoa(JSON.stringify({ wasmURL, workerURL: '' }));
  core = await factory({ wasmBinary, mainScriptUrlOrBlob: coreURL + '#' + encodedLocations });
  core.setLogger((data) => self.postMessage({ type: 'LOG', data }));
  core.setProgress((data) => self.postMessage({ type: 'PROGRESS', data }));
  return true;
}
function exec({ args, timeout = -1 }) {
  core.setTimeout(timeout);
  core.exec(...args);
  const ret = core.ret;
  core.reset();
  return ret;
}
function writeFile({ path, data }) { core.FS.writeFile(path, data); return true; }
function readFile({ path, encoding = 'binary' }) { return core.FS.readFile(path, { encoding }); }
function deleteFile({ path }) { core.FS.unlink(path); return true; }
function createDir({ path }) { core.FS.mkdir(path); return true; }
function deleteDir({ path }) { core.FS.rmdir(path); return true; }
function mount({ fsType, options, mountPoint }) {
  const fs = core.FS.filesystems[fsType];
  if (!fs) return false;
  core.FS.mount(fs, options, mountPoint);
  return true;
}
function unmount({ mountPoint }) { core.FS.unmount(mountPoint); return true; }
self.onmessage = async ({ data: message }) => {
  const { id, type, data } = message;
  try {
    let result;
    if (type !== 'LOAD' && !core) throw new Error('FFmpeg 尚未初始化');
    if (type === 'LOAD') result = await load(data);
    else if (type === 'EXEC') result = exec(data);
    else if (type === 'WRITE_FILE') result = writeFile(data);
    else if (type === 'READ_FILE') result = readFile(data);
    else if (type === 'DELETE_FILE') result = deleteFile(data);
    else if (type === 'CREATE_DIR') result = createDir(data);
    else if (type === 'DELETE_DIR') result = deleteDir(data);
    else if (type === 'MOUNT') result = mount(data);
    else if (type === 'UNMOUNT') result = unmount(data);
    else throw new Error('未知 Worker 消息：' + type);
    const transfer = result instanceof Uint8Array ? [result.buffer] : [];
    self.postMessage({ id, type, data: result }, transfer);
  } catch (error) {
    self.postMessage({ id, type: 'ERROR', data: error && error.stack ? error.stack : String(error) });
  }
};
`;

const runtime = String.raw`
const __INLINE_WORKER_SOURCE__ = ${JSON.stringify(workerSource)};

function __inlineB64Length(b64) {
  const clean = b64.trim();
  if (!clean) return 0;
  let padding = 0;
  if (clean.endsWith('==')) padding = 2;
  else if (clean.endsWith('=')) padding = 1;
  return Math.floor(clean.length * 3 / 4) - padding;
}

async function __base64ElementToBlob(id, mime, onProgress, progressStart, progressSpan, decodedBase, decodedTotal) {
  const node = document.getElementById(id);
  if (!node) throw new Error('单文件内置资源缺失：' + id);
  const b64 = node.textContent.trim();
  const chunkChars = 1024 * 1024;
  const chunks = [];
  let decoded = 0;
  for (let offset = 0; offset < b64.length;) {
    let end = Math.min(b64.length, offset + chunkChars);
    if (end < b64.length) end -= (end - offset) % 4;
    const binary = atob(b64.slice(offset, end));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    chunks.push(bytes);
    decoded += bytes.byteLength;
    offset = end;
    if (onProgress) onProgress(progressStart + progressSpan * (b64.length ? offset / b64.length : 1), decodedBase + decoded, decodedTotal);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return new Blob(chunks, { type: mime });
}

class InlineFFmpeg {
  constructor() {
    this.worker = null;
    this.pending = new Map();
    this.nextId = 1;
    this.listeners = { log: [], progress: [] };
  }
  on(type, callback) { if (this.listeners[type]) this.listeners[type].push(callback); }
  emit(type, data) { for (const callback of this.listeners[type] || []) callback(data); }
  request(type, data, transfer = []) {
    if (!this.worker) return Promise.reject(new Error('FFmpeg Worker 尚未启动'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, data }, transfer);
    });
  }
  async load(onProgress) {
    const jsNode = document.getElementById('ffmpeg-core-js-b64');
    const wasmNode = document.getElementById('ffmpeg-core-wasm-b64');
    if (!jsNode || !wasmNode) throw new Error('HTML 中没有找到内置 FFmpeg 引擎');
    const jsSize = __inlineB64Length(jsNode.textContent);
    const wasmSize = __inlineB64Length(wasmNode.textContent);
    const total = jsSize + wasmSize;
    const jsRatio = total ? jsSize / total : 0;
    const coreBlob = await __base64ElementToBlob('ffmpeg-core-js-b64', 'text/javascript', onProgress, 0, jsRatio, 0, total);
    const wasmBlob = await __base64ElementToBlob('ffmpeg-core-wasm-b64', 'application/wasm', onProgress, jsRatio, 1 - jsRatio, jsSize, total);
    const coreURL = URL.createObjectURL(coreBlob);
    const wasmURL = URL.createObjectURL(wasmBlob);
    const workerURL = URL.createObjectURL(new Blob([__INLINE_WORKER_SOURCE__], { type: 'text/javascript' }));
    this.worker = new Worker(workerURL);
    this.worker.onmessage = ({ data: message }) => {
      if (message.type === 'LOG') { this.emit('log', message.data); return; }
      if (message.type === 'PROGRESS') { this.emit('progress', message.data); return; }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.type === 'ERROR') pending.reject(new Error(message.data));
      else pending.resolve(message.data);
    };
    this.worker.onerror = (event) => {
      const error = new Error(event.message || 'FFmpeg Worker 异常');
      for (const { reject } of this.pending.values()) reject(error);
      this.pending.clear();
    };
    try {
      await this.request('LOAD', { coreURL, wasmURL });
    } finally {
      URL.revokeObjectURL(coreURL);
      URL.revokeObjectURL(wasmURL);
      URL.revokeObjectURL(workerURL);
    }
  }
  exec(args, timeout = -1) { return this.request('EXEC', { args, timeout }); }
  writeFile(path, data) { return this.request('WRITE_FILE', { path, data }, data instanceof Uint8Array ? [data.buffer] : []); }
  readFile(path, encoding = 'binary') { return this.request('READ_FILE', { path, encoding }); }
  deleteFile(path) { return this.request('DELETE_FILE', { path }); }
  createDir(path) { return this.request('CREATE_DIR', { path }); }
  deleteDir(path) { return this.request('DELETE_DIR', { path }); }
  mount(fsType, options, mountPoint) { return this.request('MOUNT', { fsType, options, mountPoint }); }
  unmount(mountPoint) { return this.request('UNMOUNT', { mountPoint }); }
  terminate() {
    if (this.worker) this.worker.terminate();
    this.worker = null;
    const error = new Error('FFmpeg 已终止');
    for (const { reject } of this.pending.values()) reject(error);
    this.pending.clear();
  }
}
`;

const escapeScript = (text) => text.replace(/<\/script/gi, '<\\/script');
const jsB64 = coreJS.toString('base64');
const wasmB64 = coreWasm.toString('base64');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#0b1020" />
  <meta name="description" content="完全离线、单 HTML 文件的视频音频分离与 MP3 转换工具" />
  <title>视频音频分离 · 单文件离线版</title>
  <style>${css}</style>
</head>
<body>
  <main id="app"><div class="shell"><div class="card" style="padding:24px">正在加载单文件离线工具…</div></div></main>
  <script>${escapeScript(runtime)}\n${escapeScript(app)}</script>
  <script id="ffmpeg-core-js-b64" type="application/octet-stream">${jsB64}</script>
  <script id="ffmpeg-core-wasm-b64" type="application/octet-stream">${wasmB64}</script>
</body>
</html>`;

await rm(resolve(root, 'dist'), { recursive: true, force: true });
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/index.html'), html);
console.log(`Built standalone dist/index.html: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
console.log(`Embedded FFmpeg core JS: ${(coreJS.byteLength / 1024).toFixed(1)} KB`);
console.log(`Embedded FFmpeg WASM: ${(coreWasm.byteLength / 1024 / 1024).toFixed(2)} MB`);

import { FFmpeg, FFFSType } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="shell">
    <header class="hero">
      <div><h1>视频 → MP3</h1><p>音视频分离与 MP3 转换，全部在你的浏览器本地完成。</p></div>
      <div class="badge">🔒 文件不会上传</div>
    </header>
    <section class="card">
      <div id="drop" class="drop">
        <h2>把视频拖到这里</h2>
        <p>支持 FFmpeg 能识别的常见视频容器和音频编码。手机会优先直接挂载本地文件，减少大文件内存占用。</p>
        <button id="pick" class="primary">选择视频</button>
        <input id="file" class="hidden" type="file" accept="video/*,.mkv,.m4v,.ts,.m2ts,.flv,.avi,.webm,.mov,.mp4,.mts,.vob,.3gp" />
      </div>
      <div id="panel" class="file-panel hidden">
        <div class="file-head"><div><div id="fileName" class="file-name"></div><div id="fileMeta" class="meta"></div></div><button id="replace" class="secondary">换一个视频</button></div>
        <div id="warning" class="warning hidden"></div>
        <div class="grid">
          <div class="control"><label for="quality">MP3 音质</label><select id="quality"><option value="vbr2">智能 VBR · 高质量（推荐）</option><option value="128">128 kbps · 标准</option><option value="192">192 kbps · 高质量</option><option value="256">256 kbps · 很高</option><option value="320">320 kbps · 最高固定码率</option></select></div>
          <div class="control"><label>处理模式</label><div style="line-height:1.55">使用 FFmpeg 只读探测读取音轨信息，不调用当前手机端容易 Aborted() 的 ffprobe；手机优先通过 WORKERFS 直接读取本地视频。</div></div>
        </div>
        <div id="tracks" class="tracks"></div>
        <div class="actions"><button id="convert" class="primary" disabled>转换所选音轨</button><button id="cancel" class="secondary hidden">取消</button></div>
        <div id="status" class="status hidden"><div class="status-row"><span id="statusText">准备中…</span><span id="percent">0%</span></div><div id="progressTrack" class="progress"><div id="bar"></div></div><div id="log" class="log"></div></div>
        <div id="results" class="results"></div>
      </div>
    </section>
    <div class="footer">首次使用会下载约 32 MB 的 FFmpeg WebAssembly 核心并保存到浏览器 Cache Storage；后续优先读取本地缓存。<br />视频内容不会上传到服务器。手机处理超大文件仍受浏览器内存和系统资源限制。</div>
  </div>`;

const el = (id) => document.getElementById(id);
const pick = el('pick'), fileInput = el('file'), drop = el('drop'), panel = el('panel');
const fileName = el('fileName'), fileMeta = el('fileMeta'), warning = el('warning'), tracksEl = el('tracks');
const convertBtn = el('convert'), cancelBtn = el('cancel'), statusBox = el('status'), statusText = el('statusText');
const percent = el('percent'), bar = el('bar'), progressTrack = el('progressTrack'), logEl = el('log'), resultsEl = el('results'), quality = el('quality');

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const MOUNT_POINT = '/input';
const CORE_VERSION = '0.12.10';
const ENGINE_CACHE = 'video-audio-web-ffmpeg-v4-core-0.12.10';
const CACHE_PREFIX = 'video-audio-web-ffmpeg-';
const MOBILE_MEMORY_FALLBACK_LIMIT = 300 * 1024 * 1024;
const DESKTOP_MEMORY_FALLBACK_LIMIT = 1536 * 1024 * 1024;

let currentFile = null;
let currentTracks = [];
let ffmpeg = null;
let ffmpegLoaded = false;
let busy = false;
let inputPath = '';
let inputMode = '';
let logBuffer = [];
let cacheSource = '';
let analysisMethod = '';

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 2 : 1)} ${units[i]}`;
}
function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '时长未知';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}
function safeStem(name) { return (name.replace(/\.[^.]+$/, '') || 'audio').replace(/[\\/:*?"<>|]/g, '_'); }
function safeExt(name) { const m = name.match(/\.([a-zA-Z0-9]{1,8})$/); return m ? `.${m[1].toLowerCase()}` : '.bin'; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function recentLogs(max = 12) { return logBuffer.slice(-max).join('\n').trim(); }

function setProgress(value, text, label) {
  progressTrack.classList.remove('indeterminate');
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  bar.style.width = `${pct}%`;
  percent.textContent = label || `${pct}%`;
  if (text) statusText.textContent = text;
}
function setIndeterminate(text, label = '处理中') {
  progressTrack.classList.add('indeterminate');
  bar.style.width = '';
  percent.textContent = label;
  if (text) statusText.textContent = text;
}
function resetOutput() {
  resultsEl.innerHTML = '';
  logEl.textContent = '';
  setProgress(0, '准备中…');
}
function showWarning(message) {
  warning.textContent = message;
  warning.classList.remove('hidden');
}
function clearWarning() { warning.classList.add('hidden'); warning.textContent = ''; }
function showSizeWarning(file) {
  clearWarning();
  const mb = file.size / 1024 / 1024;
  if (isMobile && mb >= 800) {
    showWarning(`这段视频约 ${formatBytes(file.size)}。本版本会优先直接挂载文件以降低内存占用，但手机浏览器仍可能因系统资源限制中断。建议保持页面前台并避免锁屏。`);
  } else if (!isMobile && mb >= 4096) {
    showWarning(`这段视频约 ${formatBytes(file.size)}。超大文件在浏览器 WebAssembly 中仍可能受内存和文件系统限制。`);
  }
}

function getCoreAssets() {
  const cdnBase = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`;
  const base = new URL('./', window.location.href).href;
  return [
    { key: 'core', sourceURL: `${cdnBase}/ffmpeg-core.js`, cacheKey: new URL('__ffmpeg-cache__/ffmpeg-core.js', base).href, type: 'text/javascript' },
    { key: 'wasm', sourceURL: `${cdnBase}/ffmpeg-core.wasm`, cacheKey: new URL('__ffmpeg-cache__/ffmpeg-core.wasm', base).href, type: 'application/wasm' },
  ];
}

function getClassWorkerURL() {
  const viteBase = typeof import.meta.env !== 'undefined' ? import.meta.env.BASE_URL : '';
  if (viteBase) return new URL(`${viteBase}ffmpeg-class-worker.js`, window.location.origin).href;
  return new URL('./ffmpeg-class-worker.js', import.meta.url).href;
}

async function openEngineCache() {
  if (!('caches' in window)) return null;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== ENGINE_CACHE).map((key) => caches.delete(key)));
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
    return await caches.open(ENGINE_CACHE);
  } catch (error) {
    console.warn('Cache Storage 不可用', error);
    return null;
  }
}

async function loadEngineAssets() {
  const assets = getCoreAssets();
  const cache = await openEngineCache();
  const blobs = {};
  const missing = [];

  for (const asset of assets) {
    let cached = null;
    try { cached = cache ? await cache.match(asset.cacheKey) : null; } catch {}
    if (cached) {
      const blob = await cached.blob();
      if (blob.size > 0) {
        blobs[asset.key] = blob;
        continue;
      }
    }
    missing.push(asset);
  }

  if (!missing.length) {
    cacheSource = 'local';
    setProgress(1, '已从本地缓存读取转换引擎，正在初始化…', '已缓存');
    return blobs;
  }

  cacheSource = 'network';
  let downloaded = 0;
  setIndeterminate('正在下载转换引擎：已接收 0 B', '下载中');

  for (const asset of missing) {
    const response = await fetch(asset.sourceURL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`转换引擎下载失败：${asset.sourceURL}（HTTP ${response.status}）`);
    let blob;
    if (!response.body) {
      blob = await response.blob();
      downloaded += blob.size;
      setIndeterminate(`正在下载转换引擎：已接收 ${formatBytes(downloaded)}`, '下载中');
    } else {
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        downloaded += value.byteLength;
        setIndeterminate(`正在下载转换引擎：已接收 ${formatBytes(downloaded)}`, '下载中');
      }
      blob = new Blob(chunks, { type: asset.type });
    }
    blobs[asset.key] = blob;
    if (cache) {
      try {
        await cache.put(asset.cacheKey, new Response(blob, { headers: { 'Content-Type': asset.type } }));
      } catch (error) {
        console.warn('写入 FFmpeg 缓存失败', error);
      }
    }
  }

  for (const asset of assets) {
    if (!blobs[asset.key] && cache) {
      const cached = await cache.match(asset.cacheKey);
      if (cached) blobs[asset.key] = await cached.blob();
    }
  }
  if (!blobs.core || !blobs.wasm) throw new Error('转换引擎缓存不完整，请刷新页面后重试。');
  setProgress(1, `下载完成（${formatBytes(downloaded)}），正在初始化 FFmpeg…`, '100%');
  return blobs;
}

async function ensureFFmpeg() {
  if (ffmpegLoaded && ffmpeg) return;
  statusBox.classList.remove('hidden');
  setProgress(0, '正在准备转换引擎…');
  let coreObjectURL = '';
  let wasmObjectURL = '';
  try {
    const assets = await loadEngineAssets();
    coreObjectURL = URL.createObjectURL(new Blob([assets.core], { type: 'text/javascript' }));
    wasmObjectURL = URL.createObjectURL(new Blob([assets.wasm], { type: 'application/wasm' }));
    ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
      logBuffer.push(message);
      if (logBuffer.length > 500) logBuffer.shift();
      logEl.textContent = message;
    });
    ffmpeg.on('progress', ({ progress }) => {
      if (busy && Number.isFinite(progress) && statusText.textContent.includes('转换')) setProgress(progress, statusText.textContent);
    });
    const classWorkerURL = getClassWorkerURL();
    if (cacheSource === 'local') setProgress(1, '本地缓存已读取，正在初始化 FFmpeg…', '已缓存');
    else setProgress(1, '下载完成，正在初始化 FFmpeg…', '100%');
    await ffmpeg.load({ classWorkerURL, coreURL: coreObjectURL, wasmURL: wasmObjectURL });
    ffmpegLoaded = true;
    setProgress(1, cacheSource === 'local' ? '转换引擎已就绪（来自本地缓存）' : '转换引擎已就绪');
  } catch (error) {
    setProgress(0, '转换引擎加载失败');
    logEl.textContent = error?.message || String(error);
    throw error;
  } finally {
    if (coreObjectURL) URL.revokeObjectURL(coreObjectURL);
    if (wasmObjectURL) URL.revokeObjectURL(wasmObjectURL);
  }
}

async function cleanupInput() {
  if (!ffmpeg) { inputPath = ''; inputMode = ''; return; }
  if (inputMode === 'workerfs') {
    await ffmpeg.unmount(MOUNT_POINT).catch(() => {});
    await ffmpeg.deleteDir(MOUNT_POINT).catch(() => {});
  } else if (inputMode === 'memfs' && inputPath) {
    await ffmpeg.deleteFile(inputPath).catch(() => {});
  }
  inputPath = '';
  inputMode = '';
}

async function attachInputFile(file) {
  await cleanupInput();
  setProgress(0, '正在挂载视频文件…');
  try {
    await ffmpeg.createDir(MOUNT_POINT).catch(() => {});
    const mounted = await ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, MOUNT_POINT);
    if (!mounted) throw new Error('WORKERFS 不可用');
    inputPath = `${MOUNT_POINT}/${file.name}`;
    inputMode = 'workerfs';
    setProgress(1, '视频已直接挂载，准备分析…');
    return;
  } catch (mountError) {
    console.warn('WORKERFS 挂载失败，尝试内存模式', mountError);
    await switchInputToMemory(file, '直接挂载不可用');
  }
}

async function switchInputToMemory(file, reason = '正在切换兼容模式') {
  const limit = isMobile ? MOBILE_MEMORY_FALLBACK_LIMIT : DESKTOP_MEMORY_FALLBACK_LIMIT;
  if (file.size > limit) throw new Error(`${reason}，且文件 ${formatBytes(file.size)} 过大，不适合整文件读入浏览器内存。请在电脑端处理或使用更小的视频。`);
  await cleanupInput();
  inputPath = `input${safeExt(file.name)}`;
  inputMode = 'memfs';
  setIndeterminate(`${reason}，正在以内存兼容模式读取 ${formatBytes(file.size)}…`, '读取中');
  await ffmpeg.writeFile(inputPath, await fetchFile(file));
  setProgress(1, '视频读取完成，准备分析…');
}

function parseDurationFromLogs(lines) {
  for (const line of lines) {
    const m = line.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
  return 0;
}

function parseTracksFromLogs(lines) {
  const tracks = [];
  for (const line of lines) {
    if (!/Stream #0:\d+/i.test(line) || !/Audio:/i.test(line)) continue;
    const head = line.match(/Stream #0:(\d+)(?:\[[^\]]+\])?(?:\(([^)]+)\))?.*?Audio:\s*(.+)$/i);
    if (!head) continue;
    const streamIndex = Number(head[1]);
    const lang = head[2] || '未标注语言';
    const audio = head[3].trim();
    const parts = audio.split(',').map((part) => part.trim());
    const codec = parts[0] || '未知编码';
    const samplePos = parts.findIndex((part) => /\d+\s*Hz/i.test(part));
    const sampleRate = audio.match(/(\d+)\s*Hz/i)?.[1];
    const channelLayout = samplePos >= 0 && parts[samplePos + 1] ? parts[samplePos + 1] : '';
    const bitrate = audio.match(/(\d+(?:\.\d+)?)\s*kb\/s/i)?.[1];
    if (!Number.isFinite(streamIndex)) continue;
    tracks.push({
      ordinal: tracks.length,
      streamIndex,
      lang,
      title: '',
      codec,
      sampleRate: sampleRate ? `${sampleRate} Hz` : '',
      channels: '',
      channelLayout,
      bitrate: bitrate ? `${Math.round(Number(bitrate))} kb/s` : '',
    });
  }
  return tracks;
}

async function probeInputFromFFmpegLogs() {
  logBuffer = [];
  setIndeterminate('正在读取视频容器和音轨信息…', '分析中');
  const code = await ffmpeg.exec([
    '-hide_banner',
    '-i', inputPath,
    '-map', '0:a?',
    '-c', 'copy',
    '-frames:a', '1',
    '-f', 'null',
    '-',
  ]).catch(() => -1);
  const lines = [...logBuffer];
  const tracks = parseTracksFromLogs(lines);
  const duration = parseDurationFromLogs(lines);
  const inputLine = lines.find((line) => /Input #0,/i.test(line)) || '';
  const formatName = inputLine.match(/Input #0,\s*(.+?),\s*from\s/i)?.[1] || 'FFmpeg 流信息识别';

  if (!tracks.length && !inputLine) {
    const details = recentLogs(24);
    throw new Error(`FFmpeg 无法读取该视频的媒体流信息（返回码 ${code}）。${details ? `\n${details}` : ''}`);
  }

  analysisMethod = 'FFmpeg 只读流探测';
  return { duration, formatName, tracks };
}

async function analyzeInput() {
  return await probeInputFromFFmpegLogs();
}

function renderTracks(tracks) {
  if (!tracks.length) {
    tracksEl.innerHTML = '<div class="warning">已经读取到媒体文件，但没有发现音频流。视频可能确实不含音频，或当前 FFmpeg WebAssembly 构建不支持该音轨。</div>';
    convertBtn.disabled = true;
    return;
  }
  tracksEl.innerHTML = tracks.map((t, i) => {
    const title = t.title ? ` · ${escapeHtml(t.title)}` : '';
    const detail = [t.codec, t.channelLayout || t.channels, t.sampleRate, t.bitrate, `Stream #0:${t.streamIndex}`].filter(Boolean).map(escapeHtml).join(' · ');
    return `<label class="track"><input type="checkbox" name="track" value="${t.streamIndex}" ${i === 0 ? 'checked' : ''} /><div><strong>音轨 ${i + 1} · ${escapeHtml(t.lang)}${title}</strong><span>${detail}</span></div></label>`;
  }).join('');
  convertBtn.disabled = false;
}

function classifyAnalysisError(error, file) {
  const message = error?.message || String(error);
  const lower = message.toLowerCase();
  if (/memory|out of bounds|allocation|array buffer|quota|oom/.test(lower)) return `分析失败：浏览器可用内存不足。文件大小为 ${formatBytes(file.size)}。手机端建议关闭其他页面后重试，或在电脑端处理。\n${message}`;
  if (/mount|workerfs/.test(lower)) return `分析失败：浏览器无法直接挂载该视频文件。\n${message}`;
  if (/fetch|network|http|worker|engine/.test(lower)) return `分析失败：转换引擎或资源加载异常。\n${message}`;
  if (/invalid data|moov atom|format|媒体流信息|aborted/.test(lower)) return `分析失败：FFmpeg 无法解析该视频容器或媒体结构。\n${message}`;
  return `无法分析这个视频：${message}`;
}

async function loadFile(file) {
  if (!file || busy) return;
  currentFile = file;
  currentTracks = [];
  analysisMethod = '';
  panel.classList.remove('hidden');
  fileName.textContent = file.name;
  fileMeta.textContent = `${formatBytes(file.size)} · 正在准备分析…`;
  showSizeWarning(file);
  tracksEl.innerHTML = '';
  resetOutput();
  convertBtn.disabled = true;
  try {
    busy = true;
    statusBox.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
    await ensureFFmpeg();
    await attachInputFile(file);
    const media = await analyzeInput();
    currentTracks = media.tracks;
    fileMeta.textContent = `${formatBytes(file.size)} · ${formatDuration(media.duration)} · ${media.formatName || '未知容器'} · ${media.tracks.length} 条音轨 · ${inputMode === 'workerfs' ? '直接挂载' : '内存兼容模式'} · ${analysisMethod}`;
    renderTracks(media.tracks);
    setProgress(1, '分析完成');
  } catch (error) {
    console.error(error);
    statusText.textContent = '分析失败';
    logEl.textContent = error?.message || String(error);
    showWarning(classifyAnalysisError(error, file));
    await cleanupInput().catch(() => {});
  } finally {
    busy = false;
    cancelBtn.classList.add('hidden');
  }
}

function qualityArgs() { return quality.value === 'vbr2' ? ['-q:a', '2'] : ['-b:a', `${quality.value}k`]; }

async function convertSelected() {
  const selectedIndexes = new Set([...document.querySelectorAll('input[name="track"]:checked')].map((x) => Number(x.value)));
  const selected = currentTracks.filter((track) => selectedIndexes.has(track.streamIndex));
  if (!currentFile || !selected.length || busy || !inputPath) return;
  busy = true;
  resetOutput();
  statusBox.classList.remove('hidden');
  cancelBtn.classList.remove('hidden');
  convertBtn.disabled = true;
  try {
    await ensureFFmpeg();
    const stem = safeStem(currentFile.name);
    for (let i = 0; i < selected.length; i++) {
      const track = selected[i];
      const outputName = `${stem}_音轨${track.ordinal + 1}.mp3`;
      setProgress(0, `正在转换音轨 ${track.ordinal + 1}（${i + 1}/${selected.length}）…`);
      logBuffer = [];
      const code = await ffmpeg.exec([
        '-i', inputPath,
        '-map', `0:${track.streamIndex}`,
        '-vn',
        '-c:a', 'libmp3lame',
        ...qualityArgs(),
        '-map_metadata', '-1',
        '-y', outputName,
      ]);
      if (code !== 0) throw new Error(`音轨 ${track.ordinal + 1} 转换失败（FFmpeg 返回码 ${code}）${recentLogs() ? `\n${recentLogs()}` : ''}`);
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const item = document.createElement('div');
      item.className = 'result';
      item.innerHTML = `<div><strong>${escapeHtml(outputName)}</strong><span>${formatBytes(blob.size)} · MP3 · Stream #0:${track.streamIndex}</span></div><a class="secondary" href="${url}" download="${escapeHtml(outputName)}" style="text-decoration:none;text-align:center">保存 MP3</a>`;
      resultsEl.appendChild(item);
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
    setProgress(1, `完成：已生成 ${selected.length} 个 MP3`);
  } catch (error) {
    console.error(error);
    statusText.textContent = '转换失败';
    logEl.textContent = error?.message || String(error);
    showWarning(`转换失败：${error?.message || String(error)}`);
  } finally {
    busy = false;
    cancelBtn.classList.add('hidden');
    convertBtn.disabled = false;
  }
}

async function cancelWork() {
  if (!busy || !ffmpeg) return;
  try { ffmpeg.terminate(); } catch {}
  ffmpeg = null;
  ffmpegLoaded = false;
  inputPath = '';
  inputMode = '';
  currentTracks = [];
  busy = false;
  cancelBtn.classList.add('hidden');
  convertBtn.disabled = true;
  setProgress(0, '已取消。再次选择视频时会重新初始化引擎。');
}

pick.addEventListener('click', () => fileInput.click());
el('replace').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => loadFile(fileInput.files?.[0]));
convertBtn.addEventListener('click', convertSelected);
cancelBtn.addEventListener('click', cancelWork);
drop.addEventListener('dragover', (event) => { event.preventDefault(); drop.classList.add('drag'); });
drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
drop.addEventListener('drop', (event) => {
  event.preventDefault();
  drop.classList.remove('drag');
  const file = event.dataTransfer?.files?.[0];
  if (file) loadFile(file);
});
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
          <div class="control"><label>处理模式</label><div style="line-height:1.55">使用 ffprobe 精确读取音轨；优先通过 WORKERFS 直接读取本地视频。</div></div>
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
const ENGINE_CACHE = 'video-audio-web-ffmpeg-v3-core-0.12.10';
const CACHE_PREFIX = 'video-audio-web-ffmpeg-';
const CORE_VERSION = '0.12.10';
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

function setProgress(value, text, label) {
  progressTrack.classList.remove('indeterminate');
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  bar.style.width = `${pct}%`;
  percent.textContent = label || `${pct}%`;
  if (text) statusText.textContent = text;
}
function setIndeterminate(text, label = '下载中') {
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

function getCoreURLs() {
  const viteBase = typeof import.meta.env !== 'undefined' ? import.meta.env.BASE_URL : '';
  if (viteBase) {
    return {
      core: new URL(`${viteBase}ffmpeg-core/ffmpeg-core.js`, window.location.origin).href,
      wasm: new URL(`${viteBase}ffmpeg-core/ffmpeg-core.wasm`, window.location.origin).href,
    };
  }
  const cdnBase = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`;
  return { core: `${cdnBase}/ffmpeg-core.js`, wasm: `${cdnBase}/ffmpeg-core.wasm` };
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
  const urls = getCoreURLs();
  const assets = [
    { key: 'core', url: urls.core, type: 'text/javascript' },
    { key: 'wasm', url: urls.wasm, type: 'application/wasm' },
  ];
  const cache = await openEngineCache();
  const blobs = {};
  const missing = [];

  for (const asset of assets) {
    let cached = null;
    try { cached = cache ? await cache.match(asset.url) : null; } catch {}
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
  const responses = await Promise.all(missing.map(async (asset) => {
    const response = await fetch(asset.url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`转换引擎下载失败：${asset.url}（HTTP ${response.status}）`);
    return { asset, response };
  }));

  const sameOrigin = responses.every(({ asset }) => new URL(asset.url, location.href).origin === location.origin);
  const lengths = responses.map(({ response }) => Number(response.headers.get('content-length')) || 0);
  const encoded = responses.some(({ response }) => Boolean(response.headers.get('content-encoding')));
  const exactTotal = sameOrigin && !encoded && lengths.every((n) => n > 0) ? lengths.reduce((a, b) => a + b, 0) : 0;
  let downloaded = 0;

  if (exactTotal) setProgress(0, `正在下载转换引擎：0 B / ${formatBytes(exactTotal)}`);
  else setIndeterminate('正在下载转换引擎：已接收 0 B');

  await Promise.all(responses.map(async ({ asset, response }) => {
    let blob;
    if (!response.body) {
      blob = await response.blob();
      downloaded += blob.size;
      if (exactTotal) setProgress(Math.min(1, downloaded / exactTotal), `正在下载转换引擎：${formatBytes(downloaded)} / ${formatBytes(exactTotal)}`);
      else setIndeterminate(`正在下载转换引擎：已接收 ${formatBytes(downloaded)}`);
    } else {
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        downloaded += value.byteLength;
        if (exactTotal) setProgress(Math.min(1, downloaded / exactTotal), `正在下载转换引擎：${formatBytes(downloaded)} / ${formatBytes(exactTotal)}`);
        else setIndeterminate(`正在下载转换引擎：已接收 ${formatBytes(downloaded)}`);
      }
      blob = new Blob(chunks, { type: asset.type });
    }
    blobs[asset.key] = blob;
    if (cache) {
      try {
        await cache.put(asset.url, new Response(blob, { headers: { 'Content-Type': asset.type, 'Content-Length': String(blob.size) } }));
      } catch (error) {
        console.warn('写入 FFmpeg 缓存失败', error);
      }
    }
  }));

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

    if (cacheSource === 'local') setProgress(1, '本地缓存已读取，正在初始化 FFmpeg…', '已缓存');
    else setProgress(1, '下载完成，正在初始化 FFmpeg…', '100%');

    ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
      logBuffer.push(message);
      if (logBuffer.length > 400) logBuffer.shift();
      logEl.textContent = message;
    });
    ffmpeg.on('progress', ({ progress }) => {
      if (busy && Number.isFinite(progress)) setProgress(progress, statusText.textContent);
    });
    await ffmpeg.load({ coreURL: coreObjectURL, wasmURL: wasmObjectURL });
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
    await ffmpeg.unmount(MOUNT_POINT).catch(() => {});
    await ffmpeg.deleteDir(MOUNT_POINT).catch(() => {});
    console.warn('WORKERFS 挂载失败，尝试内存模式', mountError);

    const limit = isMobile ? MOBILE_MEMORY_FALLBACK_LIMIT : DESKTOP_MEMORY_FALLBACK_LIMIT;
    if (file.size > limit) {
      throw new Error(`浏览器无法直接挂载这个文件，且文件 ${formatBytes(file.size)} 过大，不适合退回整文件内存读取。请换最新版浏览器或在电脑端处理。`);
    }

    inputPath = `input${safeExt(file.name)}`;
    inputMode = 'memfs';
    setIndeterminate(`直接挂载不可用，正在以内存兼容模式读取 ${formatBytes(file.size)}…`, '读取中');
    await ffmpeg.writeFile(inputPath, await fetchFile(file));
    setProgress(1, '视频读取完成，准备分析…');
  }
}

async function probeInput() {
  const probePath = 'probe-result.json';
  await ffmpeg.deleteFile(probePath).catch(() => {});
  setIndeterminate('正在用 ffprobe 读取容器和音轨信息…', '分析中');
  const code = await ffmpeg.ffprobe([
    '-v', 'error',
    '-show_entries', 'format=duration,format_name:stream=index,codec_type,codec_name,sample_rate,channels,channel_layout,bit_rate,duration:stream_tags=language,title',
    '-of', 'json',
    inputPath,
    '-o', probePath,
  ]);
  if (code !== 0) throw new Error(`ffprobe 无法解析该视频（返回码 ${code}）`);

  const raw = await ffmpeg.readFile(probePath, 'utf8');
  await ffmpeg.deleteFile(probePath).catch(() => {});
  const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
  let info;
  try { info = JSON.parse(text); } catch { throw new Error('ffprobe 已运行，但返回的媒体信息无法解析。'); }

  const streams = Array.isArray(info.streams) ? info.streams : [];
  const audioStreams = streams.filter((s) => s.codec_type === 'audio');
  const durationCandidates = [Number(info.format?.duration), ...streams.map((s) => Number(s.duration))].filter((n) => Number.isFinite(n) && n > 0);
  const duration = durationCandidates.length ? Math.max(...durationCandidates) : 0;

  return {
    duration,
    formatName: info.format?.format_name || '',
    tracks: audioStreams.map((s, ordinal) => ({
      ordinal,
      streamIndex: Number(s.index),
      lang: s.tags?.language || '未标注语言',
      title: s.tags?.title || '',
      codec: s.codec_name || '未知编码',
      sampleRate: s.sample_rate ? `${s.sample_rate} Hz` : '',
      channels: Number.isFinite(Number(s.channels)) ? `${s.channels} ch` : '',
      channelLayout: s.channel_layout || '',
      bitrate: s.bit_rate ? `${Math.round(Number(s.bit_rate) / 1000)} kb/s` : '',
    })).filter((t) => Number.isFinite(t.streamIndex)),
  };
}

function renderTracks(tracks) {
  if (!tracks.length) {
    tracksEl.innerHTML = '<div class="warning">ffprobe 成功读取了这个文件，但没有发现音频流。视频可能确实不含音频，或该音轨类型不在当前 FFmpeg WebAssembly 构建中。</div>';
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
  if (/memory|out of bounds|allocation|array buffer|quota|oom/.test(lower)) {
    return `分析失败：浏览器可用内存不足。文件大小为 ${formatBytes(file.size)}。手机端建议关闭其他页面后重试，或在电脑端处理。\n${message}`;
  }
  if (/mount|workerfs/.test(lower)) return `分析失败：浏览器无法直接挂载该视频文件。\n${message}`;
  if (/ffprobe|invalid data|moov atom|format/.test(lower)) return `分析失败：FFmpeg 无法解析该视频容器或媒体结构。\n${message}`;
  if (/fetch|network|http|engine/.test(lower)) return `分析失败：转换引擎或资源加载异常。\n${message}`;
  return `无法分析这个视频：${message}`;
}

async function loadFile(file) {
  if (!file || busy) return;
  currentFile = file;
  currentTracks = [];
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
    const media = await probeInput();
    currentTracks = media.tracks;
    fileMeta.textContent = `${formatBytes(file.size)} · ${formatDuration(media.duration)} · ${media.formatName || '未知容器'} · ${media.tracks.length} 条音轨 · ${inputMode === 'workerfs' ? '直接挂载' : '内存兼容模式'}`;
    renderTracks(media.tracks);
    setProgress(1, '分析完成');
  } catch (error) {
    console.error(error);
    statusText.textContent = '分析失败';
    const detail = classifyAnalysisError(error, file);
    logEl.textContent = error?.message || String(error);
    showWarning(detail);
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
      if (code !== 0) throw new Error(`音轨 ${track.ordinal + 1} 转换失败（FFmpeg 返回码 ${code}）`);
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
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

const app = document.querySelector('#app');

const TOOL_GROUPS = [
  { title: '格式转换', tools: ['videoToAudio', 'audioFormat', 'videoToMp4'] },
  { title: '裁剪与拼接', tools: ['removeAudio', 'replaceAudio', 'videoTrim', 'audioTrim', 'videoConcat', 'audioConcat'] },
  { title: '压缩', tools: ['videoCompress', 'audioCompress'] },
  { title: '画面与声音', tools: ['videoResize', 'videoRatio', 'videoRotate', 'videoMirror', 'videoSpeed', 'audioSpeed', 'volume'] },
  { title: '批量', tools: ['batch', 'folderBatch'] },
];

const TOOLS = {
  videoToAudio: { n: 1, title: '视频转音频', desc: 'MP4 / MOV / MKV 等视频提取为 MP3、WAV 或 M4A。单文件可选择真实音轨。', accept: 'video/*,.mkv,.m4v,.ts,.m2ts,.flv,.avi,.webm,.mov,.mp4,.mts,.vob,.3gp', multiple: true },
  audioFormat: { n: 2, title: '音频转格式', desc: 'MP3、WAV、M4A、AAC、FLAC 互相转换。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true },
  videoToMp4: { n: 3, title: '视频转 MP4', desc: '优先无损重新封装；不兼容时自动转为 H.264 + AAC。', accept: 'video/*,.mkv,.mov,.avi,.webm,.m4v,.ts,.m2ts,.flv,.mts,.vob,.3gp', multiple: true },
  removeAudio: { n: 4, title: '去除视频声音', desc: '直接移除全部音频流，视频画面尽量无损复制。', accept: 'video/*,.mkv,.mov,.avi,.webm,.mp4,.m4v,.ts,.m2ts', multiple: true },
  replaceAudio: { n: 5, title: '添加 / 替换音频', desc: '选择一个视频和一段音乐，生成带新声音的视频。', accept: 'video/*,.mkv,.mov,.avi,.webm,.mp4,.m4v', multiple: false },
  videoTrim: { n: 6, title: '视频裁剪', desc: '输入开始和结束时间，快速截取一段视频。', accept: 'video/*,.mkv,.mov,.avi,.webm,.mp4,.m4v,.ts,.m2ts', multiple: true },
  audioTrim: { n: 7, title: '音频裁剪', desc: '按开始和结束时间截取音频片段。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true },
  videoConcat: { n: 8, title: '视频拼接', desc: '按文件选择顺序将多个编码一致的视频合并。', accept: 'video/*,.mp4,.mkv,.mov,.ts,.m2ts,.webm', multiple: true, minFiles: 2 },
  audioConcat: { n: 9, title: '音频拼接', desc: '将多段音频按顺序合成为一个 MP3。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true, minFiles: 2 },
  videoCompress: { n: 10, title: '视频压缩', desc: '高质量、推荐、小体积三个简单档位。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true },
  audioCompress: { n: 11, title: '音频压缩', desc: '输出 320、192 或 128 kbps MP3。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true },
  videoResize: { n: 12, title: '视频改尺寸', desc: '一键输出 1080P、720P 或 480P。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true },
  videoRatio: { n: 13, title: '视频改比例', desc: '输出 16:9、9:16 或 1:1，自动留边避免画面变形。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true },
  videoRotate: { n: 14, title: '视频旋转', desc: '顺时针旋转 90°、180° 或 270°。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true },
  videoMirror: { n: 15, title: '视频镜像', desc: '左右翻转或上下翻转视频。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true },
  videoSpeed: { n: 16, title: '视频倍速', desc: '0.5x、1.5x 或 2x，画面与声音一起变速。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true },
  audioSpeed: { n: 17, title: '音频倍速', desc: '0.5x、1.5x 或 2x，并尽量保持正常音调。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true },
  volume: { n: 18, title: '调整音量', desc: '输出 50%、100%、150% 或 200% 音量。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true },
  batch: { n: 19, title: '批量处理多个文件', desc: '一次选择多个文件，按同一种规则顺序处理。', accept: 'audio/*,video/*,.mp3,.wav,.m4a,.aac,.flac,.mp4,.mkv,.mov,.avi,.webm', multiple: true },
  folderBatch: { n: 20, title: '拖入文件夹批量处理', desc: '选择或拖入整个文件夹，自动读取其中的媒体文件并批量处理。', accept: 'audio/*,video/*', multiple: true, folder: true },
};

app.innerHTML = `
  <div class="shell">
    <header class="hero">
      <div><h1>音视频工具箱</h1><p>20 个常用音视频功能，全部在本机浏览器中完成。</p></div>
      <div class="badge">🔒 完全离线 · 文件不上传</div>
    </header>

    <section class="toolbox card">
      <div class="toolbox-head"><div><strong>选择功能</strong><span>简单选项，不需要理解 FFmpeg 参数</span></div><span class="count">20 个工具</span></div>
      <div id="toolGroups" class="tool-groups"></div>
    </section>

    <section class="workspace card">
      <div class="workspace-head">
        <div><span id="toolNo" class="tool-no"></span><h2 id="toolTitle"></h2><p id="toolDesc"></p></div>
        <button id="clear" class="ghost">清空</button>
      </div>

      <div id="drop" class="drop">
        <div class="drop-icon">＋</div>
        <h3 id="dropTitle">选择媒体文件</h3>
        <p id="dropHint">也可以把文件拖到这里</p>
        <div class="drop-actions">
          <button id="pick" class="primary">选择文件</button>
          <button id="pickFolder" class="secondary hidden">选择文件夹</button>
        </div>
        <input id="file" class="hidden" type="file" />
        <input id="folder" class="hidden" type="file" webkitdirectory directory multiple />
      </div>

      <div id="selection" class="selection hidden">
        <div class="selection-head"><strong id="selectionTitle">已选择</strong><span id="selectionMeta"></span></div>
        <div id="fileList" class="file-list"></div>
      </div>

      <div id="options" class="options"></div>
      <div id="tracksBox" class="tracks-box hidden"><div class="section-title">音轨</div><div id="tracks" class="tracks"></div></div>
      <div id="warning" class="warning hidden"></div>

      <div class="actions">
        <button id="run" class="primary" disabled>开始处理</button>
        <button id="cancel" class="secondary hidden">取消</button>
      </div>

      <div id="status" class="status hidden">
        <div class="status-row"><span id="statusText">准备中…</span><span id="percent">0%</span></div>
        <div id="progressTrack" class="progress"><div id="bar"></div></div>
        <div id="log" class="log"></div>
      </div>
      <div id="results" class="results"></div>
    </section>

    <div class="footer">FFmpeg WebAssembly 引擎完整内置在单个 HTML 中。Pages 在线打开后可处理本机文件，也可将页面保存为单文件离线使用。超大文件仍受浏览器内存与系统资源限制。</div>
  </div>`;

const el = (id) => document.getElementById(id);
const toolGroupsEl = el('toolGroups');
const toolNo = el('toolNo'), toolTitle = el('toolTitle'), toolDesc = el('toolDesc');
const drop = el('drop'), dropTitle = el('dropTitle'), dropHint = el('dropHint');
const pick = el('pick'), pickFolder = el('pickFolder'), fileInput = el('file'), folderInput = el('folder');
const selection = el('selection'), selectionTitle = el('selectionTitle'), selectionMeta = el('selectionMeta'), fileList = el('fileList');
const optionsEl = el('options'), tracksBox = el('tracksBox'), tracksEl = el('tracks'), warning = el('warning');
const runBtn = el('run'), cancelBtn = el('cancel'), statusBox = el('status'), statusText = el('statusText');
const percent = el('percent'), bar = el('bar'), progressTrack = el('progressTrack'), logEl = el('log'), resultsEl = el('results');

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const MOUNT_POINT = '/input';
const MOBILE_MEMORY_FALLBACK_LIMIT = 300 * 1024 * 1024;
const DESKTOP_MEMORY_FALLBACK_LIMIT = 1536 * 1024 * 1024;
const VIDEO_EXTS = new Set(['mp4','mkv','mov','avi','webm','m4v','ts','m2ts','mts','flv','vob','3gp']);
const AUDIO_EXTS = new Set(['mp3','wav','m4a','aac','flac','ogg','opus','wma']);

let activeTool = 'videoToAudio';
let selectedFiles = [];
let secondaryFile = null;
let currentTracks = [];
let ffmpeg = null;
let ffmpegLoaded = false;
let busy = false;
let mountedMode = '';
let mountedPaths = [];
let mountedMemFiles = [];
let logBuffer = [];
let resultURLs = [];
let progressBase = 0;
let progressSpan = 1;

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 2 : 1)} ${units[i]}`;
}
function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '时长未知';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  return [h,m,s].map((v) => String(v).padStart(2,'0')).join(':');
}
function safeStem(name) { return (name.replace(/\.[^.]+$/, '') || 'output').replace(/[\\/:*?"<>|]/g, '_'); }
function extOf(name) { return (name.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1] || '').toLowerCase(); }
function safeExt(name, fallback = 'bin') { const ext = extOf(name); return `.${ext || fallback}`; }
function recentLogs(max = 20) { return logBuffer.slice(-max).join('\n').trim(); }
function isVideoFile(file) { return file.type.startsWith('video/') || VIDEO_EXTS.has(extOf(file.name)); }
function isAudioFile(file) { return file.type.startsWith('audio/') || AUDIO_EXTS.has(extOf(file.name)); }
function getOption(id, fallback = '') { return document.getElementById(id)?.value ?? fallback; }
function parseClock(value) {
  const text = String(value || '').trim();
  if (!text) return 0;
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  const parts = text.split(':').map(Number);
  if (parts.some((v) => !Number.isFinite(v))) return NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
}
function mimeFor(ext) {
  return ({mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',aac:'audio/aac',flac:'audio/flac',mp4:'video/mp4',mkv:'video/x-matroska',mov:'video/quicktime',webm:'video/webm'})[ext] || 'application/octet-stream';
}

function showWarning(message) { warning.textContent = message; warning.classList.remove('hidden'); }
function clearWarning() { warning.classList.add('hidden'); warning.textContent = ''; }
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
function clearResults() {
  for (const url of resultURLs) URL.revokeObjectURL(url);
  resultURLs = [];
  resultsEl.innerHTML = '';
  logEl.textContent = '';
}
function renderToolGroups() {
  toolGroupsEl.innerHTML = TOOL_GROUPS.map((group) => `<div class="tool-group"><div class="tool-group-title">${group.title}</div><div class="tool-buttons">${group.tools.map((key) => {
    const t = TOOLS[key];
    return `<button class="tool-button ${key === activeTool ? 'active' : ''}" data-tool="${key}"><span>${t.n}</span>${t.title}</button>`;
  }).join('')}</div></div>`).join('');
  toolGroupsEl.querySelectorAll('[data-tool]').forEach((button) => button.addEventListener('click', () => selectTool(button.dataset.tool)));
}
function optionSelect(id, label, choices, selected) {
  return `<div class="control"><label for="${id}">${label}</label><select id="${id}">${choices.map(([value, text]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${text}</option>`).join('')}</select></div>`;
}
function timeInputs() {
  return `<div class="control"><label for="startTime">开始时间</label><input id="startTime" value="00:00:00" placeholder="00:00:00" /></div><div class="control"><label for="endTime">结束时间</label><input id="endTime" value="00:00:10" placeholder="00:00:10" /></div>`;
}
function renderOptions() {
  let html = '';
  if (activeTool === 'videoToAudio') html = optionSelect('audioOutFormat','输出格式',[['mp3','MP3 · 推荐'],['wav','WAV · 无压缩'],['m4a','M4A · AAC']], 'mp3');
  else if (activeTool === 'audioFormat') html = optionSelect('audioOutFormat','转换为',[['mp3','MP3'],['wav','WAV'],['m4a','M4A'],['aac','AAC'],['flac','FLAC']], 'mp3');
  else if (activeTool === 'replaceAudio') html = `<div class="control wide"><label>新音频</label><div class="inline-pick"><button id="pickSecond" class="secondary">选择音乐 / 音频</button><span id="secondName">尚未选择</span></div><input id="secondFile" class="hidden" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus" /></div>`;
  else if (activeTool === 'videoTrim' || activeTool === 'audioTrim') html = timeInputs();
  else if (activeTool === 'videoCompress') html = optionSelect('compressLevel','压缩档位',[['high','高质量'],['balanced','推荐'],['small','小体积']], 'balanced');
  else if (activeTool === 'audioCompress') html = optionSelect('audioBitrate','输出码率',[['320','320 kbps'],['192','192 kbps · 推荐'],['128','128 kbps · 小体积']], '192');
  else if (activeTool === 'videoResize') html = optionSelect('videoHeight','输出尺寸',[['1080','1080P'],['720','720P · 推荐'],['480','480P']], '720');
  else if (activeTool === 'videoRatio') html = optionSelect('videoRatio','画面比例',[['16:9','16:9 · 横屏'],['9:16','9:16 · 竖屏'],['1:1','1:1 · 方形']], '16:9');
  else if (activeTool === 'videoRotate') html = optionSelect('rotate','旋转角度',[['90','90°'],['180','180°'],['270','270°']], '90');
  else if (activeTool === 'videoMirror') html = optionSelect('mirror','镜像方向',[['h','左右翻转'],['v','上下翻转']], 'h');
  else if (activeTool === 'videoSpeed' || activeTool === 'audioSpeed') html = optionSelect('speed','播放速度',[['0.5','0.5x'],['1.5','1.5x'],['2','2x']], '1.5');
  else if (activeTool === 'volume') html = optionSelect('volume','音量',[['0.5','50%'],['1','100%'],['1.5','150%'],['2','200%']], '1.5');
  else if (activeTool === 'batch' || activeTool === 'folderBatch') html = optionSelect('batchAction','批量操作',[['videoToAudio','视频 → MP3'],['videoToMp4','视频 → MP4'],['removeAudio','视频去声音'],['videoCompress','视频压缩（推荐）'],['audioToMp3','音频 → MP3']], 'videoToAudio');
  optionsEl.innerHTML = html ? `<div class="option-grid">${html}</div>` : '';
  if (activeTool === 'replaceAudio') {
    el('pickSecond').addEventListener('click', () => el('secondFile').click());
    el('secondFile').addEventListener('change', (event) => {
      secondaryFile = event.target.files?.[0] || null;
      el('secondName').textContent = secondaryFile ? `${secondaryFile.name} · ${formatBytes(secondaryFile.size)}` : '尚未选择';
      updateRunButton();
    });
  }
}
function selectTool(key) {
  if (!TOOLS[key] || busy) return;
  activeTool = key;
  resetSelection();
  renderToolGroups();
  const tool = TOOLS[key];
  toolNo.textContent = `#${tool.n}`;
  toolTitle.textContent = tool.title;
  toolDesc.textContent = tool.desc;
  fileInput.accept = tool.accept;
  fileInput.multiple = Boolean(tool.multiple);
  dropTitle.textContent = tool.folder ? '把文件夹拖到这里' : (tool.minFiles ? '选择多个文件' : '选择媒体文件');
  dropHint.textContent = tool.folder ? '也可以点击“选择文件夹”' : (tool.multiple ? '支持多选，也可以把文件拖到这里' : '也可以把文件拖到这里');
  pick.classList.toggle('hidden', Boolean(tool.folder));
  pickFolder.classList.toggle('hidden', !tool.folder);
  renderOptions();
  updateRunButton();
}
function resetSelection() {
  selectedFiles = [];
  secondaryFile = null;
  currentTracks = [];
  fileInput.value = '';
  folderInput.value = '';
  selection.classList.add('hidden');
  fileList.innerHTML = '';
  tracksBox.classList.add('hidden');
  tracksEl.innerHTML = '';
  clearWarning();
  clearResults();
  statusBox.classList.add('hidden');
}
function renderFiles() {
  if (!selectedFiles.length) { selection.classList.add('hidden'); updateRunButton(); return; }
  selection.classList.remove('hidden');
  const total = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  selectionTitle.textContent = activeTool === 'folderBatch' ? `文件夹内媒体 · ${selectedFiles.length} 个` : `已选择 ${selectedFiles.length} 个文件`;
  selectionMeta.textContent = formatBytes(total);
  fileList.innerHTML = selectedFiles.map((file, index) => `<div class="file-row"><span class="file-index">${index + 1}</span><div><strong>${escapeHtml(file.webkitRelativePath || file.name)}</strong><small>${formatBytes(file.size)}</small></div></div>`).join('');
  if (isMobile && total > 800 * 1024 * 1024) showWarning(`已选择 ${formatBytes(total)} 文件。手机浏览器处理超大媒体时可能因系统资源限制中断，建议保持页面前台。`);
  updateRunButton();
}
function updateRunButton() {
  const tool = TOOLS[activeTool];
  const enough = selectedFiles.length >= (tool.minFiles || 1);
  const secondOkay = activeTool !== 'replaceAudio' || Boolean(secondaryFile);
  runBtn.disabled = busy || !enough || !secondOkay;
}
function setFiles(files) {
  if (busy) return;
  let list = [...files].filter((file) => file && file.size >= 0);
  if (!TOOLS[activeTool].multiple && list.length > 1) list = list.slice(0, 1);
  selectedFiles = list;
  currentTracks = [];
  tracksBox.classList.add('hidden');
  clearResults();
  clearWarning();
  renderFiles();
  if (activeTool === 'videoToAudio' && selectedFiles.length === 1) analyzeTracksForSelected().catch(() => {});
}

async function ensureFFmpeg() {
  if (ffmpegLoaded && ffmpeg) return;
  statusBox.classList.remove('hidden');
  setProgress(0, '正在展开内置 FFmpeg 引擎…');
  ffmpeg = new InlineFFmpeg();
  ffmpeg.on('log', ({ message }) => {
    logBuffer.push(message);
    if (logBuffer.length > 600) logBuffer.shift();
    logEl.textContent = message;
  });
  ffmpeg.on('progress', ({ progress }) => {
    if (busy && Number.isFinite(progress)) setProgress(progressBase + Math.max(0, Math.min(1, progress)) * progressSpan, statusText.textContent);
  });
  try {
    await ffmpeg.load((ratio, decoded, total) => setProgress(ratio * 0.9, `正在展开内置 FFmpeg 引擎：${formatBytes(decoded)} / ${formatBytes(total)}`));
    ffmpegLoaded = true;
    setProgress(1, '内置转换引擎已就绪');
  } catch (error) {
    ffmpeg = null;
    ffmpegLoaded = false;
    throw new Error(`FFmpeg 引擎初始化失败：${error?.message || error}`);
  }
}
async function cleanupMounted() {
  if (!ffmpeg) { mountedMode = ''; mountedPaths = []; mountedMemFiles = []; return; }
  if (mountedMode === 'workerfs') {
    await ffmpeg.unmount(MOUNT_POINT).catch(() => {});
    await ffmpeg.deleteDir(MOUNT_POINT).catch(() => {});
  } else if (mountedMode === 'memfs') {
    for (const path of mountedMemFiles) await ffmpeg.deleteFile(path).catch(() => {});
  }
  mountedMode = '';
  mountedPaths = [];
  mountedMemFiles = [];
}
async function mountFiles(files) {
  await cleanupMounted();
  const total = files.reduce((sum, f) => sum + f.size, 0);
  try {
    await ffmpeg.createDir(MOUNT_POINT).catch(() => {});
    const mounted = await ffmpeg.mount('WORKERFS', { files }, MOUNT_POINT);
    if (!mounted) throw new Error('WORKERFS 不可用');
    mountedMode = 'workerfs';
    mountedPaths = files.map((file) => `${MOUNT_POINT}/${file.name}`);
    return mountedPaths;
  } catch (error) {
    await cleanupMounted().catch(() => {});
    const limit = isMobile ? MOBILE_MEMORY_FALLBACK_LIMIT : DESKTOP_MEMORY_FALLBACK_LIMIT;
    if (total > limit) throw new Error(`浏览器无法直接挂载文件，而且 ${formatBytes(total)} 超过内存兼容模式的安全范围。建议换电脑端浏览器处理。`);
    mountedMode = 'memfs';
    mountedPaths = [];
    for (let i = 0; i < files.length; i++) {
      const path = `input_${i}${safeExt(files[i].name)}`;
      setIndeterminate(`正在以内存兼容模式读取 ${i + 1}/${files.length}：${files[i].name}`, '读取中');
      await ffmpeg.writeFile(path, new Uint8Array(await files[i].arrayBuffer()));
      mountedPaths.push(path);
      mountedMemFiles.push(path);
    }
    return mountedPaths;
  }
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
  const seen = new Set();
  let insideInput = false;
  for (const raw of lines) {
    const line = String(raw || '');
    if (/\bInput #0,/i.test(line)) { insideInput = true; continue; }
    if (insideInput && /\bOutput #0,/i.test(line)) break;
    if (!insideInput || !/Stream #0:\d+/i.test(line) || !/Audio:/i.test(line)) continue;
    const head = line.match(/Stream #0:(\d+)(?:\[[^\]]+\])?(?:\(([^)]+)\))?.*?Audio:\s*(.+)$/i);
    if (!head) continue;
    const streamIndex = Number(head[1]);
    if (!Number.isFinite(streamIndex) || seen.has(streamIndex)) continue;
    seen.add(streamIndex);
    const audio = head[3].trim(), parts = audio.split(',').map((part) => part.trim());
    const samplePos = parts.findIndex((part) => /\d+\s*Hz/i.test(part));
    tracks.push({ ordinal: tracks.length, streamIndex, lang: head[2] || '未标注语言', codec: parts[0] || '未知编码', sampleRate: audio.match(/(\d+)\s*Hz/i)?.[1] ? `${audio.match(/(\d+)\s*Hz/i)[1]} Hz` : '', channelLayout: samplePos >= 0 ? (parts[samplePos + 1] || '') : '', bitrate: audio.match(/(\d+(?:\.\d+)?)\s*kb\/s/i)?.[1] ? `${Math.round(Number(audio.match(/(\d+(?:\.\d+)?)\s*kb\/s/i)[1]))} kb/s` : '' });
  }
  return tracks;
}
async function analyzeTracksForSelected() {
  if (busy || selectedFiles.length !== 1 || activeTool !== 'videoToAudio') return;
  busy = true; updateRunButton(); clearWarning(); statusBox.classList.remove('hidden'); cancelBtn.classList.remove('hidden');
  try {
    await ensureFFmpeg();
    const [path] = await mountFiles(selectedFiles);
    logBuffer = [];
    setIndeterminate('正在识别视频中的音轨…', '分析中');
    await ffmpeg.exec(['-hide_banner','-i',path,'-map','0:a?','-c','copy','-frames:a','1','-f','null','-']).catch(() => -1);
    currentTracks = parseTracksFromLogs([...logBuffer]);
    const duration = parseDurationFromLogs(logBuffer);
    if (duration) selectionMeta.textContent = `${formatBytes(selectedFiles[0].size)} · ${formatDuration(duration)} · ${currentTracks.length} 条音轨`;
    renderTracks();
    setProgress(1, currentTracks.length ? `识别到 ${currentTracks.length} 条真实音轨` : '没有检测到音频流');
  } catch (error) {
    showWarning(`音轨分析失败：${error?.message || error}`);
  } finally {
    busy = false; cancelBtn.classList.add('hidden'); updateRunButton();
  }
}
function renderTracks() {
  tracksBox.classList.remove('hidden');
  if (!currentTracks.length) {
    tracksEl.innerHTML = '<div class="empty-note">没有检测到音频流。</div>';
    return;
  }
  tracksEl.innerHTML = currentTracks.map((t, i) => `<label class="track"><input type="checkbox" name="track" value="${t.streamIndex}" ${i === 0 ? 'checked' : ''}/><div><strong>音轨 ${i + 1} · ${escapeHtml(t.lang)}</strong><span>${[t.codec,t.channelLayout,t.sampleRate,t.bitrate,`Stream #0:${t.streamIndex}`].filter(Boolean).map(escapeHtml).join(' · ')}</span></div></label>`).join('');
}

function audioEncodeArgs(format, bitrate = '192') {
  if (format === 'wav') return ['-vn','-c:a','pcm_s16le'];
  if (format === 'm4a') return ['-vn','-c:a','aac','-b:a',`${bitrate}k`];
  if (format === 'aac') return ['-vn','-c:a','aac','-b:a',`${bitrate}k`];
  if (format === 'flac') return ['-vn','-c:a','flac'];
  return ['-vn','-c:a','libmp3lame','-b:a',`${bitrate}k`];
}
function videoEncodeArgs(crf = '24', audioBitrate = '128k') { return ['-c:v','libx264','-preset','ultrafast','-crf',crf,'-pix_fmt','yuv420p','-c:a','aac','-b:a',audioBitrate,'-movflags','+faststart']; }
function trimRangeArgs() {
  const start = parseClock(getOption('startTime'));
  const end = parseClock(getOption('endTime'));
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) throw new Error('结束时间必须大于开始时间，例如 00:00:05 到 00:00:20。');
  return ['-ss',String(start),'-t',String(end - start)];
}
async function execFF(args, label, base = 0, span = 1) {
  progressBase = base; progressSpan = span; logBuffer = [];
  setProgress(base, label);
  const code = await ffmpeg.exec(args);
  if (code !== 0) throw new Error(`${label}失败（FFmpeg 返回码 ${code}）${recentLogs() ? `\n${recentLogs()}` : ''}`);
  return code;
}
async function execTry(primary, fallback, outputName, label, base = 0, span = 1) {
  progressBase = base; progressSpan = span; logBuffer = [];
  setProgress(base, label);
  let code = await ffmpeg.exec(primary).catch(() => -1);
  if (code === 0) return;
  await ffmpeg.deleteFile(outputName).catch(() => {});
  logBuffer = [];
  code = await ffmpeg.exec(fallback);
  if (code !== 0) throw new Error(`${label}失败（FFmpeg 返回码 ${code}）${recentLogs() ? `\n${recentLogs()}` : ''}`);
}
async function addResult(outputName, description) {
  const data = await ffmpeg.readFile(outputName);
  const ext = extOf(outputName);
  const blob = new Blob([data], { type: mimeFor(ext) });
  const url = URL.createObjectURL(blob);
  resultURLs.push(url);
  const item = document.createElement('div');
  item.className = 'result';
  item.innerHTML = `<div><strong>${escapeHtml(outputName)}</strong><span>${formatBytes(blob.size)}${description ? ` · ${escapeHtml(description)}` : ''}</span></div><a class="secondary" href="${url}" download="${escapeHtml(outputName)}">保存文件</a>`;
  resultsEl.appendChild(item);
  await ffmpeg.deleteFile(outputName).catch(() => {});
}

async function processPerFile(files, worker) {
  for (let i = 0; i < files.length; i++) {
    const [path] = await mountFiles([files[i]]);
    const base = i / files.length, span = 1 / files.length;
    await worker(files[i], path, i, base, span);
  }
}
async function doVideoToAudio() {
  const format = getOption('audioOutFormat','mp3');
  if (selectedFiles.length === 1 && currentTracks.length) {
    const checked = new Set([...document.querySelectorAll('input[name="track"]:checked')].map((node) => Number(node.value)));
    const tracks = currentTracks.filter((track) => checked.has(track.streamIndex));
    if (!tracks.length) throw new Error('请至少选择一条音轨。');
    const [path] = await mountFiles(selectedFiles);
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i], out = `${safeStem(selectedFiles[0].name)}_音轨${t.ordinal + 1}.${format}`;
      await execFF(['-i',path,'-map',`0:${t.streamIndex}`,...audioEncodeArgs(format),'-map_metadata','-1','-y',out],`正在转换音轨 ${t.ordinal + 1}`,i / tracks.length,1 / tracks.length);
      await addResult(out, `${format.toUpperCase()} · Stream #0:${t.streamIndex}`);
    }
    return;
  }
  await processPerFile(selectedFiles, async (file, path, i, base, span) => {
    const out = `${safeStem(file.name)}_音频.${format}`;
    await execFF(['-i',path,'-map','0:a:0',...audioEncodeArgs(format),'-map_metadata','-1','-y',out],`视频转音频 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out, format.toUpperCase());
  });
}
async function doAudioFormat() {
  const format = getOption('audioOutFormat','mp3');
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_转换.${format}`;
    await execFF(['-i',path,...audioEncodeArgs(format),'-y',out],`音频转换 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out, format.toUpperCase());
  });
}
async function doVideoToMp4() {
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_MP4.mp4`;
    await execTry(['-i',path,'-map','0:v:0','-map','0:a?','-c','copy','-movflags','+faststart','-y',out], ['-i',path,'-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-y',out], out, `视频转 MP4 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,'MP4');
  });
}
async function doRemoveAudio() {
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const ext = extOf(file.name) || 'mp4', out = `${safeStem(file.name)}_无声.${ext}`;
    await execFF(['-i',path,'-map','0:v:0','-c:v','copy','-an','-y',out],`去除声音 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,'无声视频');
  });
}
async function doReplaceAudio() {
  if (!secondaryFile) throw new Error('请选择要添加到视频的新音频。');
  const [videoPath,audioPath] = await mountFiles([selectedFiles[0],secondaryFile]);
  const out = `${safeStem(selectedFiles[0].name)}_新音频.mp4`;
  await execTry(['-i',videoPath,'-i',audioPath,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart','-y',out], ['-i',videoPath,'-i',audioPath,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart','-y',out], out, '正在添加 / 替换音频');
  await addResult(out,'新音频视频');
}
async function doVideoTrim() {
  const range = trimRangeArgs();
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const ext = extOf(file.name) || 'mp4', out = `${safeStem(file.name)}_裁剪.${ext}`;
    await execFF([...range,'-i',path,'-map','0','-c','copy','-avoid_negative_ts','make_zero','-y',out],`视频裁剪 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,'视频片段');
  });
}
async function doAudioTrim() {
  const range = trimRangeArgs();
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const ext = extOf(file.name) || 'mp3', out = `${safeStem(file.name)}_裁剪.${ext}`;
    await execFF([...range,'-i',path,'-vn','-c:a','copy','-y',out],`音频裁剪 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,'音频片段');
  });
}
function concatLine(path) { return `file '${path.replace(/'/g, "'\\''")}'`; }
async function doVideoConcat() {
  const paths = await mountFiles(selectedFiles);
  const listName = 'concat_video.txt';
  await ffmpeg.writeFile(listName, new TextEncoder().encode(paths.map(concatLine).join('\n')));
  const out = '视频拼接.mp4';
  try {
    await execFF(['-f','concat','-safe','0','-i',listName,'-map','0:v:0','-map','0:a?','-c','copy','-movflags','+faststart','-y',out],'正在拼接视频');
    await addResult(out,'拼接视频');
  } catch (error) {
    throw new Error(`${error.message}\n视频拼接要求各段编码、分辨率和参数基本一致。若素材不同，请先用“视频转 MP4”统一后再拼接。`);
  } finally { await ffmpeg.deleteFile(listName).catch(() => {}); }
}
async function doAudioConcat() {
  const paths = await mountFiles(selectedFiles);
  const args = [];
  for (const path of paths) args.push('-i',path);
  const inputs = paths.map((_,i) => `[${i}:a:0]`).join('');
  const out = '音频拼接.mp3';
  await execFF([...args,'-filter_complex',`${inputs}concat=n=${paths.length}:v=0:a=1[outa]`,'-map','[outa]','-c:a','libmp3lame','-b:a','192k','-y',out],'正在拼接音频');
  await addResult(out,'MP3');
}
async function doVideoCompress() {
  const level = getOption('compressLevel','balanced');
  const cfg = level === 'high' ? ['20','160k','高质量'] : level === 'small' ? ['30','96k','小体积'] : ['25','128k','推荐'];
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_压缩.mp4`;
    await execFF(['-i',path,...videoEncodeArgs(cfg[0],cfg[1]),'-y',out],`视频压缩 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,cfg[2]);
  });
}
async function doAudioCompress() {
  const rate = getOption('audioBitrate','192');
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_${rate}k.mp3`;
    await execFF(['-i',path,'-vn','-c:a','libmp3lame','-b:a',`${rate}k`,'-y',out],`音频压缩 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,`${rate} kbps`);
  });
}
async function doVideoResize() {
  const height = getOption('videoHeight','720');
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_${height}P.mp4`;
    await execFF(['-i',path,'-vf',`scale=-2:${height}`,...videoEncodeArgs('23','128k'),'-y',out],`调整尺寸 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,`${height}P`);
  });
}
async function doVideoRatio() {
  const ratio = getOption('videoRatio','16:9');
  const cfg = ratio === '9:16' ? [720,1280] : ratio === '1:1' ? [1080,1080] : [1280,720];
  const vf = `scale=${cfg[0]}:${cfg[1]}:force_original_aspect_ratio=decrease,pad=${cfg[0]}:${cfg[1]}:(ow-iw)/2:(oh-ih)/2`;
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_${ratio.replace(':','x')}.mp4`;
    await execFF(['-i',path,'-vf',vf,...videoEncodeArgs('23','128k'),'-y',out],`修改比例 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,ratio);
  });
}
async function doVideoRotate() {
  const value = getOption('rotate','90');
  const vf = value === '180' ? 'transpose=1,transpose=1' : value === '270' ? 'transpose=2' : 'transpose=1';
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_旋转${value}.mp4`;
    await execFF(['-i',path,'-vf',vf,...videoEncodeArgs('23','128k'),'-y',out],`视频旋转 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,`${value}°`);
  });
}
async function doVideoMirror() {
  const value = getOption('mirror','h'), vf = value === 'v' ? 'vflip' : 'hflip';
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_${value === 'v' ? '上下' : '左右'}镜像.mp4`;
    await execFF(['-i',path,'-vf',vf,...videoEncodeArgs('23','128k'),'-y',out],`视频镜像 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,'镜像视频');
  });
}
async function doVideoSpeed() {
  const speed = Number(getOption('speed','1.5'));
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_${speed}x.mp4`;
    await execFF(['-i',path,'-filter:v',`setpts=PTS/${speed}`,'-filter:a',`atempo=${speed}`,...videoEncodeArgs('23','128k'),'-y',out],`视频倍速 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,`${speed}x`);
  });
}
async function doAudioSpeed() {
  const speed = Number(getOption('speed','1.5'));
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_${speed}x.mp3`;
    await execFF(['-i',path,'-vn','-filter:a',`atempo=${speed}`,'-c:a','libmp3lame','-b:a','192k','-y',out],`音频倍速 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,`${speed}x`);
  });
}
async function doVolume() {
  const volume = Number(getOption('volume','1.5'));
  await processPerFile(selectedFiles, async (file,path,i,base,span) => {
    const out = `${safeStem(file.name)}_音量${Math.round(volume * 100)}.mp3`;
    await execFF(['-i',path,'-vn','-filter:a',`volume=${volume}`,'-c:a','libmp3lame','-b:a','192k','-y',out],`调整音量 ${i + 1}/${selectedFiles.length}`,base,span);
    await addResult(out,`${Math.round(volume * 100)}%`);
  });
}
async function doBatch() {
  const action = getOption('batchAction','videoToAudio');
  const files = selectedFiles;
  await processPerFile(files, async (file,path,i,base,span) => {
    if (action === 'videoToAudio') {
      if (!isVideoFile(file)) throw new Error(`${file.name} 不是支持的视频文件。`);
      const out = `${safeStem(file.name)}_音频.mp3`;
      await execFF(['-i',path,'-map','0:a:0','-vn','-c:a','libmp3lame','-b:a','192k','-y',out],`批量视频转 MP3 ${i + 1}/${files.length}`,base,span); await addResult(out,'MP3'); return;
    }
    if (action === 'videoToMp4') {
      if (!isVideoFile(file)) throw new Error(`${file.name} 不是支持的视频文件。`);
      const out = `${safeStem(file.name)}_MP4.mp4`;
      await execTry(['-i',path,'-c','copy','-movflags','+faststart','-y',out],['-i',path,...videoEncodeArgs('23','128k'),'-y',out],out,`批量视频转 MP4 ${i + 1}/${files.length}`,base,span); await addResult(out,'MP4'); return;
    }
    if (action === 'removeAudio') {
      if (!isVideoFile(file)) throw new Error(`${file.name} 不是支持的视频文件。`);
      const out = `${safeStem(file.name)}_无声.${extOf(file.name) || 'mp4'}`;
      await execFF(['-i',path,'-map','0:v:0','-c:v','copy','-an','-y',out],`批量去声音 ${i + 1}/${files.length}`,base,span); await addResult(out,'无声'); return;
    }
    if (action === 'videoCompress') {
      if (!isVideoFile(file)) throw new Error(`${file.name} 不是支持的视频文件。`);
      const out = `${safeStem(file.name)}_压缩.mp4`;
      await execFF(['-i',path,...videoEncodeArgs('25','128k'),'-y',out],`批量压缩视频 ${i + 1}/${files.length}`,base,span); await addResult(out,'推荐档'); return;
    }
    if (!isAudioFile(file)) throw new Error(`${file.name} 不是支持的音频文件。`);
    const out = `${safeStem(file.name)}_MP3.mp3`;
    await execFF(['-i',path,'-vn','-c:a','libmp3lame','-b:a','192k','-y',out],`批量音频转 MP3 ${i + 1}/${files.length}`,base,span); await addResult(out,'MP3');
  });
}

const PROCESSORS = {
  videoToAudio: doVideoToAudio, audioFormat: doAudioFormat, videoToMp4: doVideoToMp4, removeAudio: doRemoveAudio,
  replaceAudio: doReplaceAudio, videoTrim: doVideoTrim, audioTrim: doAudioTrim, videoConcat: doVideoConcat,
  audioConcat: doAudioConcat, videoCompress: doVideoCompress, audioCompress: doAudioCompress, videoResize: doVideoResize,
  videoRatio: doVideoRatio, videoRotate: doVideoRotate, videoMirror: doVideoMirror, videoSpeed: doVideoSpeed,
  audioSpeed: doAudioSpeed, volume: doVolume, batch: doBatch, folderBatch: doBatch,
};

async function runActiveTool() {
  if (busy || runBtn.disabled) return;
  clearWarning(); clearResults(); statusBox.classList.remove('hidden'); busy = true; updateRunButton(); cancelBtn.classList.remove('hidden');
  try {
    await ensureFFmpeg();
    setProgress(0, `准备：${TOOLS[activeTool].title}`);
    await PROCESSORS[activeTool]();
    setProgress(1, `完成：${TOOLS[activeTool].title}`);
  } catch (error) {
    console.error(error);
    const message = error?.message || String(error);
    statusText.textContent = '处理失败';
    logEl.textContent = message;
    showWarning(`处理失败：${message}`);
  } finally {
    await cleanupMounted().catch(() => {});
    busy = false; cancelBtn.classList.add('hidden'); updateRunButton();
  }
}
async function cancelWork() {
  if (!busy || !ffmpeg) return;
  try { ffmpeg.terminate(); } catch {}
  ffmpeg = null; ffmpegLoaded = false; mountedMode = ''; mountedPaths = []; mountedMemFiles = []; busy = false;
  cancelBtn.classList.add('hidden'); updateRunButton(); setProgress(0,'已取消。下次处理会重新加载内置引擎。');
}

async function readDirectoryEntry(entry) {
  if (entry.isFile) return new Promise((resolve, reject) => entry.file((file) => resolve([file]), reject));
  if (!entry.isDirectory) return [];
  const reader = entry.createReader(), children = [];
  while (true) {
    const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
    if (!batch.length) break;
    children.push(...batch);
  }
  const nested = await Promise.all(children.map(readDirectoryEntry));
  return nested.flat();
}
async function filesFromDrop(dataTransfer) {
  const items = [...(dataTransfer.items || [])];
  if (activeTool === 'folderBatch' && items.some((item) => item.webkitGetAsEntry)) {
    const entries = items.map((item) => item.webkitGetAsEntry?.()).filter(Boolean);
    const files = (await Promise.all(entries.map(readDirectoryEntry))).flat().filter((file) => isVideoFile(file) || isAudioFile(file));
    return files;
  }
  return [...(dataTransfer.files || [])];
}

pick.addEventListener('click', () => fileInput.click());
pickFolder.addEventListener('click', () => folderInput.click());
fileInput.addEventListener('change', () => setFiles(fileInput.files || []));
folderInput.addEventListener('change', () => setFiles([...folderInput.files].filter((file) => isVideoFile(file) || isAudioFile(file))));
el('clear').addEventListener('click', () => { if (!busy) { resetSelection(); renderOptions(); updateRunButton(); } });
runBtn.addEventListener('click', runActiveTool);
cancelBtn.addEventListener('click', cancelWork);
drop.addEventListener('dragover', (event) => { event.preventDefault(); drop.classList.add('drag'); });
drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
drop.addEventListener('drop', async (event) => { event.preventDefault(); drop.classList.remove('drag'); if (busy) return; const files = await filesFromDrop(event.dataTransfer); if (files.length) setFiles(files); });

selectTool(activeTool);

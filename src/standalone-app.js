const app = document.querySelector('#app');

const CATEGORIES = [
  { key: 'convert', icon: '🎵', title: '提取 / 转换', desc: '音视频格式与声音提取', tools: ['videoToAudio', 'audioFormat', 'videoToMp4', 'removeAudio'] },
  { key: 'trim', icon: '✂️', title: '裁剪', desc: '边看边选开始和结束位置', tools: ['videoTrim', 'audioTrim'] },
  { key: 'merge', icon: '🔗', title: '拼接 / 合并', desc: '替换声音与多段拼接', tools: ['replaceAudio', 'videoConcat', 'audioConcat'] },
  { key: 'compress', icon: '🗜️', title: '压缩', desc: '简单档位控制文件大小', tools: ['videoCompress', 'audioCompress'] },
  { key: 'adjust', icon: '🎬', title: '视频 / 声音调整', desc: '尺寸、比例、旋转、倍速等', tools: ['videoResize', 'videoRatio', 'videoRotate', 'videoMirror', 'videoSpeed', 'audioSpeed', 'volume'] },
  { key: 'batch', icon: '📚', title: '批量处理', desc: '多个文件或整个文件夹', tools: ['batch', 'folderBatch'] },
];

const TOOLS = {
  videoToAudio: { n: 1, category: 'convert', title: '视频转音频', short: '提取声音', desc: '提取为 MP3、WAV 或 M4A；单文件支持真实多音轨选择与试听。', accept: 'video/*,.mkv,.m4v,.ts,.m2ts,.flv,.avi,.webm,.mov,.mp4,.mts,.vob,.3gp', multiple: true, media: 'video' },
  audioFormat: { n: 2, category: 'convert', title: '音频转格式', short: '音频格式', desc: 'MP3、WAV、M4A、AAC、FLAC 互相转换，并可直接试听原文件。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true, media: 'audio' },
  videoToMp4: { n: 3, category: 'convert', title: '视频转 MP4', short: '转 MP4', desc: '优先无损重新封装，不兼容时自动转成通用 MP4。', accept: 'video/*,.mkv,.mov,.avi,.webm,.m4v,.ts,.m2ts,.flv,.mts,.vob,.3gp', multiple: true, media: 'video' },
  removeAudio: { n: 4, category: 'convert', title: '去除视频声音', short: '视频静音', desc: '一键生成无声视频，画面尽量无损复制。', accept: 'video/*,.mkv,.mov,.avi,.webm,.mp4,.m4v,.ts,.m2ts', multiple: true, media: 'video' },
  replaceAudio: { n: 5, category: 'merge', title: '添加 / 替换音频', short: '添加声音', desc: '边预览边选择替换原声，或保留原声并混合新音频。', accept: 'video/*,.mkv,.mov,.avi,.webm,.mp4,.m4v', multiple: false, media: 'video' },
  videoTrim: { n: 6, category: 'trim', title: '视频裁剪', short: '视频裁剪', desc: '用播放器、双手柄时间轴和“设为开始/结束”按钮精确选择片段。', accept: 'video/*,.mkv,.mov,.avi,.webm,.mp4,.m4v,.ts,.m2ts', multiple: false, media: 'video' },
  audioTrim: { n: 7, category: 'trim', title: '音频裁剪', short: '音频裁剪', desc: '播放器 + 波形 + 双手柄选区，拖动即可选择要保留的声音。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: false, media: 'audio' },
  videoConcat: { n: 8, category: 'merge', title: '视频拼接', short: '视频拼接', desc: '拖动或使用上下按钮调整顺序，并可逐段预览。', accept: 'video/*,.mp4,.mkv,.mov,.ts,.m2ts,.webm', multiple: true, minFiles: 2, media: 'video', reorder: true },
  audioConcat: { n: 9, category: 'merge', title: '音频拼接', short: '音频拼接', desc: '调整多段音频顺序后合成为一个 MP3，可逐段试听。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true, minFiles: 2, media: 'audio', reorder: true },
  videoCompress: { n: 10, category: 'compress', title: '视频压缩', short: '视频压缩', desc: '高质量、推荐、小体积三个档位，并给出直观体积区间提示。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true, media: 'video' },
  audioCompress: { n: 11, category: 'compress', title: '音频压缩', short: '音频压缩', desc: '输出 320、192 或 128 kbps MP3，可先试听原音频。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true, media: 'audio' },
  videoResize: { n: 12, category: 'adjust', title: '视频改尺寸', short: '改尺寸', desc: '1080P、720P、480P；预览区同步显示目标尺寸提示。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true, media: 'video' },
  videoRatio: { n: 13, category: 'adjust', title: '视频改比例', short: '改比例', desc: '16:9、9:16、1:1，并可选择完整显示或裁切填满，实时预览。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true, media: 'video' },
  videoRotate: { n: 14, category: 'adjust', title: '视频旋转', short: '旋转', desc: '左转、右转、180°，点击后预览立即变化。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true, media: 'video' },
  videoMirror: { n: 15, category: 'adjust', title: '视频镜像', short: '镜像', desc: '左右或上下翻转，点击后预览立即变化。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true, media: 'video' },
  videoSpeed: { n: 16, category: 'adjust', title: '视频倍速', short: '视频倍速', desc: '0.5x、1x、1.5x、2x；播放器可直接按目标速度预览。', accept: 'video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v', multiple: true, media: 'video' },
  audioSpeed: { n: 17, category: 'adjust', title: '音频倍速', short: '音频倍速', desc: '0.5x、1x、1.5x、2x，并用播放器即时试听。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true, media: 'audio' },
  volume: { n: 18, category: 'adjust', title: '调整音量', short: '调整音量', desc: '滑块调节 50%–200%，先试听，再导出。', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus', multiple: true, media: 'audio' },
  batch: { n: 19, category: 'batch', title: '批量处理多个文件', short: '批量文件', desc: '任务列表显示等待、处理中、完成和失败状态，支持暂停后续任务与重试失败。', accept: 'audio/*,video/*,.mp3,.wav,.m4a,.aac,.flac,.mp4,.mkv,.mov,.avi,.webm', multiple: true, media: 'mixed', batch: true },
  folderBatch: { n: 20, category: 'batch', title: '拖入文件夹批量处理', short: '批量文件夹', desc: '选择或拖入整个文件夹，递归读取媒体文件并按任务列表处理。', accept: 'audio/*,video/*', multiple: true, folder: true, media: 'mixed', batch: true },
};

app.innerHTML = `
<div class="shell">
  <header class="hero">
    <div><div class="eyebrow">本地处理 · 不上传文件</div><h1>音视频工具箱</h1><p>先预览，再调整，最后导出。20 个功能保持简单操作。</p></div>
    <div class="badge">🔒 FFmpeg 完全在浏览器运行</div>
  </header>

  <section class="category-bar card">
    <div id="categories" class="category-grid"></div>
    <div id="toolStrip" class="tool-strip"></div>
  </section>

  <section class="workspace card">
    <div class="workspace-head">
      <div><span id="toolNo" class="tool-no"></span><h2 id="toolTitle"></h2><p id="toolDesc"></p></div>
      <button id="clear" class="ghost">重新选择</button>
    </div>

    <div id="drop" class="drop">
      <div class="drop-icon">＋</div><h3 id="dropTitle">选择媒体文件</h3><p id="dropHint">也可以把文件拖到这里</p>
      <div class="drop-actions"><button id="pick" class="primary">选择文件</button><button id="pickFolder" class="secondary hidden">选择文件夹</button></div>
      <input id="file" class="hidden" type="file" /><input id="folder" class="hidden" type="file" webkitdirectory directory multiple />
    </div>

    <div id="editor" class="editor hidden">
      <div class="preview-column">
        <div class="section-label">预览</div>
        <div id="previewHost" class="preview-host"></div>
        <div id="trimPanel" class="trim-panel hidden"></div>
        <div id="wavePanel" class="wave-panel hidden"><canvas id="waveform" height="120"></canvas><div id="waveHint" class="wave-hint">正在准备波形…</div></div>
      </div>
      <div class="settings-column">
        <div class="section-label">设置</div>
        <div id="fileSummary" class="file-summary"></div>
        <div id="options" class="options"></div>
        <div id="tracksBox" class="tracks-box hidden"><div class="section-label">音轨</div><div id="tracks" class="tracks"></div><div id="trackPreview" class="track-preview"></div></div>
        <div id="taskBox" class="task-box hidden"><div class="section-label">任务列表</div><div id="taskList" class="task-list"></div></div>
      </div>
    </div>

    <div id="warning" class="warning hidden"></div>
    <details id="errorDetails" class="error-details hidden"><summary>查看技术详情</summary><pre id="errorLog"></pre></details>

    <div class="actions">
      <button id="run" class="primary" disabled>开始处理</button>
      <button id="pauseBatch" class="secondary hidden">暂停后续任务</button>
      <button id="retryFailed" class="secondary hidden">重试失败</button>
      <button id="cancel" class="secondary hidden">取消</button>
    </div>

    <div id="status" class="status hidden"><div class="status-row"><span id="statusText">准备中…</span><span id="percent">0%</span></div><div id="progressTrack" class="progress"><div id="bar"></div></div></div>
    <div id="results" class="results"></div>
  </section>

  <div class="footer">所有媒体处理都在当前设备中完成。在线页面只提供工具本身，不会上传你选择的音视频文件。</div>
</div>`;

const el = (id) => document.getElementById(id);
const categoriesEl = el('categories'), toolStrip = el('toolStrip');
const toolNo = el('toolNo'), toolTitle = el('toolTitle'), toolDesc = el('toolDesc');
const drop = el('drop'), dropTitle = el('dropTitle'), dropHint = el('dropHint');
const pick = el('pick'), pickFolder = el('pickFolder'), fileInput = el('file'), folderInput = el('folder');
const editor = el('editor'), previewHost = el('previewHost'), fileSummary = el('fileSummary'), optionsEl = el('options');
const trimPanel = el('trimPanel'), wavePanel = el('wavePanel'), waveform = el('waveform'), waveHint = el('waveHint');
const tracksBox = el('tracksBox'), tracksEl = el('tracks'), trackPreview = el('trackPreview');
const taskBox = el('taskBox'), taskList = el('taskList');
const warning = el('warning'), errorDetails = el('errorDetails'), errorLog = el('errorLog');
const runBtn = el('run'), pauseBatchBtn = el('pauseBatch'), retryFailedBtn = el('retryFailed'), cancelBtn = el('cancel');
const statusBox = el('status'), statusText = el('statusText'), percent = el('percent'), bar = el('bar'), progressTrack = el('progressTrack'), resultsEl = el('results');

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const MOUNT_POINT = '/input';
const MOBILE_MEMORY_FALLBACK_LIMIT = 300 * 1024 * 1024;
const DESKTOP_MEMORY_FALLBACK_LIMIT = 1536 * 1024 * 1024;
const WAVEFORM_LIMIT = 150 * 1024 * 1024;
const VIDEO_EXTS = new Set(['mp4','mkv','mov','avi','webm','m4v','ts','m2ts','mts','flv','vob','3gp']);
const AUDIO_EXTS = new Set(['mp3','wav','m4a','aac','flac','ogg','opus','wma']);

let activeCategory = 'convert';
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
let previewURLs = [];
let progressBase = 0;
let progressSpan = 1;
let mediaMeta = { duration: 0, width: 0, height: 0 };
let trimState = { start: 0, end: 10, duration: 10, previewing: false };
let previewTransform = { rotate: 0, scaleX: 1, scaleY: 1 };
let batchPaused = false;
let batchWaiters = [];
let batchStates = [];
let lastFailedFiles = [];
let dragIndex = -1;

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function formatBytes(bytes) { if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'; const u=['B','KB','MB','GB','TB']; const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),u.length-1); return `${(bytes/1024**i).toFixed(i>1?2:1)} ${u[i]}`; }
function formatDuration(sec, millis = false) { if (!Number.isFinite(sec) || sec < 0) return '00:00'; const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60),ms=Math.round((sec-Math.floor(sec))*1000); const base=h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; return millis?`${base}.${String(ms).padStart(3,'0')}`:base; }
function safeStem(name) { return (name.replace(/\.[^.]+$/, '') || 'output').replace(/[\\/:*?"<>|]/g, '_'); }
function extOf(name) { return (name.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1] || '').toLowerCase(); }
function safeExt(name, fallback='bin') { return `.${extOf(name)||fallback}`; }
function recentLogs(max=25) { return logBuffer.slice(-max).join('\n').trim(); }
function isVideoFile(file) { return file.type.startsWith('video/') || VIDEO_EXTS.has(extOf(file.name)); }
function isAudioFile(file) { return file.type.startsWith('audio/') || AUDIO_EXTS.has(extOf(file.name)); }
function getOption(id, fallback='') { return document.getElementById(id)?.value ?? fallback; }
function mimeFor(ext) { return ({mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',aac:'audio/aac',flac:'audio/flac',mp4:'video/mp4',mkv:'video/x-matroska',mov:'video/quicktime',webm:'video/webm'})[ext] || 'application/octet-stream'; }
function fileObjectURL(file) { const url=URL.createObjectURL(file); previewURLs.push(url); return url; }
function revokePreviewURLs() { for (const url of previewURLs) URL.revokeObjectURL(url); previewURLs=[]; }
function showWarning(message) { warning.textContent=message; warning.classList.remove('hidden'); }
function clearWarning() { warning.classList.add('hidden'); warning.textContent=''; errorDetails.classList.add('hidden'); errorLog.textContent=''; }
function setProgress(value,text,label) { progressTrack.classList.remove('indeterminate'); const pct=Math.max(0,Math.min(100,Math.round(value*100))); bar.style.width=`${pct}%`; percent.textContent=label||`${pct}%`; if(text) statusText.textContent=text; }
function setIndeterminate(text,label='处理中') { progressTrack.classList.add('indeterminate'); bar.style.width=''; percent.textContent=label; if(text) statusText.textContent=text; }
function clearResults() { for(const url of resultURLs) URL.revokeObjectURL(url); resultURLs=[]; resultsEl.innerHTML=''; }
function friendlyError(error) { const raw=error?.message||String(error); const low=raw.toLowerCase(); if(/memory|allocation|out of bounds|array buffer|oom/.test(low)) return '浏览器可用内存不足。请减少同时选择的文件，或换到电脑端处理。'; if(/no such file|invalid data|could not find codec|unsupported/.test(low)) return '这个文件的媒体格式或编码暂时无法处理。'; if(/concat|parameters|time base/.test(low)) return '拼接素材的编码或尺寸不一致。建议先统一转成 MP4 再拼接。'; if(/audio|stream/.test(low) && /not found|matches no streams|cannot/.test(low)) return '没有找到可用的音频流，或当前音轨无法处理。'; return raw.split('\n')[0] || '处理失败，请查看技术详情。'; }
function showError(error) { const raw=error?.message||String(error); showWarning(`处理失败：${friendlyError(error)}`); errorLog.textContent=raw; errorDetails.classList.remove('hidden'); }

function renderNavigation() {
  categoriesEl.innerHTML=CATEGORIES.map(c=>`<button class="category ${c.key===activeCategory?'active':''}" data-category="${c.key}"><span class="category-icon">${c.icon}</span><span><strong>${c.title}</strong><small>${c.desc}</small></span></button>`).join('');
  categoriesEl.querySelectorAll('[data-category]').forEach(btn=>btn.addEventListener('click',()=>{ if(busy)return; activeCategory=btn.dataset.category; const first=CATEGORIES.find(c=>c.key===activeCategory)?.tools[0]; if(first) selectTool(first); }));
  const category=CATEGORIES.find(c=>c.key===activeCategory);
  toolStrip.innerHTML=(category?.tools||[]).map(key=>{const t=TOOLS[key];return `<button class="tool-chip ${key===activeTool?'active':''}" data-tool="${key}"><span>${t.n}</span>${t.short}</button>`;}).join('');
  toolStrip.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>selectTool(btn.dataset.tool)));
}
function optionSelect(id,label,choices,selected) { return `<div class="control"><label for="${id}">${label}</label><select id="${id}">${choices.map(([v,t])=>`<option value="${v}" ${v===selected?'selected':''}>${t}</option>`).join('')}</select></div>`; }
function segmented(id,label,choices,selected) { return `<div class="control wide"><label>${label}</label><div class="segment" data-segment="${id}">${choices.map(([v,t])=>`<button type="button" data-value="${v}" class="${v===selected?'active':''}">${t}</button>`).join('')}</div><input id="${id}" type="hidden" value="${selected}" /></div>`; }
function rangeControl(id,label,min,max,step,value,suffix='') { return `<div class="control wide"><div class="range-label"><label for="${id}">${label}</label><strong id="${id}Value">${value}${suffix}</strong></div><input id="${id}" class="range-input" type="range" min="${min}" max="${max}" step="${step}" value="${value}" /></div>`; }
function bindSegments() { optionsEl.querySelectorAll('[data-segment]').forEach(group=>{ group.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{ const id=group.dataset.segment; const hidden=document.getElementById(id); if(hidden) hidden.value=btn.dataset.value; group.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===btn)); handleLiveOption(id,btn.dataset.value); })); }); }
function bindRange(id,suffix='') { const input=document.getElementById(id); const out=document.getElementById(`${id}Value`); if(!input)return; input.addEventListener('input',()=>{if(out)out.textContent=`${input.value}${suffix}`;handleLiveOption(id,input.value);}); }

function renderOptions() {
  let html='';
  if(activeTool==='videoToAudio') html=optionSelect('audioOutFormat','输出格式',[['mp3','MP3 · 推荐'],['wav','WAV · 无压缩'],['m4a','M4A · AAC']],'mp3');
  else if(activeTool==='audioFormat') html=optionSelect('audioOutFormat','转换为',[['mp3','MP3'],['wav','WAV'],['m4a','M4A'],['aac','AAC'],['flac','FLAC']],'mp3');
  else if(activeTool==='replaceAudio') html=`<div class="control wide"><label>新音频</label><div class="inline-pick"><button id="pickSecond" class="secondary">选择音乐 / 音频</button><span id="secondName">尚未选择</span></div><input id="secondFile" class="hidden" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus" /></div>${segmented('audioMode','声音方式',[['replace','替换原声音'],['mix','保留原声 + 新音频']],'replace')}${rangeControl('newAudioVolume','新音频音量',0,200,5,100,'%')}<div id="originalVolumeWrap" class="hidden">${rangeControl('originalAudioVolume','原声音量',0,200,5,100,'%')}</div><div id="secondPreview" class="mini-preview"></div>`;
  else if(activeTool==='videoCompress') html=`${segmented('compressLevel','压缩档位',[['high','高质量'],['balanced','推荐'],['small','小体积']],'balanced')}<div id="compressEstimate" class="estimate"></div>`;
  else if(activeTool==='audioCompress') html=segmented('audioBitrate','输出码率',[['320','320 kbps'],['192','192 kbps · 推荐'],['128','128 kbps']],'192');
  else if(activeTool==='videoResize') html=segmented('videoHeight','输出尺寸',[['1080','1080P'],['720','720P · 推荐'],['480','480P']],'720');
  else if(activeTool==='videoRatio') html=`${segmented('videoRatio','画面比例',[['16:9','16:9'],['9:16','9:16'],['1:1','1:1']],'16:9')}${segmented('ratioFit','填充方式',[['contain','完整显示'],['cover','裁切填满']],'contain')}`;
  else if(activeTool==='videoRotate') html=segmented('rotate','旋转',[['270','↺ 左转 90°'],['90','↻ 右转 90°'],['180','180°']],'90');
  else if(activeTool==='videoMirror') html=segmented('mirror','镜像',[['h','⇆ 左右镜像'],['v','⇅ 上下镜像']],'h');
  else if(activeTool==='videoSpeed'||activeTool==='audioSpeed') html=segmented('speed','播放速度',[['0.5','0.5x'],['1','1x'],['1.5','1.5x'],['2','2x']],'1');
  else if(activeTool==='volume') html=rangeControl('volumePct','音量',50,200,5,100,'%');
  else if(activeTool==='batch'||activeTool==='folderBatch') html=optionSelect('batchAction','批量操作',[['videoToAudio','视频 → MP3'],['videoToMp4','视频 → MP4'],['removeAudio','视频去声音'],['videoCompress','视频压缩（推荐）'],['audioToMp3','音频 → MP3']],'videoToAudio');
  optionsEl.innerHTML=html;
  bindSegments(); bindRange('newAudioVolume','%'); bindRange('originalAudioVolume','%'); bindRange('volumePct','%');
  optionsEl.querySelectorAll('select').forEach(node=>node.addEventListener('change',()=>handleLiveOption(node.id,node.value)));
  if(activeTool==='replaceAudio') {
    el('pickSecond').addEventListener('click',()=>el('secondFile').click());
    el('secondFile').addEventListener('change',event=>{ secondaryFile=event.target.files?.[0]||null; el('secondName').textContent=secondaryFile?`${secondaryFile.name} · ${formatBytes(secondaryFile.size)}`:'尚未选择'; renderSecondaryPreview(); updateRunButton(); });
  }
  updateCompressionEstimate();
}

function handleLiveOption(id,value) {
  const media=previewHost.querySelector('video,audio');
  if(id==='speed'&&media) media.playbackRate=Number(value)||1;
  if(id==='volumePct'&&media) media.volume=Math.min(1,Number(value)/100);
  if(id==='rotate') { previewTransform.rotate=Number(value)||0; applyPreviewTransform(); }
  if(id==='mirror') { previewTransform.scaleX=value==='h'?-1:1; previewTransform.scaleY=value==='v'?-1:1; applyPreviewTransform(); }
  if(id==='videoRatio'||id==='ratioFit') applyRatioPreview();
  if(id==='audioMode') el('originalVolumeWrap')?.classList.toggle('hidden',value!=='mix');
  if(id==='compressLevel') updateCompressionEstimate();
  if(id==='videoHeight') updatePreviewCaption();
}
function applyPreviewTransform() { const video=previewHost.querySelector('video'); if(video) video.style.transform=`rotate(${previewTransform.rotate}deg) scale(${previewTransform.scaleX},${previewTransform.scaleY})`; }
function applyRatioPreview() { const frame=previewHost.querySelector('.media-frame'); const video=previewHost.querySelector('video'); if(!frame||!video)return; const ratio=getOption('videoRatio','16:9'); frame.style.aspectRatio=ratio.replace(':',' / '); video.style.objectFit=getOption('ratioFit','contain'); }
function updatePreviewCaption() { const cap=previewHost.querySelector('.preview-caption'); if(!cap)return; if(activeTool==='videoResize') cap.textContent=`导出目标：${getOption('videoHeight','720')}P`; else cap.textContent='浏览器本地预览'; }
function updateCompressionEstimate() { const box=el('compressEstimate'); if(!box||!selectedFiles.length)return; const total=selectedFiles.reduce((s,f)=>s+f.size,0); const level=getOption('compressLevel','balanced'); const factors=level==='high'?[0.55,0.85]:level==='small'?[0.18,0.42]:[0.30,0.62]; box.innerHTML=`原文件合计 <strong>${formatBytes(total)}</strong> · 粗略预计 <strong>${formatBytes(total*factors[0])} – ${formatBytes(total*factors[1])}</strong><span>实际大小取决于画面复杂度和原编码。</span>`; }

function selectTool(key) {
  if(!TOOLS[key]||busy)return;
  activeTool=key; activeCategory=TOOLS[key].category; resetSelection(); renderNavigation();
  const tool=TOOLS[key]; toolNo.textContent=`#${tool.n}`; toolTitle.textContent=tool.title; toolDesc.textContent=tool.desc;
  fileInput.accept=tool.accept; fileInput.multiple=Boolean(tool.multiple); dropTitle.textContent=tool.folder?'把文件夹拖到这里':(tool.minFiles?'选择多个文件':'选择媒体文件'); dropHint.textContent=tool.folder?'也可以点击“选择文件夹”':(tool.multiple?'支持多选，也可以拖入文件':'也可以把文件拖到这里'); pick.classList.toggle('hidden',Boolean(tool.folder)); pickFolder.classList.toggle('hidden',!tool.folder);
  renderOptions(); updateRunButton();
}
function resetSelection() {
  selectedFiles=[]; secondaryFile=null; currentTracks=[]; mediaMeta={duration:0,width:0,height:0}; trimState={start:0,end:10,duration:10,previewing:false}; previewTransform={rotate:0,scaleX:1,scaleY:1}; batchStates=[]; lastFailedFiles=[]; batchPaused=false; resumeBatchWaiters();
  fileInput.value=''; folderInput.value=''; revokePreviewURLs(); editor.classList.add('hidden'); previewHost.innerHTML=''; fileSummary.innerHTML=''; trimPanel.classList.add('hidden'); trimPanel.innerHTML=''; wavePanel.classList.add('hidden'); tracksBox.classList.add('hidden'); tracksEl.innerHTML=''; trackPreview.innerHTML=''; taskBox.classList.add('hidden'); taskList.innerHTML=''; retryFailedBtn.classList.add('hidden'); pauseBatchBtn.classList.add('hidden'); clearWarning(); clearResults(); statusBox.classList.add('hidden');
}
function updateRunButton() { const tool=TOOLS[activeTool]; const enough=selectedFiles.length>=(tool.minFiles||1); const secondOkay=activeTool!=='replaceAudio'||Boolean(secondaryFile); runBtn.disabled=busy||!enough||!secondOkay; }

function setFiles(files) {
  if(busy)return;
  let list=[...files].filter(file=>file&&file.size>=0); if(!TOOLS[activeTool].multiple&&list.length>1) list=list.slice(0,1); selectedFiles=list; currentTracks=[]; clearResults(); clearWarning(); renderEditor();
  if(activeTool==='videoToAudio'&&selectedFiles.length===1) analyzeTracksForSelected().catch(()=>{});
}
function renderEditor() {
  if(!selectedFiles.length){editor.classList.add('hidden');updateRunButton();return;}
  editor.classList.remove('hidden'); revokePreviewURLs(); previewTransform={rotate:0,scaleX:1,scaleY:1};
  renderFileSummary(); renderPreview(); renderOptions();
  const total=selectedFiles.reduce((s,f)=>s+f.size,0); if(isMobile&&total>800*1024*1024) showWarning(`已选择 ${formatBytes(total)}。手机端处理超大媒体时可能被系统中断，建议保持页面前台。`);
  if(TOOLS[activeTool].batch){ initBatchStates(); renderTaskList(); }
  updateRunButton();
}
function renderFileSummary() {
  const tool=TOOLS[activeTool]; const total=selectedFiles.reduce((s,f)=>s+f.size,0);
  if(tool.reorder) {
    fileSummary.innerHTML=`<div class="summary-head"><strong>${selectedFiles.length} 个片段</strong><span>${formatBytes(total)}</span></div><div id="sortableFiles" class="sortable-files">${selectedFiles.map((f,i)=>sortableRow(f,i)).join('')}</div>`; bindSortable(); return;
  }
  if(TOOLS[activeTool].batch){ fileSummary.innerHTML=`<div class="summary-head"><strong>${selectedFiles.length} 个任务</strong><span>${formatBytes(total)}</span></div><p class="summary-note">下面的任务列表会显示每个文件的处理状态。</p>`; return; }
  const f=selectedFiles[0]; fileSummary.innerHTML=`<div class="single-file"><div><strong>${escapeHtml(f.webkitRelativePath||f.name)}</strong><span>${formatBytes(f.size)}${selectedFiles.length>1?` · 共 ${selectedFiles.length} 个文件`:''}</span></div><button id="changeFile" class="mini-button">更换</button></div>`;
  el('changeFile')?.addEventListener('click',()=>fileInput.click());
}
function sortableRow(file,index){return `<div class="sortable-row" draggable="true" data-index="${index}"><span class="drag-handle">☰</span><span class="order">${index+1}</span><div><strong>${escapeHtml(file.name)}</strong><small>${formatBytes(file.size)}</small></div><div class="row-actions"><button type="button" data-preview-index="${index}" title="预览">▶</button><button type="button" data-up="${index}" ${index===0?'disabled':''}>↑</button><button type="button" data-down="${index}" ${index===selectedFiles.length-1?'disabled':''}>↓</button></div></div>`;}
function bindSortable(){ const host=el('sortableFiles'); if(!host)return; host.querySelectorAll('[data-up]').forEach(b=>b.addEventListener('click',()=>moveFile(Number(b.dataset.up),-1))); host.querySelectorAll('[data-down]').forEach(b=>b.addEventListener('click',()=>moveFile(Number(b.dataset.down),1))); host.querySelectorAll('[data-preview-index]').forEach(b=>b.addEventListener('click',()=>previewSpecificFile(Number(b.dataset.previewIndex)))); host.querySelectorAll('.sortable-row').forEach(row=>{row.addEventListener('dragstart',()=>{dragIndex=Number(row.dataset.index);row.classList.add('dragging');});row.addEventListener('dragend',()=>row.classList.remove('dragging'));row.addEventListener('dragover',e=>e.preventDefault());row.addEventListener('drop',e=>{e.preventDefault();const target=Number(row.dataset.index);if(dragIndex>=0&&target!==dragIndex){const [f]=selectedFiles.splice(dragIndex,1);selectedFiles.splice(target,0,f);renderFileSummary();previewSpecificFile(0);}});}); }
function moveFile(index,delta){ const target=index+delta;if(target<0||target>=selectedFiles.length)return;[selectedFiles[index],selectedFiles[target]]=[selectedFiles[target],selectedFiles[index]];renderFileSummary();previewSpecificFile(target); }
function previewSpecificFile(index){ const file=selectedFiles[index];if(!file)return; revokePreviewURLs(); renderMediaPreview(file); }

function renderPreview() {
  previewHost.innerHTML=''; trimPanel.classList.add('hidden'); wavePanel.classList.add('hidden');
  if(!selectedFiles.length)return;
  if(TOOLS[activeTool].batch){ previewHost.innerHTML='<div class="preview-placeholder"><span>📚</span><strong>批量任务</strong><p>处理时会在右侧显示每个文件的状态。</p></div>';return; }
  renderMediaPreview(selectedFiles[0]);
}
function renderMediaPreview(file) {
  const video=isVideoFile(file); const url=fileObjectURL(file);
  previewHost.innerHTML=video?`<div class="media-frame"><video id="mainMedia" src="${url}" controls playsinline preload="metadata"></video></div><div class="preview-caption">浏览器本地预览</div>`:`<div class="audio-preview"><div class="audio-art">♫</div><audio id="mainMedia" src="${url}" controls preload="metadata"></audio></div><div class="preview-caption">浏览器本地试听</div>`;
  const media=el('mainMedia'); if(!media)return;
  media.addEventListener('loadedmetadata',()=>{mediaMeta.duration=Number(media.duration)||0;if(video){mediaMeta.width=media.videoWidth||0;mediaMeta.height=media.videoHeight||0;} if(activeTool==='videoTrim'||activeTool==='audioTrim') setupTrimUI(media); updateFileMediaMeta(); handleLiveOption('speed',getOption('speed','1')); handleLiveOption('volumePct',getOption('volumePct','100')); applyPreviewTransform(); applyRatioPreview(); updatePreviewCaption();});
  media.addEventListener('timeupdate',()=>{ if(trimState.previewing&&media.currentTime>=trimState.end){media.pause();media.currentTime=trimState.start;trimState.previewing=false;} updatePlayhead(media.currentTime); });
  media.addEventListener('error',()=>{const cap=previewHost.querySelector('.preview-caption');if(cap)cap.textContent='浏览器无法直接预览这种封装/编码，但仍可尝试用 FFmpeg 处理。';});
  if(activeTool==='audioTrim') drawWaveform(file).catch(()=>{waveHint.textContent='波形生成失败，但仍可用播放器和时间轴裁剪。';});
}
function updateFileMediaMeta(){ if(!selectedFiles.length)return; const info=fileSummary.querySelector('.single-file span'); if(info&&mediaMeta.duration){ const dims=mediaMeta.width?` · ${mediaMeta.width}×${mediaMeta.height}`:''; info.textContent=`${formatBytes(selectedFiles[0].size)} · ${formatDuration(mediaMeta.duration)}${dims}${selectedFiles.length>1?` · 共 ${selectedFiles.length} 个文件`:''}`; } }

function setupTrimUI(media) {
  const d=Math.max(0.01,Number(media.duration)||10); trimState.duration=d; trimState.start=0; trimState.end=Math.min(d,Math.max(1,Math.min(10,d)));
  trimPanel.classList.remove('hidden');
  trimPanel.innerHTML=`<div class="trim-actions"><button id="markStart" class="secondary">设为开始点</button><button id="markEnd" class="secondary">设为结束点</button><button id="previewRange" class="secondary">▶ 预览选中片段</button><button id="resetRange" class="ghost">重置</button></div><div class="timeline-wrap"><div class="timeline-track"><div id="timelineSelection" class="timeline-selection"></div><div id="playhead" class="playhead"></div></div><input id="trimStartRange" class="trim-range trim-start" type="range" min="0" max="${d}" step="0.01" value="0"><input id="trimEndRange" class="trim-range trim-end" type="range" min="0" max="${d}" step="0.01" value="${trimState.end}"></div><div class="trim-values"><label>开始<input id="trimStartText" value="${formatDuration(0,true)}"></label><div class="duration-pill">选中 <strong id="trimDurationText"></strong></div><label>结束<input id="trimEndText" value="${formatDuration(trimState.end,true)}"></label></div>`;
  const sr=el('trimStartRange'),er=el('trimEndRange'),st=el('trimStartText'),et=el('trimEndText');
  const syncFromRange=()=>{let s=Number(sr.value),e=Number(er.value);if(s>e-0.02){if(document.activeElement===sr)s=Math.max(0,e-0.02);else e=Math.min(d,s+0.02);}trimState.start=s;trimState.end=e;sr.value=String(s);er.value=String(e);st.value=formatDuration(s,true);et.value=formatDuration(e,true);updateTrimVisual();}; sr.addEventListener('input',syncFromRange);er.addEventListener('input',syncFromRange);
  const parseText=text=>{const parts=String(text).trim().split(':'); if(parts.some(p=>Number.isNaN(Number(p))))return NaN; if(parts.length===2)return Number(parts[0])*60+Number(parts[1]); if(parts.length===3)return Number(parts[0])*3600+Number(parts[1])*60+Number(parts[2]); return Number(text);};
  const syncText=()=>{const s=parseText(st.value),e=parseText(et.value);if(Number.isFinite(s)&&Number.isFinite(e)&&s>=0&&e>s&&e<=d+0.01){trimState.start=s;trimState.end=e;sr.value=String(s);er.value=String(e);updateTrimVisual();}else{st.value=formatDuration(trimState.start,true);et.value=formatDuration(trimState.end,true);}};st.addEventListener('change',syncText);et.addEventListener('change',syncText);
  el('markStart').addEventListener('click',()=>{trimState.start=Math.min(media.currentTime,trimState.end-0.02);sr.value=trimState.start;st.value=formatDuration(trimState.start,true);updateTrimVisual();}); el('markEnd').addEventListener('click',()=>{trimState.end=Math.max(media.currentTime,trimState.start+0.02);er.value=trimState.end;et.value=formatDuration(trimState.end,true);updateTrimVisual();}); el('previewRange').addEventListener('click',()=>{media.currentTime=trimState.start;trimState.previewing=true;media.play().catch(()=>{});}); el('resetRange').addEventListener('click',()=>{trimState.start=0;trimState.end=d;sr.value=0;er.value=d;st.value=formatDuration(0,true);et.value=formatDuration(d,true);updateTrimVisual();}); updateTrimVisual();
}
function updateTrimVisual(){ const d=trimState.duration||1; const left=trimState.start/d*100,right=trimState.end/d*100; const selection=el('timelineSelection'); if(selection){selection.style.left=`${left}%`;selection.style.width=`${Math.max(0,right-left)}%`;} const t=el('trimDurationText');if(t)t.textContent=formatDuration(trimState.end-trimState.start,true); }
function updatePlayhead(current){const p=el('playhead');if(p&&trimState.duration)p.style.left=`${Math.max(0,Math.min(100,current/trimState.duration*100))}%`;}
async function drawWaveform(file){ wavePanel.classList.remove('hidden'); waveHint.textContent='正在准备波形…'; if(file.size>WAVEFORM_LIMIT){waveHint.textContent='文件较大，为节省内存不生成波形；仍可使用播放器和时间轴。';return;} const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx){waveHint.textContent='当前浏览器不支持波形解码。';return;} const ctx=new Ctx(); try{const buffer=await ctx.decodeAudioData(await file.arrayBuffer());const data=buffer.getChannelData(0);const canvas=waveform;const rect=canvas.getBoundingClientRect();const width=Math.max(320,Math.floor(rect.width*devicePixelRatio));const height=Math.floor(120*devicePixelRatio);canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.clearRect(0,0,width,height);c.strokeStyle='rgba(143,180,255,.95)';c.lineWidth=Math.max(1,devicePixelRatio);c.beginPath();const step=Math.max(1,Math.floor(data.length/width));for(let x=0;x<width;x++){let min=1,max=-1;const start=x*step;for(let j=0;j<step&&start+j<data.length;j++){const v=data[start+j];if(v<min)min=v;if(v>max)max=v;}c.moveTo(x,(1+min)*height/2);c.lineTo(x,(1+max)*height/2);}c.stroke();waveHint.textContent='波形用于定位声音变化，裁剪选区与上方时间轴同步。';}finally{await ctx.close().catch(()=>{});} }
function renderSecondaryPreview(){ const host=el('secondPreview');if(!host)return; if(!secondaryFile){host.innerHTML='';return;} const url=fileObjectURL(secondaryFile);host.innerHTML=`<div class="mini-audio"><strong>${escapeHtml(secondaryFile.name)}</strong><audio src="${url}" controls preload="metadata"></audio></div>`; }

function initBatchStates(){batchStates=selectedFiles.map(file=>({file,status:'waiting',progress:0,error:''}));lastFailedFiles=[];taskBox.classList.remove('hidden');}
function renderTaskList(){if(!TOOLS[activeTool].batch)return;taskBox.classList.remove('hidden');taskList.innerHTML=batchStates.map((t,i)=>`<div class="task-row ${t.status}"><span class="task-status">${t.status==='done'?'✓':t.status==='failed'?'!':t.status==='running'?'●':'○'}</span><div><strong>${escapeHtml(t.file.webkitRelativePath||t.file.name)}</strong><small>${t.status==='waiting'?'等待':t.status==='running'?`处理中 ${Math.round(t.progress*100)}%`:t.status==='done'?'完成':`失败 · ${escapeHtml(t.error||'未知错误')}`}</small></div></div>`).join('');}
function setTaskState(index,status,progress=0,error=''){if(!batchStates[index])return;Object.assign(batchStates[index],{status,progress,error});renderTaskList();}
function resumeBatchWaiters(){batchPaused=false;for(const r of batchWaiters)r();batchWaiters=[];if(pauseBatchBtn)pauseBatchBtn.textContent='暂停后续任务';}
async function waitIfPaused(){if(!batchPaused)return;await new Promise(resolve=>batchWaiters.push(resolve));}

async function ensureFFmpeg(){ if(ffmpegLoaded&&ffmpeg)return;statusBox.classList.remove('hidden');setProgress(0,'正在展开内置 FFmpeg 引擎…');ffmpeg=new InlineFFmpeg();ffmpeg.on('log',({message})=>{logBuffer.push(message);if(logBuffer.length>700)logBuffer.shift();});ffmpeg.on('progress',({progress})=>{if(busy&&Number.isFinite(progress)){const overall=progressBase+Math.max(0,Math.min(1,progress))*progressSpan;setProgress(overall,statusText.textContent);if(TOOLS[activeTool].batch){const idx=batchStates.findIndex(t=>t.status==='running');if(idx>=0){batchStates[idx].progress=Math.max(0,Math.min(1,progress));renderTaskList();}}}});try{await ffmpeg.load((ratio,decoded,total)=>setProgress(ratio*.9,`正在展开内置 FFmpeg：${formatBytes(decoded)} / ${formatBytes(total)}`));ffmpegLoaded=true;setProgress(1,'转换引擎已就绪');}catch(error){ffmpeg=null;ffmpegLoaded=false;throw new Error(`FFmpeg 引擎初始化失败：${error?.message||error}`);} }
async function cleanupMounted(){if(!ffmpeg){mountedMode='';mountedPaths=[];mountedMemFiles=[];return;}if(mountedMode==='workerfs'){await ffmpeg.unmount(MOUNT_POINT).catch(()=>{});await ffmpeg.deleteDir(MOUNT_POINT).catch(()=>{});}else if(mountedMode==='memfs'){for(const path of mountedMemFiles)await ffmpeg.deleteFile(path).catch(()=>{});}mountedMode='';mountedPaths=[];mountedMemFiles=[];}
async function mountFiles(files){await cleanupMounted();const total=files.reduce((s,f)=>s+f.size,0);try{await ffmpeg.createDir(MOUNT_POINT).catch(()=>{});const mounted=await ffmpeg.mount('WORKERFS',{files},MOUNT_POINT);if(!mounted)throw new Error('WORKERFS 不可用');mountedMode='workerfs';mountedPaths=files.map(f=>`${MOUNT_POINT}/${f.name}`);return mountedPaths;}catch(error){await cleanupMounted().catch(()=>{});const limit=isMobile?MOBILE_MEMORY_FALLBACK_LIMIT:DESKTOP_MEMORY_FALLBACK_LIMIT;if(total>limit)throw new Error(`浏览器无法直接挂载文件，而且 ${formatBytes(total)} 超过内存兼容模式范围。`);mountedMode='memfs';mountedPaths=[];for(let i=0;i<files.length;i++){const path=`input_${i}${safeExt(files[i].name)}`;setIndeterminate(`正在读取 ${i+1}/${files.length}：${files[i].name}`,'读取中');await ffmpeg.writeFile(path,new Uint8Array(await files[i].arrayBuffer()));mountedPaths.push(path);mountedMemFiles.push(path);}return mountedPaths;}}
function parseDurationFromLogs(lines){for(const line of lines){const m=line.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);if(m)return Number(m[1])*3600+Number(m[2])*60+Number(m[3]);}return 0;}
function parseTracksFromLogs(lines){const tracks=[],seen=new Set();let insideInput=false;for(const raw of lines){const line=String(raw||'');if(/\bInput #0,/i.test(line)){insideInput=true;continue;}if(insideInput&&/\bOutput #0,/i.test(line))break;if(!insideInput||!/Stream #0:\d+/i.test(line)||!/Audio:/i.test(line))continue;const head=line.match(/Stream #0:(\d+)(?:\[[^\]]+\])?(?:\(([^)]+)\))?.*?Audio:\s*(.+)$/i);if(!head)continue;const streamIndex=Number(head[1]);if(!Number.isFinite(streamIndex)||seen.has(streamIndex))continue;seen.add(streamIndex);const audio=head[3].trim(),parts=audio.split(',').map(p=>p.trim()),samplePos=parts.findIndex(p=>/\d+\s*Hz/i.test(p)),sample=audio.match(/(\d+)\s*Hz/i)?.[1],rate=audio.match(/(\d+(?:\.\d+)?)\s*kb\/s/i)?.[1];tracks.push({ordinal:tracks.length,streamIndex,lang:head[2]||'未标注语言',codec:parts[0]||'未知编码',sampleRate:sample?`${sample} Hz`:'',channelLayout:samplePos>=0?(parts[samplePos+1]||''):'',bitrate:rate?`${Math.round(Number(rate))} kb/s`:''});}return tracks;}
async function analyzeTracksForSelected(){if(busy||selectedFiles.length!==1||activeTool!=='videoToAudio')return;busy=true;updateRunButton();statusBox.classList.remove('hidden');cancelBtn.classList.remove('hidden');try{await ensureFFmpeg();const[path]=await mountFiles(selectedFiles);logBuffer=[];setIndeterminate('正在识别真实音轨…','分析中');await ffmpeg.exec(['-hide_banner','-i',path,'-map','0:a?','-c','copy','-frames:a','1','-f','null','-']).catch(()=>-1);currentTracks=parseTracksFromLogs([...logBuffer]);renderTracks();setProgress(1,currentTracks.length?`识别到 ${currentTracks.length} 条音轨`:'没有检测到音频流');}catch(error){showError(error);}finally{await cleanupMounted().catch(()=>{});busy=false;cancelBtn.classList.add('hidden');updateRunButton();}}
function renderTracks(){tracksBox.classList.remove('hidden');if(!currentTracks.length){tracksEl.innerHTML='<div class="empty-note">没有检测到音频流。</div>';return;}tracksEl.innerHTML=currentTracks.map((t,i)=>`<div class="track"><label><input type="checkbox" name="track" value="${t.streamIndex}" ${i===0?'checked':''}><span><strong>音轨 ${i+1} · ${escapeHtml(t.lang)}</strong><small>${[t.codec,t.channelLayout,t.sampleRate,t.bitrate,`Stream #0:${t.streamIndex}`].filter(Boolean).map(escapeHtml).join(' · ')}</small></span></label><button class="mini-button" data-listen-track="${t.streamIndex}">试听 20 秒</button></div>`).join('');tracksEl.querySelectorAll('[data-listen-track]').forEach(btn=>btn.addEventListener('click',()=>previewAudioTrack(Number(btn.dataset.listenTrack))));}
async function previewAudioTrack(streamIndex){if(busy||!selectedFiles[0])return;busy=true;updateRunButton();cancelBtn.classList.remove('hidden');statusBox.classList.remove('hidden');try{await ensureFFmpeg();const[path]=await mountFiles([selectedFiles[0]]);const out=`track_preview_${streamIndex}.mp3`;await execFF(['-ss','0','-t','20','-i',path,'-map',`0:${streamIndex}`,'-vn','-c:a','libmp3lame','-b:a','128k','-y',out],'正在生成音轨试听');const data=await ffmpeg.readFile(out);const blob=new Blob([data],{type:'audio/mpeg'});const url=URL.createObjectURL(blob);resultURLs.push(url);trackPreview.innerHTML=`<audio src="${url}" controls autoplay></audio>`;await ffmpeg.deleteFile(out).catch(()=>{});setProgress(1,'音轨试听已就绪');}catch(error){showError(error);}finally{await cleanupMounted().catch(()=>{});busy=false;cancelBtn.classList.add('hidden');updateRunButton();}}

function audioEncodeArgs(format,bitrate='192'){if(format==='wav')return['-vn','-c:a','pcm_s16le'];if(format==='m4a'||format==='aac')return['-vn','-c:a','aac','-b:a',`${bitrate}k`];if(format==='flac')return['-vn','-c:a','flac'];return['-vn','-c:a','libmp3lame','-b:a',`${bitrate}k`];}
function videoEncodeArgs(crf='24',audioBitrate='128k'){return['-c:v','libx264','-preset','ultrafast','-crf',crf,'-pix_fmt','yuv420p','-c:a','aac','-b:a',audioBitrate,'-movflags','+faststart'];}
function trimRangeArgs(){const start=trimState.start,end=trimState.end;if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start)throw new Error('请选择有效的开始和结束位置。');return['-ss',String(start),'-t',String(end-start)];}
async function execFF(args,label,base=0,span=1){progressBase=base;progressSpan=span;logBuffer=[];setProgress(base,label);const code=await ffmpeg.exec(args);if(code!==0)throw new Error(`${label}失败（FFmpeg 返回码 ${code}）${recentLogs()?`\n${recentLogs()}`:''}`);return code;}
async function execTry(primary,fallback,outputName,label,base=0,span=1){progressBase=base;progressSpan=span;logBuffer=[];setProgress(base,label);let code=await ffmpeg.exec(primary).catch(()=>-1);if(code===0)return;await ffmpeg.deleteFile(outputName).catch(()=>{});logBuffer=[];code=await ffmpeg.exec(fallback);if(code!==0)throw new Error(`${label}失败（FFmpeg 返回码 ${code}）${recentLogs()?`\n${recentLogs()}`:''}`);}
async function addResult(outputName,description){const data=await ffmpeg.readFile(outputName),ext=extOf(outputName),blob=new Blob([data],{type:mimeFor(ext)}),url=URL.createObjectURL(blob);resultURLs.push(url);const item=document.createElement('div');item.className='result';item.innerHTML=`<div><strong>${escapeHtml(outputName)}</strong><span>${formatBytes(blob.size)}${description?` · ${escapeHtml(description)}`:''}</span></div><a class="secondary" href="${url}" download="${escapeHtml(outputName)}">保存文件</a>`;resultsEl.appendChild(item);await ffmpeg.deleteFile(outputName).catch(()=>{});}
async function processPerFile(files,worker){for(let i=0;i<files.length;i++){await waitIfPaused();const[path]=await mountFiles([files[i]]);const base=i/files.length,span=1/files.length;await worker(files[i],path,i,base,span);}}

async function doVideoToAudio(){const format=getOption('audioOutFormat','mp3');if(selectedFiles.length===1&&currentTracks.length){const checked=new Set([...document.querySelectorAll('input[name="track"]:checked')].map(n=>Number(n.value))),tracks=currentTracks.filter(t=>checked.has(t.streamIndex));if(!tracks.length)throw new Error('请至少选择一条音轨。');const[path]=await mountFiles(selectedFiles);for(let i=0;i<tracks.length;i++){const t=tracks[i],out=`${safeStem(selectedFiles[0].name)}_音轨${t.ordinal+1}.${format}`;await execFF(['-i',path,'-map',`0:${t.streamIndex}`,...audioEncodeArgs(format),'-map_metadata','-1','-y',out],`转换音轨 ${t.ordinal+1}`,i/tracks.length,1/tracks.length);await addResult(out,`${format.toUpperCase()} · Stream #0:${t.streamIndex}`);}return;}await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_音频.${format}`;await execFF(['-i',path,'-map','0:a:0',...audioEncodeArgs(format),'-map_metadata','-1','-y',out],`视频转音频 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,format.toUpperCase());});}
async function doAudioFormat(){const format=getOption('audioOutFormat','mp3');await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_转换.${format}`;await execFF(['-i',path,...audioEncodeArgs(format),'-y',out],`音频转换 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,format.toUpperCase());});}
async function doVideoToMp4(){await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_MP4.mp4`;await execTry(['-i',path,'-map','0:v:0','-map','0:a?','-c','copy','-movflags','+faststart','-y',out],['-i',path,'-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-y',out],out,`视频转 MP4 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,'MP4');});}
async function doRemoveAudio(){await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const ext=extOf(file.name)||'mp4',out=`${safeStem(file.name)}_无声.${ext}`;await execFF(['-i',path,'-map','0:v:0','-c:v','copy','-an','-y',out],`去除声音 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,'无声视频');});}
async function doReplaceAudio(){if(!secondaryFile)throw new Error('请选择新音频。');const[videoPath,audioPath]=await mountFiles([selectedFiles[0],secondaryFile]);const out=`${safeStem(selectedFiles[0].name)}_新音频.mp4`,mode=getOption('audioMode','replace'),newVol=Number(getOption('newAudioVolume','100'))/100,origVol=Number(getOption('originalAudioVolume','100'))/100;if(mode==='mix'){const filter=`[0:a:0]volume=${origVol}[a0];[1:a:0]volume=${newVol}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[a]`;await execTry(['-i',videoPath,'-i',audioPath,'-filter_complex',filter,'-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-y',out],['-i',videoPath,'-i',audioPath,'-filter_complex',filter,'-map','0:v:0','-map','[a]','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-y',out],out,'正在混合音频');}else{await execTry(['-i',videoPath,'-i',audioPath,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart','-y',out],['-i',videoPath,'-i',audioPath,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart','-y',out],out,'正在替换音频');}await addResult(out,mode==='mix'?'混合音频':'替换音频');}
async function doVideoTrim(){const range=trimRangeArgs();const file=selectedFiles[0],[path]=await mountFiles([file]),out=`${safeStem(file.name)}_裁剪.mp4`;await execFF([...range,'-i',path,'-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','ultrafast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-y',out],'正在精确裁剪视频');await addResult(out,`片段 ${formatDuration(trimState.start,true)} – ${formatDuration(trimState.end,true)}`);}
async function doAudioTrim(){const range=trimRangeArgs(),file=selectedFiles[0],[path]=await mountFiles([file]),original=extOf(file.name),format=['mp3','wav','m4a','aac','flac'].includes(original)?original:'mp3',out=`${safeStem(file.name)}_裁剪.${format}`;await execFF([...range,'-i',path,...audioEncodeArgs(format,'192'),'-y',out],'正在精确裁剪音频');await addResult(out,`片段 ${formatDuration(trimState.start,true)} – ${formatDuration(trimState.end,true)}`);}
function concatLine(path){return `file '${path.replace(/'/g,"'\\''")}'`;}
async function doVideoConcat(){const paths=await mountFiles(selectedFiles),listName='concat_video.txt';await ffmpeg.writeFile(listName,new TextEncoder().encode(paths.map(concatLine).join('\n')));const out='视频拼接.mp4';try{await execFF(['-f','concat','-safe','0','-i',listName,'-map','0:v:0','-map','0:a?','-c','copy','-movflags','+faststart','-y',out],'正在拼接视频');await addResult(out,'按当前顺序拼接');}catch(error){throw new Error(`${error.message}\n视频拼接要求素材编码、分辨率等参数一致。`);}finally{await ffmpeg.deleteFile(listName).catch(()=>{});}}
async function doAudioConcat(){const paths=await mountFiles(selectedFiles),args=[];for(const p of paths)args.push('-i',p);const inputs=paths.map((_,i)=>`[${i}:a:0]`).join(''),out='音频拼接.mp3';await execFF([...args,'-filter_complex',`${inputs}concat=n=${paths.length}:v=0:a=1[outa]`,'-map','[outa]','-c:a','libmp3lame','-b:a','192k','-y',out],'正在拼接音频');await addResult(out,'按当前顺序拼接');}
async function doVideoCompress(){const level=getOption('compressLevel','balanced'),cfg=level==='high'?['20','160k','高质量']:level==='small'?['30','96k','小体积']:['25','128k','推荐'];await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_压缩.mp4`;await execFF(['-i',path,...videoEncodeArgs(cfg[0],cfg[1]),'-y',out],`视频压缩 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,cfg[2]);});}
async function doAudioCompress(){const rate=getOption('audioBitrate','192');await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_${rate}k.mp3`;await execFF(['-i',path,'-vn','-c:a','libmp3lame','-b:a',`${rate}k`,'-y',out],`音频压缩 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,`${rate} kbps`);});}
async function doVideoResize(){const height=getOption('videoHeight','720');await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_${height}P.mp4`;await execFF(['-i',path,'-vf',`scale=-2:${height}`,...videoEncodeArgs('23','128k'),'-y',out],`调整尺寸 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,`${height}P`);});}
async function doVideoRatio(){const ratio=getOption('videoRatio','16:9'),fit=getOption('ratioFit','contain'),cfg=ratio==='9:16'?[720,1280]:ratio==='1:1'?[1080,1080]:[1280,720],vf=fit==='cover'?`scale=${cfg[0]}:${cfg[1]}:force_original_aspect_ratio=increase,crop=${cfg[0]}:${cfg[1]}`:`scale=${cfg[0]}:${cfg[1]}:force_original_aspect_ratio=decrease,pad=${cfg[0]}:${cfg[1]}:(ow-iw)/2:(oh-ih)/2`;await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_${ratio.replace(':','x')}.mp4`;await execFF(['-i',path,'-vf',vf,...videoEncodeArgs('23','128k'),'-y',out],`修改比例 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,`${ratio} · ${fit==='cover'?'裁切填满':'完整显示'}`);});}
async function doVideoRotate(){const value=getOption('rotate','90'),vf=value==='180'?'transpose=1,transpose=1':value==='270'?'transpose=2':'transpose=1';await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_旋转${value}.mp4`;await execFF(['-i',path,'-vf',vf,...videoEncodeArgs('23','128k'),'-y',out],`视频旋转 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,`${value}°`);});}
async function doVideoMirror(){const value=getOption('mirror','h'),vf=value==='v'?'vflip':'hflip';await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_${value==='v'?'上下':'左右'}镜像.mp4`;await execFF(['-i',path,'-vf',vf,...videoEncodeArgs('23','128k'),'-y',out],`视频镜像 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,'镜像视频');});}
async function doVideoSpeed(){const speed=Number(getOption('speed','1'));await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_${speed}x.mp4`;await execTry(['-i',path,'-filter:v',`setpts=PTS/${speed}`,'-filter:a',`atempo=${speed}`,...videoEncodeArgs('23','128k'),'-y',out],['-i',path,'-filter:v',`setpts=PTS/${speed}`,'-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-an','-movflags','+faststart','-y',out],out,`视频倍速 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,`${speed}x`);});}
async function doAudioSpeed(){const speed=Number(getOption('speed','1'));await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_${speed}x.mp3`;await execFF(['-i',path,'-vn','-filter:a',`atempo=${speed}`,'-c:a','libmp3lame','-b:a','192k','-y',out],`音频倍速 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,`${speed}x`);});}
async function doVolume(){const volume=Number(getOption('volumePct','100'))/100;await processPerFile(selectedFiles,async(file,path,i,base,span)=>{const out=`${safeStem(file.name)}_音量${Math.round(volume*100)}.mp3`;await execFF(['-i',path,'-vn','-filter:a',`volume=${volume}`,'-c:a','libmp3lame','-b:a','192k','-y',out],`调整音量 ${i+1}/${selectedFiles.length}`,base,span);await addResult(out,`${Math.round(volume*100)}%`);});}
async function processBatchFile(action,file,path,i,total){if(action==='videoToAudio'){if(!isVideoFile(file))throw new Error('不是支持的视频文件');const out=`${safeStem(file.name)}_音频.mp3`;await execFF(['-i',path,'-map','0:a:0','-vn','-c:a','libmp3lame','-b:a','192k','-y',out],`视频转 MP3 ${i+1}/${total}`,i/total,1/total);await addResult(out,'MP3');return;}if(action==='videoToMp4'){if(!isVideoFile(file))throw new Error('不是支持的视频文件');const out=`${safeStem(file.name)}_MP4.mp4`;await execTry(['-i',path,'-c','copy','-movflags','+faststart','-y',out],['-i',path,...videoEncodeArgs('23','128k'),'-y',out],out,`视频转 MP4 ${i+1}/${total}`,i/total,1/total);await addResult(out,'MP4');return;}if(action==='removeAudio'){if(!isVideoFile(file))throw new Error('不是支持的视频文件');const out=`${safeStem(file.name)}_无声.${extOf(file.name)||'mp4'}`;await execFF(['-i',path,'-map','0:v:0','-c:v','copy','-an','-y',out],`视频去声音 ${i+1}/${total}`,i/total,1/total);await addResult(out,'无声');return;}if(action==='videoCompress'){if(!isVideoFile(file))throw new Error('不是支持的视频文件');const out=`${safeStem(file.name)}_压缩.mp4`;await execFF(['-i',path,...videoEncodeArgs('25','128k'),'-y',out],`视频压缩 ${i+1}/${total}`,i/total,1/total);await addResult(out,'推荐档');return;}if(!isAudioFile(file))throw new Error('不是支持的音频文件');const out=`${safeStem(file.name)}_MP3.mp3`;await execFF(['-i',path,'-vn','-c:a','libmp3lame','-b:a','192k','-y',out],`音频转 MP3 ${i+1}/${total}`,i/total,1/total);await addResult(out,'MP3');}
async function doBatch(){const action=getOption('batchAction','videoToAudio'),files=[...selectedFiles];if(batchStates.length!==files.length)initBatchStates();lastFailedFiles=[];pauseBatchBtn.classList.remove('hidden');retryFailedBtn.classList.add('hidden');for(let i=0;i<files.length;i++){await waitIfPaused();setTaskState(i,'running',0);try{const[path]=await mountFiles([files[i]]);await processBatchFile(action,files[i],path,i,files.length);setTaskState(i,'done',1);}catch(error){setTaskState(i,'failed',0,friendlyError(error));lastFailedFiles.push(files[i]);}finally{await cleanupMounted().catch(()=>{});}}if(lastFailedFiles.length)retryFailedBtn.classList.remove('hidden');}

const PROCESSORS = { videoToAudio:doVideoToAudio,audioFormat:doAudioFormat,videoToMp4:doVideoToMp4,removeAudio:doRemoveAudio,replaceAudio:doReplaceAudio,videoTrim:doVideoTrim,audioTrim:doAudioTrim,videoConcat:doVideoConcat,audioConcat:doAudioConcat,videoCompress:doVideoCompress,audioCompress:doAudioCompress,videoResize:doVideoResize,videoRatio:doVideoRatio,videoRotate:doVideoRotate,videoMirror:doVideoMirror,videoSpeed:doVideoSpeed,audioSpeed:doAudioSpeed,volume:doVolume,batch:doBatch,folderBatch:doBatch };

async function runActiveTool(){if(busy||runBtn.disabled)return;clearWarning();clearResults();statusBox.classList.remove('hidden');busy=true;updateRunButton();cancelBtn.classList.remove('hidden');if(TOOLS[activeTool].batch)pauseBatchBtn.classList.remove('hidden');try{await ensureFFmpeg();setProgress(0,`准备：${TOOLS[activeTool].title}`);await PROCESSORS[activeTool]();const failed=lastFailedFiles.length;setProgress(1,failed?`处理完成，${failed} 个失败`:`完成：${TOOLS[activeTool].title}`);if(failed)showWarning(`批量处理完成，但有 ${failed} 个文件失败。可点击“重试失败”。`);}catch(error){console.error(error);showError(error);statusText.textContent='处理失败';}finally{await cleanupMounted().catch(()=>{});busy=false;cancelBtn.classList.add('hidden');pauseBatchBtn.classList.add('hidden');resumeBatchWaiters();updateRunButton();}}
async function cancelWork(){if(!busy||!ffmpeg)return;try{ffmpeg.terminate();}catch{}ffmpeg=null;ffmpegLoaded=false;mountedMode='';mountedPaths=[];mountedMemFiles=[];busy=false;resumeBatchWaiters();cancelBtn.classList.add('hidden');pauseBatchBtn.classList.add('hidden');updateRunButton();setProgress(0,'已取消。下次处理会重新加载内置引擎。');}

async function readDirectoryEntry(entry){if(entry.isFile)return new Promise((resolve,reject)=>entry.file(file=>resolve([file]),reject));if(!entry.isDirectory)return[];const reader=entry.createReader(),children=[];while(true){const batch=await new Promise((resolve,reject)=>reader.readEntries(resolve,reject));if(!batch.length)break;children.push(...batch);}return(await Promise.all(children.map(readDirectoryEntry))).flat();}
async function filesFromDrop(dt){const items=[...(dt.items||[])];if(activeTool==='folderBatch'&&items.some(item=>item.webkitGetAsEntry)){const entries=items.map(item=>item.webkitGetAsEntry?.()).filter(Boolean);return(await Promise.all(entries.map(readDirectoryEntry))).flat().filter(f=>isVideoFile(f)||isAudioFile(f));}return[...(dt.files||[])];}

pick.addEventListener('click',()=>fileInput.click());pickFolder.addEventListener('click',()=>folderInput.click());fileInput.addEventListener('change',()=>setFiles(fileInput.files||[]));folderInput.addEventListener('change',()=>setFiles([...folderInput.files].filter(f=>isVideoFile(f)||isAudioFile(f))));el('clear').addEventListener('click',()=>{if(!busy){resetSelection();renderOptions();updateRunButton();}});runBtn.addEventListener('click',runActiveTool);cancelBtn.addEventListener('click',cancelWork);pauseBatchBtn.addEventListener('click',()=>{batchPaused=!batchPaused;pauseBatchBtn.textContent=batchPaused?'继续后续任务':'暂停后续任务';if(!batchPaused)resumeBatchWaiters();});retryFailedBtn.addEventListener('click',()=>{if(busy||!lastFailedFiles.length)return;selectedFiles=[...lastFailedFiles];initBatchStates();renderFileSummary();renderTaskList();retryFailedBtn.classList.add('hidden');updateRunButton();runActiveTool();});drop.addEventListener('dragover',event=>{event.preventDefault();drop.classList.add('drag');});drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));drop.addEventListener('drop',async event=>{event.preventDefault();drop.classList.remove('drag');if(busy)return;const files=await filesFromDrop(event.dataTransfer);if(files.length)setFiles(files);});

renderNavigation();selectTool(activeTool);

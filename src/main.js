import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import './style.css';

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
        <p>支持浏览器能交给 FFmpeg 的常见视频容器与音频编码。手机也可以直接从“照片”或“文件”中选择。</p>
        <button id="pick" class="primary">选择视频</button>
        <input id="file" class="hidden" type="file" accept="video/*,.mkv,.m4v,.ts,.m2ts,.flv,.avi,.webm,.mov,.mp4" />
      </div>
      <div id="panel" class="file-panel hidden">
        <div class="file-head"><div><div id="fileName" class="file-name"></div><div id="fileMeta" class="meta"></div></div><button id="replace" class="secondary">换一个视频</button></div>
        <div id="warning" class="warning hidden"></div>
        <div class="grid">
          <div class="control"><label for="quality">MP3 音质</label><select id="quality"><option value="vbr2">智能 VBR · 高质量（推荐）</option><option value="128">128 kbps · 标准</option><option value="192">192 kbps · 高质量</option><option value="256">256 kbps · 很高</option><option value="320">320 kbps · 最高固定码率</option></select></div>
          <div class="control"><label>处理模式</label><div style="line-height:1.55">选择一条或多条音轨，逐条转换为 MP3。</div></div>
        </div>
        <div id="tracks" class="tracks"></div>
        <div class="actions"><button id="convert" class="primary" disabled>转换所选音轨</button><button id="cancel" class="secondary hidden">取消</button></div>
        <div id="status" class="status hidden"><div class="status-row"><span id="statusText">准备中…</span><span id="percent">0%</span></div><div class="progress"><div id="bar"></div></div><div id="log" class="log"></div></div>
        <div id="results" class="results"></div>
      </div>
    </section>
    <div class="footer">建议使用最新版 Chrome / Edge / Safari。纯浏览器转码会占用较多内存；超大视频建议在电脑端处理。<br />第一次加载转换引擎后即可开始处理，视频内容不会发送到服务器。</div>
  </div>`;

const el = (id) => document.getElementById(id);
const pick = el('pick'), fileInput = el('file'), drop = el('drop'), panel = el('panel');
const fileName = el('fileName'), fileMeta = el('fileMeta'), warning = el('warning'), tracksEl = el('tracks');
const convertBtn = el('convert'), cancelBtn = el('cancel'), statusBox = el('status'), statusText = el('statusText');
const percent = el('percent'), bar = el('bar'), logEl = el('log'), resultsEl = el('results'), quality = el('quality');
let currentFile = null, ffmpeg = null, ffmpegLoaded = false, logBuffer = [], busy = false, inputName = '';
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

function formatBytes(bytes) { if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'; const units=['B','KB','MB','GB','TB']; const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1); return `${(bytes/1024**i).toFixed(i>1?2:1)} ${units[i]}`; }
function formatDuration(sec) { if (!Number.isFinite(sec)||sec<=0) return '时长待分析'; const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60); return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':'); }
function safeStem(name) { return (name.replace(/\.[^.]+$/,'')||'audio').replace(/[\\/:*?"<>|]/g,'_'); }
function safeExt(name) { const m=name.match(/\.([a-zA-Z0-9]{1,8})$/); return m?`.${m[1].toLowerCase()}`:'.bin'; }
function setProgress(value,text) { const pct=Math.max(0,Math.min(100,Math.round(value*100))); bar.style.width=`${pct}%`; percent.textContent=`${pct}%`; if(text) statusText.textContent=text; }
function resetOutput(){ resultsEl.innerHTML=''; setProgress(0,'准备中…'); logEl.textContent=''; }
function showSizeWarning(file){ const mb=file.size/1024/1024; warning.classList.add('hidden'); if(isMobile&&mb>=500){ warning.textContent=`这段视频约 ${formatBytes(file.size)}。手机浏览器处理大文件时可能因内存不足或锁屏而中断，建议保持页面前台并优先使用电脑。`; warning.classList.remove('hidden'); } else if(!isMobile&&mb>=2048){ warning.textContent=`这段视频约 ${formatBytes(file.size)}。纯浏览器版本需要把视频交给 WebAssembly 处理，2 GB 以上文件可能消耗大量内存；超大文件建议使用桌面 FFmpeg 版本。`; warning.classList.remove('hidden'); } }

async function fetchBlobWithProgress(url, label, startPct, endPct) {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`${label} 加载失败：HTTP ${response.status}`);

  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body || !total) {
    setProgress(startPct, `正在加载${label}…`);
    const blob = await response.blob();
    setProgress(endPct, `${label}加载完成`);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    const ratio = Math.min(1, loaded / total);
    const overall = startPct + (endPct - startPct) * ratio;
    setProgress(overall, `正在下载${label}：${formatBytes(loaded)} / ${formatBytes(total)}`);
  }

  return new Blob(chunks);
}

async function ensureFFmpeg(){
  if(ffmpegLoaded&&ffmpeg) return;
  statusBox.classList.remove('hidden');
  setProgress(.01,'正在准备转换引擎…');

  const base = import.meta.env.BASE_URL;
  const coreSourceURL = new URL(`${base}ffmpeg-core/ffmpeg-core.js`, window.location.origin).href;
  const wasmSourceURL = new URL(`${base}ffmpeg-core/ffmpeg-core.wasm`, window.location.origin).href;

  let coreObjectURL = '';
  let wasmObjectURL = '';

  try {
    const coreBlob = await fetchBlobWithProgress(coreSourceURL, 'FFmpeg 核心脚本', .02, .12);
    coreObjectURL = URL.createObjectURL(new Blob([coreBlob], { type: 'text/javascript' }));

    const wasmBlob = await fetchBlobWithProgress(wasmSourceURL, 'FFmpeg WebAssembly 引擎', .12, .92);
    wasmObjectURL = URL.createObjectURL(new Blob([wasmBlob], { type: 'application/wasm' }));

    setProgress(.94,'下载完成，正在初始化 FFmpeg…');
    ffmpeg=new FFmpeg();
    ffmpeg.on('log',({message})=>{ logBuffer.push(message); if(logBuffer.length>300) logBuffer.shift(); logEl.textContent=message; });
    ffmpeg.on('progress',({progress})=>{ if(busy&&Number.isFinite(progress)) setProgress(progress,statusText.textContent); });
    await ffmpeg.load({ coreURL: coreObjectURL, wasmURL: wasmObjectURL });
    ffmpegLoaded=true;
    setProgress(1,'转换引擎已就绪');
  } catch (err) {
    const message = err?.message || String(err);
    setProgress(0,'转换引擎加载失败');
    logEl.textContent = message;
    throw err;
  } finally {
    if (coreObjectURL) URL.revokeObjectURL(coreObjectURL);
    if (wasmObjectURL) URL.revokeObjectURL(wasmObjectURL);
  }
}
function parseDuration(lines){ for(const line of lines){ const m=line.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/); if(m) return Number(m[1])*3600+Number(m[2])*60+Number(m[3]); } return 0; }
function parseTracks(lines){ const result=[]; for(const line of lines){ if(!/Stream #\d+:\d+/.test(line)||!/Audio:/.test(line)) continue; const lang=line.match(/Stream #\d+:\d+\(([^)]+)\)/)?.[1]||'未标注语言'; const streamIndex=line.match(/Stream #\d+:(\d+)/)?.[1]??'?'; const audio=line.split('Audio:')[1]?.trim()||''; const codec=audio.split(',')[0]?.trim()||'未知编码'; const sampleRate=audio.match(/(\d+)\s*Hz/)?.[1]; const channels=audio.match(/\b(mono|stereo|\d+(?:\.\d+)?)\b/i)?.[1]; const bitrate=audio.match(/(\d+)\s*kb\/s/)?.[1]; result.push({ordinal:result.length,streamIndex,lang,codec,sampleRate:sampleRate?`${sampleRate} Hz`:'',channels:channels||'',bitrate:bitrate?`${bitrate} kb/s`:''}); } return result; }
function renderTracks(tracks){ if(!tracks.length){ tracksEl.innerHTML='<div class="warning">没有识别到音轨。这个文件可能不含音频，或其格式不在当前 WebAssembly 构建的支持范围内。</div>'; convertBtn.disabled=true; return; } tracksEl.innerHTML=tracks.map((t,i)=>`<label class="track"><input type="checkbox" name="track" value="${t.ordinal}" ${i===0?'checked':''} /><div><strong>音轨 ${i+1} · ${t.lang}</strong><span>${[t.codec,t.channels,t.sampleRate,t.bitrate,`Stream #0:${t.streamIndex}`].filter(Boolean).join(' · ')}</span></div></label>`).join(''); convertBtn.disabled=false; }

async function loadFile(file){
  if(!file||busy) return; currentFile=file; panel.classList.remove('hidden'); fileName.textContent=file.name; fileMeta.textContent=`${formatBytes(file.size)} · 正在分析音轨…`; showSizeWarning(file); tracksEl.innerHTML=''; resetOutput(); convertBtn.disabled=true;
  try { busy=true; statusBox.classList.remove('hidden'); cancelBtn.classList.remove('hidden'); await ensureFFmpeg(); inputName=`input${safeExt(file.name)}`; setProgress(.04,'正在读取视频…'); await ffmpeg.writeFile(inputName,await fetchFile(file)); logBuffer=[]; setProgress(.08,'正在识别音轨…'); await ffmpeg.exec(['-hide_banner','-i',inputName]).catch(()=>{}); const duration=parseDuration(logBuffer),tracks=parseTracks(logBuffer); fileMeta.textContent=`${formatBytes(file.size)} · ${formatDuration(duration)} · ${tracks.length} 条音轨`; renderTracks(tracks); setProgress(1,'分析完成'); }
  catch(err){ console.error(err); statusText.textContent='分析失败'; logEl.textContent=err?.message||String(err); warning.textContent='无法分析这个文件。可以尝试换一个视频，或在最新版 Chrome / Edge / Safari 中打开。'; warning.classList.remove('hidden'); }
  finally { busy=false; cancelBtn.classList.add('hidden'); }
}
function qualityArgs(){ return quality.value==='vbr2'?['-q:a','2']:['-b:a',`${quality.value}k`]; }
async function convertSelected(){
  const selected=[...document.querySelectorAll('input[name="track"]:checked')].map(x=>Number(x.value)); if(!currentFile||!selected.length||busy) return; busy=true; resetOutput(); statusBox.classList.remove('hidden'); cancelBtn.classList.remove('hidden'); convertBtn.disabled=true;
  try { await ensureFFmpeg(); const stem=safeStem(currentFile.name); for(let i=0;i<selected.length;i++){ const track=selected[i],outputName=`${stem}_音轨${track+1}.mp3`; setProgress(0,`正在转换音轨 ${track+1}（${i+1}/${selected.length}）…`); logBuffer=[]; const code=await ffmpeg.exec(['-i',inputName,'-map',`0:a:${track}`,'-vn','-c:a','libmp3lame',...qualityArgs(),'-map_metadata','-1','-y',outputName]); if(code!==0) throw new Error(`音轨 ${track+1} 转换失败（FFmpeg code ${code}）`); const data=await ffmpeg.readFile(outputName); const blob=new Blob([data.buffer],{type:'audio/mpeg'}),url=URL.createObjectURL(blob),item=document.createElement('div'); item.className='result'; item.innerHTML=`<div><strong>${outputName}</strong><span>${formatBytes(blob.size)} · MP3</span></div><a class="secondary" href="${url}" download="${outputName}" style="text-decoration:none;text-align:center">保存 MP3</a>`; resultsEl.appendChild(item); await ffmpeg.deleteFile(outputName).catch(()=>{}); } setProgress(1,`完成：已生成 ${selected.length} 个 MP3`); }
  catch(err){ console.error(err); statusText.textContent='转换失败'; logEl.textContent=err?.message||String(err); }
  finally { busy=false; cancelBtn.classList.add('hidden'); convertBtn.disabled=false; }
}
async function cancelWork(){ if(!busy||!ffmpeg) return; try{ffmpeg.terminate();}catch{} ffmpeg=null; ffmpegLoaded=false; busy=false; cancelBtn.classList.add('hidden'); convertBtn.disabled=!currentFile; setProgress(0,'已取消。再次转换时会重新加载引擎。'); }
pick.addEventListener('click',()=>fileInput.click()); el('replace').addEventListener('click',()=>fileInput.click()); fileInput.addEventListener('change',()=>loadFile(fileInput.files?.[0])); convertBtn.addEventListener('click',convertSelected); cancelBtn.addEventListener('click',cancelWork);
drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag');}); drop.addEventListener('dragleave',()=>drop.classList.remove('drag')); drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag');const file=e.dataTransfer?.files?.[0];if(file)loadFile(file);});

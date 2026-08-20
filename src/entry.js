async function loadSourceFallback() {
  const mainURL = new URL('./main.js', import.meta.url);
  const response = await fetch(mainURL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`main.js 加载失败：HTTP ${response.status}`);

  let code = await response.text();
  code = code.replace("import './style.css';", '');
  code = code.replace(
    'const base = import.meta.env.BASE_URL;',
    "const base = '/video-audio-web/';"
  );
  code = code.replace(
    "const coreSourceURL = new URL(`${base}ffmpeg-core/ffmpeg-core.js`, window.location.origin).href;",
    "const coreSourceURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js';"
  );
  code = code.replace(
    "const wasmSourceURL = new URL(`${base}ffmpeg-core/ffmpeg-core.wasm`, window.location.origin).href;",
    "const wasmSourceURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm';"
  );

  const blobURL = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  try {
    await import(blobURL);
  } finally {
    URL.revokeObjectURL(blobURL);
  }
}

try {
  if (import.meta.env?.BASE_URL) {
    await import('./main.js');
  } else {
    await loadSourceFallback();
  }
} catch (error) {
  console.error(error);
  if (window.__showBootError) {
    window.__showBootError(error?.message || String(error));
  }
}

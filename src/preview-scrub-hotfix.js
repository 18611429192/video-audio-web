/* PREVIEW_SCRUB_HOTFIX_V1 */
(() => {
  const style = document.createElement('style');
  style.id = 'preview-scrub-hotfix-style';
  style.textContent = `
    .media-frame {
      width: 100%;
      min-height: 220px;
      height: min(420px, 62vh);
      aspect-ratio: auto;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: #03050a;
      margin-inline: auto;
    }
    .media-frame video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center center;
    }
    .timeline-track {
      cursor: pointer;
      touch-action: none;
    }
    .timeline-track::before {
      content: '';
      position: absolute;
      inset: -12px 0;
    }
    .trim-range {
      touch-action: none;
    }
    .trim-range::-webkit-slider-thumb {
      width: 28px;
      height: 36px;
    }
    .trim-range::-moz-range-thumb {
      width: 26px;
      height: 34px;
    }
    .wave-panel canvas {
      cursor: pointer;
      touch-action: none;
    }
  `;
  document.head.appendChild(style);

  function clampPreviewTime(media, value) {
    const duration = Number(media?.duration) || trimState.duration || 0;
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(duration || value, value));
  }

  function seekPreview(media, value) {
    if (!media) return;
    const time = clampPreviewTime(media, Number(value));
    trimState.previewing = false;
    media.pause();
    try { media.currentTime = time; } catch {}
    updatePlayhead(time);
  }

  function sourceAspect(video) {
    const width = Number(video?.videoWidth) || Number(mediaMeta.width) || 16;
    const height = Number(video?.videoHeight) || Number(mediaMeta.height) || 9;
    return width > 0 && height > 0 ? width / height : 16 / 9;
  }

  function selectedAspect(video) {
    if (activeTool !== 'videoRatio') return sourceAspect(video);
    const value = getOption('videoRatio', '16:9');
    const [w, h] = value.split(':').map(Number);
    return w > 0 && h > 0 ? w / h : sourceAspect(video);
  }

  function layoutPreviewFrame(video) {
    const frame = previewHost.querySelector('.media-frame');
    if (!frame || !video) return;

    const ratio = selectedAspect(video);
    const hostWidth = Math.max(280, previewHost.clientWidth || frame.parentElement?.clientWidth || 640);
    const maxHeight = Math.max(260, Math.min(window.innerHeight * 0.72, 760));
    const minHeight = Math.min(240, maxHeight);

    let width = hostWidth;
    let height = width / ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }
    if (height < minHeight && width < hostWidth) {
      height = minHeight;
      width = Math.min(hostWidth, height * ratio);
    }

    frame.style.aspectRatio = 'auto';
    frame.style.width = `${Math.round(width)}px`;
    frame.style.height = `${Math.round(height)}px`;
    frame.style.maxWidth = '100%';
    frame.style.marginInline = 'auto';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectPosition = 'center center';
    video.style.objectFit = activeTool === 'videoRatio' ? getOption('ratioFit', 'contain') : 'contain';
  }

  const originalApplyRatioPreview = applyRatioPreview;
  applyRatioPreview = function previewAspectFix() {
    const video = previewHost.querySelector('video');
    if (!video) return;
    layoutPreviewFrame(video);
    if (activeTool === 'videoRatio') {
      video.style.objectFit = getOption('ratioFit', 'contain');
    } else {
      video.style.objectFit = 'contain';
    }
  };

  const originalApplyPreviewTransform = applyPreviewTransform;
  applyPreviewTransform = function previewTransformFitFix() {
    const video = previewHost.querySelector('video');
    if (!video) return;
    layoutPreviewFrame(video);
    const frame = previewHost.querySelector('.media-frame');
    const quarterTurn = Math.abs(Number(previewTransform.rotate) || 0) % 180 === 90;
    let fitScale = 1;
    if (quarterTurn && frame?.clientWidth && frame?.clientHeight) {
      fitScale = Math.min(frame.clientWidth / frame.clientHeight, frame.clientHeight / frame.clientWidth);
    }
    const sx = (Number(previewTransform.scaleX) || 1) * fitScale;
    const sy = (Number(previewTransform.scaleY) || 1) * fitScale;
    video.style.transform = `rotate(${Number(previewTransform.rotate) || 0}deg) scale(${sx},${sy})`;
  };

  const originalSetupTrimUI = setupTrimUI;
  setupTrimUI = function timelineScrubFix(media) {
    originalSetupTrimUI(media);

    const startRange = el('trimStartRange');
    const endRange = el('trimEndRange');
    const startText = el('trimStartText');
    const endText = el('trimEndText');
    const track = trimPanel.querySelector('.timeline-track');

    if (startRange) {
      startRange.addEventListener('input', () => seekPreview(media, startRange.value));
      startRange.addEventListener('change', () => seekPreview(media, startRange.value));
    }
    if (endRange) {
      endRange.addEventListener('input', () => seekPreview(media, endRange.value));
      endRange.addEventListener('change', () => seekPreview(media, endRange.value));
    }
    if (startText) startText.addEventListener('change', () => seekPreview(media, trimState.start));
    if (endText) endText.addEventListener('change', () => seekPreview(media, trimState.end));

    if (track) {
      let scrubbing = false;
      const seekFromPointer = (event) => {
        const rect = track.getBoundingClientRect();
        if (!rect.width) return;
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        seekPreview(media, ratio * trimState.duration);
      };
      track.addEventListener('pointerdown', (event) => {
        scrubbing = true;
        try { track.setPointerCapture(event.pointerId); } catch {}
        seekFromPointer(event);
      });
      track.addEventListener('pointermove', (event) => { if (scrubbing) seekFromPointer(event); });
      track.addEventListener('pointerup', (event) => {
        scrubbing = false;
        try { track.releasePointerCapture(event.pointerId); } catch {}
      });
      track.addEventListener('pointercancel', () => { scrubbing = false; });
    }

    if (activeTool === 'audioTrim' && waveform) {
      const seekWaveform = (event) => {
        const rect = waveform.getBoundingClientRect();
        if (!rect.width) return;
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        seekPreview(media, ratio * trimState.duration);
      };
      waveform.addEventListener('pointerdown', seekWaveform, { once: false });
    }
  };

  previewHost.addEventListener('loadedmetadata', (event) => {
    const video = event.target instanceof HTMLVideoElement ? event.target : null;
    if (!video) return;
    requestAnimationFrame(() => {
      layoutPreviewFrame(video);
      applyPreviewTransform();
    });
  }, true);

  window.addEventListener('resize', () => {
    const video = previewHost.querySelector('video');
    if (!video) return;
    layoutPreviewFrame(video);
    applyPreviewTransform();
  }, { passive: true });

  void originalApplyRatioPreview;
  void originalApplyPreviewTransform;
})();

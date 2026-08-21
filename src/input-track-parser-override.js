function parseTracksFromLogs(lines) {
  const tracks = [];
  const seenStreamIndexes = new Set();
  let insideInput = false;

  for (const rawLine of lines) {
    const line = String(rawLine || '');

    if (/\bInput #0,/i.test(line)) {
      insideInput = true;
      continue;
    }

    if (insideInput && /\bOutput #0,/i.test(line)) break;
    if (!insideInput) continue;
    if (!/Stream #0:\d+/i.test(line) || !/Audio:/i.test(line)) continue;

    const head = line.match(/Stream #0:(\d+)(?:\[[^\]]+\])?(?:\(([^)]+)\))?.*?Audio:\s*(.+)$/i);
    if (!head) continue;

    const streamIndex = Number(head[1]);
    if (!Number.isFinite(streamIndex) || seenStreamIndexes.has(streamIndex)) continue;
    seenStreamIndexes.add(streamIndex);

    const lang = head[2] || '未标注语言';
    const audio = head[3].trim();
    const parts = audio.split(',').map((part) => part.trim());
    const codec = parts[0] || '未知编码';
    const samplePos = parts.findIndex((part) => /\d+\s*Hz/i.test(part));
    const sampleRate = audio.match(/(\d+)\s*Hz/i)?.[1];
    const channelLayout = samplePos >= 0 && parts[samplePos + 1] ? parts[samplePos + 1] : '';
    const bitrate = audio.match(/(\d+(?:\.\d+)?)\s*kb\/s/i)?.[1];

    tracks.push({
      ordinal: tracks.length,
      streamIndex,
      lang,
      codec,
      sampleRate: sampleRate ? `${sampleRate} Hz` : '',
      channelLayout,
      bitrate: bitrate ? `${Math.round(Number(bitrate))} kb/s` : '',
    });
  }

  return tracks;
}

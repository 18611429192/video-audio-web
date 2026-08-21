import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const source = await readFile(resolve('src/input-track-parser-override.js'), 'utf8');
const parseTracksFromLogs = new Function(`${source}\nreturn parseTracksFromLogs;`)();

const singleTrackWithOutput = [
  "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'single.mp4':",
  '  Duration: 00:03:13.75, start: 0.000000, bitrate: 389 kb/s',
  '  Stream #0:0[0x1](und): Video: h264 (High), yuv420p, 720x1280',
  '  Stream #0:1[0x2](und): Audio: aac (LC), 44100 Hz, stereo, fltp, 128 kb/s (default)',
  "Output #0, null, to 'pipe:':",
  '  Stream #0:0: Audio: aac (LC), 44100 Hz, stereo, fltp, 128 kb/s',
];

const single = parseTracksFromLogs(singleTrackWithOutput);
assert.equal(single.length, 1, '单音轨文件不能把 Output 流重复识别成第二条音轨');
assert.equal(single[0].streamIndex, 1);

const realMultiTrack = [
  "Input #0, matroska,webm, from 'multi.mkv':",
  '  Stream #0:0: Video: h264, yuv420p, 1920x1080',
  '  Stream #0:1(chi): Audio: aac, 48000 Hz, stereo, fltp, 192 kb/s',
  '  Stream #0:2(eng): Audio: ac3, 48000 Hz, 5.1(side), fltp, 448 kb/s',
  '  Stream #0:3(jpn): Audio: aac, 48000 Hz, stereo, fltp, 192 kb/s',
  '  Stream #0:2(eng): Audio: ac3, 48000 Hz, 5.1(side), fltp, 448 kb/s',
  "Output #0, null, to 'pipe:':",
  '  Stream #0:0: Audio: aac, 48000 Hz, stereo, fltp, 192 kb/s',
];

const multi = parseTracksFromLogs(realMultiTrack);
assert.deepEqual(multi.map((track) => track.streamIndex), [1, 2, 3], '真实多音轨必须按输入 stream index 全部保留并去重');
assert.deepEqual(multi.map((track) => track.lang), ['chi', 'eng', 'jpn']);
assert.deepEqual(multi.map((track) => track.ordinal), [0, 1, 2]);

console.log('Track parser tests passed: single input stays single; real multi-track stays multi-track.');

# 视频音频分离 · 纯网页 MP3 转换器

这是一个完全在浏览器中运行的静态网页工具。视频文件不会上传到服务器，FFmpeg WebAssembly 在用户设备本地完成音轨识别与 MP3 转换。

## 功能

- 手机 / 电脑响应式界面
- 拖拽或选择本地视频
- 自动分析并列出多条音轨
- 可勾选一条或多条音轨
- 输出 MP3：VBR 高质量、128/192/256/320 kbps
- 转换进度与 FFmpeg 日志
- FFmpeg 引擎真实下载进度
- FFmpeg 核心持久缓存，后续打开优先从本地缓存加载
- 转换结果直接保存到设备
- 手机和超大文件风险提示
- 无后端、无数据库、视频不上传

## 本地开发

需要 Node.js 20+。

```bash
npm install
npm run dev
```

## 构建

```bash
npm install
npm run build
```

构建结果位于 `dist/`。

## GitHub Pages

仓库包含 GitHub Actions 工作流。推送到 `main` 后会自动构建并发布到 GitHub Pages。

## 缓存说明

首次使用时浏览器会下载 FFmpeg WebAssembly 核心，并通过 Service Worker 写入 Cache Storage。后续再次打开网页时，同一版本的 FFmpeg 核心优先直接从本地缓存读取，不需要重新下载。升级 FFmpeg 版本时可更新 `public/sw.js` 中的缓存版本号以自动淘汰旧缓存。

## 手机使用

部署到 HTTPS 后，iPhone Safari 与 Android Chrome/Edge 均可打开。由于 WebAssembly 会占用设备内存，手机更适合处理中小视频。建议转换时保持页面在前台，不要锁屏。

## 当前限制

纯浏览器版会把视频数据交给 WebAssembly 虚拟文件系统，因此几 GB 甚至几十 GB 的视频可能因浏览器或设备内存限制失败。此场景更适合原生桌面 FFmpeg。

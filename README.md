# 视频音频分离 · 纯网页 MP3 转换器

这是一个完全在浏览器中运行的静态网页工具。视频文件不会上传到服务器，FFmpeg WebAssembly 在用户设备本地完成音轨识别与 MP3 转换。

## 功能

- 手机 / 电脑响应式界面
- 拖拽或选择本地视频
- 自动分析并列出多条音轨
- 可勾选一条或多条音轨
- 输出 MP3：VBR 高质量、128/192/256/320 kbps
- 转换进度与 FFmpeg 日志
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

## 手机使用

部署到 HTTPS 后，iPhone Safari 与 Android Chrome/Edge 均可打开。由于 WebAssembly 会占用设备内存，手机更适合处理中小视频。建议转换时保持页面在前台，不要锁屏。

## 当前限制

纯浏览器版会把视频数据交给 WebAssembly 虚拟文件系统，因此几 GB 甚至几十 GB 的视频可能因浏览器或设备内存限制失败。此场景更适合原生桌面 FFmpeg。

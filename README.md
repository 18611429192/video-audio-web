# 视频音频分离 · 单文件离线版

这是一个完全在浏览器本地运行的视频音轨提取与 MP3 转换工具。

最终发布物只有 **一个 `index.html`**。页面、样式、FFmpeg Worker、`ffmpeg-core.js` 和约 30.7 MB 的 WebAssembly 核心都内置在这个 HTML 中，因此可以离线保存、复制和分发，不依赖 CDN、服务器、Service Worker 或其他静态文件。

## 在线使用

GitHub Pages：

https://18611429192.github.io/video-audio-web/

Pages 与离线文件使用的是同一套单文件构建产物。

## 功能

- 手机和电脑浏览器均可使用
- 拖拽或选择本地视频
- 支持 FFmpeg 能识别的常见视频容器和音频编码
- 自动识别并列出多条音轨
- 可选择一条或多条音轨转换
- 输出 MP3：VBR 高质量、128 / 192 / 256 / 320 kbps
- 优先使用 WORKERFS 直接读取本地文件，减少手机端大文件内存复制
- 音轨分析使用 FFmpeg 媒体日志，避免部分移动浏览器中 ffprobe 的异常
- 显示引擎展开、分析和转换进度
- 视频与音频数据不会上传到服务器

## 离线使用

GitHub Actions 每次构建都会上传一个名为 `video-audio-offline-single-html` 的 artifact，其中只有最终的 `index.html`。

下载后可以把文件改名为任意名称，例如：

```text
video-audio-offline.html
```

然后直接用现代浏览器打开即可。文件约 41 MB，因为 FFmpeg WebAssembly 已完整内置。

> 手机文件管理器自带的“网页预览”可能不支持 Blob Worker。遇到这种情况，请选择 Chrome、Edge、Safari 等正式浏览器打开 HTML 文件。

## 从源码构建

需要 Node.js 22 或更高版本。

```bash
npm install
npm run build
```

构建结果：

```text
dist/
└── index.html
```

构建脚本会从 `@ffmpeg/core` 读取 UMD 版 `ffmpeg-core.js` 和 `ffmpeg-core.wasm`，将其编码并嵌入最终 HTML，同时内嵌页面 CSS、应用代码和 Blob Worker。

生成的 `dist/index.html` 不提交到仓库，以避免每次修改都产生约 41 MB 的大文件 diff；GitHub Actions 会构建并发布这个单文件产物。

## 仓库结构

```text
.github/workflows/pages.yml   GitHub Pages / 离线 artifact 构建与发布
scripts/build-standalone.mjs  单 HTML 构建器
src/standalone-app.js         浏览器端应用逻辑
src/style.css                 页面样式
package.json                  构建依赖与命令
```

当前运行架构不再使用 Vite、外部 Worker、Service Worker 或运行时 CDN。

## GitHub Pages 发布

推送到 `main` 后，GitHub Actions 会：

1. 安装 `@ffmpeg/core`。
2. 构建单个 `dist/index.html`。
3. 校验 `dist` 中只有这一个文件，并确认 FFmpeg JS / WASM 已内嵌。
4. 上传离线 HTML artifact。
5. 将相同的 `dist` 发布到 GitHub Pages。

Pull Request 也会执行同样的单文件构建校验，但不会部署 Pages。

## 隐私

所有视频分析、音轨读取和 MP3 转换都在当前浏览器进程中完成。工具没有后端接口，不会把用户选择的视频上传到服务器。

## 当前限制

FFmpeg WebAssembly 仍受浏览器内存、文件系统和移动设备资源限制。单文件版会优先直接挂载本地视频，但超大视频、低内存设备或浏览器主动回收页面时仍可能处理失败。对于数 GB 以上的视频，桌面原生 FFmpeg 通常更稳定。

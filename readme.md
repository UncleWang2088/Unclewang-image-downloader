# 王叔图片下载 (WangShu Image Downloader)

双击任意网页图片，弹窗选择保存目录后快速下载的浏览器扩展。基于开源插件 **Double-click Image Downloader** 深度改造。

## 来源

本项目是 [Double-click Image Downloader](https://gitlab.com/Marnes-group/webextensions)（作者：Marnes / leaumar，[MPL-2.0](LICENSE) 协议）的二次开发版本：

- 原插件为 Manifest V2，已无法在 Chrome 中使用 → 本项目已迁移为 **Manifest V3**
- 原插件双击即静默下载 → 本项目增加 **「保存位置选择弹窗」**：双击后弹出目录下拉菜单，确认后才下载
- 增加**目录记忆**：最近使用过的目录自动记住（最多 5 个），下次默认选中；浏览（另存为）选过的目录也会进入列表
- 界面全部中文化；支持常用目录配置（选项页）
- 兼容 Pinterest 等嵌套 DOM 结构站点；支持 canvas 画布兜底截图下载

## 安装方法（Chrome / Edge）

### 方式一：下载构建好的 zip（推荐，无需构建）

1. 打开 [Releases](../../releases) 页面，下载最新的 `wangshu-image-downloader-v7.x.x.zip`
2. 解压到任意目录（得到 `manifest.json`、`content.js` 等文件）
3. 打开浏览器扩展管理页：
   - Chrome：地址栏输入 `chrome://extensions`
   - Edge：地址栏输入 `edge://extensions`
4. 打开右上角「开发者模式」开关
5. 点击「加载已解压的扩展程序」
6. 选择解压后的目录
7. 完成！双击任意网页图片即可体验

### 方式二：从源码构建

前置要求：Node.js ≥ 20、Yarn 4（仓库已内置 `.yarn/releases/yarn-4.1.1.cjs`，无需全局安装）

```bash
yarn install
yarn parcel:build
```

构建产物在 `dist/parcel/`，按方式一第 3-6 步加载即可。

### 使用说明

- **双击图片** → 弹出「保存图片到…」弹窗 → 下拉选择目录（最近使用 / 常用目录 / 默认下载文件夹）→ 点「下载」
- **浏览…**：弹出系统另存为对话框，可保存到任意位置；选过的目录会记入下拉菜单
- **选项页**：右键扩展图标 → 选项 → 可配置「常用目录」「双击后弹出选择器开关」「文件重命名」「右键菜单」等
- 默认下载文件夹即浏览器下载设置中的目录（Chrome 不向扩展暴露该路径的绝对地址，故下拉中显示为「默认下载文件夹」）

## 开发

```bash
yarn tsc            # 类型检查
yarn eslint         # 代码检查
yarn parcel:build   # 构建到 dist/parcel
```

每次迭代版本号 +1（见 `src/manifest.json` 的 `version` 字段），加载后可在控制台日志 / 选项页顶部确认版本。

## 许可证

[MPL-2.0](LICENSE)（继承自 Double-click Image Downloader，原作者版权声明保留）

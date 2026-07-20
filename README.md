# Lumina Memo

个人日程与待办工作台。数据保存在浏览器本地（IndexedDB），支持 PWA 离线使用。

## 功能

- **日 / 周** 顶部开关切换今日时间轴与周视图
- **事件 / 待办** 勾选控制显示内容
- 日视图顶部独立「今日待办」列表
- **拖拽** 改事件时间，底边拉时长（15 分钟吸附）
- **重复规则**：每天 / 每周 / 自定义间隔
- **搜索**：输入关键词回车，跳转到对应日期；多条结果时列出供选择
- **导出 ICS**、浏览器到点提醒
- 本机 IndexedDB 持久化，首次打开带演示数据
- GitHub Pages 静态部署 + 可安装 PWA

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

生产环境 `base` 为 `/test/`（对应仓库名）。若仓库改名，请同步修改 `vite.config.ts` 中的 `base` 与 PWA `start_url` / `scope`。

## 部署

推送到 `main` 后，GitHub Actions 会构建并发布到 GitHub Pages。

也可在仓库 Settings → Pages 中确认 Source 为 GitHub Actions。

# Lumina Memo

个人日程与待办工作台。数据保存在浏览器本地（IndexedDB），支持 PWA 离线使用。

## 功能

- **日 / 周** 顶部开关切换今日时间轴与周视图
- **事件 / 待办** 勾选控制显示内容；全天事件单独一行
- **今日焦点**：日视图顶部显示下一件要做的事
- **拖拽**：改时间 / 拉时长；周视图可跨天；重复事件可选「只改这一次 / 改全部」
- **重复规则**：每天 / 每周 / 自定义间隔
- **搜索**：关键词回车跳转；多结果下列表选择
- **备份**：JSON 导出 / 导入；另支持 ICS 导出
- **提醒**：浏览器到点通知
- 空状态引导；重叠事件自动并排；移动端编辑为底部抽屉
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

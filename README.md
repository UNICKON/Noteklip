# Klip

Klip 是一个本地优先的 Kindle 标注管理与可视化仪表盘：导入/上传 `My Clippings.txt` 后，可以在网页里浏览高亮、按书籍/作者聚合统计，并用图表快速回顾你的阅读轨迹。

## 功能

- **Dashboard**：年度趋势、近 30 天脉冲、热力图、按星期/时段分布、书籍/作者榜单与洞察
- **Library / Highlights**：按书籍与作者浏览、搜索与筛选
- **Export / Backup**：导出与备份（面向迁移/恢复）
- **i18n**：中英双语

## 技术栈

- Vite + React 18
- react-router-dom
- Recharts

## 本地开发（Windows PowerShell）

```powershell
Set-Location "C:\Users\HX\GolandProjects\cursor\klip"
npm.cmd install
npm.cmd run dev
```

## 构建与预览

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

## 部署到 GitHub Pages（`https://<user>.github.io/<repo>/`）

本仓库已内置 GitHub Actions 工作流（见 `.github/workflows/pages.yml`），push 到 `main` 会自动构建并发布到 Pages。

1. Push 代码到 GitHub（确保默认分支为 `main`）
2. GitHub 仓库 → `Settings` → `Pages`
3. `Build and deployment` 选择 **GitHub Actions**
4. 等 Actions 运行完成后访问：`https://<user>.github.io/<repo>/`

说明：为了适配 `/<repo>/` 子路径，本项目在 Pages 构建时会设置 `VITE_BASE=/<repo>/`，并已包含 SPA 刷新/直达子路由的 404 回退处理。

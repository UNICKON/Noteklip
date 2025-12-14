<div align="center">

# 📚 NoteKlip

### Transform Your Kindle Highlights into Actionable Insights
### 将你的 Kindle 标注转化为可操作的洞察

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646cff?logo=vite)](https://vitejs.dev/)
[![Live Demo](https://img.shields.io/badge/demo-noteklip.org-success)](https://noteklip.org)

---

## 📖 Documentation / 文档

选择语言：

[English Documentation](./README_EN.md) | [中文文档](./README_ZH.md)


---

### 🌐 Live Demo / 在线演示

**Visit / 访问:** [noteklip.org](https://noteklip.org)

---

<sub>Built with ❤️ by readers, for readers | 由读者制作，为读者服务</sub>

</div>

## English

### 🌟 Overview

**NoteKlip** is a privacy-first, browser-based dashboard for managing and visualizing your Kindle highlights. Upload your `My Clippings.txt` file and instantly gain insights into your reading habits, discover patterns across books and authors, and revisit your favorite passages—all without sending your data to any server.

### ✨ Key Features

<table>
<tr>
<td width="50%">

#### 📊 **Interactive Dashboard**
- **Yearly Trends**: Track reading activity over time
- **Recent Pulse**: 30-day highlight heatmap
- **Time Analysis**: Distribution by weekday & hour
- **Top Rankings**: Most-highlighted books & prolific authors
- **Author Insights**: Discover your reading universe

</td>
<td width="50%">

#### 📖 **Smart Library**
- **Book Gallery**: Visual grid with cover art support
- **Advanced Search**: Filter by title, author, or content
- **Multi-Sort**: By date, title, author, or highlight count
- **Quick Stats**: See highlight count per book at a glance

</td>
</tr>
<tr>
<td width="50%">

#### 🎯 **Highlights Explorer**
- **Full-Text Search**: Find specific passages instantly
- **Author Filter**: Browse highlights by writer
- **Copy & Share**: One-click copying for notes
- **Metadata Display**: Location & timestamp per highlight

</td>
<td width="50%">

#### 🔧 **Power User Tools**
- **Data Export**: JSON backup for portability
- **Import/Merge**: Add new clippings without duplication
- **Privacy-First**: All processing happens locally
- **Bilingual**: Seamless EN ⇄ 中文 switching

</td>
</tr>
</table>

---

### 🏗️ Architecture

```
NoteKlip/
├── 🎨 Frontend (React 18 + Vite)
│   ├── Dashboard       → Visualizations & insights
│   ├── Library         → Book browsing & search
│   ├── Highlights      → Full-text highlight explorer
│   ├── Export          → Backup & data portability
│   └── Settings        → Import & preferences
│
├── 📊 Data Layer (Local Storage)
│   ├── IndexedDB       → Persistent highlight storage
│   ├── State Manager   → React Context + Hooks
│   └── API Facade      → Unified data access layer
│
└── 🎭 UI Components
    ├── Recharts        → Data visualization
    ├── React Router    → SPA navigation
    └── React Icons     → Iconography
```

---

### 🚀 Quick Start

#### Prerequisites
- Node.js 18+ 
- npm or yarn

#### Installation

```bash
# Clone the repository
git clone https://github.com/UNICKON/klips.git
cd klips

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see NoteKlip in action.

#### Building for Production

```bash
# Create optimized build
npm run build

# Preview production build locally
npm run preview
```

---

### 📦 Deployment

#### Deploy to Cloudflare Pages (Recommended)

1. **Connect Repository**: Link your GitHub repo to Cloudflare Pages
2. **Configure Build**:
   - Build command: `npm ci && npm run build`
   - Output directory: `dist`
   - Environment variable: `VITE_BASE=/`
3. **Deploy**: Push to `main` branch triggers auto-deployment

#### Deploy to GitHub Pages

1. **Enable Pages**: Go to `Settings` → `Pages` → Select `GitHub Actions`
2. **Auto-Deploy**: The included workflow (`.github/workflows/pages.yml`) handles everything
3. **Access**: Visit `https://<username>.github.io/klips/`

> **Note**: The project auto-detects deployment paths via `VITE_BASE` environment variable.

---

### 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 18 | Component-based UI |
| **Build Tool** | Vite 5 | Lightning-fast HMR |
| **Routing** | React Router 6 | Client-side navigation |
| **Visualization** | Recharts | Charts & graphs |
| **Storage** | IndexedDB | Local data persistence |
| **Icons** | React Icons | UI iconography |
| **Bundling** | ESBuild | Optimized production builds |

---

### 📖 Usage Guide

#### 1️⃣ Import Your Highlights

1. Connect your Kindle via USB
2. Navigate to `documents/My Clippings.txt`
3. In NoteKlip, go to **Settings** → **Import**
4. Upload the file or paste content directly

#### 2️⃣ Explore Your Data

- **Dashboard**: Get bird's-eye view of reading patterns
- **Library**: Browse books with visual covers
- **Highlights**: Search and filter individual passages
- **Export**: Backup data as JSON for safekeeping

#### 3️⃣ Customize Your Experience

- **Drag & Drop**: Reorder dashboard cards
- **Language Toggle**: Switch between EN/中文
- **Persistent Settings**: Preferences saved locally

---

### 🔒 Privacy & Security

- ✅ **100% Local**: No data leaves your browser
- ✅ **No Tracking**: Zero analytics or cookies
- ✅ **Open Source**: Full code transparency
- ✅ **Portable**: Export and own your data

---

### 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

### 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

### 🙏 Acknowledgments

- Inspired by the need for a privacy-respecting Kindle companion
- Built with ❤️ for readers who love data
- Special thanks to the open-source community

---

### 📧 Contact & Support

- 🌐 Website: [noteklip.org](https://noteklip.org)
- 🐛 Issues: [GitHub Issues](https://github.com/UNICKON/klips/issues)

---

<div align="center">

**Made with 📖 by readers, for readers**

[⬆ Back to Top](#-noteklip)

</div>

---

## 中文

### 🌟 项目概述

**NoteKlip** 是一个隐私优先、基于浏览器的 Kindle 标注管理与可视化仪表盘。上传你的 `My Clippings.txt` 文件，即可立即洞察阅读习惯、发现跨书籍和作者的模式，并重温你最喜欢的段落——所有数据完全本地处理，不上传任何服务器。

### ✨ 核心功能

<table>
<tr>
<td width="50%">

#### 📊 **交互式仪表盘**
- **年度趋势**：追踪长期阅读活动
- **近期脉动**：30 天标注热力图
- **时间分析**：按星期和小时分布统计
- **榜单排行**：高亮最多的书籍与作者
- **作者洞察**：探索你的阅读宇宙

</td>
<td width="50%">

#### 📖 **智能书库**
- **书籍画廊**：支持封面的可视化网格
- **高级搜索**：按标题、作者或内容筛选
- **多维排序**：日期、书名、作者、高亮数
- **快速统计**：一目了然的书籍高亮数量

</td>
</tr>
<tr>
<td width="50%">

#### 🎯 **高亮浏览器**
- **全文搜索**：瞬间找到特定段落
- **作者过滤**：按作家浏览标注
- **复制分享**：一键复制笔记
- **元数据展示**：每条高亮的位置与时间戳

</td>
<td width="50%">

#### 🔧 **高级工具**
- **数据导出**：JSON 备份便于迁移
- **导入合并**：新增标注自动去重
- **隐私至上**：所有处理完全本地化
- **双语界面**：EN ⇄ 中文 无缝切换

</td>
</tr>
</table>

---

### 🏗️ 技术架构

```
NoteKlip/
├── 🎨 前端层 (React 18 + Vite)
│   ├── 仪表盘         → 可视化与洞察
│   ├── 书库          → 书籍浏览与搜索
│   ├── 高亮          → 全文标注浏览器
│   ├── 导出          → 备份与数据可移植性
│   └── 设置          → 导入与偏好设置
│
├── 📊 数据层 (本地存储)
│   ├── IndexedDB     → 持久化标注存储
│   ├── 状态管理       → React Context + Hooks
│   └── API 门面      → 统一数据访问层
│
└── 🎭 UI 组件
    ├── Recharts      → 数据可视化
    ├── React Router  → SPA 导航
    └── React Icons   → 图标系统
```

---

### 🚀 快速开始

#### 环境要求
- Node.js 18+ 
- npm 或 yarn

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/UNICKON/klips.git
cd klips

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 即可体验 NoteKlip。

#### 生产构建

```bash
# 创建优化构建
npm run build

# 本地预览生产版本
npm run preview
```

---

### 📦 部署指南

#### 部署到 Cloudflare Pages（推荐）

1. **连接仓库**：将 GitHub 仓库关联到 Cloudflare Pages
2. **配置构建**：
   - 构建命令：`npm ci && npm run build`
   - 输出目录：`dist`
   - 环境变量：`VITE_BASE=/`
3. **部署**：推送到 `main` 分支自动触发部署

#### 部署到 GitHub Pages

1. **启用 Pages**：进入 `Settings` → `Pages` → 选择 `GitHub Actions`
2. **自动部署**：内置工作流（`.github/workflows/pages.yml`）自动处理
3. **访问**：访问 `https://<用户名>.github.io/klips/`

> **提示**：项目通过 `VITE_BASE` 环境变量自动适配部署路径。

---

### 🛠️ 技术栈

| 分类 | 技术 | 用途 |
|----------|-----------|---------|
| **框架** | React 18 | 组件化 UI |
| **构建工具** | Vite 5 | 极速热更新 |
| **路由** | React Router 6 | 客户端导航 |
| **可视化** | Recharts | 图表与图形 |
| **存储** | IndexedDB | 本地数据持久化 |
| **图标** | React Icons | UI 图标系统 |
| **打包** | ESBuild | 优化生产构建 |

---

### 📖 使用指南

#### 1️⃣ 导入你的标注

1. 通过 USB 连接 Kindle
2. 打开 `documents/My Clippings.txt`
3. 在 NoteKlip 中进入 **设置** → **导入**
4. 上传文件或直接粘贴内容

#### 2️⃣ 探索你的数据

- **仪表盘**：鸟瞰阅读模式全局
- **书库**：浏览带封面的书籍
- **高亮**：搜索和筛选单条段落
- **导出**：备份数据为 JSON 格式

#### 3️⃣ 自定义体验

- **拖放排序**：重新排列仪表盘卡片
- **语言切换**：EN/中文 自由切换
- **持久化设置**：偏好本地保存

---

### 🔒 隐私与安全

- ✅ **100% 本地**：数据不离开浏览器
- ✅ **零追踪**：无分析工具或 Cookie
- ✅ **开源透明**：代码完全可审查
- ✅ **可移植**：导出并拥有你的数据

---

### 🤝 参与贡献

我们欢迎贡献！请参考以下流程：

1. Fork 仓库
2. 创建特性分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add amazing feature'`）
4. 推送分支（`git push origin feature/amazing-feature`）
5. 发起 Pull Request

---

### 📄 许可证

本项目采用 **MIT 许可证** - 详见 [LICENSE](LICENSE) 文件。

---

### 🙏 致谢

- 灵感源于对隐私友好型 Kindle 工具的需求
- 由热爱数据的读者用 ❤️ 打造
- 特别感谢开源社区

---

### 📧 联系与支持

- 🌐 官网：[noteklip.org](https://noteklip.org)
- 🐛 问题反馈：[GitHub Issues](https://github.com/UNICKON/klips/issues)

---

<div align="center">

**由读者制作，为读者服务 📖**

[⬆ 返回顶部](#-noteklip)

</div>

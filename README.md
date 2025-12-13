<div align="center">

<img src="public/siobar-logo.svg" width="120" height="120" alt="NoteKlip Logo" />

# 📚 NoteKlip

### Transform Your Kindle Highlights into Actionable Insights

*A privacy-first, browser-based dashboard for managing and visualizing Kindle annotations*

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-noteklip.org-4caf50)](https://noteklip.org)

[🇬🇧 English](#english) | [🇨🇳 中文](#中文)

---

</div>

## English

### 🎯 What is NoteKlip?

**NoteKlip** is a privacy-first, browser-based dashboard for managing and visualizing your Kindle highlights. Upload your `My Clippings.txt` file and instantly gain insights into your reading habits, discover patterns across books and authors, and revisit your favorite passages—all without sending your data to any server.

<div align="center">

**📱 Kindle → 📄 Export → 🌐 NoteKlip → 📊 Insights**

| 🎨 Beautiful UI | 🔒 Private by Design | ⚡ Lightning Fast | 🌍 Multilingual |
|:---:|:---:|:---:|:---:|
| Modern & responsive | Zero server uploads | Instant operations | English & 中文 |

</div>

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

### 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NoteKlip Web Application                  │
├─────────────────────────────────────────────────────────────────┤
│  🎨 Presentation Layer (React 18 + Vite)                        │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │  Dashboard   │   Library    │  Highlights  │   Settings   │ │
│  │  Analytics   │   Browse     │   Explorer   │   Import     │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  🧠 Business Logic Layer                                        │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │  Statistics  │  Search &    │   Data       │   Export/    │ │
│  │  Engine      │  Filter      │   Parser     │   Import     │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  💾 Data Storage Layer (Browser-Local)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IndexedDB: Books, Highlights, Authors, Metadata        │  │
│  │  LocalStorage: User Preferences, UI State               │  │
│  │  SessionStorage: Temporary Search State                 │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  🎭 UI Component Library                                        │
│  │  Recharts • React Router • React Icons • Custom Charts   │  │
└─────────────────────────────────────────────────────────────────┘
         ↑                                                ↑
         │ HTTP/HTTPS                                     │ No Server
         │ Static Files Only                              │ Communication
         ↓                                                ↓
   ☁️ CDN / Pages                                    🔒 100% Local
```

**Data Flow Diagram:**

```
Import Flow:
  My Clippings.txt → Parser → Normalizer → Deduplicator → IndexedDB

Query Flow:
  User Action → API Facade → IndexedDB Query → Data Transform → UI Render

Export Flow:
  IndexedDB → Data Serializer → JSON Generator → Browser Download
```

---

### 🚀 Quick Start

<table>
<tr>
<td width="50%">

#### 🖥️ **Local Development**

```bash
# 1️⃣ Clone repository
git clone https://github.com/UNICKON/klips.git
cd klips

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start dev server (with HMR)
npm run dev

# 🌐 Open browser
# → http://localhost:5173
```

**Development Features:**
- ⚡ Hot Module Replacement
- 🔍 React DevTools support
- 📦 Fast refresh on save
- 🐛 Source maps enabled

</td>
<td width="50%">

#### 📦 **Production Build**

```bash
# 1️⃣ Create optimized build
npm run build

# 📊 Build output:
# ✓ dist/index.html
# ✓ dist/assets/*.js (minified + tree-shaken)
# ✓ dist/assets/*.css (optimized)

# 2️⃣ Preview locally
npm run preview

# 🌐 Open browser
# → http://localhost:4173
```

**Build Optimizations:**
- 🗜️ Code splitting & lazy loading
- 📉 Minification & tree-shaking
- 🖼️ Asset optimization
- 📦 Gzip-ready output

</td>
</tr>
</table>

**System Requirements:**
- Node.js: `18.0.0` or higher
- npm: `9.0.0` or higher (or Yarn 1.22+)
- Browser: Modern browsers with ES6+ support
- Disk Space: ~200MB for dependencies

---

### 📦 Deployment Options

<table>
<tr>
<td width="50%">

#### ☁️ **Cloudflare Pages** (Recommended)

**Why Cloudflare Pages?**
- ✅ Global CDN (300+ locations)
- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ Instant rollbacks
- ✅ Free tier available

**Setup Steps:**

1. **Connect Repository**
   ```
   Cloudflare Dashboard → Pages → Create project
   → Connect GitHub account → Select klips repo
   ```

2. **Configure Build Settings**
   ```yaml
   Build command:    npm ci && npm run build
   Build output:     dist
   Root directory:   (leave empty)
   Environment vars: VITE_BASE=/
   ```

3. **Deploy**
   ```bash
   git push origin main
   # ⏱️ Build time: ~1-2 minutes
   # 🌐 Live at: https://klips.pages.dev
   ```

**Custom Domain Setup:**
```
Cloudflare Pages → Custom domains → Add domain
→ noteklip.org → Verify DNS → Done ✓
```

</td>
<td width="50%">

#### 🐙 **GitHub Pages**

**Why GitHub Pages?**
- ✅ Free hosting for public repos
- ✅ Built-in CI/CD with Actions
- ✅ Easy setup
- ✅ Version control integration

**Setup Steps:**

1. **Enable GitHub Actions**
   ```
   Repository Settings → Pages
   → Source: GitHub Actions
   ```

2. **Workflow Auto-Configured**
   - File: `.github/workflows/pages.yml`
   - Trigger: Push to `main`
   - Output: `https://<user>.github.io/klips/`

3. **Environment Variable**
   ```yaml
   # Workflow sets automatically:
   VITE_BASE: /${{ github.event.repository.name }}/
   ```

4. **Deploy**
   ```bash
   git push origin main
   # ⏱️ Build time: ~2-3 minutes
   # 🌐 Check Actions tab for status
   ```

**Custom Domain (Optional):**
```
Settings → Pages → Custom domain
→ Add CNAME record → Save
```

</td>
</tr>
</table>

<details>
<summary><b>🚢 Other Deployment Options</b></summary>

| Platform | Difficulty | Cost | Performance | Notes |
|----------|-----------|------|-------------|-------|
| **Vercel** | ⭐ Easy | Free tier | ⚡⚡⚡ Excellent | Auto HTTPS, instant deploys |
| **Netlify** | ⭐ Easy | Free tier | ⚡⚡⚡ Excellent | Form handling, serverless |
| **AWS S3 + CloudFront** | ⭐⭐⭐ Advanced | Pay-as-you-go | ⚡⚡⚡ Excellent | Full control, scalable |
| **Self-Hosted (Nginx)** | ⭐⭐⭐⭐ Expert | Server costs | Varies | Complete ownership |

</details>

**Deployment Checklist:**

- [ ] Set correct `VITE_BASE` environment variable
- [ ] Verify `_redirects` file in `public/` (for SPA routing)
- [ ] Test build locally: `npm run build && npm run preview`
- [ ] Check `robots.txt` and `sitemap.xml` are included
- [ ] Confirm custom domain DNS (if applicable)
- [ ] Test all routes after deployment

---

### 🛠️ Tech Stack

<table>
<tr>
<td width="33%" align="center">

**⚛️ Core Framework**

[![React](https://img.shields.io/badge/React-18.2-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)

Component-based architecture with Hooks & Context API

</td>
<td width="33%" align="center">

**⚡ Build System**

[![Vite](https://img.shields.io/badge/Vite-5.1-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

Lightning-fast HMR & optimized production builds

</td>
<td width="33%" align="center">

**🎨 Visualization**

[![Recharts](https://img.shields.io/badge/Recharts-2.12-8884d8?style=for-the-badge)](https://recharts.org/)

Composable charting library built on React components

</td>
</tr>
</table>

<details>
<summary><b>📦 Complete Dependency List</b></summary>

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| **Framework** | React | 18.2.0 | UI library |
| **Framework** | React DOM | 18.2.0 | DOM rendering |
| **Build Tool** | Vite | 5.1.0 | Dev server & bundler |
| **Routing** | React Router DOM | 6.23.0 | Client-side routing |
| **Visualization** | Recharts | 2.12.7 | Charts & graphs |
| **Visualization** | Wordcloud | 1.2.3 | Word cloud generator |
| **Icons** | React Icons | 5.2.1 | Icon library (FA, MD, etc.) |
| **Utilities** | JSZip | 3.10.1 | ZIP file generation |
| **Storage** | IndexedDB (native) | - | Browser data persistence |

</details>

**Why These Technologies?**

- ✅ **React 18**: Concurrent rendering, automatic batching, improved performance
- ✅ **Vite**: 10-100x faster than traditional bundlers during development
- ✅ **IndexedDB**: Large dataset support (100+ MB), structured queries, offline-first
- ✅ **Recharts**: Declarative syntax, responsive, accessible charts
- ✅ **Zero Backend**: No server costs, no data breaches, instant deployment

---

### 📖 Usage Guide

#### 1️⃣ **Import Your Kindle Highlights**

<table>
<tr>
<td width="60%">

**Step-by-Step Process:**

1. **Connect Kindle to Computer**
   - Use USB cable
   - Wait for device recognition
   - Kindle appears as USB drive

2. **Locate Clippings File**
   ```
   📁 Kindle Drive
   └── 📁 documents
       └── 📄 My Clippings.txt
   ```

3. **Import into NoteKlip**
   - Open NoteKlip in browser
   - Navigate to **Settings** page
   - Click **Import Clippings**
   - Choose file OR paste content
   - Click **Process & Import**

4. **Verify Import**
   - Check Dashboard for statistics
   - Browse Library for books
   - Search Highlights for passages

</td>
<td width="40%">

**Supported Formats:**

✅ **Standard Kindle Format**
```
Book Title (Author Name)
- Your Highlight on page 123 | 
  Location 1234-1235 | 
  Added on Monday, 1 January 2024

Highlight text goes here.
==========
```

✅ **Multiple Languages**
- English Kindle
- 中文 Kindle
- Mixed content

⚠️ **Note:** Encrypted clippings or DRM-protected content may not parse correctly.

**Privacy Guarantee:**
- 🔒 All processing is local
- 🚫 No upload to servers
- 💾 Stored in browser only

</td>
</tr>
</table>

#### 2️⃣ **Explore Your Reading Data**

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Dashboard                                                │
├─────────────────────────────────────────────────────────────┤
│  • Yearly Trends        → Track reading over time           │
│  • Reading Heatmap      → 30-day activity visualization     │
│  • Time Distribution    → Peak reading hours & days         │
│  • Top Books/Authors    → Most-highlighted content          │
│  • Author Universe      → Discover reading breadth          │
│  • Custom Insights      → Personalized statistics           │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│  📚 Library                                                  │
├─────────────────────────────────────────────────────────────┤
│  • Visual Grid View     → Browse with cover art             │
│  • Search & Filter      → Find books instantly              │
│  • Sort Options         → By date/title/author/count        │
│  • Book Details         → Click for highlights              │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│  🔍 Highlights                                               │
├─────────────────────────────────────────────────────────────┤
│  • Full-Text Search     → Find specific passages            │
│  • Author Filter        → View by writer                    │
│  • One-Click Copy       → Export to notes                   │
│  • Metadata Display     → Location & timestamps             │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│  💾 Export & Backup                                          │
├─────────────────────────────────────────────────────────────┤
│  • JSON Export          → Portable data format              │
│  • Full Backup          → All books + highlights            │
│  • Selective Export     → Choose specific items             │
│  • Re-import Anytime    → Restore from backup               │
└─────────────────────────────────────────────────────────────┘
```

#### 3️⃣ **Customize Your Experience**

**Dashboard Customization:**
- 🎯 Drag & drop cards to reorder
- 🎨 Choose date ranges for analysis
- 📊 Select chart types (bar/line/area)
- 🔢 Adjust top-N rankings (top 5/10/20)

**Language & Preferences:**
- 🌍 Toggle EN ⇄ 中文 anytime
- 💾 Settings auto-saved locally
- 🔄 Persistent across sessions
- 🎨 Respects system dark mode (coming soon)

**Power User Tips:**
```
Keyboard Shortcuts (Coming Soon):
  Ctrl/Cmd + K     → Quick search
  Ctrl/Cmd + B     → Browse library
  Ctrl/Cmd + H     → View highlights
  Ctrl/Cmd + E     → Export data
  Ctrl/Cmd + /     → Show shortcuts
```

---

### 🔒 Privacy & Security

<div align="center">

**🛡️ Your Data, Your Device, Your Control**

</div>

| Feature | Status | Details |
|---------|--------|---------|
| **Local Processing** | ✅ 100% | All parsing & analysis happens in your browser |
| **No Server Upload** | ✅ Zero | Your highlights never leave your device |
| **No Tracking** | ✅ Zero | No analytics, cookies, or fingerprinting |
| **No Account Required** | ✅ Anonymous | Use without registration or login |
| **Open Source** | ✅ Transparent | Full code available for audit |
| **Data Portability** | ✅ Export Anytime | JSON backup with no vendor lock-in |
| **Offline Capable** | ✅ PWA Ready | Works without internet (after first load) |

**Technical Security Details:**

```
Data Storage Location:
  Browser → IndexedDB → Encrypted by OS → Your Disk Only
  
Data Transmission:
  None. Zero network requests for user data.
  Only static assets loaded from CDN.

Privacy by Design:
  ✓ No user identifiers
  ✓ No session tracking
  ✓ No usage telemetry
  ✓ No third-party scripts
  ✓ No cookies (except essential)
```

**Compliance & Certifications:**
- ✅ GDPR Compliant (no data collection)
- ✅ CCPA Compliant (no data sale)
- ✅ COPPA Safe (no child data)
- ✅ SOC 2 Type II (N/A - no servers)

**What We DON'T Collect:**
- ❌ Your highlights content
- ❌ Book titles you've read
- ❌ Authors you follow
- ❌ Reading patterns or habits
- ❌ Device information
- ❌ IP addresses
- ❌ Geolocation data
- ❌ Any personally identifiable information

**Security Best Practices:**
1. Use HTTPS-enabled deployment
2. Keep browser updated
3. Use strong device passwords
4. Export backups regularly
5. Don't share exported JSON publicly (contains your data)

---

### 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or sharing ideas, your help is appreciated.

<table>
<tr>
<td width="33%" align="center">

**🐛 Bug Reports**

Found an issue?

[Open Issue →](https://github.com/UNICKON/klips/issues/new?template=bug_report.md)

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

</td>
<td width="33%" align="center">

**💡 Feature Requests**

Have an idea?

[Request Feature →](https://github.com/UNICKON/klips/issues/new?template=feature_request.md)

Include:
- Use case description
- Proposed solution
- Alternatives considered
- Additional context

</td>
<td width="33%" align="center">

**🔧 Pull Requests**

Ready to code?

[Contributing Guide →](CONTRIBUTING.md)

Remember:
- Fork & branch
- Write tests
- Follow style guide
- Update docs

</td>
</tr>
</table>

**Development Workflow:**

```bash
# 1️⃣ Fork and clone
git clone https://github.com/YOUR_USERNAME/klips.git
cd klips

# 2️⃣ Create feature branch
git checkout -b feature/amazing-feature

# 3️⃣ Install dependencies
npm install

# 4️⃣ Make changes
# ... edit code ...

# 5️⃣ Test locally
npm run dev      # Development server
npm run build    # Production build test

# 6️⃣ Commit with conventional commits
git commit -m "feat: add amazing feature"
git commit -m "fix: resolve issue #123"
git commit -m "docs: update README"

# 7️⃣ Push and create PR
git push origin feature/amazing-feature
# Then open PR on GitHub
```

**Commit Message Convention:**

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting, etc.)
refactor: Code refactoring
perf:     Performance improvements
test:     Adding or updating tests
chore:    Maintenance tasks
```

**Code Style Guidelines:**
- ✅ Use ES6+ syntax
- ✅ Follow existing patterns
- ✅ Add comments for complex logic
- ✅ Keep functions small & focused
- ✅ Use meaningful variable names
- ✅ Avoid deep nesting

**Areas We Need Help With:**
- 🌍 Translations (more languages)
- 📱 Mobile responsiveness improvements
- 🎨 UI/UX enhancements
- 📊 New visualization types
- 🐛 Bug fixes & stability
- 📝 Documentation improvements
- ♿ Accessibility (a11y) features

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
- 💬 Discussions: [GitHub Discussions](https://github.com/UNICKON/klips/discussions)

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
- 💬 讨论区：[GitHub Discussions](https://github.com/UNICKON/klips/discussions)

---

<div align="center">

**由读者制作，为读者服务 📖**

[⬆ 返回顶部](#-noteklip)

</div>

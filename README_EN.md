<div align="center">

# 📚 NoteKlip

### Transform Your Kindle Highlights into Actionable Insights

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646cff?logo=vite)](https://vitejs.dev/)
[![Live Demo](https://img.shields.io/badge/demo-noteklip.org-success)](https://noteklip.org)

**[🇨🇳 中文文档](./README_ZH.md)** | **[🏠 Home](./README.md)**

---

</div>

## 🌟 Overview

**NoteKlip** is a privacy-first, browser-based dashboard for managing and visualizing your Kindle highlights. Simply upload your `My Clippings.txt` file and instantly gain deep insights into your reading habits, discover patterns across books and authors, and revisit your favorite passages—all without sending your data to any server.

> **🔒 Privacy Promise:** All processing happens locally in your browser. Zero data collection, zero tracking, 100% yours.

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 📊 **Interactive Dashboard**

Gain insights at a glance with rich visualizations:

- **📈 Yearly Trends** - Track your reading journey over time
- **🔥 Recent Pulse** - 30-day highlight activity heatmap  
- **⏰ Time Analysis** - Discover your peak reading hours & days
- **🏆 Top Rankings** - Most-highlighted books & prolific authors
- **🌌 Author Universe** - Explore your literary ecosystem
- **📅 Reading Calendar** - Year-over-year activity comparison
- **🎯 Custom Insights** - Drag & drop to personalize your view

</td>
<td width="50%" valign="top">

### 📖 **Smart Library**

Browse and search with powerful tools:

- **🎨 Book Gallery** - Visual grid with cover art support
- **🔍 Advanced Search** - Filter by title, author, or keywords
- **🔢 Multi-Sort Options** - By date, name, or highlight count
- **📊 Quick Stats** - Highlight counts at a glance
- **🏷️ Metadata Display** - Author, publication info
- **⚡ Instant Loading** - Optimized for large libraries
- **📱 Responsive Design** - Works on all screen sizes

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🎯 **Highlights Explorer**

Rediscover your favorite passages:

- **🔎 Full-Text Search** - Find any quote instantly
- **✍️ Author Filter** - Browse by specific writers
- **📋 Copy & Share** - One-click copying for notes
- **📍 Location Tags** - Jump to original page positions
- **⏱️ Timestamp View** - When you captured each insight
- **🎨 Clean Interface** - Focus on content, not clutter
- **♾️ Infinite Scroll** - Smooth browsing experience

</td>
<td width="50%" valign="top">

### 🔧 **Power User Tools**

Professional features for serious readers:

- **💾 Data Export** - Full JSON backup for portability
- **🔄 Import/Merge** - Add new highlights without duplicates
- **🔐 Privacy-First** - All processing stays local
- **🌐 Bilingual UI** - Seamless EN ⇄ 中文 switching
- **📦 Backup System** - Never lose your annotations
- **⚙️ Customizable** - Tailor the experience to your needs
- **🚀 Zero Setup** - Works immediately after upload

</td>
</tr>
</table>

---

## 🏗️ Architecture

NoteKlip follows a modern, modular architecture optimized for performance and maintainability:

```
┌─────────────────────────────────────────────────────────┐
│                    🎨 Frontend Layer                    │
│                  (React 18 + Vite 5)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐           │
│  │Dashboard │  │ Library  │  │ Highlights │  ...      │
│  │   View   │  │   View   │  │    View    │           │
│  └──────────┘  └──────────┘  └────────────┘           │
│       │              │               │                  │
│       └──────────────┴───────────────┘                  │
│                      │                                  │
├──────────────────────┼──────────────────────────────────┤
│                      ▼                                  │
│              ┌───────────────┐                          │
│              │  API Facade   │  (Unified Interface)     │
│              └───────────────┘                          │
│                      │                                  │
├──────────────────────┼──────────────────────────────────┤
│                      ▼                                  │
│        📊 Data Layer (Browser Storage)                  │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │  IndexedDB  │   │ LocalStorage │   │ SessionMgr │  │
│  │  (Primary)  │   │ (Settings)   │   │  (State)   │  │
│  └─────────────┘   └──────────────┘   └────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                 🎭 UI Component Library                 │
│                                                         │
│  Recharts  │  React Router  │  React Icons  │  ...    │
└─────────────────────────────────────────────────────────┘
```

### Key Design Principles

- **🔌 Modular**: Independent, reusable components
- **⚡ Fast**: Optimized rendering with lazy loading
- **📱 Responsive**: Mobile-first design approach  
- **🎯 Type-Safe**: Normalized data structures
- **🧪 Testable**: Clear separation of concerns

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** `18.0` or higher ([Download](https://nodejs.org/))
- **npm** `9.0+` or **yarn** `1.22+`
- A modern browser (Chrome, Firefox, Safari, or Edge)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/UNICKON/klips.git
cd klips

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

🎉 **Success!** Visit `http://localhost:5173` to see NoteKlip in action.

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview the production build locally
npm run preview
```

The optimized files will be in the `dist/` directory, ready for deployment.

---

## 📦 Deployment

### Option 1: Cloudflare Pages (Recommended)

**Why Cloudflare Pages?**
- ⚡ Ultra-fast global CDN
- 🆓 Free hosting with unlimited bandwidth
- 🔄 Auto-deploy on git push
- 🌐 Custom domain support

**Setup Steps:**

1. **Connect Repository**  
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project" → Connect to GitHub
   - Select the `klips` repository

2. **Configure Build Settings**
   ```yaml
   Build command: npm ci && npm run build
   Output directory: dist
   Environment variables:
     VITE_BASE: /
   ```

3. **Deploy**  
   - Click "Save and Deploy"
   - Every push to `main` triggers auto-deployment
   - Access via: `https://<your-project>.pages.dev`

4. **Custom Domain** (Optional)
   - Go to your project → Custom domains
   - Add your domain (e.g., `noteklip.org`)
   - Update DNS records as instructed

### Option 2: GitHub Pages

**Setup Steps:**

1. **Enable GitHub Pages**
   - Go to repository `Settings` → `Pages`
   - Source: Select **GitHub Actions**

2. **Auto-Deploy Workflow**  
   The included `.github/workflows/pages.yml` handles everything:
   - Builds on every push to `main`
   - Sets correct base path automatically
   - Deploys to GitHub Pages

3. **Access Your Site**
   - Visit: `https://<username>.github.io/klips/`
   - Allow 2-3 minutes for first deployment

> **💡 Tip:** The project auto-detects deployment paths via the `VITE_BASE` environment variable, so routing and assets work correctly on both platforms.

---

## 🛠️ Tech Stack

<table>
<thead>
<tr>
<th width="20%">Category</th>
<th width="25%">Technology</th>
<th width="20%">Version</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Framework</strong></td>
<td>React</td>
<td>18.2</td>
<td>Component-based UI library for building interactive interfaces</td>
</tr>
<tr>
<td><strong>Build Tool</strong></td>
<td>Vite</td>
<td>5.1</td>
<td>Next-generation frontend tooling with lightning-fast HMR</td>
</tr>
<tr>
<td><strong>Routing</strong></td>
<td>React Router</td>
<td>6.23</td>
<td>Declarative client-side routing for single-page applications</td>
</tr>
<tr>
<td><strong>Visualization</strong></td>
<td>Recharts</td>
<td>2.12</td>
<td>Composable charting library built on React components</td>
</tr>
<tr>
<td><strong>Storage</strong></td>
<td>IndexedDB</td>
<td>Native</td>
<td>Browser-native persistent storage for structured data</td>
</tr>
<tr>
<td><strong>Icons</strong></td>
<td>React Icons</td>
<td>5.2</td>
<td>SVG icon library with popular icon packs included</td>
</tr>
<tr>
<td><strong>Bundling</strong></td>
<td>ESBuild</td>
<td>0.19+</td>
<td>Extremely fast JavaScript bundler (via Vite)</td>
</tr>
<tr>
<td><strong>Compression</strong></td>
<td>JSZip</td>
<td>3.10</td>
<td>JavaScript library for creating and reading zip files</td>
</tr>
</tbody>
</table>

---

## 📖 Usage Guide

### 1️⃣ Import Your Highlights

**Step 1: Export from Kindle**
1. Connect your Kindle device to your computer via USB
2. Navigate to `Kindle Drive` → `documents` → `My Clippings.txt`
3. Copy the file to your computer

**Step 2: Import to NoteKlip**
1. Open NoteKlip in your browser
2. Go to **⚙️ Settings** page
3. Click **Import Clippings** section
4. Choose one method:
   - **📁 File Upload**: Click "Choose File" and select `My Clippings.txt`
   - **📋 Direct Paste**: Copy-paste the file contents into the text area
5. Click **Import** and wait for processing

> **💡 Tip:** You can import multiple times. NoteKlip automatically detects and skips duplicate highlights.

### 2️⃣ Explore Your Data

**Dashboard - Bird's Eye View**
- See your reading trends over time with interactive charts
- Identify your most productive reading periods
- Discover which books and authors captivate you most
- Drag & drop cards to customize your dashboard layout

**Library - Book Collection**
- Browse all your highlighted books in a visual grid
- Search by title or author name
- Sort by date added, title, or highlight count
- Click any book to see all its highlights

**Highlights - Deep Dive**
- Search across all your highlights instantly
- Filter by author to focus on specific writers
- Copy any highlight with one click for note-taking
- See original page numbers and timestamps

**Export - Data Ownership**
- Backup all your data as a JSON file
- Restore from previous backups
- Transfer data between devices
- Keep full control of your reading history

### 3️⃣ Customize Your Experience

**Personalize Dashboard**
- Drag any chart card to reorder
- Your layout is saved automatically
- Reset to default arrangement anytime

**Language Switching**
- Click the language toggle in the sidebar
- Switch between English and Chinese instantly
- All interface text updates immediately

**Persistent Preferences**
- All settings are saved locally
- Your preferences persist across sessions
- No account needed, no cloud sync

---

## 🔒 Privacy & Security

NoteKlip is built with privacy as the foundation. Here's our commitment:

### ✅ What We Do

- **100% Local Processing**: All data stays in your browser
- **Zero Server Uploads**: Your highlights never leave your device
- **No Tracking**: No analytics, no cookies, no telemetry
- **Open Source**: Full code transparency on GitHub
- **Offline Capable**: Works without internet after first load
- **Data Portability**: Export and own your data forever

### ❌ What We Don't Do

- ❌ No user accounts or authentication
- ❌ No cloud storage or syncing
- ❌ No third-party services or APIs
- ❌ No ads or monetization
- ❌ No data collection or analytics
- ❌ No tracking pixels or fingerprinting

### 🔐 How Your Data is Stored

| Storage Type | Purpose | Persistence |
|-------------|---------|-------------|
| **IndexedDB** | Highlights & books | Permanent (until you clear) |
| **LocalStorage** | User preferences | Permanent (until you clear) |
| **SessionStorage** | Temporary UI state | Cleared on tab close |

**You are always in control.** Clear your data anytime via browser settings or the built-in clear function.

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, documentation improvements, or translations, your help makes NoteKlip better for everyone.

### How to Contribute

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/klips.git
   cd klips
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   # Or for bug fixes:
   git checkout -b fix/bug-description
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Test thoroughly before committing

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   # Use conventional commits: feat/fix/docs/style/refactor/test/chore
   ```

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/amazing-feature
   # Then open a PR on GitHub with a clear description
   ```

### Development Guidelines

- Write clean, readable code
- Follow React best practices
- Ensure responsive design on all screen sizes
- Test on multiple browsers (Chrome, Firefox, Safari)
- Update documentation if adding features
- Add i18n translations for both English and Chinese

### Need Help?

- 💬 Join [GitHub Discussions](https://github.com/UNICKON/klips/discussions)
- 🐛 Report issues on [GitHub Issues](https://github.com/UNICKON/klips/issues)
- 📧 Contact maintainers via repository

---

## 📄 License

This project is licensed under the **MIT License**.

### What This Means:

✅ **You CAN:**
- Use commercially
- Modify and distribute
- Use privately
- Sublicense

❌ **You MUST:**
- Include the original license
- Include copyright notice

❌ **You CANNOT:**
- Hold the author liable

For full license text, see the [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

NoteKlip stands on the shoulders of giants. We're grateful to:

### Inspiration
- **Readwise** - For pioneering the highlight management space
- **Goodreads** - For building a community around reading
- **Kindle Readers** - For inspiring this tool's creation

### Open Source Projects
- **React Team** - For the incredible framework
- **Vite Team** - For revolutionizing build tools
- **Recharts Contributors** - For beautiful, accessible charts
- **All Dependencies** - Listed in `package.json`

### Community
- **Contributors** - Everyone who submits PRs and issues
- **Users** - Your feedback drives improvements
- **Beta Testers** - For helping catch bugs early

### Special Thanks
- Built with ❤️ by readers who love data
- Maintained by the open-source community
- Powered by your passion for reading

---

## 📧 Contact & Support

### Get Help

- 🌐 **Website**: [noteklip.org](https://noteklip.org)
- 📖 **Documentation**: You're reading it!
- 💬 **Discussions**: [GitHub Discussions](https://github.com/UNICKON/klips/discussions)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/UNICKON/klips/issues)

### Stay Updated

- ⭐ **Star on GitHub**: Get notified of new releases
- 👀 **Watch Repository**: Follow development progress
- 🔔 **Subscribe**: Enable notifications for important updates

### Spread the Word

If NoteKlip helps you, consider:
- ⭐ Starring the repository
- 🐦 Sharing on social media
- 📝 Writing a blog post or review
- 💬 Recommending to fellow readers

---

<div align="center">

### 💝 Made with Love

**Built by readers, for readers**

Every highlight tells a story. NoteKlip helps you tell yours.

---

[⬆ Back to Top](#-noteklip) • [🏠 Home](./README.md) • [🇨🇳 中文](./README_ZH.md)

<sub>© 2024 NoteKlip • MIT License • [Privacy First](#-privacy--security) • [Open Source](https://github.com/UNICKON/klips)</sub>

</div>

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'klip.lang';

const MESSAGES = {
  zh: {
    'app.name': 'Noteklip',

    'nav.dashboard': '仪表盘',
    'nav.library': '书库',
    'nav.highlights': '高亮',
    'nav.export': '导出',
    'nav.settings': '设置',
    'nav.support': '支持',

    'lang.zh': '中文',
    'lang.en': 'EN',
    'lang.switch.aria': '切换语言',

    'common.loading': '加载中...',
    'common.error': '出错了',
    'common.prevPage': '上一页',
    'common.nextPage': '下一页',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.showNote': '展开笔记',
    'common.hideNote': '收起笔记',
    'common.noResults': '暂无结果。',

    'dashboard.header': 'Kindle 标注概览',
    'dashboard.loading': '统计数据加载中...',
    'dashboard.loadFail': '加载统计数据失败',
    'dashboard.allYears': '全部年份',
    'dashboard.highlightsLabel': '高亮',

    'dashboard.upload.desc': '上传 Kindle 的 My Clippings.txt，我们会自动增量解析并更新统计。',
    'dashboard.upload.button': '上传 My Clippings.txt 开始分析',
    'dashboard.upload.uploading': '上传中...',
    'dashboard.upload.success': '解析完成，新增 {count} 条高亮',
    'dashboard.upload.fail': '上传失败',

    'dashboard.stats.totalHighlights': '高亮总数',
    'dashboard.stats.booksNoted': '涉及书籍',
    'dashboard.stats.authorsCount': '涉及作者',
    'dashboard.stats.mostReadAuthor': '高亮最多的作者',
    'dashboard.stats.mostNotedAuthor': '作者书籍数排名',
    'dashboard.stats.activeReadingDays': '累计活跃天数',

    'dashboard.activityTrend.title': '年份活跃趋势',
    'dashboard.topBooks.title': '高亮最多的 5 本书',
    'dashboard.topAuthors.title': '高亮最多的作者',
    'dashboard.pulse.title': '近 30 天情况',
    'dashboard.pulse.headline': '近 {date}：{count} 条（较 7 天前 {sign}{delta}）',

    'dashboard.heatmap.title': '活跃热力图',
    'dashboard.heatmap.toggle.aria': '切换热力图视图',
    'dashboard.heatmap.toggle.daily': '按日',
    'dashboard.heatmap.toggle.monthly': '按月',
    'dashboard.heatmap.daily.scrollAria': '每日热力图滚动区域',
    'dashboard.heatmap.daily.gridAria': '每日热力图',
    'dashboard.heatmap.monthly.gridAria': '每月热力图（最近 {years} 年）',
    'dashboard.heatmap.cellTitle': '{key}: {count}',

    'dashboard.weekday.title': '周中活跃情况',
    'dashboard.weekday.peak': '{day} 最常出现，占比 {share}%',
    'dashboard.hour.title': '最常看书时段',
    'dashboard.hour.peak': '阅读高峰约在 {time}',
    'dashboard.seasonal.title': '最常看书月份',
    'dashboard.seasonal.peak': '{month} 活跃度最高（{count} 条）',

    'dashboard.activeDays.title': '活跃天数概览',
    'dashboard.activeDays.totalActiveDays': '累计活跃天数',
    'dashboard.activeDays.longestStreak': '最长连续天数',
    'dashboard.activeDays.trailingStreak': '最近连续天数',
    'dashboard.activeDays.avgPerActiveDay': '平均每活跃日高亮',
    'dashboard.activeDays.busiestDay': '单日最高高亮',
    'dashboard.activeDays.lastActiveDay': '最近活跃日期',

    'dashboard.yearly.title': '年度概览',
    'dashboard.yearly.span': '覆盖年份',
    'dashboard.yearly.totalYears': '年份总数',
    'dashboard.yearly.bestYear': '最佳年份',
    'dashboard.yearly.avgPerYear': '平均每年',
    'dashboard.yearly.medianPerYear': '年度中位数',
    'dashboard.yearly.totalHighlights': '累计高亮',
    'dashboard.yearly.topYears': '热门年份',

    'dashboard.authorInsights.title': '作者概览',
    'dashboard.authorInsights.authorCount': '作者数',
    'dashboard.authorInsights.totalHighlights': '累计高亮',
    'dashboard.authorInsights.totalBooksTracked': '书籍数',
    'dashboard.authorInsights.avgPerBook': '平均每本书',
    'dashboard.authorInsights.top3Books': 'Top 3 作者合计覆盖 {books} 本书',
    'dashboard.authorInsights.topVoices': '看得最多的作者',
    'dashboard.authorInsights.voiceTooltip': '高亮 {count} 条 · {books} 本书 · 占比 {share}%',

    'dashboard.authorBooks.title': '看得最多的作者',

    'dashboard.table.rank': '#',
    'dashboard.table.book': '书籍',
    'dashboard.table.author': '作者',
    'dashboard.table.highlights': '高亮',
    'dashboard.table.highlightsCount': '高亮数量',

    'dashboard.placeholder.noYearlyData': '暂无年度数据。',
    'dashboard.placeholder.noBookStats': '暂无书籍统计。',
    'dashboard.placeholder.noAuthorStats': '暂无作者统计，先去添加一些高亮吧。',
    'dashboard.placeholder.no30dData': '暂无近 30 天数据。',
    'dashboard.placeholder.noActiveDays': '暂无活跃天数统计。',
    'dashboard.placeholder.noWeekdayStats': '暂无按星期统计。',
    'dashboard.placeholder.noHourStats': '暂无按时段统计。',
    'dashboard.placeholder.noSeasonalStats': '暂无季节性统计。',
    'dashboard.placeholder.noAuthorInsights': '暂无作者洞察。',
    'dashboard.placeholder.noAuthors': '暂无作者',
    'dashboard.placeholder.selectAuthor': '选择一位作者，查看其各书的高亮分布。',

    'library.title': '我的书库',
    'library.search.placeholder': '搜索书名或作者…',
    'library.sort.label': '排序：',
    'library.sort.countDesc': '高亮数',
    'library.sort.dateDesc': '时间(最新)',
    'library.sort.dateAsc': '时间(最早)',
    'library.sort.bookAsc': '书名(A-Z)',
    'library.sort.authorAsc': '作者(A-Z)',
    'library.loadFail': '加载书籍失败',
    'library.bookCoverAlt': '《{title}》封面',

    'highlights.title': '高亮',
    'highlights.pageTitle': '我的高亮',
    'highlights.search.placeholder': '搜索高亮、书名或作者…',
    'highlights.sort.label': '排序：',
    'highlights.noResults': '暂无高亮。',
    'highlights.updateFail': '更新高亮失败',
    'highlights.loadFail': '加载高亮列表失败',

    'export.title': '导出高亮',
    'export.subtitle': '导出高亮/笔记到 txt、json 或 markdown，可按书籍拆分为 ZIP。',
    'export.field.format': '格式',
    'export.field.language': '语言',
    'export.splitByBook': '按书籍拆分（ZIP 打包）',
    'export.button': '导出高亮',
    'exporting': '导出中...',
    'export.success': '导出成功，文件已下载。',
    'export.fail': '导出失败，请稍后重试。',

    'settings.title': '设置',
    'settings.subtitle': '资料库备份、导入导出与系统相关设置。',

    'settings.section.backup': '资料库备份',
    'settings.section.backup.desc': '导入 / 导出整个本地资料库备份。',
    'settings.section.system': '系统相关',
    'settings.section.system.desc': '恢复默认布局或清除本地数据。',
    'settings.import.title': '导入资料库备份',
    'settings.import.desc': '选择导出的 JSON 文件，默认增量合并。',
    'settings.import.button': '导入',
    'settings.importing': '恢复中...',
    'settings.import.fail': '恢复失败，请确认文件是否为导出的 JSON 备份。',
    'settings.import.mergeSummary': '增量导入完成：新增 {inserted} 条高亮；当前共有 {highlights} 条 / {books} 本。',
    'settings.import.noNewSummary': '备份导入完成，没有发现新的高亮。当前共有 {highlights} 条 / {books} 本。',
    'settings.import.tip': '{summary} 如需覆盖式恢复，可先在下方清除数据，再导入备份。',

    'settings.export.title': '导出资料库备份',
    'settings.export.desc': '导出当前资料库为 JSON 文件。',
    'settings.export.button': '导出',
    'settings.exporting': '导出中...',
    'settings.export.success': '备份已生成，可将 JSON 文件保存到云盘或私有仓库。',
    'settings.export.fail': '导出失败，请稍后重试。',
    'settings.export.morePrefix': '需要 TXT / Markdown 等格式请前往 ',
    'settings.export.moreSuffix': '。',
    'settings.export.moreLink': '高亮导出',

    'support.title': '支持',
    'support.subtitle': '面向国内与国际用户的支持入口。',
    'support.domestic.title': '国内支持',
    'support.domestic.desc': '反馈问题、提出建议或参与讨论。',
    'support.international.title': '国际支持',
    'support.international.desc': '提交问题、提出需求或参与讨论。',
    'support.link.website': '官网',
    'support.link.issues': '问题反馈',
    'support.link.discussions': '讨论区',

    'settings.clear.title': '清除本地数据',
    'settings.clear.desc': '清空当前浏览器的所有资料（不可撤销）。',
    'settings.clear.button': '清除',
    'settings.clearing': '清除中...',
    'settings.clear.confirm': '此操作会清空所有本地数据，且不可撤销。确定继续吗？',
    'settings.clear.success': '本地数据已清除，如需恢复请导入 JSON 备份。',
    'settings.clear.fail': '清除失败，请稍后再试。',
    'settings.clear.tip': '建议先导出备份再执行清除。',

    'settings.resetDashboard.title': '重置仪表盘布局',
    'settings.resetDashboard.desc': '恢复默认卡片顺序（会清除自定义拖拽顺序）。',
    'settings.resetDashboard.button': '恢复',
    'settings.resetDashboard.success': '已恢复默认布局，刷新后生效。',
    'settings.resetDashboard.fail': '重置失败，请稍后重试。',

    'author.title': '作者：{name}',
    'author.subtitle': '你在该作者的 {books} 本书中，共有 {highlights} 条高亮。',
    'author.loadFail': '加载作者书籍失败',
    'author.viewClippings': '查看高亮',

    'book.editTitle': '编辑书名',
    'book.editAuthor': '编辑作者',
    'book.byPrefix': '作者：',
    'book.highlightsCount': '共 {count} 条高亮',
    'book.search.placeholder': '搜索本书高亮…',
    'book.sort.label': '排序：',
    'book.sort.dateDesc': '时间(最新)',
    'book.sort.dateAsc': '时间(最早)',
    'book.location': '位置 {location}',
    'book.exportMd.button': '导出',
    'book.exportMd.exporting': '导出中...',
    'book.exportMd.fail': '导出失败，请稍后重试。',
    'book.saving': '正在保存书籍信息…',
    'book.loadDetailFail': '加载书籍详情失败',
    'book.loadHighlightsFail': '加载高亮失败',
    'book.deleteFail': '删除高亮失败',
    'book.updateFail': '更新高亮失败',
    'book.updateBookFail': '更新书籍信息失败',
  },
  en: {
    'app.name': 'Noteklip',

    'nav.dashboard': 'Dashboard',
    'nav.library': 'Library',
    'nav.highlights': 'Highlights',
    'nav.export': 'Export',
    'nav.settings': 'Settings',
    'nav.support': 'Support',

    'lang.zh': '中文',
    'lang.en': 'EN',
    'lang.switch.aria': 'Switch language',

    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.prevPage': 'Last',
    'common.nextPage': 'Next',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.showNote': 'Show note',
    'common.hideNote': 'Hide note',
    'common.noResults': 'No results.',

    'dashboard.header': 'Kindle Highlights Overview',
    'dashboard.loading': 'Loading stats...',
    'dashboard.loadFail': 'Failed to load stats',
    'dashboard.allYears': 'All years',
    'dashboard.highlightsLabel': 'Highlights',

    'dashboard.upload.desc': 'Upload My Clippings.txt from your Kindle. We\'ll parse it incrementally and update your stats.',
    'dashboard.upload.button': 'Upload My Clippings.txt',
    'dashboard.upload.uploading': 'Uploading...',
    'dashboard.upload.success': 'Parsed. {count} new highlight(s) added.',
    'dashboard.upload.fail': 'Upload failed',

    'dashboard.stats.totalHighlights': 'Highlights',
    'dashboard.stats.booksNoted': 'Books',
    'dashboard.stats.authorsCount': 'Authors',
    'dashboard.stats.mostReadAuthor': 'Top author by highlights',
    'dashboard.stats.mostNotedAuthor': 'Top author by books',
    'dashboard.stats.activeReadingDays': 'Total active days',

    'dashboard.activityTrend.title': 'Highlights by year',
    'dashboard.topBooks.title': 'Top 5 Books by Highlights',
    'dashboard.topAuthors.title': 'Top authors by highlights',
    'dashboard.pulse.title': 'Last 30 days',
    'dashboard.pulse.headline': 'Last {date}: {count} highlights ({sign}{delta} vs 7 days ago)',

    'dashboard.heatmap.title': 'Heatmap',
    'dashboard.heatmap.toggle.aria': 'Switch heatmap view',
    'dashboard.heatmap.toggle.daily': 'Daily',
    'dashboard.heatmap.toggle.monthly': 'Monthly',
    'dashboard.heatmap.daily.scrollAria': 'Daily heatmap scroll area',
    'dashboard.heatmap.daily.gridAria': 'Daily heatmap',
    'dashboard.heatmap.monthly.gridAria': 'Monthly heatmap (last {years} years)',
    'dashboard.heatmap.cellTitle': '{key}: {count}',

    'dashboard.weekday.title': 'Highlights by weekday',
    'dashboard.weekday.peak': '{day} is most common ({share}%)',
    'dashboard.hour.title': 'Highlights by hour',
    'dashboard.hour.peak': 'Peak around {time}',
    'dashboard.seasonal.title': 'Highlights by month',
    'dashboard.seasonal.peak': '{month} is highest ({count} highlights)',

    'dashboard.activeDays.title': 'Active days overview',
    'dashboard.activeDays.totalActiveDays': 'Total active days',
    'dashboard.activeDays.longestStreak': 'Longest streak',
    'dashboard.activeDays.trailingStreak': 'Current streak',
    'dashboard.activeDays.avgPerActiveDay': 'Avg / active day',
    'dashboard.activeDays.busiestDay': 'Busiest day',
    'dashboard.activeDays.lastActiveDay': 'Last active day',

    'dashboard.yearly.title': 'Year overview',
    'dashboard.yearly.span': 'Year span',
    'dashboard.yearly.totalYears': 'Total years',
    'dashboard.yearly.bestYear': 'Best year',
    'dashboard.yearly.avgPerYear': 'Avg / year',
    'dashboard.yearly.medianPerYear': 'Median / year',
    'dashboard.yearly.totalHighlights': 'Total highlights',
    'dashboard.yearly.topYears': 'Top years',

    'dashboard.authorInsights.title': 'Authors overview',
    'dashboard.authorInsights.authorCount': 'Authors',
    'dashboard.authorInsights.totalHighlights': 'Total highlights',
    'dashboard.authorInsights.totalBooksTracked': 'Books',
    'dashboard.authorInsights.avgPerBook': 'Avg per book',
    'dashboard.authorInsights.top3Books': 'Top 3 authors cover {books} book(s)',
    'dashboard.authorInsights.topVoices': 'Top authors',
    'dashboard.authorInsights.voiceTooltip': '{count} highlights · {books} book(s) · {share}%',

    'dashboard.authorBooks.title': 'Books by author',

    'dashboard.table.rank': '#',
    'dashboard.table.book': 'Book',
    'dashboard.table.author': 'Author',
    'dashboard.table.highlights': 'Highlights',
    'dashboard.table.highlightsCount': 'Count',

    'dashboard.placeholder.noYearlyData': 'No yearly data.',
    'dashboard.placeholder.noBookStats': 'No book stats.',
    'dashboard.placeholder.noAuthorStats': 'No author stats yet. Add some highlights first.',
    'dashboard.placeholder.no30dData': 'No data for the last 30 days.',
    'dashboard.placeholder.noActiveDays': 'No active-days data.',
    'dashboard.placeholder.noWeekdayStats': 'No weekday stats.',
    'dashboard.placeholder.noHourStats': 'No hourly stats.',
    'dashboard.placeholder.noSeasonalStats': 'No seasonal stats.',
    'dashboard.placeholder.noAuthorInsights': 'No author insights.',
    'dashboard.placeholder.noAuthors': 'No authors',
    'dashboard.placeholder.selectAuthor': 'Select an author to see highlights broken down by book.',

    'library.title': 'My Library',
    'library.search.placeholder': 'Search books or authors…',
    'library.sort.label': 'Sort by: ',
    'library.sort.countDesc': 'Highlights Count',
    'library.sort.dateDesc': 'Date (Newest)',
    'library.sort.dateAsc': 'Date (Oldest)',
    'library.sort.bookAsc': 'Book (A-Z)',
    'library.sort.authorAsc': 'Author (A-Z)',
    'library.loadFail': 'Failed to load books',
    'library.bookCoverAlt': '{title} cover',

    'highlights.title': 'Highlights',
    'highlights.pageTitle': 'My Highlights',
    'highlights.search.placeholder': 'Search highlights, books, or authors…',
    'highlights.sort.label': 'Sort by: ',
    'highlights.noResults': 'No highlights found.',
    'highlights.updateFail': 'Failed to update highlight',
    'highlights.loadFail': 'Failed to load highlights',

    'export.title': 'Export Highlights',
    'export.subtitle': 'Export highlights/notes to txt, json, or markdown. Optionally split by book into a ZIP.',
    'export.field.format': 'Format',
    'export.field.language': 'Language',
    'export.splitByBook': 'Split by book (ZIP)',
    'export.button': 'Export Highlights',
    'exporting': 'Exporting...',
    'export.success': 'Exported. File downloaded.',
    'export.fail': 'Export failed. Please try again later.',

    'settings.title': 'Settings',
    'settings.subtitle': 'Backup, import/export, and system settings.',

    'settings.section.backup': 'Library backup',
    'settings.section.backup.desc': 'Import / export the entire local library backup.',
    'settings.section.system': 'System',
    'settings.section.system.desc': 'Restore defaults or clear local data.',
    'settings.import.title': 'Import Backup',
    'settings.import.desc': 'Choose an exported JSON file. Default is merge.',
    'settings.import.button': 'Import',
    'settings.importing': 'Restoring...',
    'settings.import.fail': 'Restore failed. Please ensure this is an exported JSON backup.',
    'settings.import.mergeSummary': 'Merged: +{inserted} highlights. Now {highlights} highlights / {books} books.',
    'settings.import.noNewSummary': 'Imported: no new highlights. Now {highlights} highlights / {books} books.',
    'settings.import.tip': '{summary} For overwrite restore, clear data below first, then import again.',

    'settings.export.title': 'Export Backup',
    'settings.export.desc': 'Export current library as a JSON file.',
    'settings.export.button': 'Export',
    'settings.exporting': 'Exporting...',
    'settings.export.success': 'Backup created. Save the JSON file somewhere safe.',
    'settings.export.fail': 'Export failed. Please try again later.',
    'settings.export.morePrefix': 'For TXT / Markdown formats, go to ',
    'settings.export.moreSuffix': '.',
    'settings.export.moreLink': 'Highlights Export',

    'support.title': 'Support',
    'support.subtitle': 'Support entry points for users in China and worldwide.',
    'support.domestic.title': 'Support (China)',
    'support.domestic.desc': 'Report bugs, request features, or join discussions.',
    'support.international.title': 'Support (International)',
    'support.international.desc': 'Report bugs, request features, or join discussions.',
    'support.link.website': 'Website',
    'support.link.issues': 'Bug reports',
    'support.link.discussions': 'Discussions',

    'settings.clear.title': 'Clear Local Data',
    'settings.clear.desc': 'Remove all data in this browser (irreversible).',
    'settings.clear.button': 'Clear',
    'settings.clearing': 'Clearing...',
    'settings.clear.confirm': 'This will delete all local data and cannot be undone. Continue?',
    'settings.clear.success': 'Local data cleared. Import a JSON backup to restore.',
    'settings.clear.fail': 'Clear failed. Please try again later.',
    'settings.clear.tip': 'Export a backup before clearing.',

    'settings.resetDashboard.title': 'Reset dashboard layout',
    'settings.resetDashboard.desc': 'Restore default card order (clears your drag-and-drop layout).',
    'settings.resetDashboard.button': 'Restore',
    'settings.resetDashboard.success': 'Defaults restored. Refresh to apply.',
    'settings.resetDashboard.fail': 'Reset failed. Please try again.',

    'author.title': 'Author: {name}',
    'author.subtitle': 'You have {highlights} highlights from {books} book(s) by this author.',
    'author.loadFail': 'Failed to load author books',
    'author.viewClippings': 'View Clippings',

    'book.editTitle': 'Edit title',
    'book.editAuthor': 'Edit author',
    'book.byPrefix': 'by ',
    'book.highlightsCount': '{count} highlights',
    'book.search.placeholder': 'Search highlights in this book…',
    'book.sort.label': 'Sort by: ',
    'book.sort.dateDesc': 'Date (Newest)',
    'book.sort.dateAsc': 'Date (Oldest)',
    'book.location': 'Location {location}',
    'book.exportMd.button': 'Export',
    'book.exportMd.exporting': 'Exporting...',
    'book.exportMd.fail': 'Export failed. Please try again later.',
    'book.saving': 'Saving book info…',
    'book.loadDetailFail': 'Failed to load book details',
    'book.loadHighlightsFail': 'Failed to load highlights',
    'book.deleteFail': 'Failed to delete highlight',
    'book.updateFail': 'Failed to update highlight',
    'book.updateBookFail': 'Failed to update book info',
  },
};

const normalizeLang = (input) => {
  const raw = String(input || '').trim().toLowerCase();
  if (raw.startsWith('zh')) return 'zh';
  if (raw.startsWith('en')) return 'en';
  return '';
};

const detectBrowserLang = () => {
  const candidates = [];
  if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
  if (navigator.language) candidates.push(navigator.language);
  for (const item of candidates) {
    const normalized = normalizeLang(item);
    if (normalized) return normalized;
  }
  return 'zh';
};

const I18nContext = createContext({
  lang: 'zh',
  setLang: () => {},
  t: (key) => key,
});

const interpolate = (template, vars) => {
  if (!vars) return template;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => {
    const value = vars[name];
    return value === undefined || value === null ? '' : String(value);
  });
};

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const stored = normalizeLang(window.localStorage.getItem(STORAGE_KEY));
    return stored || detectBrowserLang();
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      const dict = MESSAGES[lang] || MESSAGES.zh;
      const fallback = MESSAGES.en;
      const message = dict?.[key] ?? fallback?.[key];
      if (typeof message === 'function') {
        return message(vars);
      }
      if (typeof message === 'string') {
        return interpolate(message, vars);
      }
      return key;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return React.createElement(I18nContext.Provider, { value }, children);
};

export const useI18n = () => useContext(I18nContext);

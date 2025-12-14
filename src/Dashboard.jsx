import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import {
  getStatsOverview,
  getStatsRecent,
  getStatsTitleWordcloud,
  getStatsAuthorsWordcloud,
  getStatsAuthorsByHighlights,
  getStatsActiveDaysAll,
  getStatsMonthlyMatrix,
  getStatsTemporalBreakdown,
  getAuthorBooksStats,
  uploadClippings,
} from './api';
import { useI18n } from './i18n';
import { normalizeAuthorKey } from './utils/author';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DASHBOARD_CHART_ORDER_KEY = 'klip.dashboard.chartCardOrder';
const DASHBOARD_STAT_ORDER_KEY = 'klip.dashboard.statCardOrder';
const DEFAULT_CHART_CARD_ORDER = [
  'authorBooks',
  'topBooks',
  'topAuthors',
  'activityTrend',
  'pulse',
  'heatmap',
  'weekday',
  'hour',
  'seasonal',
  'yearly',
  'authorInsights',
  'activeDays',
];
const DEFAULT_STAT_CARD_ORDER = ['totalHighlights', 'activeReadingDays', 'booksNoted', 'authorsCount', 'mostReadAuthor'];
const AUTHOR_TIERS = [
  { key: 'casual', label: '偶尔上榜 (1-2)', min: 1, max: 2, color: '#a5b4fc' },
  { key: 'steady', label: '稳定贡献 (3-9)', min: 3, max: 9, color: '#60a5fa' },
  { key: 'prolific', label: '高产作者 (10+)', min: 10, max: Infinity, color: '#2563eb' },
];

const loadLocalOrder = (storageKey) => {
  if (typeof window === 'undefined' || !storageKey) return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : null;
  } catch (err) {
    console.warn('Failed to load dashboard order:', storageKey, err);
    return null;
  }
};

const saveLocalOrder = (storageKey, order) => {
  if (typeof window === 'undefined' || !storageKey) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(order));
  } catch (err) {
    console.warn('Failed to save dashboard order:', storageKey, err);
  }
};

const mergeOrder = (saved, defaults) => {
  const safeDefaults = Array.isArray(defaults) ? defaults : [];
  if (!Array.isArray(saved) || saved.length === 0) return [...safeDefaults];

  const seen = new Set();
  const merged = [];
  saved.forEach((id) => {
    if (typeof id !== 'string') return;
    if (!safeDefaults.includes(id)) return;
    if (seen.has(id)) return;
    seen.add(id);
    merged.push(id);
  });
  safeDefaults.forEach((id) => {
    if (seen.has(id)) return;
    merged.push(id);
  });
  return merged;
};

const reorderRelative = (order, sourceId, targetId, placeAfter = false) => {
  if (!sourceId || !targetId || sourceId === targetId) return order;
  const next = order.filter((id) => id !== sourceId);
  const targetIndex = next.indexOf(targetId);
  if (targetIndex === -1) {
    return placeAfter ? [...next, sourceId] : [sourceId, ...next];
  }
  const insertIndex = placeAfter ? targetIndex + 1 : targetIndex;
  next.splice(insertIndex, 0, sourceId);
  return next;
};

const isInteractiveTarget = (target) => {
  if (!target || typeof target.closest !== 'function') return false;
  return Boolean(target.closest('a,button,input,select,textarea,label'));
};

const parseDayString = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const computeActiveDayStats = (rows = []) => {
  if (!Array.isArray(rows) || !rows.length) {
    return {
      longestStreak: 0,
      trailingStreak: 0,
      avgHighlights: 0,
      busiestDay: null,
      lastActiveDay: null,
    };
  }
  const sorted = [...rows].sort((a, b) => a.d.localeCompare(b.d));
  let longest = 0;
  let current = 0;
  let prevDate = null;
  sorted.forEach((row) => {
    const date = parseDayString(row.d);
    if (!date) {
      current = 0;
      prevDate = null;
      return;
    }
    if (prevDate) {
      const diff = date.getTime() - prevDate.getTime();
      current = diff === DAY_MS ? current + 1 : 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    prevDate = date;
  });

  let trailing = 0;
  let trailingPrev = null;
  for (let idx = sorted.length - 1; idx >= 0; idx -= 1) {
    const date = parseDayString(sorted[idx].d);
    if (!date) {
      if (trailing === 0) {
        continue;
      }
      break;
    }
    if (!trailingPrev) {
      trailing = 1;
      trailingPrev = date;
      continue;
    }
    const diff = trailingPrev.getTime() - date.getTime();
    if (diff === DAY_MS) {
      trailing += 1;
      trailingPrev = date;
    } else {
      break;
    }
  }

  const busiestDay = [...sorted]
    .sort((a, b) => (b.cnt || 0) - (a.cnt || 0) || a.d.localeCompare(b.d))[0] || null;
  const avgHighlights = sorted.reduce((sum, row) => sum + (row.cnt || 0), 0) / sorted.length;
  const lastActiveDay = sorted[sorted.length - 1]?.d || null;

  return {
    longestStreak: longest,
    trailingStreak: trailing,
    avgHighlights,
    busiestDay,
    lastActiveDay,
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const weekdayNames = useMemo(
    () => (lang === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['周日', '周一', '周二', '周三', '周四', '周五', '周六']),
    [lang]
  );

  const monthShort = useMemo(
    () =>
      lang === 'en'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    [lang]
  );

  const formatHighlightsCount = (rawValue) => {
    const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue || 0);
    return lang === 'en' ? `${numeric} highlights` : `${numeric} 条`;
  };

  const [overview, setOverview] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [topBooksData, setTopBooksData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [topAuthorsData, setTopAuthorsData] = useState([]);
  const [authorsByBooks, setAuthorsByBooks] = useState([]);
  const [authorsByHighlights, setAuthorsByHighlights] = useState([]);
  const [authorUniverse, setAuthorUniverse] = useState([]);
  const [monthlyHeatmap, setMonthlyHeatmap] = useState([]);
  const [dailyTrendData, setDailyTrendData] = useState([]);
  const [totalActiveDays, setTotalActiveDays] = useState(null);
  const [heatmapView, setHeatmapView] = useState('daily');
  const monthlyHeatmapYears = 8;
  const [activeDayRows, setActiveDayRows] = useState([]);
  const [temporalStats, setTemporalStats] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [authorBooksData, setAuthorBooksData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRef = useRef(null);
  const [statsVersion, setStatsVersion] = useState(0);
  const dailyHeatmapScrollRef = useRef(null);
  const didAutoScrollDailyHeatmapRef = useRef(false);
  const prevHeatmapViewRef = useRef('daily');

  const [chartCardOrder, setChartCardOrder] = useState(() =>
    mergeOrder(loadLocalOrder(DASHBOARD_CHART_ORDER_KEY), DEFAULT_CHART_CARD_ORDER)
  );
  const [statCardOrder, setStatCardOrder] = useState(() =>
    mergeOrder(loadLocalOrder(DASHBOARD_STAT_ORDER_KEY), DEFAULT_STAT_CARD_ORDER)
  );
  const [draggingChartId, setDraggingChartId] = useState(null);
  const [dragOverChartId, setDragOverChartId] = useState(null);
  const [draggingStatId, setDraggingStatId] = useState(null);
  const [dragOverStatId, setDragOverStatId] = useState(null);

  useEffect(() => {
    saveLocalOrder(DASHBOARD_CHART_ORDER_KEY, chartCardOrder);
  }, [chartCardOrder]);

  useEffect(() => {
    saveLocalOrder(DASHBOARD_STAT_ORDER_KEY, statCardOrder);
  }, [statCardOrder]);

  const onChartDragStart = (evt, id) => {
    if (isInteractiveTarget(evt.target)) {
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }
    setDraggingChartId(id);
    setDragOverChartId(null);
    try {
      evt.dataTransfer.effectAllowed = 'move';
      evt.dataTransfer.setData('text/plain', id);
    } catch {
      // ignore
    }
  };
  const onChartDragOver = (evt, id) => {
    evt.preventDefault();
    try {
      evt.dataTransfer.dropEffect = 'move';
    } catch {
      // ignore
    }
  };
  const onChartDrop = (evt, targetId) => {
    evt.preventDefault();
    setDraggingChartId(null);
    setDragOverChartId(null);
  };
  const onChartDragEnd = () => {
    setDraggingChartId(null);
    setDragOverChartId(null);
  };

  const getDragPlacement = (evt) => {
    const target = evt?.currentTarget;
    if (!target || typeof target.getBoundingClientRect !== 'function') {
      return { placeAfter: false }; // default insert before
    }
    const rect = target.getBoundingClientRect();
    const horizontalDominant = rect.width >= rect.height;
    const pointerCoord = horizontalDominant ? evt.clientX : evt.clientY;
    const startCoord = horizontalDominant ? rect.left : rect.top;
    const size = horizontalDominant ? rect.width : rect.height;
    if (Number.isNaN(pointerCoord) || Number.isNaN(startCoord) || Number.isNaN(size) || size <= 0) {
      return { placeAfter: false };
    }
    const offset = pointerCoord - startCoord;
    return { placeAfter: offset >= size / 2 };
  };

  const onChartDragEnter = (evt, id) => {
    evt.preventDefault();
    if (!draggingChartId || id === draggingChartId || dragOverChartId === id) {
      return;
    }
    const { placeAfter } = getDragPlacement(evt);
    setChartCardOrder((prev) => reorderRelative(prev, draggingChartId, id, placeAfter));
    setDragOverChartId(id);
  };
  const onChartDragLeave = (evt, id) => {
    if (dragOverChartId === id) {
      // 仅在离开当前 hover 的卡片时清理，避免闪烁
      setDragOverChartId(null);
    }
  };

  const onStatDragStart = (evt, id) => {
    if (isInteractiveTarget(evt.target)) {
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }
    setDraggingStatId(id);
    setDragOverStatId(null);
    try {
      evt.dataTransfer.effectAllowed = 'move';
      evt.dataTransfer.setData('text/plain', id);
    } catch {
      // ignore
    }
  };
  const onStatDragOver = (evt, id) => {
    evt.preventDefault();
    try {
      evt.dataTransfer.dropEffect = 'move';
    } catch {
      // ignore
    }
  };
  const onStatDrop = (evt, targetId) => {
    evt.preventDefault();
    setDraggingStatId(null);
    setDragOverStatId(null);
  };
  const onStatDragEnd = () => {
    setDraggingStatId(null);
    setDragOverStatId(null);
  };

  const onStatDragEnter = (evt, id) => {
    evt.preventDefault();
    if (!draggingStatId || id === draggingStatId || dragOverStatId === id) {
      return;
    }
    const { placeAfter } = getDragPlacement(evt);
    setStatCardOrder((prev) => reorderRelative(prev, draggingStatId, id, placeAfter));
    setDragOverStatId(id);
  };
  const onStatDragLeave = (evt, id) => {
    if (dragOverStatId === id) {
      setDragOverStatId(null);
    }
  };

  const statHandleProps = (id) => ({
    draggable: true,
    onDragStart: (e) => onStatDragStart(e, id),
    onDragEnd: onStatDragEnd,
  });

  const chartHandleProps = (id) => ({
    draggable: true,
    onDragStart: (e) => onChartDragStart(e, id),
    onDragEnd: onChartDragEnd,
  });

  const wrapStatCard = (id, content) => (
    <div
      key={id}
      className={`stat-card ${draggingStatId === id ? 'is-dragging' : ''} ${dragOverStatId === id ? 'is-drag-over' : ''}`}
      onDragEnter={(e) => onStatDragEnter(e, id)}
      onDragOver={(e) => onStatDragOver(e, id)}
      onDragLeave={(e) => onStatDragLeave(e, id)}
      onDrop={(e) => onStatDrop(e, id)}
      data-card-id={id}
      style={{ cursor: 'default' }}
    >
      {content}
    </div>
  );

  const wrapChartCard = (id, content) => (
    <div
      key={id}
      className={`chart-card ${draggingChartId === id ? 'is-dragging' : ''} ${dragOverChartId === id ? 'is-drag-over' : ''}`}
      onDragEnter={(e) => onChartDragEnter(e, id)}
      onDragOver={(e) => onChartDragOver(e, id)}
      onDragLeave={(e) => onChartDragLeave(e, id)}
      onDrop={(e) => onChartDrop(e, id)}
      data-card-id={id}
      style={{ cursor: 'default' }}
    >
      {content}
    </div>
  );

  const activityRangeLabel = activityData.length
    ? `${activityData[0].name} - ${activityData[activityData.length - 1].name}`
    : '';

  const heatmapMax = monthlyHeatmap.reduce((max, row) => {
    const rowMax = row.months.reduce((innerMax, month) => Math.max(innerMax, month.count), 0);
    return Math.max(max, rowMax);
  }, 0);

  const monthlyHeadingMonths = monthlyTrendData.length;
  const totalAuthorsCount = authorUniverse.length;
  const activeDayStats = useMemo(() => computeActiveDayStats(activeDayRows), [activeDayRows]);
  const topActiveDays = useMemo(() => {
    if (!activeDayRows.length) {
      return [];
    }
    return [...activeDayRows]
      .sort((a, b) => (b.cnt || 0) - (a.cnt || 0) || a.d.localeCompare(b.d))
      .slice(0, 10);
  }, [activeDayRows]);

  const dailyHeatmap = useMemo(() => {
    if (!activeDayRows.length) {
      return { weeks: [], max: 0, spanLabel: '' };
    }

    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);

    const earliest = activeDayRows
      .map((row) => parseDayString(row?.d))
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    let start = earliest ? new Date(earliest) : new Date(end);
    start.setUTCHours(0, 0, 0, 0);

    const formatKey = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const counts = new Map();
    activeDayRows.forEach((row) => {
      if (!row?.d) return;
      counts.set(String(row.d), row.cnt || 0);
    });

    // Align to week boundaries for cleaner grid.
    const alignedStart = new Date(start);
    alignedStart.setUTCDate(alignedStart.getUTCDate() - alignedStart.getUTCDay());
    const alignedEnd = new Date(end);
    alignedEnd.setUTCDate(alignedEnd.getUTCDate() + (6 - alignedEnd.getUTCDay()));

    const spanLabel = `${formatKey(start)} - ${formatKey(end)}`;

    // Build week columns (Sun..Sat) for the date range.
    const weeks = [];
    let currentWeek = Array(7).fill(null);
    let cursor = new Date(alignedStart);
    while (cursor <= alignedEnd) {
      const weekday = cursor.getUTCDay();
      const key = formatKey(cursor);
      if (cursor >= start && cursor <= end) {
        const cnt = counts.get(key) || 0;
        currentWeek[weekday] = { d: key, cnt, weekday };
      }

      if (weekday === 6) {
        weeks.push(currentWeek);
        currentWeek = Array(7).fill(null);
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    if (currentWeek.some(Boolean)) {
      weeks.push(currentWeek);
    }

    let max = 0;
    weeks.forEach((week) => {
      week.forEach((cell) => {
        if (!cell) return;
        max = Math.max(max, cell.cnt || 0);
      });
    });

    return { weeks, max, spanLabel };
  }, [activeDayRows]);
  const sortedAuthorBooks = useMemo(() => {
    if (!authorBooksData.length) {
      return [];
    }
    return [...authorBooksData].sort((a, b) => (b.count || 0) - (a.count || 0) || (a.book_title || '').localeCompare(b.book_title || ''));
  }, [authorBooksData]);
  const dailyTrendSeries = useMemo(() => {
    if (!dailyTrendData.length) {
      return [];
    }
    return dailyTrendData.map((day, idx, arr) => {
      const start = Math.max(0, idx - 6);
      const window = arr.slice(start, idx + 1);
      const avg = window.reduce((sum, item) => sum + (item.count || 0), 0) / window.length;
      return {
        ...day,
        rollingAvg: Number(avg.toFixed(2)),
      };
    });
  }, [dailyTrendData]);
  const dailyPulseHeadline = useMemo(() => {
    if (dailyTrendSeries.length < 2) {
      return null;
    }
    const latest = dailyTrendSeries[dailyTrendSeries.length - 1];
    const prevIndex = Math.max(0, dailyTrendSeries.length - 8);
    const prev = dailyTrendSeries[prevIndex];
    if (!latest || !prev) {
      return null;
    }
    return {
      latestDate: latest.date,
      latestCount: latest.count,
      delta: latest.count - prev.count,
    };
  }, [dailyTrendSeries]);
  const weekdayDistribution = useMemo(() => {
    if (!Array.isArray(temporalStats?.by_weekday) || temporalStats.by_weekday.length === 0) {
      return [];
    }
    const total = temporalStats.by_weekday.reduce((sum, entry) => sum + (entry.count || 0), 0);
    return WEEKDAY_ORDER.map((weekday) => {
      const entry = temporalStats.by_weekday.find((item) => item.weekday === weekday) || { count: 0 };
      const count = entry.count || 0;
      const share = total ? Number(((count / total) * 100).toFixed(1)) : 0;
      return {
        weekday,
        label: weekdayNames[weekday],
        count,
        share,
      };
    });
  }, [temporalStats, weekdayNames]);

  const hasActivityTrendData = useMemo(() => {
    if (!Array.isArray(activityData) || activityData.length === 0) {
      return false;
    }
    return activityData.some((item) => (item?.highlights || item?.count || 0) > 0);
  }, [activityData]);

  const hasWeekdayData = useMemo(() => {
    if (!Array.isArray(weekdayDistribution) || weekdayDistribution.length === 0) {
      return false;
    }
    return weekdayDistribution.some((item) => (item?.count || 0) > 0);
  }, [weekdayDistribution]);
  const weekdayPeak = useMemo(() => {
    if (!weekdayDistribution.length) {
      return null;
    }
    return weekdayDistribution.reduce((best, item) =>
      !best || item.count > best.count ? item : best,
      null
    );
  }, [weekdayDistribution]);
  const hourlyDistribution = useMemo(() => {
    if (!temporalStats?.by_hour) {
      return [];
    }
    return temporalStats.by_hour.map((entry) => ({
      hour: entry.hour,
      label: `${String(entry.hour).padStart(2, '0')}:00`,
      count: entry.count || 0,
    }));
  }, [temporalStats]);

  const hasHourlyData = useMemo(() => {
    if (!Array.isArray(hourlyDistribution) || hourlyDistribution.length === 0) {
      return false;
    }
    return hourlyDistribution.some((item) => (item?.count || 0) > 0);
  }, [hourlyDistribution]);
  const hourlyPeak = useMemo(() => {
    if (!hourlyDistribution.length) {
      return null;
    }
    return hourlyDistribution.reduce((best, item) =>
      !best || item.count > best.count ? item : best,
      null
    );
  }, [hourlyDistribution]);
  const seasonalDistribution = useMemo(() => {
    if (!temporalStats?.by_month) {
      return [];
    }
    return [...temporalStats.by_month]
      .sort((a, b) => a.month - b.month)
      .map((entry) => ({
        month: entry.month,
        label: monthShort[entry.month - 1] || (lang === 'en' ? `M${entry.month}` : `${entry.month}月`),
        count: entry.count || 0,
      }));
  }, [temporalStats, monthShort, lang]);

  const hasSeasonalData = useMemo(() => {
    if (!Array.isArray(seasonalDistribution) || seasonalDistribution.length === 0) {
      return false;
    }
    return seasonalDistribution.some((item) => (item?.count || 0) > 0);
  }, [seasonalDistribution]);
  const seasonalPeak = useMemo(() => {
    if (!seasonalDistribution.length) {
      return null;
    }
    return seasonalDistribution.reduce((best, item) =>
      !best || item.count > best.count ? item : best,
      null
    );
  }, [seasonalDistribution]);
  const yearlyInsights = useMemo(() => {
    if (!activityData.length) {
      return {
        recentYears: [],
        spanLabel: '',
        bestYear: null,
        totalYears: 0,
        avgPerYear: 0,
        medianPerYear: 0,
        topYears: [],
        totalHighlights: 0,
      };
    }
    const parsed = activityData
      .map((entry) => ({
        year: Number(entry.name),
        label: entry.name,
        count: entry.highlights || 0,
      }))
      .filter((item) => Number.isFinite(item.year))
      .sort((a, b) => a.year - b.year);
    if (!parsed.length) {
      return {
        recentYears: [],
        spanLabel: '',
        bestYear: null,
        totalYears: 0,
        avgPerYear: 0,
        medianPerYear: 0,
        topYears: [],
        totalHighlights: 0,
      };
    }
    const totalHighlights = parsed.reduce((sum, item) => sum + item.count, 0);
    const avgPerYear = totalHighlights / parsed.length;
    const countsSorted = parsed.map((item) => item.count).sort((a, b) => a - b);
    const mid = Math.floor(countsSorted.length / 2);
    const medianPerYear =
      countsSorted.length % 2 === 0
        ? (countsSorted[mid - 1] + countsSorted[mid]) / 2
        : countsSorted[mid];
    const topYears = [...parsed]
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 3);
    const bestYear = topYears[0] || null;
    const recentYears = parsed.slice(-5).sort((a, b) => b.year - a.year);
    return {
      recentYears,
      spanLabel: `${parsed[0].label} - ${parsed[parsed.length - 1].label}`,
      bestYear,
      totalYears: parsed.length,
      avgPerYear,
      medianPerYear,
      topYears,
      totalHighlights,
    };
  }, [activityData]);
  const authorInsights = useMemo(() => {
    if (!authorUniverse.length) {
      return {
        leaders: [],
        totalHighlights: 0,
        totalBooksTracked: 0,
        leaderBooks: 0,
        topShare: 0,
        topThreeShare: 0,
        avgPerBook: 0,
        authorCount: 0,
        longTailShare: 0,
        diversityScore: 0,
        tierBreakdown: [],
      };
    }
    const totalHighlights = authorUniverse.reduce((sum, author) => sum + (author.count || 0), 0);
    const totalBooksTracked = authorUniverse.reduce((sum, author) => sum + (author.bookCount || 0), 0);
    const sortedByBooks = [...authorUniverse].sort((a, b) => {
      const bookDelta = (b.bookCount || 0) - (a.bookCount || 0);
      if (bookDelta !== 0) return bookDelta;
      const highlightDelta = (b.count || 0) - (a.count || 0);
      if (highlightDelta !== 0) return highlightDelta;
      return (a.name || '').localeCompare(b.name || '');
    });
    const leaders = sortedByBooks.slice(0, 3).map((author) => {
      const share = totalBooksTracked
        ? Number(((author.bookCount / totalBooksTracked) * 100).toFixed(1))
        : 0;
      const highlightShare = totalHighlights
        ? Number(((author.count / totalHighlights) * 100).toFixed(1))
        : 0;
      return { ...author, share, highlightShare };
    });
    const topShare = leaders[0]?.share || 0;
    const topThreeShare = leaders.slice(0, 3).reduce((sum, author) => sum + author.share, 0);
    const leaderHighlights = leaders.reduce((sum, author) => sum + (author.count || 0), 0);
    const leaderBooks = leaders.reduce((sum, author) => sum + (author.bookCount || 0), 0);
    const longTailShare = totalBooksTracked
      ? Number(((totalBooksTracked - leaderBooks) / totalBooksTracked) * 100)
      : 0;
    const avgPerBook = totalBooksTracked ? totalHighlights / totalBooksTracked : 0;
    const tierBreakdown = AUTHOR_TIERS.map((tier) => {
      const authors = authorUniverse.filter((author) => {
        const bookTotal = author.bookCount || 0;
        if (!bookTotal) return false;
        if (tier.max === Infinity) {
          return bookTotal >= tier.min;
        }
        return bookTotal >= tier.min && bookTotal <= tier.max;
      });
      const bookSum = authors.reduce((sum, author) => sum + (author.bookCount || 0), 0);
      const share = totalBooksTracked ? Number(((bookSum / totalBooksTracked) * 100).toFixed(1)) : 0;
      return {
        ...tier,
        authorsCount: authors.length,
        bookSum,
        share,
      };
    }).filter((tier) => tier.authorsCount > 0);
    const diversityScore = totalHighlights
      ? Math.min(100, Number(((authorUniverse.length / totalHighlights) * 100).toFixed(1)))
      : 0;
    return {
      leaders,
      totalHighlights,
      totalBooksTracked,
      leaderBooks,
      topShare,
      topThreeShare: Number(topThreeShare.toFixed(1)),
      avgPerBook,
      authorCount: authorUniverse.length,
      longTailShare,
      diversityScore,
      tierBreakdown,
    };
  }, [authorUniverse]);
  const buildAuthorHighlightsLink = (name) => {
    if (!name) return '/highlights';
    const params = new URLSearchParams({ author: name });
    const key = normalizeAuthorKey(name);
    if (key) {
      params.set('authorKey', key);
    }
    return `/highlights?${params.toString()}`;
  };
  const mostReadAuthor = authorsByHighlights[0] || null;
  const mostReadAuthorName = mostReadAuthor?.name || null;
  const mostReadAuthorHighlights = mostReadAuthor?.count || 0;
  const mostReadAuthorLink = mostReadAuthorName
    ? buildAuthorHighlightsLink(mostReadAuthorName)
    : null;

  const navigateHighlightsWith = (params = {}) => {
    const entries = Object.entries(params).filter(([, value]) => Boolean(value));
    if (!entries.length) return;
    const search = new URLSearchParams();
    entries.forEach(([key, value]) => search.set(key, value));
    navigate(`/highlights?${search.toString()}`);
  };

  const goToDayHighlights = (rawDay) => {
    if (!rawDay) return;
    const trimmed = String(rawDay).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return;
    navigateHighlightsWith({ day: trimmed });
  };

  const goToWeekdayHighlights = (weekday) => {
    const parsed = Number(weekday);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 6) return;
    navigateHighlightsWith({ weekday: String(parsed) });
  };

  const goToHourHighlights = (hour) => {
    const parsed = Number(hour);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 23) return;
    navigateHighlightsWith({ hour: String(parsed) });
  };

  const goToMonthOfYearHighlights = (month) => {
    const parsed = Number(month);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 12) return;
    navigateHighlightsWith({ monthOfYear: String(parsed) });
  };

  const goToMonthHighlights = (rawMonth) => {
    if (!rawMonth) return;
    const trimmed = String(rawMonth).trim();
    if (!trimmed) return;
    const normalized = (() => {
      const ymMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})$/);
      if (ymMatch) {
        return `${ymMatch[1]}-${String(ymMatch[2]).padStart(2, '0')}`;
      }
      if (/^\d{6}$/.test(trimmed)) {
        return `${trimmed.slice(0, 4)}-${trimmed.slice(4)}`;
      }
      return trimmed;
    })();
    navigateHighlightsWith({ month: normalized });
  };

  const goToYearHighlights = (rawYear) => {
    if (!rawYear) return;
    const match = String(rawYear).match(/(\d{4})/);
    if (!match) return;
    navigateHighlightsWith({ year: match[1] });
  };

  const handleYearChartClick = (state) => {
    const label =
      (Array.isArray(state?.activePayload) && state.activePayload[0]?.payload?.name) ||
      state?.activeLabel;
    goToYearHighlights(label);
  };

  const handleMonthlyBarClick = (data) => {
    const source = data?.payload || data;
    if (!source) return;
    goToMonthHighlights(source.monthKey || source.label);
  };

  const handleHeatmapKeyDown = (event, monthKey) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToMonthHighlights(monthKey);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);

        const [
          overviewRes,
          recentRes,
          titleWordRes,
          authorsWordRes,
          activeDaysRes,
          temporalRes,
          authorsByHighlightsRes,
        ] = await Promise.all([
          getStatsOverview(),
          getStatsRecent(),
          getStatsTitleWordcloud(),
          getStatsAuthorsWordcloud(),
          getStatsActiveDaysAll(),
          getStatsTemporalBreakdown(),
          getStatsAuthorsByHighlights(),
        ]);

        if (cancelled) return;

        setOverview(overviewRes);

        // 过去 5 年的阅读活跃度：使用 /stats/recent 的按年份聚合数据
        const recent = recentRes || {};
        const yearsRaw =
          recent.by_year ||
          recent.years ||
          recent.year_stats ||
          [];
        const yearsSorted = [...yearsRaw].sort((a, b) => {
          const ay = parseInt(a.y || a.year || a.ym || 0, 10);
          const by = parseInt(b.y || b.year || b.ym || 0, 10);
          return ay - by;
        });
        setActivityData(
          yearsSorted.map((y) => ({
            name: String(y.year || y.y || y.ym || ''),
            highlights: y.cnt || y.count || y.total || 0,
          }))
        );

        // Top 5 书籍：从 title wordcloud 中取
        const titles = Array.isArray(titleWordRes)
          ? titleWordRes
          : titleWordRes.items || [];
        setTopBooksData(
          titles.slice(0, 5).map((t) => ({
            bookId: t.book_id || t.bookId || t.id || null,
            name: t.title || t.name,
            highlights: t.count || t.cnt || 0,
          }))
        );

        const daily = Array.isArray(recent.by_day_30)
          ? recent.by_day_30
          : recent.by_day || [];
        const dailyData = daily
          .map((entry) => ({
            date: entry.d || entry.date || entry.day,
            count: entry.cnt || entry.count || 0,
          }))
          .filter((item) => Boolean(item.date))
          .sort((a, b) => a.date.localeCompare(b.date));
        setDailyTrendData(dailyData);

        const monthly = Array.isArray(recent.by_month_12)
          ? recent.by_month_12
          : recent.months || recent.by_month || [];
        const monthlyData = monthly
          .map((entry) => {
            const labelFromYm = typeof entry.ym === 'string' ? entry.ym : null;
            const yearValue = entry.year ?? entry.y;
            const monthValue = entry.month ?? entry.m;
            const fallbackLabel = labelFromYm ||
              (yearValue && monthValue
                ? `${yearValue}-${String(monthValue).padStart(2, '0')}`
                : entry.label || entry.d || 'N/A');
            return {
              label: fallbackLabel,
              monthKey:
                (labelFromYm && labelFromYm.replace('/', '-')) ||
                (yearValue && monthValue
                  ? `${yearValue}-${String(monthValue).padStart(2, '0')}`
                  : fallbackLabel),
              count: entry.cnt || entry.count || entry.total || 0,
            };
          })
          .sort((a, b) => {
            const aKey = a.monthKey || a.label || '';
            const bKey = b.monthKey || b.label || '';
            return aKey.localeCompare(bKey);
          });
        setMonthlyTrendData(monthlyData);

        // 累计活跃天数：使用全量高亮的按日聚合
        const totalActive =
          (typeof activeDaysRes === 'number' && activeDaysRes) ||
          activeDaysRes?.active_days ||
          (Array.isArray(activeDaysRes?.days) && activeDaysRes.days.length) ||
          (Array.isArray(activeDaysRes) ? activeDaysRes.length : 0);
        const dayRows =
          (Array.isArray(activeDaysRes?.days) && activeDaysRes.days) ||
          (Array.isArray(activeDaysRes) ? activeDaysRes : []);
        setTotalActiveDays(totalActive);
        setActiveDayRows(dayRows);

        const authorsRaw = Array.isArray(authorsWordRes)
          ? authorsWordRes
          : authorsWordRes.items || [];
        const normalizedAuthors = authorsRaw
          .map((a) => ({
            name: a.author || a.name || 'Unknown',
            count: a.count || a.cnt || 0,
            bookCount: a.books || a.book_count || a.bookCount || 0,
          }))
          .filter((author) => Boolean(author.name));
        const authorsByBooksList = [...normalizedAuthors]
          .sort(
            (a, b) =>
              (b.bookCount || 0) - (a.bookCount || 0) ||
              (b.count || 0) - (a.count || 0) ||
              (a.name || '').localeCompare(b.name || '')
          )
          .map((author, idx) => ({ ...author, rank: idx + 1 }));

        setAuthorUniverse(normalizedAuthors);
        setAuthorsByBooks(authorsByBooksList);
        setTopAuthorsData(authorsByBooksList);

        const authorsHighlightsRaw = Array.isArray(authorsByHighlightsRes)
          ? authorsByHighlightsRes
          : [];
        const normalizedByHighlights = authorsHighlightsRaw
          .map((a, idx) => ({
            rank: idx + 1,
            name: a.author || a.name || 'Unknown',
            count: a.count || a.cnt || 0,
          }))
          .filter((author) => Boolean(author.name));
        setAuthorsByHighlights(normalizedByHighlights);

        setTemporalStats(temporalRes || null);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err.message || t('dashboard.loadFail'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [statsVersion]);

  useEffect(() => {
    // Reset when stats refresh.
    didAutoScrollDailyHeatmapRef.current = false;
  }, [statsVersion]);

  useEffect(() => {
    const prevView = prevHeatmapViewRef.current;
    prevHeatmapViewRef.current = heatmapView;

    if (heatmapView !== 'daily') return;
    if (!dailyHeatmap.weeks.length) return;

    // When switching back to Daily, always scroll to the latest.
    const shouldForceScroll = prevView !== 'daily';
    if (!shouldForceScroll && didAutoScrollDailyHeatmapRef.current) return;

    const el = dailyHeatmapScrollRef.current;
    if (!el) return;
    const id = window.requestAnimationFrame(() => {
      el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      didAutoScrollDailyHeatmapRef.current = true;
    });
    return () => window.cancelAnimationFrame(id);
  }, [dailyHeatmap.weeks.length, heatmapView]);

  useEffect(() => {
    let cancelled = false;
    async function loadHeatmap() {
      try {
        const matrix = await getStatsMonthlyMatrix({ years: monthlyHeatmapYears });
        if (!cancelled) {
          setMonthlyHeatmap(matrix);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setMonthlyHeatmap([]);
        }
      }
    }
    loadHeatmap();
    return () => {
      cancelled = true;
    };
  }, [statsVersion]);

  useEffect(() => {
    if (!authorsByBooks.length) {
      setSelectedAuthor('');
      return;
    }
    setSelectedAuthor((prev) =>
      prev && authorsByBooks.some((author) => author.name === prev)
        ? prev
        : authorsByBooks[0].name
    );
  }, [authorsByBooks]);

  useEffect(() => {
    if (!selectedAuthor) {
      setAuthorBooksData([]);
      return;
    }
    let cancelled = false;
    async function loadAuthorBooks() {
      try {
        const rows = await getAuthorBooksStats(selectedAuthor);
        if (!cancelled) {
          setAuthorBooksData(rows);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setAuthorBooksData([]);
        }
      }
    }
    loadAuthorBooks();
    return () => {
      cancelled = true;
    };
  }, [selectedAuthor, statsVersion]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const res = await uploadClippings(file);
      const count =
        (typeof res === 'number' && res) ||
        res.count ||
        res.total ||
        res.parsed_count;
      setUploadMsg(t('dashboard.upload.success', { count: count ?? '?' }));
    } catch (err) {
      console.error(err);
      setUploadMsg(err.message || t('dashboard.upload.fail'));
    } finally {
      setUploading(false);
      // 仅刷新统计数据，而不是整页刷新
      setStatsVersion((v) => v + 1);
    }
  };

  return (
    <main className="main-content">
      <header>
        <h1>{t('dashboard.header')}</h1>
      </header>

      <div className="upload-zone">
        <p>{t('dashboard.upload.desc')}</p>
        <input
          type="file"
          accept=".txt"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button className="upload-button" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? t('dashboard.upload.uploading') : t('dashboard.upload.button')}
        </button>
        {uploadMsg && <p>{uploadMsg}</p>}
      </div>

      {loading && <p>{t('dashboard.loading')}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="stats-grid">
        {statCardOrder
          .map((id) => {
            switch (id) {
              case 'totalHighlights':
                return wrapStatCard(
                  id,
                  <>
                    <div className="title" {...statHandleProps('totalHighlights')}>
                      {t('dashboard.stats.totalHighlights')}
                    </div>
                    <div className="value">{overview?.total_highlights ?? '-'}</div>
                  </>
                );
              case 'booksNoted':
                return wrapStatCard(
                  id,
                  <>
                    <div className="title" {...statHandleProps('booksNoted')}>
                      {t('dashboard.stats.booksNoted')}
                    </div>
                    <div className="value">
                      {overview?.books_with_highlights ?? overview?.books_count ?? overview?.books ?? overview?.book_count ?? '-'}
                    </div>
                  </>
                );
              case 'authorsCount':
                return wrapStatCard(
                  id,
                  <>
                    <div className="title" {...statHandleProps('authorsCount')}>
                      {t('dashboard.stats.authorsCount')}
                    </div>
                    <div className="value">{totalAuthorsCount || '-'}</div>
                  </>
                );
              case 'mostReadAuthor':
                return wrapStatCard(
                  id,
                  <>
                    <div className="title" {...statHandleProps('mostReadAuthor')}>
                      {t('dashboard.stats.mostReadAuthor')}
                    </div>
                    <div className="value">
                      {mostReadAuthorName ? (
                        <Link to={mostReadAuthorLink} className="dashboard-link">
                          {mostReadAuthorName}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </div>
                  </>
                );
              case 'activeReadingDays':
                return wrapStatCard(
                  id,
                  <>
                    <div className="title" {...statHandleProps('activeReadingDays')}>
                      {t('dashboard.stats.activeReadingDays')}
                    </div>
                    <div className="value">{overview?.active_days ?? '-'}</div>
                  </>
                );
              default:
                return null;
            }
          })
          .filter(Boolean)}
      </div>

      <div className="dashboard-grid">
        {chartCardOrder
          .map((cardId) => {
            switch (cardId) {
              case 'activityTrend':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('activityTrend')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>
                        {t('dashboard.activityTrend.title')} ({activityRangeLabel || t('dashboard.allYears')})
                      </h3>
                    </div>
          {hasActivityTrendData ? (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={activityData}
                  style={{ cursor: 'pointer' }}
                >
                  <defs>
                    <linearGradient id="activityTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [formatHighlightsCount(value), t('dashboard.highlightsLabel')]} />
                  <Area
                    type="monotone"
                    dataKey="highlights"
                    stroke="#8884d8"
                    fill="url(#activityTrendGradient)"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props || {};
                      if (!payload || typeof cx !== 'number' || typeof cy !== 'number') {
                        return null;
                      }
                      // 默认不展示圈圈，但保留可点击命中区域
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={10}
                          stroke="transparent"
                          strokeWidth={0}
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onClick={(evt) => {
                            evt.stopPropagation();
                            goToYearHighlights(payload.name);
                          }}
                        />
                      );
                    }}
                    activeDot={(props) => {
                      const { cx, cy, payload } = props || {};
                      if (!payload || typeof cx !== 'number' || typeof cy !== 'number') {
                        return null;
                      }
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          stroke="#8884d8"
                          strokeWidth={0}
                          fill="#8884d8"
                          style={{ cursor: 'pointer' }}
                          onClick={(evt) => {
                            evt.stopPropagation();
                            goToYearHighlights(payload.name);
                          }}
                        />
                      );
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noYearlyData')}</p>
          )}
                  </>
                );
              case 'topBooks':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('topBooks')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('dashboard.topBooks.title')}</h3>
                    </div>
          {topBooksData.length ? (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>{t('dashboard.table.book')}</th>
                  <th>{t('dashboard.table.highlights')}</th>
                </tr>
              </thead>
              <tbody>
                {topBooksData.map((book) => (
                  <tr key={book.bookId || book.name}>
                    <td>
                      {book.bookId ? (
                        <Link to={`/book/${book.bookId}`} className="dashboard-link">
                          {book.name}
                        </Link>
                      ) : (
                        book.name
                      )}
                    </td>
                    <td>{book.highlights}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noBookStats')}</p>
          )}
                  </>
                );
              case 'topAuthors':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('topAuthors')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('dashboard.topAuthors.title')}</h3>
                    </div>
          {authorsByHighlights.length ? (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>{t('dashboard.table.rank')}</th>
                  <th>{t('dashboard.table.author')}</th>
                  <th>{t('dashboard.table.highlights')}</th>
                </tr>
              </thead>
              <tbody>
                {authorsByHighlights.slice(0, 6).map((author) => (
                  <tr key={`${author.rank}-${author.name}`}>
                    <td>{author.rank}</td>
                    <td>
                      <Link
                        to={buildAuthorHighlightsLink(author.name)}
                        className="dashboard-link"
                      >
                        {author.name}
                      </Link>
                    </td>
                    <td>{author.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noAuthorStats')}</p>
          )}
                  </>
                );
              case 'pulse':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('pulse')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('dashboard.pulse.title')}</h3>
                    </div>
          {dailyTrendSeries.length ? (
            <>
              {dailyPulseHeadline && (
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  {t('dashboard.pulse.headline', {
                    date: dailyPulseHeadline.latestDate,
                    count: dailyPulseHeadline.latestCount,
                    sign: dailyPulseHeadline.delta >= 0 ? '+' : '',
                    delta: dailyPulseHeadline.delta,
                  })}
                </div>
              )}
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyTrendSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => (value ? value.slice(5) : '')}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props || {};
                        if (!payload || typeof cx !== 'number' || typeof cy !== 'number') {
                          return null;
                        }
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={10}
                            stroke="transparent"
                            strokeWidth={0}
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onClick={(evt) => {
                              evt.stopPropagation();
                              goToDayHighlights(payload.date);
                            }}
                          />
                        );
                      }}
                      activeDot={(props) => {
                        const { cx, cy, payload } = props || {};
                        if (!payload || typeof cx !== 'number' || typeof cy !== 'number') {
                          return null;
                        }
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={5}
                            strokeWidth={0}
                            fill="#0ea5e9"
                            style={{ cursor: 'pointer' }}
                            onClick={(evt) => {
                              evt.stopPropagation();
                              goToDayHighlights(payload.date);
                            }}
                          />
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rollingAvg"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="4 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.no30dData')}</p>
          )}
                  </>
                );
              case 'heatmap':
                return wrapChartCard(
                  cardId,
                  <>

          <div className="heatmap-card-header" {...chartHandleProps('heatmap')}>
            <h3>{t('dashboard.heatmap.title')}</h3>
            <div className="heatmap-toggle" role="tablist" aria-label={t('dashboard.heatmap.toggle.aria')}>
              <button
                type="button"
                role="tab"
                aria-selected={heatmapView === 'daily'}
                className={`heatmap-toggle__btn ${heatmapView === 'daily' ? 'is-active' : ''}`}
                onClick={() => setHeatmapView('daily')}
              >
                {t('dashboard.heatmap.toggle.daily')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={heatmapView === 'monthly'}
                className={`heatmap-toggle__btn ${heatmapView === 'monthly' ? 'is-active' : ''}`}
                onClick={() => setHeatmapView('monthly')}
              >
                {t('dashboard.heatmap.toggle.monthly')}
              </button>
            </div>
          </div>

          {heatmapView === 'daily' ? (
            dailyHeatmap.weeks.length ? (
              <>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  {dailyHeatmap.spanLabel}
                </div>

                <div
                  className="daily-heatmap-scroll"
                  aria-label={t('dashboard.heatmap.daily.scrollAria')}
                  ref={dailyHeatmapScrollRef}
                >
                  <div className="daily-heatmap" role="grid" aria-label={t('dashboard.heatmap.daily.gridAria')}>
                    {dailyHeatmap.weeks.map((week, weekIdx) => (
                      <div key={`week-${weekIdx}`} className="daily-heatmap-week" role="row">
                        {week.map((cell, weekdayIdx) => {
                          if (!cell) {
                            return (
                              <div
                                key={`empty-${weekIdx}-${weekdayIdx}`}
                                className="daily-heatmap-cell empty"
                                aria-hidden="true"
                              />
                            );
                          }
                          const level = dailyHeatmap.max
                            ? Math.ceil((cell.cnt / dailyHeatmap.max) * 4)
                            : 0;
                          const safeLevel = cell.cnt ? Math.max(1, Math.min(4, level)) : 0;
                          return (
                            <div
                              key={cell.d}
                              role="button"
                              tabIndex={0}
                              className={`daily-heatmap-cell level-${safeLevel} clickable`}
                              title={t('dashboard.heatmap.cellTitle', { key: cell.d, count: cell.cnt })}
                              aria-label={t('dashboard.heatmap.cellTitle', { key: cell.d, count: cell.cnt })}
                              onClick={() => goToDayHighlights(cell.d)}
                              onKeyDown={(evt) => {
                                if (evt.key === 'Enter' || evt.key === ' ') {
                                  evt.preventDefault();
                                  goToDayHighlights(cell.d);
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="placeholder-text">{t('dashboard.placeholder.noActiveDays')}</p>
            )
          ) : monthlyHeatmap.length ? (
            <div
              className="heatmap-grid"
              role="grid"
              aria-label={t('dashboard.heatmap.monthly.gridAria', { years: monthlyHeatmapYears })}
            >
              {monthlyHeatmap.map((row) => (
                <div key={row.year} className="heatmap-row" role="row">
                  <div className="heatmap-year" role="rowheader">
                    {row.year}
                  </div>
                  <div className="heatmap-months">
                    {row.months.map((month) => {
                      const level = heatmapMax ? Math.ceil((month.count / heatmapMax) * 4) : 0;
                      const monthKey = `${row.year}-${String(month.month).padStart(2, '0')}`;
                      return (
                        <div
                          key={`${row.year}-${month.month}`}
                          className={`heatmap-cell level-${level} clickable`}
                          title={t('dashboard.heatmap.cellTitle', { key: `${row.year}-${String(month.month).padStart(2, '0')}`, count: month.count })}
                          aria-label={t('dashboard.heatmap.cellTitle', { key: `${row.year}-${String(month.month).padStart(2, '0')}`, count: month.count })}
                          role="button"
                          tabIndex={0}
                          onClick={() => goToMonthHighlights(monthKey)}
                          onKeyDown={(evt) => handleHeatmapKeyDown(evt, monthKey)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noActiveDays')}</p>
          )}
                  </>
                );
              case 'weekday':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('weekday')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('dashboard.weekday.title')}</h3>
                    </div>
          {hasWeekdayData ? (
            <>
              {weekdayPeak && (
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  {t('dashboard.weekday.peak', { day: weekdayPeak.label, share: weekdayPeak.share })}
                </div>
              )}
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={weekdayDistribution}
                    layout="vertical"
                    margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
                    barCategoryGap={10}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      width={46}
                    />
                    <Tooltip
                      formatter={(value, name, props) => {
                        const share = props?.payload?.share;
                        const countText = formatHighlightsCount(value);
                        if (typeof share === 'number') {
                          return [
                            lang === 'en' ? `${countText} (${share}%)` : `${countText}（${share}%）`,
                            t('dashboard.highlightsLabel'),
                          ];
                        }
                        return [countText, t('dashboard.highlightsLabel')];
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#6366f1"
                      radius={[0, 8, 8, 0]}
                      barSize={14}
                      cursor="pointer"
                      onClick={(data) => goToWeekdayHighlights(data?.payload?.weekday)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noWeekdayStats')}</p>
          )}
                  </>
                );
              case 'hour':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('hour')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('dashboard.hour.title')}</h3>
                    </div>
          {hasHourlyData ? (
            <>
              {hourlyPeak && (
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  {t('dashboard.hour.peak', { time: hourlyPeak.label })}
                </div>
              )}
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={hourlyDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={2} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatHighlightsCount(value), t('dashboard.highlightsLabel')]} />
                    <Bar
                      dataKey="count"
                      fill="#14b8a6"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(data) => goToHourHighlights(data?.payload?.hour)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noHourStats')}</p>
          )}
                  </>
                );
              case 'seasonal':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('seasonal')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('dashboard.seasonal.title')}</h3>
                    </div>
          {hasSeasonalData ? (
            <>
              {seasonalPeak && (
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  {t('dashboard.seasonal.peak', { month: seasonalPeak.label, count: seasonalPeak.count })}
                </div>
              )}
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={seasonalDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="seasonalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatHighlightsCount(value), t('dashboard.highlightsLabel')]} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#db2777"
                      fill="url(#seasonalGradient)"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props || {};
                        if (!payload || typeof cx !== 'number' || typeof cy !== 'number') {
                          return null;
                        }
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={10}
                            stroke="transparent"
                            strokeWidth={0}
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onClick={(evt) => {
                              evt.stopPropagation();
                              goToMonthOfYearHighlights(payload.month);
                            }}
                          />
                        );
                      }}
                      activeDot={(props) => {
                        const { cx, cy, payload } = props || {};
                        if (!payload || typeof cx !== 'number' || typeof cy !== 'number') {
                          return null;
                        }
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            strokeWidth={0}
                            fill="#db2777"
                            style={{ cursor: 'pointer' }}
                            onClick={(evt) => {
                              evt.stopPropagation();
                              goToMonthOfYearHighlights(payload.month);
                            }}
                          />
                        );
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noSeasonalStats')}</p>
          )}
                  </>
                );
              case 'activeDays':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('activeDays')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('dashboard.activeDays.title')}</h3>
                    </div>
          {activeDayRows.length ? (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                {[
                  {
                    label: t('dashboard.activeDays.totalActiveDays'),
                    value:
                      typeof totalActiveDays === 'number' ? totalActiveDays : '-',
                  },
                  {
                    label: t('dashboard.activeDays.longestStreak'),
                    value: activeDayStats.longestStreak > 0 ? activeDayStats.longestStreak : '-',
                  },
                  {
                    label: t('dashboard.activeDays.trailingStreak'),
                    value: activeDayStats.trailingStreak > 0 ? activeDayStats.trailingStreak : '-',
                  },
                  {
                    label: t('dashboard.activeDays.avgPerActiveDay'),
                    value: activeDayRows.length
                      ? activeDayStats.avgHighlights.toFixed(1)
                      : '-',
                  },
                  {
                    label: t('dashboard.activeDays.busiestDay'),
                    value: activeDayStats.busiestDay
                      ? lang === 'en'
                        ? `${activeDayStats.busiestDay.cnt} (${activeDayStats.busiestDay.d})`
                        : `${activeDayStats.busiestDay.cnt}（${activeDayStats.busiestDay.d}）`
                      : '-',
                    onActivate: () => {
                      if (activeDayStats.busiestDay?.d) {
                        goToDayHighlights(activeDayStats.busiestDay.d);
                      }
                    },
                  },
                  {
                    label: t('dashboard.activeDays.lastActiveDay'),
                    value: activeDayStats.lastActiveDay || '-',
                    onActivate: () => {
                      if (activeDayStats.lastActiveDay) {
                        goToDayHighlights(activeDayStats.lastActiveDay);
                      }
                    },
                  },
                ].map((item) => (
                  <div key={item.label} style={{ minWidth: '150px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {typeof item.onActivate === 'function' && item.value !== '-' ? (
                        <span
                          className="dashboard-clickable"
                          role="button"
                          tabIndex={0}
                          onClick={item.onActivate}
                          onKeyDown={(evt) => {
                            if (evt.key === 'Enter' || evt.key === ' ') {
                              evt.preventDefault();
                              item.onActivate();
                            }
                          }}
                        >
                          {item.value}
                        </span>
                      ) : (
                        item.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            
            </>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noActiveDays')}</p>
          )}
                  </>
                );
              case 'yearly':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('yearly')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('dashboard.yearly.title')}</h3>
                    </div>
          {yearlyInsights.recentYears.length ? (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                {[
                  { label: t('dashboard.yearly.span'), value: yearlyInsights.spanLabel || '-' },
                  { label: t('dashboard.yearly.totalYears'), value: yearlyInsights.totalYears || '-' },
                  {
                    label: t('dashboard.yearly.bestYear'),
                    value: yearlyInsights.bestYear
                      ? lang === 'en'
                        ? `${yearlyInsights.bestYear.label} (${yearlyInsights.bestYear.count})`
                        : `${yearlyInsights.bestYear.label}（${yearlyInsights.bestYear.count}）`
                      : '-',
                  },
                  {
                    label: t('dashboard.yearly.avgPerYear'),
                    value: yearlyInsights.avgPerYear
                      ? yearlyInsights.avgPerYear.toFixed(1)
                      : '-',
                  },
                  {
                    label: t('dashboard.yearly.medianPerYear'),
                    value: yearlyInsights.medianPerYear
                      ? yearlyInsights.medianPerYear.toFixed(1)
                      : '-',
                  },
                  {
                    label: t('dashboard.yearly.totalHighlights'),
                    value: yearlyInsights.totalHighlights || '-',
                  },
                ].map((item) => (
                  <div key={item.label} style={{ minWidth: '150px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {yearlyInsights.topYears.length ? (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                    {t('dashboard.yearly.topYears')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {yearlyInsights.topYears.map((year) => (
                      <div
                        key={year.label}
                        className="dashboard-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => goToYearHighlights(year.label)}
                        onKeyDown={(evt) => {
                          if (evt.key === 'Enter' || evt.key === ' ') {
                            evt.preventDefault();
                            goToYearHighlights(year.label);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          background: '#eef2ff',
                          fontSize: '13px',
                        }}
                      >
                        {year.label} · {year.count}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            
            </>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noYearlyData')}</p>
          )}
                  </>
                );
              case 'authorInsights':
                return wrapChartCard(
                  cardId,
                  <>
                    <div className="dashboard-card-header" {...chartHandleProps('authorInsights')}>
                      <h3 style={{ marginTop: 0, marginBottom: 0 }}>{t('dashboard.authorInsights.title')}</h3>
                    </div>
          {authorInsights.leaders.length ? (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                {[
                  {
                    label: t('dashboard.authorInsights.authorCount'),
                    value: authorInsights.authorCount || '-',
                  },
                  {
                    label: t('dashboard.authorInsights.totalHighlights'),
                    value: authorInsights.totalHighlights || '-',
                  },
                  {
                    label: t('dashboard.authorInsights.totalBooksTracked'),
                    value: authorInsights.totalBooksTracked || '-',
                  },
                  {
                    label: t('dashboard.authorInsights.avgPerBook'),
                    value: authorInsights.avgPerBook
                      ? authorInsights.avgPerBook.toFixed(1)
                      : '-',
                  },
                
                ].map((item) => (
                  <div key={item.label} style={{ minWidth: '150px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {authorInsights.leaderBooks ? (
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '8px',
                }}>
                  {t('dashboard.authorInsights.top3Books', { books: authorInsights.leaderBooks })}
                </div>
              ) : null}
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                {t('dashboard.authorInsights.topVoices')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {authorInsights.leaders.map((author, index) => (
                  <div
                    key={author.name}
                    className="dashboard-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      navigate(buildAuthorHighlightsLink(author.name));
                    }}
                    onKeyDown={(evt) => {
                      if (evt.key === 'Enter' || evt.key === ' ') {
                        evt.preventDefault();
                        navigate(buildAuthorHighlightsLink(author.name));
                      }
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                        marginBottom: '4px',
                      }}
                    >
                      <span>
                        {index + 1}. {author.name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{author.share}%</span>
                    </div>
                    <div
                      className="insight-progress"
                      title={t('dashboard.authorInsights.voiceTooltip', {
                        count: author.count,
                        books: author.bookCount || 0,
                        share: author.share,
                      })}
                      aria-label={t('dashboard.authorInsights.voiceTooltip', {
                        count: author.count,
                        books: author.bookCount || 0,
                        share: author.share,
                      })}
                    >
                      <div
                        className="insight-progress__value"
                        style={{ width: `${author.share}%`, background: '#7c3aed' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.noAuthorInsights')}</p>
          )}
                  </>
                );
              case 'authorBooks':
                return wrapChartCard(
                  cardId,
                  <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
                      <h3 style={{ margin: 0 }} {...chartHandleProps('authorBooks')}>
                        {t('dashboard.authorBooks.title')}
                      </h3>
            <div className="author-selector" style={{ marginBottom: 0 }}>
              <label>
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  disabled={!authorsByBooks.length}
                >
                  {authorsByBooks.length === 0 && <option value="">{t('dashboard.placeholder.noAuthors')}</option>}
                  {authorsByBooks.slice(0, 8).map((author) => (
                    <option key={author.name} value={author.name}>
                      {lang === 'en'
                        ? `${author.name} (${author.bookCount || 0})`
                        : `${author.name}（${author.bookCount || 0}）`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          {selectedAuthor && sortedAuthorBooks.length ? (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>{t('dashboard.table.book')}</th>
                  <th>{t('dashboard.table.highlightsCount')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedAuthorBooks.slice(0, 6).map((book) => (
                  <tr key={book.book_id}>
                    <td>
                      <Link to={`/book/${book.book_id}`} className="dashboard-link">
                        {book.book_title}
                      </Link>
                    </td>
                    <td>{book.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="placeholder-text">{t('dashboard.placeholder.selectAuthor')}</p>
          )}
                  </>
                );
              default:
                return null;
            }
          })
          .filter(Boolean)}
        {/* 热力图已合并到上方卡片（按日/按月切换） */}
      </div>
    </main>
  );
};

export default Dashboard;

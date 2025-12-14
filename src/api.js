import JSZip from 'jszip';
import { parseClippings } from './utils/clippingsParser';
import { normalizeAuthorKey } from './utils/author';

const STORAGE_KEY = 'klip-local-data-v1';
const defaultState = { books: {}, highlights: [] };
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
let runtimeState = null;

function withDefaultHighlightFields(entry = {}) {
  return {
    ...entry,
    deleted_at: entry.deleted_at || null,
  };
}

function getActiveHighlights(state) {
  return state.highlights.filter((h) => !h.deleted_at);
}

function cloneState(state) {
  const books = {};
  Object.entries(state.books || {}).forEach(([key, book]) => {
    books[key] = { ...book };
  });
  return {
    books,
    highlights: (state.highlights || []).map((h) => withDefaultHighlightFields({ ...h })),
  };
}

function loadState() {
  if (isBrowser) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const rawHighlights = Array.isArray(parsed.highlights) ? parsed.highlights : [];
        return {
          books: parsed.books || {},
          highlights: rawHighlights.map((item) => withDefaultHighlightFields(item)),
        };
      }
    } catch (err) {
      console.warn('加载本地数据失败，使用空状态', err);
    }
  }
  return cloneState(defaultState);
}

function persistState() {
  if (!runtimeState) {
    runtimeState = cloneState(defaultState);
  }
  const serialized = JSON.stringify(runtimeState);
  if (isBrowser) {
    window.localStorage.setItem(STORAGE_KEY, serialized);
  }
  runtimeState = JSON.parse(serialized);
}

function getState() {
  if (!runtimeState) {
    runtimeState = loadState();
  }
  return runtimeState;
}

function parseDateValue(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value}Z`);
  }
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }
  return null;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureBookRecord(bookMap, highlight) {
  const existing = bookMap[highlight.book_id];
  if (existing) {
    const next = { ...existing };
    if (!next.book_title && highlight.book_title) {
      next.book_title = highlight.book_title;
    }
    if (!next.original_title && highlight.book_title) {
      next.original_title = highlight.book_title;
    }
    if (!next.author && highlight.author) {
      next.author = highlight.author;
    }
    bookMap[highlight.book_id] = next;
    return;
  }
  bookMap[highlight.book_id] = {
    book_id: highlight.book_id,
    book_title: highlight.book_title,
    original_title: highlight.book_title,
    author: highlight.author,
    cover_url: '',
  };
}

function bookStats(state) {
  const stats = {};
  getActiveHighlights(state).forEach((h) => {
    if (!stats[h.book_id]) {
      stats[h.book_id] = { count: 0, last: null };
    }
    stats[h.book_id].count += 1;
    const dateValue = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
    if (dateValue) {
      const iso = dateValue.toISOString();
      if (!stats[h.book_id].last || iso > stats[h.book_id].last) {
        stats[h.book_id].last = iso;
      }
    }
  });
  return stats;
}

function saveAndReturn(value) {
  persistState();
  return value;
}

function compareDatesDesc(a, b) {
  const da = parseDateValue(a);
  const db = parseDateValue(b);
  if (da && db) return db - da;
  if (da) return -1;
  if (db) return 1;
  return 0;
}

function compareDatesAsc(a, b) {
  const da = parseDateValue(a);
  const db = parseDateValue(b);
  if (da && db) return da - db;
  if (da) return -1;
  if (db) return 1;
  return 0;
}

function paginate(items, skip = 0, limit = 50) {
  const total = items.length;
  const sliced = items.slice(skip, skip + limit);
  return { items: sliced, total, skip, limit };
}

function normalizeHighlightsWithBooks(state) {
  const books = state.books;
  return getActiveHighlights(state).map((h) => ({
    ...h,
    book_title: books[h.book_id]?.book_title || h.book_title || 'Unknown',
    author: books[h.book_id]?.author || h.author || 'Unknown',
  }));
}

function groupByBook(state) {
  const result = {};
  normalizeHighlightsWithBooks(state).forEach((highlight) => {
    if (!result[highlight.book_id]) {
      result[highlight.book_id] = {
        book_id: highlight.book_id,
        book_title: state.books[highlight.book_id]?.book_title || highlight.book_title || 'Unknown',
        author: state.books[highlight.book_id]?.author || highlight.author || 'Unknown',
        items: [],
      };
    }
    result[highlight.book_id].items.push(highlight);
  });
  return result;
}

export async function uploadClippings(file) {
  const text = await file.text();
  const state = getState();
  const existingIds = new Set(state.highlights.map((h) => h.id));
  const parsed = parseClippings(text, { existingHashes: existingIds });
  const totalParsed = parsed.length;
  let inserted = 0;
  parsed.forEach((highlight) => {
    ensureBookRecord(state.books, highlight);
    if (existingIds.has(highlight.id)) {
      return;
    }
    inserted += 1;
    existingIds.add(highlight.id);
    state.highlights.push(withDefaultHighlightFields(highlight));
  });
  state.highlights.sort((a, b) => a.clip_index - b.clip_index);
  saveAndReturn(null);
  return { count: totalParsed, inserted };
}

export async function listBooks({ q, author, skip = 0, limit = 50, sort = 'latest_desc' } = {}) {
  const state = getState();
  const stats = bookStats(state);
  const keyword = q ? q.toLowerCase() : null;
  const authorKeyword = author ? author.toLowerCase() : null;
  let books = Object.values(state.books).map((book) => ({
    ...book,
    highlight_count: stats[book.book_id]?.count || 0,
    last_highlight_at: stats[book.book_id]?.last || null,
  }));

  if (keyword || authorKeyword) {
    books = books.filter((book) => {
      const matchTitle = keyword ? (book.book_title || '').toLowerCase().includes(keyword) : false;
      const matchAuthor = authorKeyword ? (book.author || '').toLowerCase().includes(authorKeyword) : false;
      if (keyword && authorKeyword) {
        return matchTitle || matchAuthor;
      }
      return matchTitle || matchAuthor;
    });
  }

  const comparators = {
    latest_desc: (a, b) => compareDatesDesc(a.last_highlight_at, b.last_highlight_at),
    latest_asc: (a, b) => compareDatesAsc(a.last_highlight_at, b.last_highlight_at),
    title_asc: (a, b) => (a.book_title || '').localeCompare(b.book_title || ''),
    title_desc: (a, b) => (b.book_title || '').localeCompare(a.book_title || ''),
    author_asc: (a, b) => (a.author || '').localeCompare(b.author || ''),
    author_desc: (a, b) => (b.author || '').localeCompare(a.author || ''),
    count_desc: (a, b) => b.highlight_count - a.highlight_count || compareDatesDesc(a.last_highlight_at, b.last_highlight_at),
  };
  const sorter = comparators[sort] || comparators.latest_desc;
  books.sort(sorter);

  const { items, total } = paginate(books, skip, limit);
  return { items, total, skip, limit };
}

export async function getBookDetail(bookId, { skip = 0, limit = 50 } = {}) {
  const state = getState();
  const book = state.books[bookId];
  if (!book) {
    throw new Error('书籍不存在');
  }
  const allHighlights = normalizeHighlightsWithBooks(state)
    .filter((h) => h.book_id === bookId)
    .sort((a, b) => a.clip_index - b.clip_index);
  const { items, total } = paginate(allHighlights, skip, limit);
  return {
    book,
    highlights: items,
    pagination: { total, skip, limit },
  };
}

export async function getBookHighlightCount(bookId) {
  const state = getState();
  const count = getActiveHighlights(state).filter((h) => h.book_id === bookId).length;
  return { book_id: bookId, highlight_count: count };
}

export async function updateBook(bookId, payload) {
  const state = getState();
  if (!state.books[bookId]) {
    throw new Error('书籍不存在');
  }
  state.books[bookId] = { ...state.books[bookId], ...payload };
  const updated = state.books[bookId];
  saveAndReturn(null);
  return { book: updated };
}

export async function listHighlights({
  book_id,
  keyword,
  author,
  day,
  weekday,
  hour,
  monthOfYear,
  month,
  year,
  author_key,
  skip = 0,
  limit = 50,
  sort = 'date_desc',
} = {}) {
  let items = normalizeHighlightsWithBooks(getState());

  if (book_id) {
    items = items.filter((h) => h.book_id === book_id);
  }

  const keywordLower = keyword ? keyword.toLowerCase() : null;
  const authorLower = author ? author.toLowerCase() : null;
  const authorKeyFilter = author_key ? normalizeAuthorKey(author_key) : null;
  if (keywordLower || authorLower || authorKeyFilter) {
    items = items.filter((h) => {
      const checks = [];
      if (keywordLower) {
        checks.push((h.highlight_content || '').toLowerCase().includes(keywordLower));
      }
      if (authorKeyFilter) {
        const highlightKey = normalizeAuthorKey(h.author || '');
        checks.push(Boolean(highlightKey) && highlightKey === authorKeyFilter);
      } else if (authorLower) {
        checks.push((h.author || '').toLowerCase().includes(authorLower));
      }
      return checks.length ? checks.some(Boolean) : true;
    });
  }

  const dayFilter = day ? String(day).trim() : '';
  const monthFilter = month ? month.trim() : '';
  const yearFilter = year ? String(year).trim() : '';
  const weekdayFilterRaw = weekday !== undefined && weekday !== null ? String(weekday).trim() : '';
  const hourFilterRaw = hour !== undefined && hour !== null ? String(hour).trim() : '';
  const monthOfYearFilterRaw =
    monthOfYear !== undefined && monthOfYear !== null ? String(monthOfYear).trim() : '';

  const weekdayFilter = weekdayFilterRaw ? Number(weekdayFilterRaw) : null;
  const hourFilter = hourFilterRaw ? Number(hourFilterRaw) : null;
  const monthOfYearFilter = monthOfYearFilterRaw ? Number(monthOfYearFilterRaw) : null;

  if (dayFilter || monthFilter || yearFilter || weekdayFilterRaw || hourFilterRaw || monthOfYearFilterRaw) {
    items = items.filter((h) => {
      const date = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
      if (!date) return false;

      if (yearFilter && String(date.getFullYear()) !== yearFilter) return false;

      if (monthFilter) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (key !== monthFilter) return false;
      }

      if (dayFilter) {
        const key = formatDateKey(date);
        if (key !== dayFilter) return false;
      }

      if (weekdayFilterRaw) {
        if (!Number.isFinite(weekdayFilter) || weekdayFilter < 0 || weekdayFilter > 6) return false;
        if (date.getDay() !== weekdayFilter) return false;
      }

      if (hourFilterRaw) {
        if (!Number.isFinite(hourFilter) || hourFilter < 0 || hourFilter > 23) return false;
        if (date.getHours() !== hourFilter) return false;
      }

      if (monthOfYearFilterRaw) {
        if (!Number.isFinite(monthOfYearFilter) || monthOfYearFilter < 1 || monthOfYearFilter > 12) return false;
        if (date.getMonth() + 1 !== monthOfYearFilter) return false;
      }

      return true;
    });
  }

  const sorters = {
    date_desc: (a, b) => compareDatesDesc(a.date_added, b.date_added) || b.clip_index - a.clip_index,
    date_asc: (a, b) => compareDatesAsc(a.date_added, b.date_added) || a.clip_index - b.clip_index,
    author_asc: (a, b) => (a.author || '').localeCompare(b.author || ''),
    author_desc: (a, b) => (b.author || '').localeCompare(a.author || ''),
    book_asc: (a, b) => (a.book_title || '').localeCompare(b.book_title || ''),
    book_desc: (a, b) => (b.book_title || '').localeCompare(a.book_title || ''),
  };
  const sorter = sorters[sort] || sorters.date_desc;
  items.sort(sorter);

  const { items: paged, total } = paginate(items, skip, limit);
  return { items: paged, total, skip, limit };
}

export async function deleteHighlight(highlightId) {
  const state = getState();
  const target = state.highlights.find((h) => h.id === highlightId);
  if (!target) {
    throw new Error('高亮不存在');
  }
  if (target.deleted_at) {
    throw new Error('高亮已删除');
  }
  target.deleted_at = new Date().toISOString();
  saveAndReturn(null);
  return { status: 'ok' };
}

export async function updateHighlight(highlightId, payload) {
  const state = getState();
  const index = state.highlights.findIndex((h) => h.id === highlightId);
  if (index === -1) {
    throw new Error('高亮不存在');
  }
  if (state.highlights[index].deleted_at) {
    throw new Error('高亮已删除');
  }
  const safePayload = { ...(payload || {}) };
  delete safePayload.deleted_at;
  state.highlights[index] = { ...state.highlights[index], ...safePayload };
  saveAndReturn(null);
  return { status: 'ok', highlight: state.highlights[index] };
}

export async function clearAllData() {
  runtimeState = cloneState(defaultState);
  if (isBrowser) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return { status: 'ok' };
}

export function getBackupSnapshot() {
  return cloneState(getState());
}

export async function restoreBackupSnapshot(snapshot, options = {}) {
  const mode = options.mode === 'replace' ? 'replace' : 'merge';
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('备份文件格式无效');
  }
  const booksInput = snapshot.books;
  const highlightsInput = snapshot.highlights;
  if (!booksInput || typeof booksInput !== 'object') {
    throw new Error('备份文件缺少 books 数据');
  }
  if (!Array.isArray(highlightsInput)) {
    throw new Error('备份文件缺少 highlights 数组');
  }

  const sanitizedBooks = {};
  Object.entries(booksInput).forEach(([key, value]) => {
    if (!value || typeof value !== 'object') {
      return;
    }
    const bookId = value.book_id || value.bookId || key;
    if (!bookId) {
      return;
    }
    sanitizedBooks[bookId] = { ...value, book_id: bookId };
  });

  const sanitizedHighlights = highlightsInput.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error('备份文件包含非法高亮记录');
    }
    const id = item.id || item.highlight_id || item.uuid;
    if (!id) {
      throw new Error('备份中的高亮缺少 id 字段');
    }
    const bookId = item.book_id || item.bookId;
    if (!bookId) {
      throw new Error('备份中的高亮缺少 book_id 字段');
    }
    const clipIndex = typeof item.clip_index === 'number' ? item.clip_index : index;
    return withDefaultHighlightFields({
      ...item,
      id,
      book_id: bookId,
      clip_index: clipIndex,
    });
  });

  if (mode === 'replace') {
    runtimeState = {
      books: sanitizedBooks,
      highlights: sanitizedHighlights,
    };
    persistState();
    return {
      status: 'ok',
      books: Object.keys(sanitizedBooks).length,
      highlights: sanitizedHighlights.length,
      mode,
    };
  }

  const state = getState();
  Object.entries(sanitizedBooks).forEach(([bookId, bookValue]) => {
    if (!state.books[bookId]) {
      state.books[bookId] = { ...bookValue };
      return;
    }
    state.books[bookId] = { ...state.books[bookId], ...bookValue };
  });

  const existingIds = new Set(state.highlights.map((h) => h.id));
  let inserted = 0;
  sanitizedHighlights.forEach((item) => {
    if (existingIds.has(item.id)) {
      return;
    }
    inserted += 1;
    existingIds.add(item.id);
    state.highlights.push(item);
  });
  persistState();
  return {
    status: 'ok',
    books: Object.keys(state.books).length,
    highlights: state.highlights.length,
    inserted,
    mode,
  };
}

export async function getStatsOverview() {
  const state = getState();
  const stats = bookStats(state);
  const activeHighlights = getActiveHighlights(state);
  const total_highlights = activeHighlights.length;
  const books_with_highlights = Object.keys(stats).length;

  const activeDaysSet = new Set();
  activeHighlights.forEach((h) => {
    const date = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
    if (date) {
      activeDaysSet.add(formatDateKey(date));
    }
  });

  const books = Object.values(state.books).map((book) => ({
    book_id: book.book_id,
    book_title: book.book_title,
    author: book.author,
    highlight_count: stats[book.book_id]?.count || 0,
  }));

  const top_books = books.sort((a, b) => b.highlight_count - a.highlight_count).slice(0, 5);
  const authorCounts = {};
  activeHighlights.forEach((h) => {
    const authorName = state.books[h.book_id]?.author || h.author;
    if (!authorName) return;
    authorCounts[authorName] = (authorCounts[authorName] || 0) + 1;
  });
  const top_authors = Object.entries(authorCounts)
    .map(([authorName, count]) => ({ author: authorName, highlight_count: count }))
    .sort((a, b) => b.highlight_count - a.highlight_count)
    .slice(0, 5);

  return {
    total_highlights,
    books_with_highlights,
    active_days: activeDaysSet.size,
    top_books,
    top_authors,
    top_author: top_authors[0] || null,
  };
}

function aggregateByDate(highlights) {
  const map = new Map();
  highlights.forEach((h) => {
    const date = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
    if (!date) return;
    const key = formatDateKey(date);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([d, cnt]) => ({ d, cnt }))
    .sort((a, b) => a.d.localeCompare(b.d));
}

export async function getStatsRecent() {
  const state = getState();
  const now = new Date();
  const cutoff30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const cutoff12m = new Date(now);
  cutoff12m.setMonth(cutoff12m.getMonth() - 11);

  const byDay30Map = new Map();
  const byMonth12Map = new Map();
  const byYearMap = new Map();

  getActiveHighlights(state).forEach((h) => {
    const date = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
    if (!date) return;
    if (date >= cutoff30) {
      const key = formatDateKey(date);
      byDay30Map.set(key, (byDay30Map.get(key) || 0) + 1);
    }
    if (date >= cutoff12m) {
      const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth12Map.set(ym, (byMonth12Map.get(ym) || 0) + 1);
    }
    const year = date.getFullYear();
    byYearMap.set(year, (byYearMap.get(year) || 0) + 1);
  });

  return {
    by_day_30: Array.from(byDay30Map.entries()).map(([d, cnt]) => ({ d, cnt })).sort((a, b) => a.d.localeCompare(b.d)),
    by_month_12: Array.from(byMonth12Map.entries()).map(([ym, cnt]) => ({ ym, cnt })).sort((a, b) => a.ym.localeCompare(b.ym)),
    by_year: Array.from(byYearMap.entries())
      .map(([y, cnt]) => ({ y, year: y, cnt }))
      .sort((a, b) => a.y - b.y),
  };
}

export async function getStatsAuthorsWordcloud() {
  const counts = {};
  const bookSets = new Map();
  const state = getState();
  getActiveHighlights(state).forEach((h) => {
    const authorName = state.books[h.book_id]?.author || h.author;
    if (!authorName) return;
    counts[authorName] = (counts[authorName] || 0) + 1;
    if (!bookSets.has(authorName)) {
      bookSets.set(authorName, new Set());
    }
    bookSets.get(authorName).add(h.book_id);
  });
  return Object.entries(counts)
    .map(([author, count]) => ({
      author,
      count,
      books: bookSets.get(author)?.size || 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getStatsAuthorsByHighlights() {
  const counts = {};
  const state = getState();
  getActiveHighlights(state).forEach((h) => {
    const authorName = state.books[h.book_id]?.author || h.author;
    if (!authorName) return;
    counts[authorName] = (counts[authorName] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([author, count]) => ({
      author,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getStatsTitleWordcloud() {
  const grouped = groupByBook(getState());
  return Object.values(grouped)
    .map((book) => ({ book_id: book.book_id, title: book.book_title, count: book.items.length }))
    .sort((a, b) => b.count - a.count);
}

export async function getStatsHeatmapYear() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const rows = aggregateByDate(
    getActiveHighlights(getState()).filter((h) => {
      const date = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
      return date && date >= cutoff;
    })
  );
  return rows;
}

export async function getStatsActiveDaysAll() {
  const rows = aggregateByDate(getActiveHighlights(getState()));
  return { active_days: rows.length, days: rows };
}

export async function getStatsLast12Months() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 11);
  const map = new Map();
  getActiveHighlights(getState()).forEach((h) => {
    const date = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
    if (!date || date < cutoff) return;
    const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    map.set(ym, (map.get(ym) || 0) + 1);
  });
  return Array.from(map.entries()).map(([ym, cnt]) => ({ ym, cnt })).sort((a, b) => a.ym.localeCompare(b.ym));
}

export async function getStatsTemporalBreakdown() {
  const highlights = getActiveHighlights(getState());
  const hourBuckets = Array(24).fill(0);
  const weekdayBuckets = Array(7).fill(0);
  const monthBuckets = Array(12).fill(0);

  highlights.forEach((h) => {
    const date = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
    if (!date) return;
    hourBuckets[date.getHours()] += 1;
    weekdayBuckets[date.getDay()] += 1;
    monthBuckets[date.getMonth()] += 1;
  });

  return {
    total: highlights.length,
    by_hour: hourBuckets.map((count, hour) => ({ hour, count })),
    by_weekday: weekdayBuckets.map((count, weekday) => ({ weekday, count })),
    by_month: monthBuckets.map((count, month) => ({ month: month + 1, count })),
  };
}

export async function getStatsMonthlyMatrix({ years = 5 } = {}) {
  const state = getState();
  const activeHighlights = getActiveHighlights(state);
  const yearValues = [];
  activeHighlights.forEach((h) => {
    const date = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
    if (!date) return;
    yearValues.push(date.getFullYear());
  });

  if (!yearValues.length) {
    return [];
  }

  const minYear = Math.min(...yearValues);
  const maxYear = Math.max(...yearValues);
  const isAllTime =
    years === 'all' ||
    years === 'all-time' ||
    years === 'allTime' ||
    years === 0 ||
    years === '0' ||
    years == null;

  const sanitizedYears = Math.max(1, Math.min(10, Number.isFinite(Number(years)) ? Number(years) : 5));
  const totalSpanYears = maxYear - minYear + 1;
  const latestYear = maxYear;
  const earliestYear = isAllTime
    ? minYear
    : totalSpanYears <= sanitizedYears
      ? minYear
      : latestYear - (sanitizedYears - 1);

  const yearBuckets = new Map();
  for (let year = earliestYear; year <= latestYear; year += 1) {
    yearBuckets.set(year, Array(12).fill(0));
  }

  activeHighlights.forEach((h) => {
    const date = parseDateValue(h.date_added) || parseDateValue(h.date_added_raw);
    if (!date) return;
    const year = date.getFullYear();
    if (!yearBuckets.has(year)) return;
    const monthIndex = date.getMonth();
    const months = yearBuckets.get(year);
    months[monthIndex] += 1;
  });

  return Array.from(yearBuckets.entries()).map(([year, counts]) => ({
    year,
    months: counts.map((count, idx) => ({ month: idx + 1, count })),
  }));
}

export async function getAuthorBooksStats(authorName) {
  if (!authorName) {
    return [];
  }
  const normalized = normalizeHighlightsWithBooks(getState());
  const target = authorName.toLowerCase();
  const map = new Map();
  normalized.forEach((highlight) => {
    if (!highlight.author || highlight.author.toLowerCase() !== target) {
      return;
    }
    if (!map.has(highlight.book_id)) {
      map.set(highlight.book_id, {
        book_id: highlight.book_id,
        book_title: highlight.book_title || 'Unknown',
        count: 0,
      });
    }
    const entry = map.get(highlight.book_id);
    entry.count += 1;
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function buildTextContent(book, lang) {
  const authorLabel = lang === 'zh' ? '作者' : 'Author';
  const lines = [`${book.book_title}`, `${authorLabel}: ${book.author || 'Unknown'}`, ''];
  book.items.forEach((item) => {
    if (item.highlight_content) {
      lines.push(item.highlight_content);
      lines.push('');
    }
    if (item.note_content) {
      lines.push(item.note_content);
      lines.push('');
    }
  });
  return `${lines.join('\n').trim()}\n`;
}

function buildMarkdownContent(book) {
  const lines = [`# ${book.book_title}`, '', `**${book.author || 'Unknown'}**`, ''];
  book.items.forEach((item) => {
    if (item.highlight_content) {
      lines.push(`+ ${item.highlight_content}`);
      lines.push('');
    }
    if (item.note_content) {
      lines.push(`    ${item.note_content}`);
      lines.push('');
    }
  });
  return `${lines.join('\n').trim()}\n`;
}

function encodeRFC5987ValueChars(str) {
  // RFC 5987: attr-char with percent-encoding for others.
  return encodeURIComponent(str)
    .replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, '%2A')
    .replace(/%(7C|60|5E)/g, (m) => m.toLowerCase());
}

function toAsciiFilename(filename) {
  return String(filename || 'download')
    // strip control chars
    .replace(/[\x00-\x1F\x7F]/g, '_')
    // replace non-ascii
    .replace(/[^\x20-\x7E]/g, '_')
    // avoid quotes/backslashes breaking header
    .replace(/["\\]/g, '_')
    .trim() || 'download';
}

function buildContentDisposition(filename) {
  const raw = String(filename || 'download');
  const ascii = toAsciiFilename(raw);
  const encoded = encodeRFC5987ValueChars(raw);
  // Entire header value must be ISO-8859-1 representable.
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function exportHighlights({
  export_format = 'txt',
  split_by_book = false,
  lang = 'zh',
  book_id,
} = {}) {
  const grouped = groupByBook(getState());
  const books = Object.values(grouped).filter((book) => {
    if (!book_id) return true;
    return String(book.book_id) === String(book_id);
  });
  if (!books.length) {
    throw new Error('当前没有可导出的高亮数据');
  }

  const orderedBooks = books.map((book) => ({
    ...book,
    items: [...book.items].sort((a, b) => a.clip_index - b.clip_index),
  }));

  if (!split_by_book) {
    let contentBytes;
    let mediaType;
    let filename;
    const singleBook = book_id ? orderedBooks[0] : null;
    if (export_format === 'json') {
      const payload = orderedBooks.flatMap((book) =>
        book.items.map((item) => ({
          book_title: book.book_title,
          author: book.author,
          highlight_content: item.highlight_content,
          note_content: item.note_content,
          location: item.location,
          date_added_raw: item.date_added_raw,
          date_added: item.date_added,
          note_date_added: item.note_date_added,
        }))
      );
      contentBytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
      mediaType = 'application/json';
      if (singleBook) {
        const safeTitle = (singleBook.book_title || 'unknown').replace(/[\\/:*?"<>|]/g, '_');
        filename = `${safeTitle}.json`;
      } else {
        filename = 'highlights_all.json';
      }
    } else {
      const parts = orderedBooks.map((book) =>
        export_format === 'txt' ? buildTextContent(book, lang) : buildMarkdownContent(book)
      );
      contentBytes = new TextEncoder().encode(parts.join('\n\n'));
      mediaType = export_format === 'txt' ? 'text/plain; charset=utf-8' : 'text/markdown; charset=utf-8';
      if (singleBook) {
        const safeTitle = (singleBook.book_title || 'unknown').replace(/[\\/:*?"<>|]/g, '_');
        filename = `${safeTitle}.${export_format === 'txt' ? 'txt' : 'md'}`;
      } else {
        filename = export_format === 'txt' ? 'highlights_all.txt' : 'highlights_all.md';
      }
    }
    return new Response(contentBytes, {
      headers: new Headers({
        'Content-Type': mediaType,
        'Content-Disposition': buildContentDisposition(filename),
      }),
    });
  }

  const zip = new JSZip();
  await Promise.all(
    orderedBooks.map(async (book) => {
      let fileBytes;
      let ext;
      if (export_format === 'json') {
        const payload = book.items.map((item) => ({
          book_title: book.book_title,
          author: book.author,
          highlight_content: item.highlight_content,
          note_content: item.note_content,
          location: item.location,
          date_added_raw: item.date_added_raw,
          date_added: item.date_added,
          note_date_added: item.note_date_added,
        }));
        fileBytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
        ext = 'json';
      } else if (export_format === 'txt') {
        fileBytes = new TextEncoder().encode(buildTextContent(book, lang));
        ext = 'txt';
      } else {
        fileBytes = new TextEncoder().encode(buildMarkdownContent(book));
        ext = 'md';
      }
      const safeTitle = (book.book_title || 'unknown').replace(/[\\/:*?"<>|]/g, '_');
      zip.file(`${safeTitle}.${ext}`, fileBytes);
    })
  );

  const blob = await zip.generateAsync({ type: 'uint8array' });
  return new Response(blob, {
    headers: new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': buildContentDisposition('highlights_by_book.zip'),
    }),
  });
  }



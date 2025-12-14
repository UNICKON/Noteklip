import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigationType } from 'react-router-dom';
import { FaSearch, FaStickyNote, FaEdit, FaTrash } from 'react-icons/fa';
import { listHighlights, updateHighlight, deleteHighlight } from './api';
import { normalizeHighlight } from './utils/normalizers';
import { formatDisplayDate } from './utils/date';
import { loadSessionState, saveSessionState } from './utils/stateStorage';
import { normalizeAuthorKey } from './utils/author';
import { useI18n } from './i18n';

const HIGHLIGHTS_STATE_KEY = 'highlights-view-state';

const normalizeMonthValue = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
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
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    return '';
  }
  return normalized;
};

const normalizeYearValue = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/(\d{4})/);
  return match ? match[1] : '';
};

const normalizeDayValue = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : '';
};

const normalizeIntRange = (value, min, max) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return '';
  const normalized = Math.trunc(parsed);
  if (normalized < min || normalized > max) return '';
  return String(normalized);
};

const HighlightsView = () => {
  const { t } = useI18n();
  const location = useLocation();
  const navigationType = useNavigationType();
  const isPopNavigation = navigationType === 'POP';
  const persistedStateRef = useRef();
  if (persistedStateRef.current === undefined) {
    persistedStateRef.current = isPopNavigation ? loadSessionState(HIGHLIGHTS_STATE_KEY) : null;
  }
  const initialSnapshot = persistedStateRef.current || {};
  const [openNoteKey, setOpenNoteKey] = useState(null);
  const [searchInput, setSearchInput] = useState(initialSnapshot.searchInput || '');
  const [searchQuery, setSearchQuery] = useState(initialSnapshot.searchQuery || '');
  const [sortBy, setSortBy] = useState(initialSnapshot.sortBy || 'date-desc');
  const [highlights, setHighlights] = useState([]);
  const [displayedHighlights, setDisplayedHighlights] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(
    Number.isInteger(initialSnapshot.page) ? initialSnapshot.page : 0
  );
  const [pageSize] = useState(15);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const [monthFilter, setMonthFilter] = useState(initialSnapshot.monthFilter || '');
  const [yearFilter, setYearFilter] = useState(initialSnapshot.yearFilter || '');
  const [dayFilter, setDayFilter] = useState(initialSnapshot.dayFilter || '');
  const [weekdayFilter, setWeekdayFilter] = useState(initialSnapshot.weekdayFilter || '');
  const [hourFilter, setHourFilter] = useState(initialSnapshot.hourFilter || '');
  const [monthOfYearFilter, setMonthOfYearFilter] = useState(initialSnapshot.monthOfYearFilter || '');
  const [authorFilter, setAuthorFilter] = useState(initialSnapshot.authorFilter || '');
  const [authorKeyFilter, setAuthorKeyFilter] = useState(initialSnapshot.authorKeyFilter || '');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const normalizedMonth = normalizeMonthValue(params.get('month') || '');
    const normalizedYear = normalizeYearValue(params.get('year') || '');
    const normalizedDay = normalizeDayValue(params.get('day') || '');
    const normalizedWeekday = normalizeIntRange(params.get('weekday'), 0, 6);
    const normalizedHour = normalizeIntRange(params.get('hour'), 0, 23);
    const normalizedMonthOfYear = normalizeIntRange(params.get('monthOfYear'), 1, 12);
    const authorParamRaw = params.get('author') || '';
    const authorParam = authorParamRaw.trim();
    const authorKeyParam = params.get('authorKey') || '';
    const normalizedAuthorKeyFromParam = authorKeyParam
      ? normalizeAuthorKey(authorKeyParam)
      : '';
    const fallbackAuthorKey = authorParam ? normalizeAuthorKey(authorParam) : '';
    setMonthFilter(normalizedMonth);
    setYearFilter(normalizedYear);
    setDayFilter(normalizedDay);
    setWeekdayFilter(normalizedWeekday);
    setHourFilter(normalizedHour);
    setMonthOfYearFilter(normalizedMonthOfYear);
    setAuthorFilter(authorParam);
    setAuthorKeyFilter(normalizedAuthorKeyFromParam || fallbackAuthorKey);

    if (navigationType !== 'POP') {
      setSearchInput('');
      setSearchQuery('');
      setPage(0);
      const shouldUseOldest = Boolean(
        normalizedDay ||
          normalizedMonth ||
          normalizedYear ||
          normalizedWeekday ||
          normalizedHour ||
          normalizedMonthOfYear ||
          authorParam
      );
      setSortBy(shouldUseOldest ? 'date-asc' : 'date-desc');
    }
  }, [location.search, navigationType]);

  useEffect(() => {
    saveSessionState(HIGHLIGHTS_STATE_KEY, {
      searchInput,
      searchQuery,
      sortBy,
      page,
      dayFilter,
      monthFilter,
      yearFilter,
      weekdayFilter,
      hourFilter,
      monthOfYearFilter,
      authorFilter,
      authorKeyFilter,
    });
  }, [
    searchInput,
    searchQuery,
    sortBy,
    page,
    dayFilter,
    monthFilter,
    yearFilter,
    weekdayFilter,
    hourFilter,
    monthOfYearFilter,
    authorFilter,
    authorKeyFilter,
  ]);

  const scrollToTop = () => {
    const main = document.querySelector('.main-content');
    if (main && 'scrollTo' in main) {
      main.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const keyword = searchQuery.trim() || undefined;
    const normalizedAuthorFilter = authorFilter.trim();
    const authorQuery = normalizedAuthorFilter || undefined;
    const normalizedAuthorKey =
      authorKeyFilter ||
      (normalizedAuthorFilter ? normalizeAuthorKey(normalizedAuthorFilter) : '');
    // 将前端 sortBy 映射为后端 /highlights 的 sort 参数
    let apiSort = 'date_desc';
    if (sortBy === 'date-asc') apiSort = 'date_asc';
    else if (sortBy === 'book-asc') apiSort = 'book_asc';
    else if (sortBy === 'author-asc') apiSort = 'author_asc';

    listHighlights({
      keyword,
      author: authorQuery,
      author_key: normalizedAuthorKey || undefined,
      day: dayFilter || undefined,
      weekday: weekdayFilter || undefined,
      hour: hourFilter || undefined,
      monthOfYear: monthOfYearFilter || undefined,
      month: monthFilter || undefined,
      year: yearFilter || undefined,
      skip: page * pageSize,
      limit: pageSize,
      sort: apiSort,
    })
      .then((res) => {
        if (cancelled) return;
        const items = Array.isArray(res) ? res : res.items || res.data || [];
        const total =
          (typeof res.total === 'number' && res.total) ||
          (res.pagination && typeof res.pagination.total === 'number' && res.pagination.total) ||
          null;
        // 兼容后端字段名：highlight_content/book_title
        const mapped = items.map(normalizeHighlight);
        setHighlights(mapped);
        setDisplayedHighlights(mapped);
        setHasMore(items.length === pageSize);
        if (total !== null) {
          setTotalCount(total);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError(err.message || t('highlights.loadFail'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    searchQuery,
    sortBy,
    page,
    pageSize,
    dayFilter,
    monthFilter,
    yearFilter,
    weekdayFilter,
    hourFilter,
    monthOfYearFilter,
    authorFilter,
    authorKeyFilter,
  ]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(0);
    scrollToTop();
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    // 更换排序方式时，从第一页开始看，避免误解为“只对当前页生效”
    setPage(0);
    scrollToTop();
  };

  const handleDeleteHighlight = async (key, id) => {
    try {
      await deleteHighlight(id);
      const filtered = highlights.filter(h => `${h.bookId}-${h.id}` !== key);
      setHighlights(filtered);
      setDisplayedHighlights(filtered);
    } catch (err) {
      console.error(err);
      alert(err.message || '删除高亮失败');
    }
  };

  const handleEditHighlight = (key, text) => {
    setEditingKey(key);
    setEditText(text);
  };

  const handleSaveEdit = async (key, id) => {
    try {
      await updateHighlight(id, { highlight_content: editText });
      const updated = highlights.map(h => 
        `${h.bookId}-${h.id}` === key ? { ...h, text: editText, highlight_content: editText } : h
      );
      setHighlights(updated);
      setDisplayedHighlights(updated);
      setEditingKey(null);
    } catch (err) {
      console.error(err);
      alert(err.message || t('highlights.updateFail'));
    }
  };

  const totalPages =
    totalCount !== null ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>{t('highlights.pageTitle')}</h1>
        <div className="actions">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <FaSearch />
            <input 
              type="text" 
              placeholder={t('highlights.search.placeholder')}
              value={searchInput}
              onChange={handleSearchChange}
              title={searchInput || undefined}
            />
          </form>
          <div className="filter-dropdown">
            <label htmlFor="sort-select">{t('highlights.sort.label')}</label>
            <select
              id="sort-select"
              className="filter-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="date-desc">{t('library.sort.dateDesc')}</option>
              <option value="date-asc">{t('library.sort.dateAsc')}</option>
              <option value="book-asc">{t('library.sort.bookAsc')}</option>
              <option value="author-asc">{t('library.sort.authorAsc')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="highlights-list-container">
        {loading && <p>{t('common.loading')}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {displayedHighlights.length > 0 ? (
          displayedHighlights.map((h, index) => {
            const key = `${h.bookId}-${h.id}`;
            const isOpen = openNoteKey === key;
            const isEditing = editingKey === key;
            const { short: shortDate, full: fullDate } = formatDisplayDate(h.date);

            return (
              <div key={key} className={`highlight-list-item ${h.note ? 'has-note' : ''} ${isOpen ? 'note-open' : ''}`}>
                {isEditing ? (
                  <div className="edit-highlight-mode">
                    <textarea 
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-textarea"
                    />
                    <div className="edit-actions">
                      <button onClick={() => handleSaveEdit(key, h.id)} className="btn-save">{t('common.save')}</button>
                      <button onClick={() => setEditingKey(null)} className="btn-cancel">{t('common.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="highlight-text">{h.text}</p>
                    <div className="highlight-meta">
                      <span>— <Link to={`/book/${h.bookId}`} className="author-link">{h.bookTitle}</Link>•<Link to={`/author/${h.author}`} state={{ background: location }} className="author-link">{h.author}</Link>
                        <div className="highlight-actions">
                          <button 
                            className="action-btn"
                            onClick={() => handleEditHighlight(key, h.text)}
                            title={t('common.edit')}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteHighlight(key, h.id)}
                            title={t('common.delete')}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </span>
                        {h.note && (
                          <div className="note-control">
                            <button
                              className="note-button"
                              onClick={() => setOpenNoteKey(isOpen ? null : key)}
                              aria-expanded={isOpen}
                              aria-controls={`note-${key}`}
                              aria-label={isOpen ? t('common.hideNote') : t('common.showNote')}
                            ><FaStickyNote /></button>
                          </div>
                        )}
                        <span className="date" title={fullDate || undefined}>
                          {shortDate || fullDate || '—'}
                        </span>

                    </div>

                    {/* Inline expandable note panel for this highlight */}
                    <div id={`note-${key}`} className={`note-panel-inline ${isOpen ? 'open' : ''}`}>
                      <div className="note-panel-inner">
                        <p className="note-content">{h.note}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        ) : (
          <p className="no-results">{t('highlights.noResults')}</p>
        )}
      </div>
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <div className="pagination">
          <button
            className="page-button"
            disabled={page === 0}
            onClick={() => {
              setPage((p) => Math.max(0, p - 1));
              scrollToTop();
            }}
          >
            {t('common.prevPage')}
          </button>
          {totalPages !== null &&
            Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (p === 1 || p === totalPages) return true;
                return Math.abs(p - (page + 1)) <= 2;
              })
              .map((p, index, arr) => {
                const prev = arr[index - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span>...</span>}
                    <button
                      className={
                        p === page + 1 ? 'page-button active' : 'page-button'
                      }
                      onClick={() => {
                        setPage(p - 1);
                        scrollToTop();
                      }}
                      disabled={p === page + 1}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
          <button
            className="page-button"
            disabled={totalPages !== null ? page + 1 >= totalPages : !hasMore}
            onClick={() => {
              setPage((p) => p + 1);
              scrollToTop();
            }}
          >
            {t('common.nextPage')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HighlightsView;

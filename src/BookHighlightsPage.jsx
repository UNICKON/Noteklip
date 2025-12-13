import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { FaStickyNote, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import {
  getBookDetail,
  getBookHighlightCount,
  listHighlights,
  updateBook,
  updateHighlight,
  deleteHighlight,
} from './api';
import { normalizeBook, normalizeHighlight } from './utils/normalizers';
import { formatDisplayDate } from './utils/date';
import { useI18n } from './i18n';

const BookHighlightsPage = () => {
  const { t } = useI18n();
  const { bookId } = useParams();
  const location = useLocation();
  const [book, setBook] = useState(null);
  const [openNoteKey, setOpenNoteKey] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightCount, setHighlightCount] = useState(0);
  const [savingBook, setSavingBook] = useState(false);
  const [bookSaveError, setBookSaveError] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    setSearchInput('');
    setSearchQuery('');
    setSortBy('date-desc');
    setPage(0);
  }, [bookId]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      getBookDetail(bookId, { skip: 0, limit: 0 }),
      getBookHighlightCount(bookId),
    ])
      .then(([bookRes, countRes]) => {
        if (cancelled) return;
        const b = bookRes.book || {};
        const normalizedBook = normalizeBook(b);
        setBook(normalizedBook);
        setBookTitle(normalizedBook.title || '');
        setBookAuthor(normalizedBook.author || '');

        const cnt =
          (typeof countRes === 'number' && countRes) ||
          countRes.highlight_count ||
          countRes.count ||
          countRes.cnt ||
          countRes.total ||
          0;
        setHighlightCount(cnt);
        setTotalCount(cnt);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError(err.message || t('book.loadDetailFail'));
      });

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const keyword = searchQuery.trim() || undefined;
    let apiSort = 'date_desc';
    if (sortBy === 'date-asc') apiSort = 'date_asc';

    listHighlights({
      book_id: bookId,
      keyword,
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
          highlightCount ||
          0;
        const normalizedHighlights = items.map(normalizeHighlight);
        setHighlights(normalizedHighlights);
        setTotalCount(total);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError(err.message || t('book.loadHighlightsFail'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, searchQuery, sortBy, page, pageSize, highlightCount]);

  const persistBookChanges = async (newTitle, newAuthor) => {
    if (!book) return;
    const payload = {};
    if (newTitle !== (book.title || book.book_title || '')) {
      payload.book_title = newTitle;
    }
    if (newAuthor !== (book.author || '')) {
      payload.author = newAuthor;
    }
    // 如果没有实际变更，就不调用后端
    if (Object.keys(payload).length === 0) {
      return;
    }
    try {
      setSavingBook(true);
      setBookSaveError(null);
      const updated = await updateBook(bookId, payload);
      const updatedBook = normalizeBook(updated.book || updated);
      setBook(updatedBook);
      setBookTitle(updatedBook.title || newTitle);
      setBookAuthor(updatedBook.author || newAuthor);
    } catch (err) {
      console.error(err);
      setBookSaveError(err.message || t('book.updateBookFail'));
    } finally {
      setSavingBook(false);
    }
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    persistBookChanges(bookTitle, bookAuthor);
  };

  const handleAuthorBlur = () => {
    setEditingAuthor(false);
    persistBookChanges(bookTitle, bookAuthor);
  };

  const handleDeleteHighlight = async (id) => {
    try {
      await deleteHighlight(id);
      setHighlights(highlights.filter(h => h.id !== id));
      setHighlightCount((prev) => Math.max(0, prev - 1));
      setTotalCount((prev) => (typeof prev === 'number' ? Math.max(0, prev - 1) : prev));
    } catch (err) {
      console.error(err);
      alert(err.message || t('book.deleteFail'));
    }
  };

  const handleEditHighlight = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleSaveEdit = async (id) => {
    try {
      await updateHighlight(id, { highlight_content: editText });
      setHighlights(highlights.map(h => 
        h.id === id ? { ...h, text: editText, highlight_content: editText } : h
      ));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || t('book.updateFail'));
    }
  };

  const scrollToTop = () => {
    const main = document.querySelector('.main-content');
    if (main && 'scrollTo' in main) {
      main.scrollTo(0, 0);
    }
  };

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
    setPage(0);
    scrollToTop();
  };

  const totalPages =
    totalCount !== null ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;

  return (
    <div className="main-content">
      {loading && <p>{t('common.loading')}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="page-header book-highlights-header" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 auto' }}>
          <div className="header-with-edit">
            {editingTitle ? (
              <input 
                type="text" 
                value={bookTitle} 
                onChange={(e) => setBookTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTitleBlur();
                  }
                }}
                autoFocus
                className="edit-input"
                style={{ width: '100%' }}
              />
            ) : (
              <>
                <h1>{bookTitle}</h1>
                <button 
                  className="edit-btn"
                  onClick={() => setEditingTitle(true)}
                  title={t('book.editTitle')}
                >
                  <FaEdit />
                </button>
              </>
            )}
          </div>
          <div className="header-with-edit">
            {editingAuthor ? (
              <input 
                type="text" 
                value={bookAuthor} 
                onChange={(e) => setBookAuthor(e.target.value)}
                onBlur={handleAuthorBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAuthorBlur();
                  }
                }}
                autoFocus
                className="edit-input"
                style={{ width: '100%' }}
              />
            ) : (
              <>
                <p>
                  {t('book.byPrefix')}
                  <Link to={`/author/${bookAuthor}`} state={{ background: location }} className="author-link">
                    {bookAuthor}
                  </Link>
                </p>
                <button 
                  className="edit-btn"
                  onClick={() => setEditingAuthor(true)}
                  title={t('book.editAuthor')}
                >
                  <FaEdit />
                </button>
              </>
            )}
          </div>
          <p className="stats">
            {t('book.highlightsCount', { count: highlightCount ?? highlights.length })}
          </p>
          {savingBook && <p style={{ fontSize: 12, color: '#666' }}>{t('book.saving')}</p>}
          {bookSaveError && (
            <p style={{ fontSize: 12, color: 'red' }}>{bookSaveError}</p>
          )}
        </div>
        <div
          className="actions"
          style={{
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            marginTop: 8,
          }}
        >
          <form className="search-bar" onSubmit={handleSearchSubmit} style={{ minWidth: 280 }}>
            <FaSearch />
            <input
              type="text"
              placeholder={t('book.search.placeholder')}
              value={searchInput}
              onChange={handleSearchChange}
              title={searchInput || undefined}
            />
          </form>
          <div className="filter-dropdown">
            <label htmlFor="book-sort-select">{t('book.sort.label')}</label>
            <select
              id="book-sort-select"
              className="filter-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="date-desc">{t('book.sort.dateDesc')}</option>
              <option value="date-asc">{t('book.sort.dateAsc')}</option>
            </select>
          </div>
        </div>
      </div>
      <div className="highlights-list-container">
        {highlights.map(h => {
          const key = `${book.id}-${h.id}`;
          const isOpen = openNoteKey === key;
          const isEditing = editingId === h.id;
          const { short: shortDate, full: fullDate } = formatDisplayDate(h.date);
          const displayDate = shortDate || fullDate || '—';

          return (
            <div key={h.id} className={`highlight-card ${h.note ? 'has-note' : ''} ${isOpen ? 'note-open' : ''}`}>
              {isEditing ? (
                <div className="edit-highlight-mode">
                  <textarea 
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="edit-textarea"
                  />
                  <div className="edit-actions">
                    <button onClick={() => handleSaveEdit(h.id)} className="btn-save">{t('common.save')}</button>
                    <button onClick={() => setEditingId(null)} className="btn-cancel">{t('common.cancel')}</button>
                  </div>
                </div>
              ) : (
                <>
                  <blockquote className='highlight-text'>{h.text}</blockquote>
                  <div className="highlight-meta">
                    <span>
                      {t('book.location', { location: h.location })}
                      {' • '}
                      <span className="date" title={fullDate || undefined}>{displayDate}</span>
                      <div className="highlight-actions">
                        <button 
                          className="action-btn"
                          onClick={() => handleEditHighlight(h.id, h.text)}
                          title={t('common.edit')}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteHighlight(h.id)}
                          title={t('common.delete')}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </span>
                    {h.note && (
                      <button
                        className="note-button"
                        onClick={() => setOpenNoteKey(isOpen ? null : key)}
                        aria-expanded={isOpen}
                        aria-controls={`note-${key}`}
                        aria-label={isOpen ? t('common.hideNote') : t('common.showNote')}
                      >
                        <FaStickyNote />
                      </button>
                    )}
                  </div>

                  <div id={`note-${key}`} className={`note-panel-inline ${isOpen ? 'open' : ''}`}>
                    <div className="note-panel-inner">
                      <p className="note-content">{h.note}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {totalPages !== null && totalPages > 1 && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <div className="pagination">
            <button
              className="page-button"
              disabled={page === 0}
              onClick={() => {
                setPage((p) => {
                  const next = Math.max(0, p - 1);
                  return next;
                });
                scrollToTop();
              }}
            >
              {t('common.prevPage')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // 简单窗口：当前页前后各 2 页 + 首尾
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
              disabled={page + 1 >= totalPages}
              onClick={() => {
                setPage((p) => p + 1);
                scrollToTop();
              }}
            >
              {t('common.nextPage')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookHighlightsPage;

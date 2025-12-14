import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigationType } from 'react-router-dom';
import { FaBook, FaSearch } from 'react-icons/fa';
import { listBooks, getBookHighlightCount } from './api';
import { normalizeBook } from './utils/normalizers';
import { loadSessionState, saveSessionState } from './utils/stateStorage';
import { useI18n } from './i18n';

const LIBRARY_STATE_KEY = 'library-view-state';

const LibraryView = () => {
  const { t } = useI18n();
  const location = useLocation();
  const navigationType = useNavigationType();
  const isPopNavigation = navigationType === 'POP';
  const persistedStateRef = useRef();
  if (persistedStateRef.current === undefined) {
    persistedStateRef.current = isPopNavigation ? loadSessionState(LIBRARY_STATE_KEY) : null;
  }
  const initialSnapshot = persistedStateRef.current || {};
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(initialSnapshot.searchInput || '');
  const [searchQuery, setSearchQuery] = useState(initialSnapshot.searchQuery || '');
  // 排序选项：date-desc/date-asc/book-asc/author-asc/count-desc/count-asc
  const [sort, setSort] = useState(initialSnapshot.sort || 'count-desc');
  const [page, setPage] = useState(
    Number.isInteger(initialSnapshot.page) ? initialSnapshot.page : 0
  );
  const [pageSize] = useState(18);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(null);

  useEffect(() => {
    saveSessionState(LIBRARY_STATE_KEY, {
      searchInput,
      searchQuery,
      sort,
      page,
    });
  }, [searchInput, searchQuery, sort, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const keyword = searchQuery.trim() || undefined;
    // 将前端 sort 映射为后端 /books 支持的 sort 参数
    let apiSort = 'count_desc'; // 默认按批注数降序
    if (sort === 'date-desc') apiSort = 'latest_desc';
    else if (sort === 'date-asc') apiSort = 'latest_asc';
    else if (sort === 'book-asc') apiSort = 'title_asc';
    else if (sort === 'author-asc') apiSort = 'author_asc';
    else if (sort === 'count-desc') apiSort = 'count_desc';

    listBooks({
      q: keyword,
      author: keyword,
      skip: page * pageSize,
      limit: pageSize,
      sort: apiSort,
    })
      .then(async (res) => {
        if (cancelled) return;
        // 后端可以返回任意结构，这里假设为数组，或者 {items: [], total: N}
        const items = Array.isArray(res) ? res : res.items || res.data || [];
        const total =
          (typeof res.total === 'number' && res.total) ||
          (res.pagination && typeof res.pagination.total === 'number' && res.pagination.total) ||
          null;
        const normalized = items.map(normalizeBook).filter((b) => b.id);

        // 对每本书调用 /books/{book_id}/highlight-count，确保高亮数量准确
        const withCounts = await Promise.all(
          normalized.map(async (book) => {
            try {
              const countRes = await getBookHighlightCount(book.id);
              const count =
                (typeof countRes === 'number' && countRes) ||
                countRes.highlight_count ||
                countRes.count ||
                countRes.cnt ||
                countRes.total ||
                book.highlightsCount ||
                0;
              return { ...book, highlightsCount: count };
            } catch (e) {
              console.error('加载书籍高亮数量失败', book.id, e);
              return book;
            }
          })
        );

        if (!cancelled) {
          setBooks(withCounts);
          setHasMore(items.length === pageSize);
          if (total !== null) {
            setTotalCount(total);
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError(err.message || '加载书籍失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery, sort, page, pageSize]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const scrollToTop = () => {
    const main = document.querySelector('.main-content');
    if (main && 'scrollTo' in main) {
      main.scrollTo(0, 0);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(0);
    scrollToTop();
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(0);
    scrollToTop();
  };

  const totalPages =
    totalCount !== null ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>{t('library.title')}</h1>
        <div className="actions">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <FaSearch />
            <input
              type="text"
              placeholder={t('library.search.placeholder')}
              value={searchInput}
              onChange={handleSearchChange}
              title={searchInput || undefined}
            />
          </form>
          <div className="filter-dropdown">
            <label htmlFor="library-sort-select">{t('library.sort.label')}</label>
            <select
              id="library-sort-select"
              className="filter-select"
              value={sort}
              onChange={handleSortChange}
            >
              <option value="count-desc">{t('library.sort.countDesc')}</option>
              <option value="date-desc">{t('library.sort.dateDesc')}</option>
              <option value="date-asc">{t('library.sort.dateAsc')}</option>
              <option value="book-asc">{t('library.sort.bookAsc')}</option>
              <option value="author-asc">{t('library.sort.authorAsc')}</option>
            </select>
          </div>
        </div>
      </div>
      {loading && <p>{t('common.loading')}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="library-grid">
        {books.map(book => (
          <Link to={`/book/${book.id}`} key={book.id} className="book-card">
            <div className="book-cover">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={t('library.bookCoverAlt', { title: book.title || '' })}
                  onError={(e) => (e.target.style.display = 'none')}
                />
              ) : (
                <FaBook />
              )}
            </div>
            <div className="book-card-info">
              <div>
                <h3 title={book.title}>{book.title}</h3>
                <p>
                  <Link 
                    to={`/author/${book.author}`} 
                    state={{ background: location }} 
                    className="author-link"
                    onClick={(e) => e.stopPropagation()}
                    title={book.author}
                  >
                    {book.author}
                  </Link>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
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
          {totalPages !== null &&
            Array.from({ length: totalPages }, (_, i) => i + 1)
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
export default LibraryView;

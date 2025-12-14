import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaBook, FaStar } from 'react-icons/fa';
import { listBooks, getBookHighlightCount } from './api';
import { normalizeBook } from './utils/normalizers';
import { useI18n } from './i18n';

const AuthorPage = () => {
  const { t } = useI18n();
  const { authorName } = useParams();
  const navigate = useNavigate();
  const [booksByAuthor, setBooksByAuthor] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authorName) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listBooks({ author: authorName, skip: 0, limit: 200 })
      .then(async (res) => {
        if (cancelled) return;
        const items = Array.isArray(res) ? res : res.items || res.data || [];
        const normalized = items.map(normalizeBook).filter((b) => b.id);

        // 为作者下的每本书补充准确的高亮数量
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
              console.error('加载作者书籍高亮数量失败', book.id, e);
              return book;
            }
          })
        );

        if (cancelled) return;
        setBooksByAuthor(withCounts);
        if (!withCounts.length) {
          navigate(-1);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError(err.message || t('author.loadFail'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authorName, navigate]);

  const totalHighlights = booksByAuthor.reduce(
    (sum, book) => sum + (book.highlightsCount || book.highlights_count || 0),
    0
  );

  return (
    <div className="modal-overlay" onClick={() => navigate(-1)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={() => navigate(-1)}>×</button>
        <h3>{t('author.title', { name: authorName })}</h3>
        {loading && <p>{t('common.loading')}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p className="modal-subtitle">
          {t('author.subtitle', { highlights: totalHighlights, books: booksByAuthor.length })}
        </p>

        <div className="author-books-scroll">
          {booksByAuthor.map(book => (
            <div key={book.id} className="modal-book-card">
              <div className="modal-book-cover"><FaBook /></div>
              <div className="modal-book-info">
                <h4>{book.title}</h4>
                <p>{book.author}</p>
                <div className="modal-book-stats">
                  ⭐ {book.highlightsCount}
                </div>
              </div>
                <Link to={`/book/${book.id}`} className="view-clippings-button">{t('author.viewClippings')}</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthorPage;

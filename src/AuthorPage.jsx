import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { data } from './data';
import { FaBook, FaStar } from 'react-icons/fa';

const AuthorPage = () => {
  const { authorName } = useParams();
  const navigate = useNavigate();
  const authorData = data.authors[authorName];

  if (!authorData) return navigate("/");

  const booksByAuthor = authorData.books.map(id => data.books[id]);
  const totalHighlights = booksByAuthor.reduce((sum, book) => sum + (book.highlightsCount || 0), 0);

  return (
    <div className="modal-overlay" onClick={() => navigate(-1)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={() => navigate(-1)}>×</button>
        <h3>Author: {authorName}</h3>
        <p className="modal-subtitle">You have {totalHighlights} highlights from {booksByAuthor.length} book by this author.</p>

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
            <Link to={`/book/${book.id}`} className="view-clippings-button">View Clippings</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthorPage;

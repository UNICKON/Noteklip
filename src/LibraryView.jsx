import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { data } from './data';
import { FaBook } from 'react-icons/fa';

const LibraryView = () => {
  const books = Object.values(data.books);
  const location = useLocation();

  return (
    <div className="main-content">
      <h1>My Library</h1>
      <div className="library-grid">
        {books.map(book => (
          <Link to={`/book/${book.id}`} key={book.id} className="book-card">
            <div className="book-cover">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={`${book.title} cover`} onError={(e) => e.target.style.display = 'none'} />
              ) : (
                <FaBook />
              )}
            </div>
            <div className="book-card-info">
              <div>
                <h3>{book.title}</h3>
                <p>
                  <Link 
                    to={`/author/${book.author}`} 
                    state={{ background: location }} 
                    className="author-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {book.author}
                  </Link>
                </p>
              </div>
              <div className="book-card-stats">⭐ {book.highlightsCount}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default LibraryView;

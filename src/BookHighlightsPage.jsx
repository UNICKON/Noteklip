import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { data } from './data';
import { FaStickyNote, FaEdit, FaTrash } from 'react-icons/fa';

const BookHighlightsPage = () => {
  const { bookId } = useParams();
  const book = data.books[bookId];

  const location = useLocation();
  const [openNoteKey, setOpenNoteKey] = useState(null);
  const [highlights, setHighlights] = useState(book?.highlights || []);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [bookTitle, setBookTitle] = useState(book?.title || '');
  const [bookAuthor, setBookAuthor] = useState(book?.author || '');

  if (!book) return <div className="main-content">Book not found!</div>;

  const handleDeleteHighlight = (id) => {
    setHighlights(highlights.filter(h => h.id !== id));
  };

  const handleEditHighlight = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleSaveEdit = (id) => {
    setHighlights(highlights.map(h => 
      h.id === id ? { ...h, text: editText } : h
    ));
    setEditingId(null);
  };

  return (
    <div className="main-content">
      <div className="book-highlights-header">
        <div>
          <div className="header-with-edit">
            {editingTitle ? (
              <input 
                type="text" 
                value={bookTitle} 
                onChange={(e) => setBookTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                autoFocus
                className="edit-input"
              />
            ) : (
              <>
                <h1>{bookTitle}</h1>
                <button 
                  className="edit-btn"
                  onClick={() => setEditingTitle(true)}
                  title="Edit title"
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
                onBlur={() => setEditingAuthor(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingAuthor(false)}
                autoFocus
                className="edit-input"
              />
            ) : (
              <>
                <p>by <Link to={`/author/${bookAuthor}`} state={{ background: location }} className="author-link">{bookAuthor}</Link></p>
                <button 
                  className="edit-btn"
                  onClick={() => setEditingAuthor(true)}
                  title="Edit author"
                >
                  <FaEdit />
                </button>
              </>
            )}
          </div>
          <p className="stats">{highlights.length} highlights</p>
        </div>
      </div>
      <div className="highlights-list-container">
        {highlights.map(h => {
          const key = `${book.id}-${h.id}`;
          const isOpen = openNoteKey === key;
          const isEditing = editingId === h.id;

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
                    <button onClick={() => handleSaveEdit(h.id)} className="btn-save">Save</button>
                    <button onClick={() => setEditingId(null)} className="btn-cancel">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <blockquote className='highlight-text'>{h.text}</blockquote>
                  <div className="highlight-meta">
                    <span>Location {h.location}•{h.date}
                      <div className="highlight-actions">
                        <button 
                          className="action-btn"
                          onClick={() => handleEditHighlight(h.id, h.text)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteHighlight(h.id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </span>
                    {h.note && (
                      <button className="note-button" onClick={() => setOpenNoteKey(isOpen ? null : key)} aria-expanded={isOpen} aria-controls={`note-${key}`} aria-label={isOpen ? 'Hide note' : 'Show note'}>
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
    </div>
  );
};
export default BookHighlightsPage;

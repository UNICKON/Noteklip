import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { data } from './data';
import { FaSearch, FaStickyNote, FaEdit, FaTrash } from 'react-icons/fa';

const HighlightsView = () => {
  const allHighlights = data.getAllHighlights();
  const location = useLocation();
  const [openNoteKey, setOpenNoteKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [displayedHighlights, setDisplayedHighlights] = useState(allHighlights);
  const [highlights, setHighlights] = useState(allHighlights);
  const [editingKey, setEditingKey] = useState(null);
  const [editText, setEditText] = useState('');

  // Apply search and sort filtering
  useEffect(() => {
    let filtered = [...highlights];

    // 1. Apply search filter
    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(h =>
        h.text.toLowerCase().includes(lowercasedQuery) ||
        h.bookTitle.toLowerCase().includes(lowercasedQuery) ||
        h.author.toLowerCase().includes(lowercasedQuery)
      );
    }

    // 2. Apply sorting
    switch (sortBy) {
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'book-asc':
        filtered.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle, 'zh-CN'));
        break;
      case 'author-asc':
        filtered.sort((a, b) => a.author.localeCompare(b.author, 'zh-CN'));
        break;
      case 'date-desc':
      default:
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }

    setDisplayedHighlights(filtered);
  }, [searchQuery, sortBy, highlights]);

  const handleDeleteHighlight = (key) => {
    setHighlights(highlights.filter(h => `${h.bookId}-${h.id}` !== key));
  };

  const handleEditHighlight = (key, text) => {
    setEditingKey(key);
    setEditText(text);
  };

  const handleSaveEdit = (key) => {
    setHighlights(highlights.map(h => 
      `${h.bookId}-${h.id}` === key ? { ...h, text: editText } : h
    ));
    setEditingKey(null);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>My Highlights</h1>
        <div className="actions">
          <div className="search-bar">
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search highlights, books, or authors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <label htmlFor="sort-select">Sort by: </label>
            <select
              id="sort-select"
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="book-asc">Book (A-Z)</option>
              <option value="author-asc">Author (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="highlights-list-container">
        {displayedHighlights.length > 0 ? (
          displayedHighlights.map((h, index) => {
            const key = `${h.bookId}-${h.id}`;
            const isOpen = openNoteKey === key;
            const isEditing = editingKey === key;

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
                      <button onClick={() => handleSaveEdit(key)} className="btn-save">Save</button>
                      <button onClick={() => setEditingKey(null)} className="btn-cancel">Cancel</button>
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
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteHighlight(key)}
                            title="Delete"
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
                              aria-label={isOpen ? 'Hide note' : 'Show note'}
                            ><FaStickyNote /></button>
                          </div>
                        )}
                        <span className="date">{h.date}</span>

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
          <p className="no-results">No highlights found.</p>
        )}
      </div>
      
    </div>
  );
};

export default HighlightsView;

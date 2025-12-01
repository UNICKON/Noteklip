import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import LibraryView from './LibraryView';
import BookHighlightsPage from './BookHighlightsPage';
import AuthorPage from './AuthorPage';
import HighlightsView from './HighlightsView';
import './App.css';

// A component to handle rendering of the AuthorPage as a modal
const AppRoutes = () => {
    const location = useLocation();
    const background = location.state && location.state.background;

    return (
        <>
            <Routes location={background || location}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/library" element={<LibraryView />} />
                <Route path="/highlights" element={<HighlightsView />} />
                <Route path="/book/:bookId" element={<BookHighlightsPage />} />
                <Route path="/settings" element={<div className="main-content">Settings Page</div>} />
            </Routes>

            {background && (
                <Routes>
                    <Route path="/author/:authorName" element={<AuthorPage />} />
                </Routes>
            )}
        </>
    );
}


function App() {
  return (
    <Router>
        <div className="app-container">
            <Sidebar />
            <AppRoutes />
        </div>
    </Router>
  );
}

export default App;

import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { useI18n } from './i18n';
// 多语言 description 文本
const DESCRIPTIONS = {
    zh: 'Noteklip Dashboard - 管理和导出 Kindle 高亮、笔记与书籍信息，提升阅读体验，便捷整理与分享您的阅读成果。',
    en: 'Noteklip Dashboard - Manage and export Kindle highlights, notes, and book info to enhance your reading experience. Easily organize and share your reading insights.'
};

// 动态设置 meta description
function MetaDescription() {
    const { lang } = useI18n();
    useEffect(() => {
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', DESCRIPTIONS[lang] || DESCRIPTIONS.zh);
    }, [lang]);
    return null;
}
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import LibraryView from './LibraryView';
import BookHighlightsPage from './BookHighlightsPage';
import AuthorPage from './AuthorPage';
import HighlightsView from './HighlightsView';
import ExportPage from './ExportPage';
import SettingsPage from './SettingsPage';
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
                <Route path="/export" element={<ExportPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>

            {background && (
                <Routes>
                    <Route path="/author/:authorName" element={<AuthorPage />} />
                </Routes>
            )}
        </>
    );
}

const ScrollMemory = () => {
    const location = useLocation();
    const navigationType = useNavigationType();
    const positionsRef = useRef({});

    useLayoutEffect(() => {
        const key = location.key;
        const main = document.querySelector('.main-content');
        if (main) {
            const stored = positionsRef.current[key];
            if (navigationType === 'POP' && typeof stored === 'number') {
                main.scrollTo(0, stored);
            } else if (navigationType !== 'POP') {
                main.scrollTo(0, 0);
            }
        }

        return () => {
            const content = document.querySelector('.main-content');
            if (content) {
                positionsRef.current[key] = content.scrollTop;
            }
        };
    }, [location, navigationType]);

    return null;
};



function App() {
    return (
        <Router basename={import.meta.env.BASE_URL}>
            <MetaDescription />
            <ScrollMemory />
            <div className="app-container">
                <Sidebar />
                <AppRoutes />
            </div>
        </Router>
    );
}

export default App;

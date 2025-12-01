1. HighlightsPage.js 组件
这个组件将管理搜索词和排序选项的状态，并根据这些状态计算出最终要显示的笔记列表。

JavaScript
import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import './HighlightsPage.css'; // 我们将为新功能添加样式

// --- 模拟数据 ---
// 在真实的应用中，这些数据可能来自 API 或文件
const allMyHighlights = [
  { id: 1, text: '生产力从来不是偶然，它始终是追求卓越的结果。', book: '高效能人士的七个习惯', author: '史蒂芬·柯维', date: '2023-10-15' },
  { id: 2, text: '不读书的人，和不能读书的人比起来，没有任何优势。', book: '三体', author: '刘慈欣', date: '2023-11-01' },
  { id: 3, text: '我们由反复进行的行为塑造。因此，卓越不是一种行为，而是一种习惯。', book: '原子习惯', author: '詹姆斯·克利尔', date: '2023-09-20' },
  { id: 4, text: '千里之行，始于足下。', book: '道德经', author: '老子', date: '2022-05-30' },
  { id: 5, text: '给岁月以文明，而不是给文明以岁月。', book: '三体', author: '刘慈欣', date: '2023-11-25' },
];
// --- 模拟数据结束 ---


const HighlightsPage = () => {
  // 状态：搜索输入框中的文本
  const [searchQuery, setSearchQuery] = useState('');
  // 状态：当前的排序方式
  const [sortBy, setSortBy] = useState('date-desc'); // 默认按日期降序（最新在前）
  // 状态：最终显示在页面上的笔记列表
  const [displayedHighlights, setDisplayedHighlights] = useState(allMyHighlights);

  // 每当 `searchQuery` 或 `sortBy` 发生变化时，这个 useEffect 钩子就会重新运行
  useEffect(() => {
    let filtered = [...allMyHighlights];

    // 1. 应用搜索过滤
    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(h =>
        h.text.toLowerCase().includes(lowercasedQuery) ||
        h.book.toLowerCase().includes(lowercasedQuery) ||
        h.author.toLowerCase().includes(lowercasedQuery)
      );
    }

    // 2. 应用排序
    switch (sortBy) {
      case 'date-asc': // 按日期升序
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'book-asc': // 按书名升序 (A-Z)
        filtered.sort((a, b) => a.book.localeCompare(b.book, 'zh-CN'));
        break;
      case 'author-asc': // 按作者升序 (A-Z)
        filtered.sort((a, b) => a.author.localeCompare(b.author, 'zh-CN'));
        break;
      case 'date-desc': // 按日期降序（默认）
      default:
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }

    setDisplayedHighlights(filtered);
  }, [searchQuery, sortBy]); // 依赖项数组

  return (
    <div className="highlights-container">
      <div className="page-header">
        <h1>我的笔记</h1>
        <div className="actions">
          {/* 搜索框 */}
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="搜索笔记、书籍或作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 过滤/排序下拉菜单 */}
          <div className="filter-dropdown">
            <label htmlFor="sort-select">排序方式: </label>
            <select
              id="sort-select"
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">日期 (最新在前)</option>
              <option value="date-asc">日期 (最早在前)</option>
              <option value="book-asc">书名 (A-Z)</option>
              <option value="author-asc">作者 (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 显示结果 */}
      <div className="highlights-list">
        {displayedHighlights.length > 0 ? (
          displayedHighlights.map(h => (
            <div key={h.id} className="highlight-item">
              <p>"{h.text}"</p>
              <footer>— {h.author}，摘自《<strong>{h.book}</strong>》({h.date})</footer>
            </div>
          ))
        ) : (
          <p className="no-results">没有找到相关笔记。</p>
        )}
      </div>
    </div>
  );
};

export default HighlightsPage;
2. 相关 CSS 样式
将这些样式添加到 HighlightsPage.css 文件中，来美化搜索框和新增的下拉菜单。

CSS
/* --- HighlightsPage.css --- */

.highlights-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 20px; /* 搜索和过滤之间的间距 */
}

/* 搜索框样式 */
.search-bar {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 20px;
  padding: 8px 15px;
  border: 1px solid transparent;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.search-bar:focus-within {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.search-bar svg {
  color: #888;
  margin-right: 10px;
}

.search-bar input {
  border: none;
  background: none;
  outline: none;
  width: 250px;
  font-size: 16px;
}

/* 过滤/排序下拉菜单样式 */
.filter-dropdown {
  display: flex;
  align-items: center;
}

.filter-dropdown label {
  margin-right: 8px;
  font-weight: 500;
  color: #555;
}

.filter-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background-color: #fff;
  font-size: 16px;
  cursor: pointer;
}

/* 笔记列表样式 */
.highlight-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  border-left: 4px solid #007bff;
}

.highlight-item p {
  font-style: italic;
  font-size: 1.1em;
  margin-top: 0;
}

.highlight-item footer {
  font-size: 0.9em;
  color: #777;
  text-align: right;
}

.no-results {
  text-align: center;
  font-size: 1.2em;
  color: #888;
  padding: 50px 0;
}
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBook, FaSearch, FaCog, FaKiwiBird, FaHighlighter } from 'react-icons/fa';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo">
        <FaKiwiBird className="logo-icon" />
        <span>K-Logo</span>
      </div>
      <ul className="nav">
        <NavLink to="/" exact className="nav-item">
            <FaTachometerAlt /> Dashboard
        </NavLink>
        <NavLink to="/library" className="nav-item">
            <FaBook /> Library View
        </NavLink>
        <NavLink to="/highlights" className="nav-item">
            <FaHighlighter /> Highlights
        </NavLink>
        <NavLink to="/settings" className="nav-item">
            <FaCog /> Settings
        </NavLink>
      </ul>
    </div>
  );
};
export default Sidebar;

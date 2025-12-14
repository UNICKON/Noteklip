import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaBook,
  FaCog,
  FaHighlighter,
  FaDownload,
} from 'react-icons/fa';
import { useI18n } from './i18n';

const navItems = [
  { to: '/', labelKey: 'nav.dashboard', icon: FaTachometerAlt, end: true },
  { to: '/library', labelKey: 'nav.library', icon: FaBook },
  { to: '/highlights', labelKey: 'nav.highlights', icon: FaHighlighter },
  { to: '/export', labelKey: 'nav.export', icon: FaDownload },
  { to: '/settings', labelKey: 'nav.settings', icon: FaCog },
];

const Sidebar = () => {
  const { lang, setLang, t } = useI18n();
  const logoSrc = `${import.meta.env.BASE_URL}kiwi-logo.svg`;

  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="logo">
        <img src={logoSrc} alt={t('app.name')} className="logo-icon" />
        <span className="logo-text">{t('app.name')}</span>
      </div>
      <nav className="nav">
        {navItems.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" aria-label={t('lang.switch.aria')}>
        <div className="lang-switch" role="group" aria-label={t('lang.switch.aria')}>
          <button
            type="button"
            className={`lang-switch-btn${lang === 'zh' ? ' active' : ''}`}
            onClick={() => setLang('zh')}
          >
            {t('lang.zh')}
          </button>
          <button
            type="button"
            className={`lang-switch-btn${lang === 'en' ? ' active' : ''}`}
            onClick={() => setLang('en')}
          >
            {t('lang.en')}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

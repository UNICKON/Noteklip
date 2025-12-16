import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaBook,
  FaCog,
  FaHighlighter,
  FaDownload,
  FaGithub,
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 1 }}>
            <a
              href="https://github.com/UNICKON/Noteklip"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#64748b', opacity: 0.85, fontSize: 22, display: 'inline-block' }}
              title="GitHub"
            >
              <FaGithub />
            </a>
          </div>
          <div className="lang-switch" role="group" aria-label={t('lang.switch.aria')} style={{ display: 'flex', gap: 0 }}>
            <button
              type="button"
              className={`lang-switch-btn${lang === 'zh' ? ' active' : ''}`}
              onClick={() => setLang('zh')}
              style={{ flex: 1, borderRadius: '10px 0 0 10px', width: '50%' }}
            >
              {t('lang.zh')}
            </button>
            <button
              type="button"
              className={`lang-switch-btn${lang === 'en' ? ' active' : ''}`}
              onClick={() => setLang('en')}
              style={{ flex: 1, borderRadius: '0 10px 10px 0', width: '50%' }}
            >
              {t('lang.en')}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

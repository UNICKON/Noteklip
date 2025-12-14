import React, { useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import { exportHighlights } from './api';
import { useI18n } from './i18n';

const ExportPage = () => {
  const { lang: uiLang, t } = useI18n();
  const [exportFormat, setExportFormat] = useState('txt');
  const [splitByBook, setSplitByBook] = useState(false);
  const [exportLang, setExportLang] = useState(() => {
    const browserLang =
      typeof navigator !== 'undefined'
        ? (navigator.languages && navigator.languages[0]) || navigator.language || ''
        : '';

    if (/^zh\b|^zh-/i.test(browserLang)) return 'zh';
    if (/^en\b|^en-/i.test(browserLang)) return 'en';

    return uiLang === 'en' ? 'en' : 'zh';
  });
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const buildFilename = () => {
    if (splitByBook) return 'highlights.zip';
    if (exportFormat === 'markdown') return 'highlights.md';
    return `highlights.${exportFormat}`;
  };

  const parseFilename = (contentDisposition) => {
    if (!contentDisposition) return null;
    const filenameStar = /filename\*\s*=\s*['"]?(?:UTF-8''|)([^;'"\n]+)/i.exec(contentDisposition);
    if (filenameStar && filenameStar[1]) {
      try {
        return decodeURIComponent(filenameStar[1].replace(/"/g, ''));
      } catch (err) {
        return filenameStar[1];
      }
    }
    const filename = /filename\s*=\s*['"]?([^;'"\n]+)/i.exec(contentDisposition);
    if (filename && filename[1]) {
      return filename[1].replace(/"/g, '');
    }
    return null;
  };

  const handleExport = async () => {
    setExporting(true);
    setExportMsg('');
    try {
      const resp = await exportHighlights({
        export_format: exportFormat,
        split_by_book: splitByBook,
        lang: exportLang,
      });
      const blob = await resp.blob();
      const suggestedName =
        parseFilename(resp.headers.get('content-disposition')) || buildFilename();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportMsg(t('export.success'));
    } catch (err) {
      console.error(err);
      setExportMsg(err.message || t('export.fail'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="main-content export-page">
      <div className="page-header export-header">
        <div>
          <h1>{t('export.title')}</h1>
          <p className="page-subtitle">{t('export.subtitle')}</p>
        </div>
      </div>

      <div className="export-card">
        <div className="export-card-body">
          <div className="export-field">
            <span>{t('export.field.format')}</span>
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
              <option value="txt">TXT (.txt)</option>
              <option value="json">JSON (.json)</option>
              <option value="markdown">Markdown (.md)</option>
            </select>
          </div>
          <div className="export-field">
            <span>{t('export.field.language')}</span>
            <select value={exportLang} onChange={(e) => setExportLang(e.target.value)}>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <label className="export-checkbox">
            <input
              type="checkbox"
              checked={splitByBook}
              onChange={(e) => setSplitByBook(e.target.checked)}
            />
            <span>{t('export.splitByBook')}</span>
          </label>
          <button className="export-button" onClick={handleExport} disabled={exporting}>
            <FaDownload /> {exporting ? t('exporting') : t('export.button')}
          </button>
          {exportMsg && <div className="export-status">{exportMsg}</div>}
        </div>

      </div>
    </div>
  );
};

export default ExportPage;

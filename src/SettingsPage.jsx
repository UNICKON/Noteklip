import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBackupSnapshot, restoreBackupSnapshot, clearAllData } from './api';
import { useI18n } from './i18n';

const SettingsPage = () => {
  const { t } = useI18n();
  const importInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState('');
  const [resettingLayout, setResettingLayout] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const buildBackupFilename = () => {
    const safeStamp = new Date().toISOString().replace(/[.:]/g, '-');
    return `klip-backup-${safeStamp}.json`;
  };

  const triggerImportDialog = () => {
    if (importInputRef.current) {
      importInputRef.current.value = '';
      importInputRef.current.click();
    }
  };

  const handleBackupImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg('');
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const result = await restoreBackupSnapshot(payload, { mode: 'merge' });
      const inserted = typeof result.inserted === 'number' ? result.inserted : 0;
      const highlights = result.highlights ?? 0;
      const books = result.books ?? 0;
      const summary =
        inserted > 0
          ? t('settings.import.mergeSummary', { inserted, highlights, books })
          : t('settings.import.noNewSummary', { highlights, books });
      setImportMsg(t('settings.import.tip', { summary }));
    } catch (err) {
      console.error(err);
      setImportMsg(err.message || t('settings.import.fail'));
    } finally {
      setImporting(false);
    }
  };

  const handleBackupExport = async () => {
    setExporting(true);
    setExportMsg('');
    try {
      const snapshot = getBackupSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = buildBackupFilename();
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setExportMsg(t('settings.export.success'));
    } catch (err) {
      console.error(err);
      setExportMsg(err.message || t('settings.export.fail'));
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(t('settings.clear.confirm'));
    if (!confirmed) return;
    setClearing(true);
    setClearMsg('');
    try {
      await clearAllData();
      setClearMsg(t('settings.clear.success'));
    } catch (err) {
      console.error(err);
      setClearMsg(err.message || t('settings.clear.fail'));
    } finally {
      setClearing(false);
    }
  };

  const handleResetDashboardLayout = () => {
    setResettingLayout(true);
    setResetMsg('');
    try {
      const chartKey = 'klip.dashboard.chartCardOrder';
      const statKey = 'klip.dashboard.statCardOrder';
      window.localStorage.removeItem(chartKey);
      window.localStorage.removeItem(statKey);
      setResetMsg(t('settings.resetDashboard.success'));
    } catch (err) {
      console.error(err);
      setResetMsg(t('settings.resetDashboard.fail'));
    } finally {
      setResettingLayout(false);
    }
  };

  return (
    <div className="main-content settings-page">
      <div className="page-header">
        <div>
          <h1>{t('settings.title')}</h1>
          <p className="page-subtitle">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">{t('settings.section.backup')}</h2>
          <p className="settings-section__desc">{t('settings.section.backup.desc')}</p>
        </div>

        <div className="settings-grid">
          <section className="settings-card">
          <div className="settings-row">
            <div className="settings-row__text">
              <h2>{t('settings.import.title')}</h2>
              <p>{t('settings.import.desc')}</p>
            </div>
            <input
              type="file"
              ref={importInputRef}
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={handleBackupImport}
            />
            <div className="settings-actions">
              <button className="primary" onClick={triggerImportDialog} disabled={importing}>
                {importing ? t('settings.importing') : t('settings.import.button')}
              </button>
            </div>
          </div>
          {importMsg && <p className="settings-status">{importMsg}</p>}
          </section>

          <section className="settings-card">
          <div className="settings-row">
            <div className="settings-row__text">
              <h2>{t('settings.export.title')}</h2>
              <p>{t('settings.export.desc')}</p>
            </div>
            <div className="settings-actions">
              <button className="secondary" onClick={handleBackupExport} disabled={exporting}>
                {exporting ? t('settings.exporting') : t('settings.export.button')}
              </button>
            </div>
          </div>
          {exportMsg && <p className="settings-status">{exportMsg}</p>}
          <p className="settings-status">
            {t('settings.export.morePrefix')}
            <Link to="/export">{t('settings.export.moreLink')}</Link>
            {t('settings.export.moreSuffix')}
          </p>
          </section>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">{t('settings.section.system')}</h2>
          <p className="settings-section__desc">{t('settings.section.system.desc')}</p>
        </div>

        <div className="settings-grid">
          <section className="settings-card">
            <div className="settings-row">
              <div className="settings-row__text">
                <h2>{t('settings.resetDashboard.title')}</h2>
                <p>{t('settings.resetDashboard.desc')}</p>
              </div>
              <div className="settings-actions">
                <button className="secondary" onClick={handleResetDashboardLayout} disabled={resettingLayout}>
                  {resettingLayout ? t('settings.importing') : t('settings.resetDashboard.button')}
                </button>
              </div>
            </div>
            {resetMsg && <p className="settings-status">{resetMsg}</p>}
          </section>

          <section className="settings-card warning">
          <div className="settings-row">
            <div className="settings-row__text">
              <h2>{t('settings.clear.title')}</h2>
              <p>{t('settings.clear.desc')}</p>
            </div>
            <div className="settings-actions">
              <button className="danger" onClick={handleClearData} disabled={clearing}>
                {clearing ? t('settings.clearing') : t('settings.clear.button')}
              </button>
            </div>
          </div>
          {clearMsg && <p className="settings-status">{clearMsg}</p>}
          <p className="settings-status">{t('settings.clear.tip')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

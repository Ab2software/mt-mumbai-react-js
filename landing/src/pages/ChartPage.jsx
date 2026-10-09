import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = (function () {
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window === 'undefined') return 'http://localhost:5001/api';
  const host = window.location.hostname || '';
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return 'http://localhost:5001/api';
  }
  if (host.includes('airoapp.ai')) {
    return 'https://ww7ncvv5bk.c24.airoapp.ai/api';
  }
  return `${window.location.origin}/api`;
})();

const getApkLink = (link) => {
  if (!link || link === '#' || link.trim() === '') {
    return '/apk/gama-567.apk';
  }
  return link;
};

const ChartPage = () => {
  const [searchParams] = useSearchParams();
  const chartType = searchParams.get('type') || 'panel';
  const gameName = searchParams.get('game') || 'KALYAN';

  const [appName, setAppName] = useState('GAMA567');
  const [appLink, setAppLink] = useState('/apk/gama-567.apk');
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch Branding Info
    axios.get(`${API_BASE}/landing/info`)
      .then(res => {
        if (res.data && res.data.success === '1' && res.data.data) {
          if (res.data.data.app_name) setAppName(res.data.data.app_name);
          if (res.data.data.app_link) setAppLink(res.data.data.app_link);
        }
      })
      .catch(e => console.error(e));

    // Fetch Chart Data
    axios.get(`${API_BASE}/landing/chart/${chartType}/${encodeURIComponent(gameName)}`)
      .then(res => {
        if (res.data && res.data.success === '1' && res.data.weeks) {
          setWeeks(res.data.weeks);
        } else {
          setWeeks([]);
        }
      })
      .catch(err => {
        console.error('Error loading chart:', err);
        setError('Failed to load chart data');
      })
      .finally(() => setLoading(false));
  }, [chartType, gameName]);

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayKeys = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div>
      <header className="header">
        <div className="container navbar">
          <Link to="/" className="brand-logo">
            <img src="/img/logo.png" alt="Gama 567" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
          </Link>

          <div className="nav-actions">
            <Link to="/" className="btn btn-outline">🏠 Home</Link>
            <a href={getApkLink(appLink)} className="btn btn-gold" download="gama-567.apk">📲 Download App</a>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: '30px 16px' }}>
        <Link to="/" style={{ color: 'var(--text-gold)', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
          ← Back to Live Results
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-gold)', marginBottom: '8px' }}>
            {gameName} {chartType === 'panel' ? 'PANEL CHART' : 'JODI CHART'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Historical record from Monday to Sunday for {gameName}</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--primary-gold)', padding: '40px' }}>
            Loading chart records...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'var(--accent-red)', padding: '40px' }}>
            {error}
          </div>
        ) : weeks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            No historical chart records found for {gameName}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="chart-table">
              <thead>
                <tr>
                  <th>Date / Week</th>
                  {dayHeaders.map((h, i) => <th key={i}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {weeks.map((w, index) => (
                  <tr key={index}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{w.weekStart}</td>
                    {dayKeys.map(dKey => {
                      const item = w.days[dKey];
                      if (item) {
                        const jodi = item.jodi || '**';
                        const d1 = parseInt(jodi.charAt(0), 10);
                        const d2 = parseInt(jodi.charAt(1), 10);
                        const isRed = (d1 === d2) || (Math.abs(d1 - d2) === 5);

                        if (chartType === 'panel') {
                          return (
                            <td key={dKey}>
                              <span className="pana-text">{item.open_pana}</span>
                              <span className={`jodi-text ${isRed ? 'red-jodi' : ''}`}>{jodi}</span>
                              <span className="pana-text">{item.close_pana}</span>
                            </td>
                          );
                        } else {
                          return (
                            <td key={dKey}>
                              <span className={`jodi-text ${isRed ? 'red-jodi' : ''}`}>{jodi}</span>
                            </td>
                          );
                        }
                      } else {
                        return <td key={dKey}><span className="text-muted">***</span></td>;
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <Link to="/" className="btn btn-outline">🏠 Live Results</Link>
        <a href={getApkLink(appLink)} className="btn btn-gold" download="gama-567.apk">📲 Download APK</a>
      </div>
    </div>
  );
};

export default ChartPage;

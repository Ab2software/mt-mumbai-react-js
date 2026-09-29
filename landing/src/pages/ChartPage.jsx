import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = (function () {
  if (typeof window === 'undefined') return 'http://localhost:5001/api';
  const origin = window.location.origin || '';
  if (origin.includes(':5001')) {
    return '/api';
  }
  return 'http://localhost:5001/api';
})();

const ChartPage = () => {
  const [searchParams] = useSearchParams();
  const chartType = searchParams.get('type') || 'panel';
  const gameName = searchParams.get('game') || 'KALYAN';

  const [appName, setAppName] = useState('SHREE MATKA');
  const [appLink, setAppLink] = useState('#');
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
            <span className="brand-title">{appName}</span>
          </Link>

          <div className="nav-actions">
            <Link to="/" className="btn btn-outline">🏠 Home</Link>
            <a href={appLink} className="btn btn-gold" download>📲 Download App</a>
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
        <a href={appLink} className="btn btn-gold" download>📲 Download APK</a>
      </div>
    </div>
  );
};

export default ChartPage;

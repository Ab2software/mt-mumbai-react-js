import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const FALLBACK_MARKETS = [
  { id: 1, market_name: 'KALYAN', open_time: '03:45 PM', close_time: '05:45 PM', result_display: '***-**-***', is_declared_today: false },
  { id: 2, market_name: 'TIME BAZAR', open_time: '01:00 PM', close_time: '02:00 PM', result_display: '***-**-***', is_declared_today: false },
  { id: 3, market_name: 'MAIN BAZAR', open_time: '09:50 PM', close_time: '11:50 PM', result_display: '***-**-***', is_declared_today: false },
  { id: 4, market_name: 'RAJDHANI NIGHT', open_time: '09:30 PM', close_time: '11:40 PM', result_display: '***-**-***', is_declared_today: false },
  { id: 5, market_name: 'MILAN DAY', open_time: '02:05 PM', close_time: '05:00 PM', result_display: '***-**-***', is_declared_today: false },
  { id: 6, market_name: 'SUPREME NIGHT', open_time: '08:45 PM', close_time: '10:45 PM', result_display: '***-**-***', is_declared_today: false }
];

const getApkLink = (link) => {
  if (!link || link === '#' || link.trim() === '') {
    return '/apk/gama-567.apk';
  }
  return link;
};

const LandingHome = () => {
  const navigate = useNavigate();
  const [info, setInfo] = useState({
    app_name: 'GAMA567',
    app_link: '/apk/gama-567.apk',
    how_to_play: '#',
    mobile: '',
    wp_mobile: '',
    alert_message: "Welcome to India's No.1 Fastest Live Matka Result & Information Portal! Download our official app now.",
    rates: []
  });

  const [markets, setMarkets] = useState([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);

  // Fetch Landing Info
  const fetchInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE}/landing/info`);
      if (res.data && res.data.success === '1' && res.data.data) {
        setInfo(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (e) {
      console.error('Error fetching landing info:', e);
    }
  };

  // Fetch Markets
  const fetchMarkets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/landing/markets`);
      if (res.data && res.data.success === '1' && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setMarkets(res.data.data);
      } else {
        setMarkets(FALLBACK_MARKETS);
      }
    } catch (e) {
      console.error('Error fetching markets:', e);
      setMarkets(FALLBACK_MARKETS);
    } finally {
      setLoadingMarkets(false);
    }
  };

  useEffect(() => {
    fetchInfo();
    fetchMarkets();

    // 15-second real-time polling for live markets & notice bar
    const interval = setInterval(() => {
      fetchMarkets();
      fetchInfo();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Open Chart Modal
  const openChartModal = async (type, gameName) => {
    setModalTitle(`${gameName} - ${type === 'panel' ? 'Panel Chart' : 'Jodi Chart'}`);
    setModalContent(
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--primary-gold)' }}>
        Loading chart history for {gameName}...
      </div>
    );
    setModalOpen(true);

    try {
      const res = await axios.get(`${API_BASE}/landing/chart/${type}/${encodeURIComponent(gameName)}`);
      if (res.data && res.data.success === '1' && res.data.weeks && res.data.weeks.length > 0) {
        renderChartTable(type, res.data.weeks);
      } else {
        setModalContent(
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No historical chart data recorded for {gameName} yet.
          </div>
        );
      }
    } catch (err) {
      setModalContent(
        <div style={{ textAlign: 'center', color: 'var(--accent-red)', padding: '20px' }}>
          Failed to load chart.
        </div>
      );
    }
  };

  // Render Chart Table inside Modal
  const renderChartTable = (type, weeks) => {
    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayKeys = [1, 2, 3, 4, 5, 6, 0];

    setModalContent(
      <div style={{ overflowX: 'auto' }}>
        <table class="chart-table">
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

                    if (type === 'panel') {
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
    );
  };

  // Open How to Play Modal
  const openHowToPlayModal = () => {
    setModalTitle(`How to Play GAMA 567`);
    setModalContent(
      <div style={{ padding: '10px 0' }}>
        <h3 style={{ color: 'var(--primary-gold)', marginBottom: '12px' }}>Step-by-Step Guide:</h3>
        <ol style={{ marginLeft: '20px', color: 'var(--text-white)', lineHeight: '1.8' }}>
          <li><b>Download APK:</b> Click on the "Download App" button to install our official android application.</li>
          <li><b>Register Account:</b> Open the app, enter your name, mobile number, and create a secure PIN.</li>
          <li><b>Add Wallet Balance:</b> Deposit points securely using GPay, PhonePe, Paytm, or UPI.</li>
          <li><b>Select Market:</b> Choose your favourite market (Kalyan, Time Bazar, Main Bazar, etc.) and place your bids.</li>
          <li><b>Instant Withdrawal:</b> When you win, request withdrawal to get money directly in your bank account or UPI within minutes!</li>
        </ol>

        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <a href={getApkLink(info.app_link)} className="btn btn-gold btn-hero-lg" download="gama-567.apk">
            📲 Download App Now
          </a>
        </div>
      </div>
    );
    setModalOpen(true);
  };

  const wpUrl = info.wp_mobile ? `https://wa.me/${info.wp_mobile}?text=Hello%20GAMA%2056  7%20Support,%20I%20need%20help%20logging%20into%20my%20account.` : '#';

  const defaultRates = [
    { type: 'Single Digit', min_value: '10', max_value: '95' },
    { type: 'Jodi Digit', min_value: '10', max_value: '950' },
    { type: 'Single Panna', min_value: '10', max_value: '1400' },
    { type: 'Double Panna', min_value: '10', max_value: '2800' },
    { type: 'Triple Panna', min_value: '10', max_value: '7000' },
    { type: 'Half Sangam', min_value: '10', max_value: '10000' },
    { type: 'Full Sangam', min_value: '10', max_value: '100000' }
  ];

  const ratesList = (info.rates && info.rates.length > 0) ? info.rates : defaultRates;

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="container navbar">
          <Link to="/" className="brand-logo">
            <img src="/img/logo.png" alt="Gama 567" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
          </Link>

          <div className="nav-actions">
            <a href={wpUrl} className="btn btn-whatsapp" target="_blank" rel="noopener noreferrer">
              💬 WhatsApp
            </a>
            <a href={getApkLink(info.app_link)} className="btn btn-gold" download="gama-567.apk">
              📲 Download App
            </a>
          </div>
        </div>
      </header>

      {/* Notice Bar */}
      <div className="notice-bar">
        <div className="container notice-content">
          <span className="notice-tag">NOTICE</span>
          <div className="marquee">
            <p>{info.alert_message || "Welcome to India's No.1 Live Matka Result Portal! Download our official app now."}</p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="live-pulse">
            <span className="pulse-dot"></span> LIVE RESULTS & UPDATES
          </div>

          <h1 className="hero-title">Fastest Matka Live Results & Market Charts</h1>
          <p className="hero-subtitle">Check real-time declared open/close results, panel charts, jodi charts, and download the official android application with 24x7 instant withdrawals.</p>

          <div className="hero-cta-group">
            <a href={getApkLink(info.app_link)} className="btn btn-gold btn-hero-lg" download="gama-567.apk">
              📲 Download Official APK
            </a>
            <button
              onClick={() => {
                if (info.how_to_play && info.how_to_play.startsWith('http')) {
                  window.open(info.how_to_play, '_blank');
                } else {
                  openHowToPlayModal();
                }
              }}
              className="btn btn-outline btn-hero-lg"
            >
              ▶️ How to Play
            </button>
          </div>
        </div>
      </section>

      {/* Live Market Results Grid */}
      <section className="container">
        <div className="section-title-box">
          <h2 className="section-title">LIVE MARKET RESULTS</h2>
        </div>

        {loadingMarkets ? (
          <div style={{ textAlign: 'center', color: 'var(--primary-gold)', padding: '40px' }}>
            Loading Live Market Results...
          </div>
        ) : (
          <div className="markets-grid">
            {markets.map(m => (
              <div key={m.id || m.market_name} className="market-card">
                <div className="market-name">{m.market_name}</div>
                <div className="market-timing">
                  <span>Open: <b>{m.open_time || '--'}</b></span>
                  <span>Close: <b>{m.close_time || '--'}</b></span>
                </div>

                <div className="result-box">
                  <div className="result-number">{m.result_display || '***-**-***'}</div>
                </div>

                <div className="market-card-actions">
                  <button
                    className="btn btn-chart btn-panel"
                    onClick={() => openChartModal('panel', m.market_name)}
                  >
                    📊 Panel Chart
                  </button>
                  <button
                    className="btn btn-chart btn-jodi"
                    onClick={() => openChartModal('jodi', m.market_name)}
                  >
                    📈 Jodi Chart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Game Payout Rates Section */}
      <section className="container">
        <div className="section-title-box">
          <h2 className="section-title">GAME PAYOUT RATES</h2>
        </div>

        <div className="rates-grid">
          {ratesList.map((r, i) => (
            <div key={i} className="rate-card">
              <div className="rate-type">{r.type || r.game_name}</div>
              <div className="rate-value">{r.min_value || 10} KA {r.max_value || 95}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How to Play Section */}
      <section className="container">
        <div className="section-title-box">
          <h2 className="section-title">HOW TO PLAY ON MOBILE</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-title">Download APK</div>
            <div className="step-desc">Click on the Download App button to install the official Android App.</div>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-title">Register & Login</div>
            <div className="step-desc">Enter your mobile number and set up your secure account password & MPIN.</div>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-title">Add Funds</div>
            <div className="step-desc">Deposit points using UPI, PhonePe, GooglePay, or Paytm instantly.</div>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-title">Play & Win</div>
            <div className="step-desc">Select your favourite market, place bids, and get instant 24x7 bank withdrawals!</div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            <h3 style={{ color: 'var(--primary-gold)', marginBottom: '15px' }}>{modalTitle}</h3>
            {modalContent}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Bar */}
      <div className="bottom-nav">
        <a href={wpUrl} className="btn btn-whatsapp" target="_blank" rel="noopener noreferrer">
          💬 WhatsApp Support
        </a>
        <a href={getApkLink(info.app_link)} className="btn btn-gold" download="gama-567.apk">
          📲 Download APK
        </a>
      </div>
    </div>
  );
};

export default LandingHome;

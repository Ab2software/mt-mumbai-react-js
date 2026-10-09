/* ==========================================================================
   Shree Matka / Pravesh Information Landing Page Application Logic
   Handles dynamic data binding from backend API, real-time live results polling,
   dynamic chart modal rendering, and admin link synchronization.
   ========================================================================== */

(function () {
  'use strict';

  // Base API configuration (targets backend server port 5001 or relative /api)
  const API_BASE = (function () {
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

  // State
  let appState = {
    appName: 'GAMA567',
    appLink: '#',
    howToPlayLink: '#',
    mobile: '',
    wpMobile: '',
    alertMessage: 'Welcome to India\'s No.1 Live Matka Result Portal!',
    markets: [],
    rates: []
  };

  // Default Fallback Markets if backend is unreachable
  const FALLBACK_MARKETS = [
    { id: 1, market_name: 'KALYAN', open_time: '03:45 PM', close_time: '05:45 PM', result_display: '***-**-***', is_declared_today: false },
    { id: 2, market_name: 'TIME BAZAR', open_time: '01:00 PM', close_time: '02:00 PM', result_display: '***-**-***', is_declared_today: false },
    { id: 3, market_name: 'MAIN BAZAR', open_time: '09:50 PM', close_time: '11:50 PM', result_display: '***-**-***', is_declared_today: false },
    { id: 4, market_name: 'RAJDHANI NIGHT', open_time: '09:30 PM', close_time: '11:40 PM', result_display: '***-**-***', is_declared_today: false },
    { id: 5, market_name: 'MILAN DAY', open_time: '02:05 PM', close_time: '05:00 PM', result_display: '***-**-***', is_declared_today: false },
    { id: 6, market_name: 'SUPREME NIGHT', open_time: '08:45 PM', close_time: '10:45 PM', result_display: '***-**-***', is_declared_today: false }
  ];

  // DOM Elements
  const elements = {
    brandTitle: document.getElementById('brandTitle'),
    noticeText: document.getElementById('noticeText'),
    apkDownloadBtnHeader: document.getElementById('apkDownloadBtnHeader'),
    apkDownloadBtnHero: document.getElementById('apkDownloadBtnHero'),
    apkDownloadBtnBottom: document.getElementById('apkDownloadBtnBottom'),
    howToPlayBtnHero: document.getElementById('howToPlayBtnHero'),
    wpBtnHeader: document.getElementById('wpBtnHeader'),
    wpBtnBottom: document.getElementById('wpBtnBottom'),
    marketsGrid: document.getElementById('marketsGrid'),
    ratesGrid: document.getElementById('ratesGrid'),
    chartModal: document.getElementById('chartModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose')
  };

  // 1. Fetch Landing Info (App Link, How to Play, Notice, Contacts, Rates)
  async function fetchLandingInfo() {
    try {
      const res = await fetch(`${API_BASE}/landing/info`);
      const data = await res.json();

      if (data.success === '1' && data.data) {
        const info = data.data;
        appState.appName = info.app_name || 'GAMA567';
        const rawLink = info.app_link;
        appState.appLink = (rawLink && rawLink !== '#' && rawLink.trim() !== '') ? rawLink : '/apk/gama-567.apk';
        appState.howToPlayLink = info.how_to_play || '#';
        appState.mobile = info.mobile || '';
        appState.wpMobile = info.wp_mobile || info.mobile || '';
        appState.alertMessage = info.alert_message || '';
        appState.rates = info.rates || [];

        // Bind data to DOM
        if (elements.brandTitle) elements.brandTitle.innerText = appState.appName;
        if (elements.noticeText && appState.alertMessage) elements.noticeText.innerText = appState.alertMessage;

        // APK Download Links
        [elements.apkDownloadBtnHeader, elements.apkDownloadBtnHero, elements.apkDownloadBtnBottom].forEach(btn => {
          if (btn) {
            btn.href = appState.appLink;
            btn.setAttribute('download', 'gama-567.apk');
          }
        });

        // How to play button
        if (elements.howToPlayBtnHero) {
          elements.howToPlayBtnHero.onclick = (e) => {
            e.preventDefault();
            if (appState.howToPlayLink && appState.howToPlayLink.startsWith('http')) {
              window.open(appState.howToPlayLink, '_blank');
            } else {
              openHowToPlayModal();
            }
          };
        }

        // WhatsApp Support Links
        const wpUrl = appState.wpMobile ? `https://wa.me/${appState.wpMobile}?text=Hello%20${encodeURIComponent(appState.appName)}%20Team` : '#';
        [elements.wpBtnHeader, elements.wpBtnBottom].forEach(btn => {
          if (btn) btn.href = wpUrl;
        });

        // Render Rates
        renderRates(appState.rates);
      }
    } catch (err) {
      console.error('Error fetching landing info:', err);
      renderRates([]);
    }
  }

  // 2. Fetch Markets & Live Results
  async function fetchMarkets() {
    try {
      const res = await fetch(`${API_BASE}/landing/markets`);
      const data = await res.json();

      if (data.success === '1' && Array.isArray(data.data) && data.data.length > 0) {
        appState.markets = data.data;
        renderMarkets(appState.markets);
      } else {
        renderMarkets(FALLBACK_MARKETS);
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
      renderMarkets(FALLBACK_MARKETS);
    }
  }

  // Render Markets Grid Cards
  function renderMarkets(markets) {
    if (!elements.marketsGrid) return;

    if (!markets || markets.length === 0) {
      markets = FALLBACK_MARKETS;
    }

    elements.marketsGrid.innerHTML = markets.map(m => {
      const isLive = m.is_declared_today;
      return `
        <div class="market-card">
          <div class="market-name">${escapeHtml(m.market_name)}</div>
          <div class="market-timing">
            <span>Open: <b>${escapeHtml(m.open_time || '--')}</b></span>
            <span>Close: <b>${escapeHtml(m.close_time || '--')}</b></span>
          </div>

          <div class="result-box">
            <div class="result-number">${escapeHtml(m.result_display || '***-**-***')}</div>
          </div>

          <div class="market-card-actions">
            <button class="btn btn-chart btn-panel" onclick="openChartModal('panel', '${escapeJsStr(m.market_name)}')">
              📊 Panel Chart
            </button>
            <button class="btn btn-chart btn-jodi" onclick="openChartModal('jodi', '${escapeJsStr(m.market_name)}')">
              📈 Jodi Chart
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Rates
  function renderRates(rates) {
    if (!elements.ratesGrid) return;
    if (!rates || rates.length === 0) {
      rates = [
        { type: 'Single Digit', min_value: '10', max_value: '95' },
        { type: 'Jodi Digit', min_value: '10', max_value: '950' },
        { type: 'Single Panna', min_value: '10', max_value: '1400' },
        { type: 'Double Panna', min_value: '10', max_value: '2800' },
        { type: 'Triple Panna', min_value: '10', max_value: '7000' },
        { type: 'Half Sangam', min_value: '10', max_value: '10000' },
        { type: 'Full Sangam', min_value: '10', max_value: '100000' }
      ];
    }

    elements.ratesGrid.innerHTML = rates.map(r => `
      <div class="rate-card">
        <div class="rate-type">${escapeHtml(r.type || r.game_name)}</div>
        <div class="rate-value">${r.min_value || 10} KA ${r.max_value || 95}</div>
      </div>
    `).join('');
  }

  // Open Chart Modal (Panel or Jodi)
  window.openChartModal = async function (type, gameName) {
    if (!elements.chartModal) return;

    elements.modalTitle.innerText = `${gameName} - ${type === 'panel' ? 'Panel Chart' : 'Jodi Chart'}`;
    elements.modalBody.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--primary-gold);">
        Loading chart history for ${escapeHtml(gameName)}...
      </div>
    `;
    elements.chartModal.style.display = 'flex';

    try {
      const res = await fetch(`${API_BASE}/landing/chart/${type}/${encodeURIComponent(gameName)}`);
      const data = await res.json();

      if (data.success === '1' && data.weeks && data.weeks.length > 0) {
        renderChartTable(type, data.weeks);
      } else {
        elements.modalBody.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            No historical chart data recorded for ${escapeHtml(gameName)} yet.
          </div>
        `;
      }
    } catch (err) {
      console.error('Error fetching chart modal:', err);
      elements.modalBody.innerHTML = `<div style="text-align:center; color: var(--accent-red); padding: 20px;">Failed to load chart.</div>`;
    }
  };

  // Render Weekwise Chart Table
  function renderChartTable(type, weeks) {
    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayKeys = [1, 2, 3, 4, 5, 6, 0];

    let tableHtml = `
      <table class="chart-table">
        <thead>
          <tr>
            <th>Date / Week</th>
            ${dayHeaders.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    weeks.forEach(w => {
      tableHtml += `
        <tr>
          <td style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold;">${w.weekStart}</td>
      `;

      dayKeys.forEach(dKey => {
        const item = w.days[dKey];
        if (item) {
          const jodiVal = item.jodi || '**';
          const isRed = isRedJodi(jodiVal);

          if (type === 'panel') {
            tableHtml += `
              <td>
                <span class="pana-text">${item.open_pana}</span>
                <span class="jodi-text ${isRed ? 'red-jodi' : ''}">${jodiVal}</span>
                <span class="pana-text">${item.close_pana}</span>
              </td>
            `;
          } else {
            tableHtml += `
              <td>
                <span class="jodi-text ${isRed ? 'red-jodi' : ''}">${jodiVal}</span>
              </td>
            `;
          }
        } else {
          tableHtml += `<td><span class="text-muted">***</span></td>`;
        }
      });

      tableHtml += `</tr>`;
    });

    tableHtml += `
        </tbody>
      </table>
    `;

    elements.modalBody.innerHTML = tableHtml;
  }

  // Red Jodi Evaluator
  function isRedJodi(jodi) {
    if (!jodi || jodi.length !== 2 || jodi.includes('*')) return false;
    const d1 = parseInt(jodi.charAt(0), 10);
    const d2 = parseInt(jodi.charAt(1), 10);
    if (isNaN(d1) || isNaN(d2)) return false;
    if (d1 === d2) return true;
    if (Math.abs(d1 - d2) === 5) return true;
    return false;
  }

  // How to Play Modal
  function openHowToPlayModal() {
    if (!elements.chartModal) return;
    elements.modalTitle.innerText = `How to Play ${appState.appName}`;
    elements.modalBody.innerHTML = `
      <div style="padding: 10px 0;">
        <h3 style="color: var(--primary-gold); margin-bottom: 12px;">Step-by-Step Guide:</h3>
        <ol style="margin-left: 20px; color: var(--text-white); line-height: 1.8;">
          <li><b>Download APK:</b> Click on the "Download App" button to install our official android application.</li>
          <li><b>Register Account:</b> Open the app, enter your name, mobile number, and create a secure PIN.</li>
          <li><b>Add Wallet Balance:</b> Deposit points securely using GPay, PhonePe, Paytm, or UPI.</li>
          <li><b>Select Market:</b> Choose your favourite market (Kalyan, Time Bazar, Main Bazar, etc.) and place your bids.</li>
          <li><b>Instant Withdrawal:</b> When you win, request withdrawal to get money directly in your bank account or UPI within minutes!</li>
        </ol>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${appState.appLink}" class="btn btn-gold btn-hero-lg">
            📲 Download App Now
          </a>
        </div>
      </div>
    `;
    elements.chartModal.style.display = 'flex';
  }

  // Close Modal listener
  if (elements.modalClose) {
    elements.modalClose.onclick = () => {
      elements.chartModal.style.display = 'none';
    };
  }

  window.onclick = function (event) {
    if (event.target === elements.chartModal) {
      elements.chartModal.style.display = 'none';
    }
  };

  // Helpers
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeJsStr(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'");
  }

  // Initialize
  function init() {
    fetchLandingInfo();
    fetchMarkets();

    // Auto poll live results every 15 seconds for real-time result declarations
    setInterval(fetchMarkets, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

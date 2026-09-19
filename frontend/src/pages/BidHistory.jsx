import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Calendar, Filter, History } from 'lucide-react';
import api from '../utils/api';

const BidHistory = () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [history, setHistory] = useState([]);
  const [wallet, setWallet] = useState('0');
  const [loading, setLoading] = useState(true);

  const getBidDetail = (item) => {
    const g = item.game_type;
    const s = item.session;
    const t = [];

    if (g === 'Single Pana' && s === 'Open' && item.open_pana) t.push(`Open Pana: ${item.open_pana}`);
    if (g === 'Single Pana' && s === 'Close' && item.close_pana) t.push(`Close Pana: ${item.close_pana}`);
    if (g === 'Single Digit' && s === 'Open' && item.open_digit) t.push(`Open Digit: ${item.open_digit}`);
    if (g === 'Single Digit' && s === 'Close' && item.close_digit) t.push(`Close Digit: ${item.close_digit}`);
    if (g === 'Jodi Digit' || g === 'Jodi') t.push(`Open: ${item.open_digit || '-'}, Close: ${item.close_digit || '-'}`);
    if (g === 'Double Pana' && s === 'Open' && item.open_pana) t.push(`Open Pana: ${item.open_pana}`);
    if (g === 'Double Pana' && s === 'Close' && item.close_pana) t.push(`Close Pana: ${item.close_pana}`);
    if (g === 'Triple Pana' && s === 'Open' && item.open_pana) t.push(`Open Pana: ${item.open_pana}`);
    if (g === 'Triple Pana' && s === 'Close' && item.close_pana) t.push(`Close Pana: ${item.close_pana}`);
    if (g === 'Half Sangam') {
      const hs = [];
      if (item.open_pana && item.open_pana !== 'NA') hs.push(`Open Pana: ${item.open_pana}`);
      if (item.close_digit && item.close_digit !== 'NA') hs.push(`Close Digit: ${item.close_digit}`);
      if (hs.length) t.push(hs.join(' | '));
    }
    if (g === 'Full Sangam') t.push(`Open: ${item.open_pana || '-'}, Close: ${item.close_pana || '-'}`);
    if (g === 'SP Motor' || g === 'DP Motor') {
      const m = [];
      if (item.open_pana && item.open_pana !== 'NA') m.push(`Open Pana: ${item.open_pana}`);
      if (item.close_digit && item.close_digit !== 'NA') m.push(`Close Digit: ${item.close_digit}`);
      if (item.close_pana && item.close_pana !== 'NA') m.push(`Close Pana: ${item.close_pana}`);
      if (item.open_digit && item.open_digit !== 'NA') m.push(`Open Digit: ${item.open_digit}`);
      if (m.length) t.push(m.join(' | '));
    }

    return t.length ? t.join(' • ') : (g && s ? `${g} (${s})` : '');
  };

  const fetchHistory = async (d1 = fromDate, d2 = toDate) => {
    setLoading(true);
    try {
      const [bidRes, walRes] = await Promise.all([
        api.get(`/games/bid-history?date1=${d1}&date2=${d2}`),
        api.get('/wallet/info')
      ]);

      if (bidRes.data.success === '1') {
        setHistory(bidRes.data.result || bidRes.data.data || []);
      }
      if (walRes.data.success === '1') {
        setWallet(walRes.data.data?.wallet || '0');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleApply = (e) => {
    e.preventDefault();
    fetchHistory(fromDate, toDate);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 32px' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--app-gradient-primary, linear-gradient(135deg, #d6be66 0%, #10b981 100%))',
        padding: '12px 18px',
        borderRadius: '14px',
        marginBottom: '20px',
        color: '#0b1a30',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#0b1a30' }}>
            <ArrowLeft size={20} />
          </Link>
          <span style={{ fontWeight: '800', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Bidding History</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '0.95rem' }}>
          <Wallet size={18} />
          <span>₹ {wallet}</span>
        </div>
      </div>

      {/* Date Filter Box */}
      <div className="card-glass-v2" style={{ marginBottom: '20px', padding: '18px' }}>
        <form onSubmit={handleApply}>
          {/* Quick Date Range Presets */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Quick Presets
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const t = new Date().toISOString().slice(0, 10);
                  setFromDate(t);
                  setToDate(t);
                  fetchHistory(t, t);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(214,190,102,0.3)',
                  background: fromDate === todayStr && toDate === todayStr ? 'var(--color-gold, #d6be66)' : 'rgba(255,255,255,0.06)',
                  color: fromDate === todayStr && toDate === todayStr ? '#0b1a30' : '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => {
                  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                  setFromDate(y);
                  setToDate(y);
                  fetchHistory(y, y);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Yesterday
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  const firstDay = new Date(d.setDate(d.getDate() - d.getDay())).toISOString().slice(0, 10);
                  const today = new Date().toISOString().slice(0, 10);
                  setFromDate(firstDay);
                  setToDate(today);
                  fetchHistory(firstDay, today);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                This Week
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
                  const today = new Date().toISOString().slice(0, 10);
                  setFromDate(firstDay);
                  setToDate(today);
                  fetchHistory(firstDay, today);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                This Month
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                <Calendar size={14} /> From Date
              </label>
              <input
                type="date"
                className="form-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.88rem' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                <Calendar size={14} /> To Date
              </label>
              <input
                type="date"
                className="form-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              className="btn-gold"
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.88rem'
              }}
            >
              <Filter size={15} /> Apply Filter
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date().toISOString().slice(0, 10);
                setFromDate(t);
                setToDate(t);
                fetchHistory(t, t);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
        <History size={18} style={{ color: 'var(--color-gold, #d6be66)' }} />
        <h4 style={{ color: 'var(--color-gold, #d6be66)', fontWeight: '800', fontSize: '1rem', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
          Recent Bidding Records
        </h4>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>Loading bid history...</div>
      ) : history.length === 0 ? (
        <div className="card-glass-v2" style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.6)' }}>
          No bid history found for selected date range.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item, idx) => {
            const detail = getBidDetail(item);
            return (
              <div
                key={item.id || idx}
                className="card-glass-v2"
                style={{ padding: '16px', borderLeft: '4px solid var(--color-gold, #d6be66)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '10px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>
                    {item.game_name || '-'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {item.date || '-'} {item.time ? `• ${item.time}` : ''}
                    </span>
                    <span className="badge-open-v2" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {item.session || '-'}
                    </span>
                  </div>
                </div>

                {detail && (
                  <div style={{
                    fontSize: '0.82rem',
                    color: 'var(--color-gold, #d6be66)',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontWeight: '600'
                  }}>
                    {detail}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '500' }}>
                    {item.game_type || '-'}
                  </span>
                  <span style={{
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    color: 'var(--color-gold, #d6be66)',
                    padding: '4px 12px',
                    background: 'rgba(214, 190, 102, 0.15)',
                    borderRadius: '8px',
                    border: '1px solid rgba(214, 190, 102, 0.3)'
                  }}>
                    {item.points_action || '0'} Points
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BidHistory;

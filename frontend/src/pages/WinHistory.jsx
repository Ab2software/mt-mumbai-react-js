import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Calendar, Filter, Trophy, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

const getOneWeekAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
};
const getTodayStr = () => new Date().toISOString().slice(0, 10);

const WinHistory = () => {
  const [fromDate, setFromDate] = useState(getOneWeekAgoStr());
  const [toDate, setToDate] = useState(getTodayStr());
  const [history, setHistory] = useState([]);
  const [wallet, setWallet] = useState('0');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (d1 = fromDate, d2 = toDate) => {
    setLoading(true);
    try {
      const [winRes, walRes] = await Promise.all([
        api.get(`/games/win-history?date1=${d1}&date2=${d2}`),
        api.get('/wallet/info')
      ]);

      if (winRes.data.success === '1') {
        setHistory(winRes.data.result || winRes.data.data || []);
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
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '16px 14px' }}>
      {/* Top Header */}
      <div className="card-glass-v2" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        marginBottom: '18px',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
            <ArrowLeft size={20} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} style={{ color: 'var(--color-gold)' }} />
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>Winning History</span>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'rgba(214, 190, 102, 0.15)',
          border: '1px solid rgba(214, 190, 102, 0.3)',
          borderRadius: '20px',
          fontWeight: '700',
          fontSize: '0.88rem',
          color: 'var(--color-gold)'
        }}>
          <Wallet size={16} />
          <span>₹ {wallet}</span>
        </div>
      </div>

      {/* Date Filter Box */}
      <div className="card-glass-v2" style={{ padding: '18px', marginBottom: '20px', borderRadius: '16px' }}>
        <form onSubmit={handleApply}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--color-gold)' }} />
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--color-gold)' }} />
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-gradient"
            style={{
              width: '100%',
              padding: '11px',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Filter size={16} />
            Apply Filter
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.5px', marginBottom: '14px' }}>
        Recent Winning Records
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.7)' }}>Loading winning records...</div>
      ) : history.length === 0 ? (
        <div className="card-glass-v2" style={{
          borderRadius: '16px',
          padding: '36px 20px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <Trophy size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <div>No winning records found in this date range.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item, idx) => {
            const digitsPana = [
              item.close_digit && item.close_digit !== 'N/A' && item.close_digit !== 'NA' ? `CD: ${item.close_digit}` : '',
              item.close_pana && item.close_pana !== 'N/A' && item.close_pana !== 'NA' ? `CP: ${item.close_pana}` : '',
              item.open_digit && item.open_digit !== 'N/A' && item.open_digit !== 'NA' ? `OD: ${item.open_digit}` : '',
              item.open_pana && item.open_pana !== 'N/A' && item.open_pana !== 'NA' ? `OP: ${item.open_pana}` : ''
            ].filter(Boolean).join(' | ');

            return (
              <div
                key={item.id || idx}
                className="card-glass-v2"
                style={{
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: '4px solid #10b981'
                }}
              >
                {/* Left: Won Points */}
                <div style={{ minWidth: '90px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.72rem', color: '#10b981', textTransform: 'uppercase', fontWeight: '700' }}>Won</span>
                  </div>
                  <h4 style={{ margin: '2px 0 0 0', color: '#10b981', fontWeight: '800', fontSize: '1.25rem' }}>
                    +₹{item.winning_points || '0'}
                  </h4>
                </div>

                {/* Center: Bid ID & Session */}
                <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '0.88rem', color: '#fff' }}>
                    Bid #{item.bid_id || idx + 1}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'var(--color-gold)',
                    border: '1px solid rgba(214,190,102,0.2)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    marginTop: '4px'
                  }}>
                    {item.session || 'Open'}
                  </span>
                </div>

                {/* Right: Game Name, Type, and Bid Action */}
                <div style={{ textAlign: 'right', minWidth: '110px' }}>
                  <p style={{ margin: 0, fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                    {item.game_name}
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '0.78rem', color: 'var(--color-gold)', fontWeight: '600' }}>
                    {item.game_type}
                  </p>
                  {digitsPana && (
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                      {digitsPana}
                    </p>
                  )}
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    Bet: ₹{item.points_action || '0'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.15)',
  backgroundColor: 'rgba(0,0,0,0.25)',
  fontSize: '0.88rem',
  color: '#ffffff',
  boxSizing: 'border-box',
  outline: 'none'
};

export default WinHistory;


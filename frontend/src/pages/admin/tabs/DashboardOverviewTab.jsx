import React, { useState } from 'react';
import { Users, UserX, UserCheck, Gamepad2, TrendingUp, Wallet, Eye } from 'lucide-react';
import api from '../../../utils/api';

const DashboardOverviewTab = ({
  metrics,
  games,
  selectedGameForMarket,
  setSelectedGameForMarket,
  marketBidAmount,
  setMarketBidAmount,
  ankGameName,
  setAnkGameName,
  ankMarketStatus,
  setAnkMarketStatus,
  ankDate,
  setAnkDate,
  ankBids,
  setAnkBids
}) => {
  const [ankLoading, setAnkLoading] = useState(false);

  const fetchAnkBids = async () => {
    if (!ankGameName) return;
    setAnkLoading(true);
    try {
      const res = await api.get('/admin/single-ank-bids', {
        params: {
          game_name: ankGameName,
          market_status: ankMarketStatus,
          date: ankDate
        }
      });
      if (res.data.success === '1') {
        setAnkBids(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnkLoading(false);
    }
  };

  return (
    <div>
      {/* Metrics Row (6 Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Users */}
        <div style={metricCardStyle('#556ee6')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={cardLabelStyle}>Total Users</p>
              <h3 style={cardValueStyle}>{metrics.total_users || 0}</h3>
            </div>
            <div style={iconBoxStyle('rgba(85,110,230,0.15)', '#556ee6')}>
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Unapproved Users */}
        <div style={metricCardStyle('#f59e0b')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={cardLabelStyle}>Unapproved Users</p>
              <h3 style={cardValueStyle}>{metrics.unapproved_users || 0}</h3>
            </div>
            <div style={iconBoxStyle('rgba(245,158,11,0.15)', '#f59e0b')}>
              <UserX size={22} />
            </div>
          </div>
        </div>

        {/* Approved Users */}
        <div style={metricCardStyle('#10b981')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={cardLabelStyle}>Approved Users</p>
              <h3 style={cardValueStyle}>{metrics.approved_users || 0}</h3>
            </div>
            <div style={iconBoxStyle('rgba(16,185,129,0.15)', '#10b981')}>
              <UserCheck size={22} />
            </div>
          </div>
        </div>

        {/* Total Games */}
        <div style={metricCardStyle('#3b82f6')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={cardLabelStyle}>Total Games</p>
              <h3 style={cardValueStyle}>{metrics.total_games || 0}</h3>
            </div>
            <div style={iconBoxStyle('rgba(59,130,246,0.15)', '#3b82f6')}>
              <Gamepad2 size={22} />
            </div>
          </div>
        </div>

        {/* Today's Total Bids */}
        <div style={metricCardStyle('#8b5cf6')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={cardLabelStyle}>Today Bid Amount</p>
              <h3 style={cardValueStyle}>₹ {metrics.today_bid_amount || 0}</h3>
            </div>
            <div style={iconBoxStyle('rgba(139,92,246,0.15)', '#8b5cf6')}>
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        {/* Admin Wallet Balance */}
        <div style={metricCardStyle('#ec4899')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={cardLabelStyle}>Admin Wallet Coins</p>
              <h3 style={cardValueStyle}>{metrics.admin_wallet || 0}</h3>
            </div>
            <div style={iconBoxStyle('rgba(236,72,153,0.15)', '#ec4899')}>
              <Wallet size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Market Bid Amount Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
        border: '1px solid #edf2f7',
        marginBottom: '24px'
      }}>
        <h5 style={{ margin: '0 0 16px 0', color: '#2d3748', fontWeight: '700' }}>Select Game Market Total Bid</h5>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedGameForMarket}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedGameForMarket(val);
              if (val) {
                const g = games.find(item => item.game_name === val);
                setMarketBidAmount(g ? (g.total_bid || 0) : 0);
              } else {
                setMarketBidAmount('N/A');
              }
            }}
            style={{
              flex: '1 1 300px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e0',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          >
            <option value="">-- Select Game Name --</option>
            {games.map(g => (
              <option key={g.id || g.game_name} value={g.game_name}>{g.game_name}</option>
            ))}
          </select>
          <div style={{
            padding: '10px 20px',
            backgroundColor: '#f7fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontWeight: '700',
            fontSize: '1rem',
            color: '#556ee6'
          }}>
            Total Bid: ₹ {marketBidAmount}
          </div>
        </div>
      </div>

      {/* 10 Single Ank Cards Section */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
        border: '1px solid #edf2f7'
      }}>
        <h5 style={{ margin: '0 0 16px 0', color: '#2d3748', fontWeight: '700' }}>10 Single Ank Bid Breakdown</h5>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <select
            value={ankGameName}
            onChange={(e) => setAnkGameName(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
          >
            <option value="">Select Game</option>
            {games.map(g => (
              <option key={g.id || g.game_name} value={g.game_name}>{g.game_name}</option>
            ))}
          </select>

          <select
            value={ankMarketStatus}
            onChange={(e) => setAnkMarketStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
          >
            <option value="open_digit">Open Digit</option>
            <option value="close_digit">Close Digit</option>
          </select>

          <input
            type="date"
            value={ankDate}
            onChange={(e) => setAnkDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
          />

          <button
            type="button"
            onClick={fetchAnkBids}
            disabled={ankLoading}
            style={{
              padding: '8px 18px',
              backgroundColor: '#556ee6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {ankLoading ? 'Loading...' : 'Get Ank Breakdown'}
          </button>
        </div>

        {/* 10 Ank Cards Display */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(ank => (
            <div key={ank} style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#556ee6', marginBottom: '4px' }}>
                Ank: {ank}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                Bids: {ankBids[ank]?.bids || 0}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2d3748', marginTop: '2px' }}>
                ₹ {ankBids[ank]?.amount || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const metricCardStyle = (accentColor) => ({
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
  border: '1px solid #edf2f7',
  borderTop: `4px solid ${accentColor}`
});

const cardLabelStyle = {
  fontSize: '0.82rem',
  color: '#718096',
  fontWeight: '600',
  margin: '0 0 6px 0',
  textTransform: 'uppercase'
};

const cardValueStyle = {
  fontSize: '1.35rem',
  color: '#2d3748',
  fontWeight: '800',
  margin: 0
};

const iconBoxStyle = (bgColor, color) => ({
  width: '44px',
  height: '44px',
  borderRadius: '10px',
  backgroundColor: bgColor,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

export default DashboardOverviewTab;

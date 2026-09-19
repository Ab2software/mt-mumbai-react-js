import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Coins, Award } from 'lucide-react';
import api from '../utils/api';

const GameRate = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    try {
      const res = await api.get('/games/rates');
      if (res.data.success === '1') {
        setRates(res.data.data || res.data.result || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '16px 14px' }}>
      {/* Top Header */}
      <div className="card-glass-v2" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        marginBottom: '20px',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
            <ArrowLeft size={20} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: 'var(--color-gold)' }} />
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>Game Payout Rates</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.7)' }}>Loading game rates...</div>
      ) : rates.length === 0 ? (
        <div className="card-glass-v2" style={{
          borderRadius: '16px',
          padding: '36px 20px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <Coins size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <div>No game rates available at the moment.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rates.map((item, idx) => (
            <div
              key={item.id || idx}
              className="card-glass-v2"
              style={{
                borderRadius: '16px',
                padding: '16px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: '4px solid var(--color-gold)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(214, 190, 102, 0.15)',
                  border: '1px solid rgba(214, 190, 102, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-gold)'
                }}>
                  <Award size={22} />
                </div>
                <div>
                  <h5 style={{ margin: 0, fontWeight: '800', color: '#fff', fontSize: '1.05rem' }}>
                    {item.type}
                  </h5>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    Standard Market Payout
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  backgroundColor: 'rgba(214, 190, 102, 0.18)',
                  border: '1px solid rgba(214, 190, 102, 0.4)',
                  color: 'var(--color-gold)',
                  padding: '7px 16px',
                  borderRadius: '20px',
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  display: 'inline-block',
                  boxShadow: '0 2px 10px rgba(214,190,102,0.1)'
                }}>
                  ₹ {item.min_value || '0'} - ₹ {item.max_value || '0'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameRate;


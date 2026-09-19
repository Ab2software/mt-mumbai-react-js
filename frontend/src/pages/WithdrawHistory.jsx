import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet, PlusCircle, CheckCircle2, XCircle, Clock, ArrowUpRight } from 'lucide-react';
import api from '../utils/api';

const WithdrawHistory = () => {
  const [history, setHistory] = useState([]);
  const [wallet, setWallet] = useState('0');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const [histRes, walRes] = await Promise.all([
        api.get('/wallet/withdraw-history'),
        api.get('/wallet/info')
      ]);

      if (histRes.data.success === '1') {
        setHistory(histRes.data.result || histRes.data.data || []);
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
            <ArrowUpRight size={20} style={{ color: 'var(--color-gold)' }} />
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>Withdraw History</span>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.85rem' }}>
          Your withdrawal requests & approval status
        </p>
        <Link
          to="/withdraw"
          className="btn-gradient"
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '700',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <PlusCircle size={14} /> Request Withdraw
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.7)' }}>Loading withdraw requests...</div>
      ) : history.length === 0 ? (
        <div className="card-glass-v2" style={{
          borderRadius: '16px',
          padding: '36px 20px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <Clock size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p style={{ marginBottom: '14px', fontSize: '0.9rem' }}>No withdrawal requests found.</p>
          <Link
            to="/withdraw"
            className="btn-gradient"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              fontWeight: '700',
              textDecoration: 'none',
              fontSize: '0.88rem'
            }}
          >
            <PlusCircle size={16} /> Submit Withdraw Request
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((item, idx) => {
            const isApproved = item.status === '1';
            const isRejected = item.status === '-1';
            const statusLabel = isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING';
            const statusColor = isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b';
            const StatusIcon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock;

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
                  borderLeft: `4px solid ${statusColor}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `${statusColor}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: statusColor
                  }}>
                    <StatusIcon size={20} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                      {item.remark || 'Withdrawal'}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                      {item.date}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      color: statusColor,
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px'
                    }}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <h5 style={{ margin: 0, color: 'var(--color-gold)', fontWeight: '800', fontSize: '1.15rem' }}>
                  ₹ {item.points || item.amount || '0'}
                </h5>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WithdrawHistory;


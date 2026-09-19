import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, Trophy, Wallet, MessageCircle } from 'lucide-react';

const BottomNav = ({ themeColor = 'gold' }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const activeColor = themeColor === 'cyan' ? '#38bdf8' : themeColor === 'crimson' ? '#fb7185' : 'var(--color-gold, #d6be66)';

  return (
    <footer className="bottom-nav-container">
      {/* 1. Bid History */}
      <Link
        to="/bid-history"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          gap: '3px',
          flex: 1,
          color: currentPath === '/bid-history' ? activeColor : 'rgba(255, 255, 255, 0.5)',
          transition: 'all 0.2s ease'
        }}
      >
        <History size={20} />
        <span style={{ fontSize: '0.7rem', fontWeight: currentPath === '/bid-history' ? '700' : '500' }}>
          Bid Logs
        </span>
      </Link>

      {/* 2. Win History */}
      <Link
        to="/win-history"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          gap: '3px',
          flex: 1,
          color: currentPath === '/win-history' ? activeColor : 'rgba(255, 255, 255, 0.5)',
          transition: 'all 0.2s ease'
        }}
      >
        <Trophy size={20} />
        <span style={{ fontSize: '0.7rem', fontWeight: currentPath === '/win-history' ? '700' : '500' }}>
          Win Logs
        </span>
      </Link>

      {/* 3. Center Elevated Home Button */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            position: 'absolute',
            top: '-24px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: themeColor === 'cyan' ? 'linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)' : themeColor === 'crimson' ? 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)' : 'linear-gradient(135deg, #d6be66 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.4)',
            border: '3px solid #09121f',
            color: themeColor === 'gold' ? '#0b1a30' : '#ffffff',
            transition: 'transform 0.2s ease'
          }}
        >
          <Home size={24} />
        </Link>
      </div>

      {/* 4. Wallet History */}
      <Link
        to="/wallet-history"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          gap: '3px',
          flex: 1,
          color: (currentPath === '/wallet-history' || currentPath === '/wallet') ? activeColor : 'rgba(255, 255, 255, 0.5)',
          transition: 'all 0.2s ease'
        }}
      >
        <Wallet size={20} />
        <span style={{ fontSize: '0.7rem', fontWeight: (currentPath === '/wallet-history' || currentPath === '/wallet') ? '700' : '500' }}>
          Wallet
        </span>
      </Link>

      {/* 5. Support */}
      <Link
        to="/support"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          gap: '3px',
          flex: 1,
          color: currentPath === '/support' ? activeColor : 'rgba(255, 255, 255, 0.5)',
          transition: 'all 0.2s ease'
        }}
      >
        <MessageCircle size={20} />
        <span style={{ fontSize: '0.7rem', fontWeight: currentPath === '/support' ? '700' : '500' }}>
          Support
        </span>
      </Link>
    </footer>
  );
};

export default BottomNav;

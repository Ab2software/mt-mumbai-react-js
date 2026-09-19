import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import UserNavbar from './UserNavbar';
import SidebarDrawer from './SidebarDrawer';
import BottomNav from './BottomNav';
import LockScreen from './LockScreen';
import api from '../../utils/api';

const UserLayout = ({ children, setAuth }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('auth_theme_color') || 'gold');
  const [userData, setUserData] = useState({
    name: localStorage.getItem('name') || '',
    phone: localStorage.getItem('phone') || '',
    email: '',
    wallet: '0'
  });
  const [wpNumber, setWpNumber] = useState('');
  const [mpinStatus, setMpinStatus] = useState('1');
  const [isLocked, setIsLocked] = useState(() => sessionStorage.getItem('mpin_unlocked') !== 'true');
  const navigate = useNavigate();

  const loadUserData = async () => {
    try {
      const [walletRes, profileRes, appRes] = await Promise.all([
        api.get('/wallet/info').catch(() => null),
        api.get('/profile').catch(() => null),
        api.get('/app-info').catch(() => null)
      ]);

      const wallet = walletRes?.data?.data?.wallet || '0';
      const prof = profileRes?.data?.data || {};
      const appInfo = appRes?.data?.data || {};

      const currentMpinStatus = appInfo.mpin_status || walletRes?.data?.data?.mpin_status || '1';
      setMpinStatus(currentMpinStatus);

      setUserData({
        name: prof.name || localStorage.getItem('name') || 'Lucky Player',
        phone_number: prof.phone_number || prof.phone || localStorage.getItem('phone') || '',
        phone: prof.phone || localStorage.getItem('phone') || '',
        email: prof.email || '',
        wallet: wallet
      });

      if (appInfo.wp_mobile || appInfo.mobile) {
        setWpNumber(appInfo.wp_mobile || appInfo.mobile);
      }

      if (prof.name) localStorage.setItem('name', prof.name);
      if (prof.phone) localStorage.setItem('phone', prof.phone);
    } catch (err) {
      console.error('Error loading user layout data:', err);
    }
  };

  useEffect(() => {
    loadUserData();
    const interval = setInterval(loadUserData, 15000); // 15s refresh

    const onThemeChange = () => {
      setThemeColor(localStorage.getItem('auth_theme_color') || 'gold');
    };
    window.addEventListener('storage', onThemeChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onThemeChange);
    };
  }, []);

  const changeTheme = (newColor) => {
    setThemeColor(newColor);
    localStorage.setItem('auth_theme_color', newColor);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('name');
    localStorage.removeItem('phone');
    if (setAuth) setAuth(false);
    navigate('/login', { replace: true });
  };

  const cleanWpNumber = wpNumber.replace(/\D/g, '');
  const whatsappUrl = cleanWpNumber 
    ? `https://wa.me/${cleanWpNumber.length === 10 ? '91' + cleanWpNumber : cleanWpNumber}?text=${encodeURIComponent(`Hello Support, I need assistance.`)}`
    : `https://wa.me/?text=${encodeURIComponent(`Hello Support, I need assistance.`)}`;

  return (
    <div className={`app-theme-${themeColor}`} style={{
      minHeight: '100vh',
      backgroundColor: 'var(--app-bg, #09121f)',
      display: 'flex',
      flexDirection: 'column',
      color: '#ffffff',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background 0.4s ease'
    }}>
      {/* Background Decorative Glowing Ambient Orbs */}
      <div style={{
        position: 'fixed',
        top: '-120px',
        left: '-120px',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: themeColor === 'cyan' ? 'rgba(6, 182, 212, 0.15)' : themeColor === 'crimson' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(214, 190, 102, 0.15)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-120px',
        right: '-120px',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: themeColor === 'cyan' ? 'rgba(168, 85, 247, 0.15)' : themeColor === 'crimson' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(16, 185, 129, 0.15)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Fixed Top Navbar */}
      <UserNavbar
        onOpenSidebar={() => setSidebarOpen(true)}
        wallet={userData.wallet}
        themeColor={themeColor}
        onThemeChange={changeTheme}
        onLogout={handleLogout}
      />

      {/* Slide-out Left Drawer */}
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={userData}
        onLogout={handleLogout}
        themeColor={themeColor}
        onThemeChange={changeTheme}
        whatsappUrl={whatsappUrl}
      />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        paddingTop: '64px',
        paddingBottom: '96px',
        position: 'relative',
        zIndex: 1
      }}>
        {children}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav themeColor={themeColor} />

      {/* M-PIN Lock Screen Overlay */}
      {mpinStatus === '1' && isLocked && (
        <LockScreen
          onUnlock={() => setIsLocked(false)}
          onLogout={handleLogout}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};

export default UserLayout;

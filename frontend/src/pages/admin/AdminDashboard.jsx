import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';

// Modular Admin Components
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';

// Modular Admin Tabs
import DashboardOverviewTab from './tabs/DashboardOverviewTab';
import UsersTab from './tabs/UsersTab';
import DepositsTab from './tabs/DepositsTab';
import WithdrawalsTab from './tabs/WithdrawalsTab';
import GamesTab from './tabs/GamesTab';
import ReportsTab from './tabs/ReportsTab';
import WalletTab from './tabs/WalletTab';
import NumbersTab from './tabs/NumbersTab';
import SettingsTab from './tabs/SettingsTab';
import CommissionTab from './tabs/CommissionTab';

const AdminDashboard = ({ setAdminAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Active navigation tab (Restored from URL query param or localStorage on refresh)
  const getInitialTab = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryTab = searchParams.get('tab');
    if (queryTab) return queryTab;
    return localStorage.getItem('admin_active_tab') || 'dashboards';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Persist activeTab to localStorage & update URL search parameter
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('admin_active_tab', activeTab);
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== activeTab) {
        url.searchParams.set('tab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeTab]);

  // Submenu collapse states
  const [openMenus, setOpenMenus] = useState({
    commission: true,
    reports: false,
    wallet: false,
    games: false,
    numbers: false,
    settings: false
  });

  // Automatically open relevant sidebar menu based on activeTab
  useEffect(() => {
    if (['user_commission', 'user_commission_pay_list'].includes(activeTab)) {
      setOpenMenus(prev => ({ ...prev, commission: true }));
    } else if (['bid_history_report', 'customer_sell_report', 'winning_report', 'transfer_report', 'withdraw_report', 'add_fund_report', 'report_bid_history', 'report_sell', 'report_winning', 'report_transfer', 'report_bid_win', 'report_withdraw', 'report_auto_deposit', 'report_add_fund', 'winning_prediction'].includes(activeTab)) {
      setOpenMenus(prev => ({ ...prev, reports: true }));
    } else if (['deposits', 'withdrawals', 'add_fund_wallet', 'bid_revert'].includes(activeTab)) {
      setOpenMenus(prev => ({ ...prev, wallet: true }));
    } else if (['game_names', 'rates'].includes(activeTab)) {
      setOpenMenus(prev => ({ ...prev, games: true }));
    } else if (activeTab.startsWith('num_')) {
      setOpenMenus(prev => ({ ...prev, numbers: true }));
    } else if (['settings', 'contact_settings', 'sliders', 'how_to_play'].includes(activeTab)) {
      setOpenMenus(prev => ({ ...prev, settings: true }));
    }
  }, [activeTab]);

  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  // Profile Dropdown & Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminCoins, setAdminCoins] = useState(0);
  const [adminName, setAdminName] = useState(() => localStorage.getItem('admin_name') || 'Admin');

  // Overview Metrics & Games State
  const [metrics, setMetrics] = useState({
    total_users: 0,
    unapproved_users: 0,
    approved_users: 0,
    total_games: 0,
    today_bid_amount: 0,
    admin_wallet: 0
  });

  const [games, setGames] = useState([]);
  const [selectedGameForMarket, setSelectedGameForMarket] = useState('');
  const [marketBidAmount, setMarketBidAmount] = useState('N/A');

  // Single Ank Cards State
  const [ankGameName, setAnkGameName] = useState('');
  const [ankMarketStatus, setAnkMarketStatus] = useState('open_digit');
  const [ankDate, setAnkDate] = useState(new Date().toISOString().slice(0, 10));
  const [ankBids, setAnkBids] = useState({
    0: { bids: 0, amount: 0 }, 1: { bids: 0, amount: 0 }, 2: { bids: 0, amount: 0 }, 3: { bids: 0, amount: 0 }, 4: { bids: 0, amount: 0 },
    5: { bids: 0, amount: 0 }, 6: { bids: 0, amount: 0 }, 7: { bids: 0, amount: 0 }, 8: { bids: 0, amount: 0 }, 9: { bids: 0, amount: 0 }
  });

  // User details view state
  const [selectedUserId, setSelectedUserId] = useState(() => localStorage.getItem('admin_selected_user_id') || null);

  // Load Dashboard Overview metrics & games list
  const loadDashboardData = async () => {
    try {
      const [mRes, gRes] = await Promise.all([
        api.get('/admin/dashboard-metrics').catch(() => null),
        api.get('/admin/admin-games-list').catch(() => null)
      ]);

      if (mRes?.data?.success === '1') {
        setMetrics(mRes.data.data);
        if (mRes.data.data?.admin_wallet !== undefined) {
          setAdminCoins(mRes.data.data.admin_wallet);
        }
      }

      if (gRes?.data?.success === '1') {
        setGames(gRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_active_tab');
    if (setAdminAuth) setAdminAuth(false);
    navigate('/admin/login');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboards':
        return (
          <DashboardOverviewTab
            metrics={metrics}
            games={games}
            selectedGameForMarket={selectedGameForMarket}
            setSelectedGameForMarket={setSelectedGameForMarket}
            marketBidAmount={marketBidAmount}
            setMarketBidAmount={setMarketBidAmount}
            ankGameName={ankGameName}
            setAnkGameName={setAnkGameName}
            ankMarketStatus={ankMarketStatus}
            setAnkMarketStatus={setAnkMarketStatus}
            ankDate={ankDate}
            setAnkDate={setAnkDate}
            ankBids={ankBids}
            setAnkBids={setAnkBids}
          />
        );

      case 'user_management':
        return (
          <UsersTab
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
          />
        );

      case 'user_commission':
      case 'user_commission_pay_list':
        return <CommissionTab activeTab={activeTab} />;

      case 'deposits':
        return <DepositsTab />;

      case 'withdrawals':
        return <WithdrawalsTab />;

      case 'add_fund_wallet':
      case 'bid_revert':
        return <WalletTab activeTab={activeTab} />;

      case 'game_names':
      case 'rates':
        return <GamesTab activeTab={activeTab} />;

      case 'bid_history_report':
      case 'customer_sell_report':
      case 'winning_report':
      case 'transfer_report':
      case 'withdraw_report':
      case 'add_fund_report':
      case 'report_auto_deposit':
      case 'winning_prediction':
        return <ReportsTab activeTab={activeTab} games={games} />;

      case 'num_single_digit':
      case 'num_jodi_digit':
      case 'num_single_pana':
      case 'num_double_pana':
      case 'num_triple_pana':
      case 'num_half_sangam':
      case 'num_full_sangam':
        return <NumbersTab activeTab={activeTab} />;

      case 'settings':
      case 'contact_settings':
      case 'sliders':
      case 'how_to_play':
        return <SettingsTab activeTab={activeTab} />;

      default:
        return (
          <DashboardOverviewTab
            metrics={metrics}
            games={games}
            selectedGameForMarket={selectedGameForMarket}
            setSelectedGameForMarket={setSelectedGameForMarket}
            marketBidAmount={marketBidAmount}
            setMarketBidAmount={setMarketBidAmount}
            ankGameName={ankGameName}
            setAnkGameName={setAnkGameName}
            ankMarketStatus={ankMarketStatus}
            setAnkMarketStatus={setAnkMarketStatus}
            ankDate={ankDate}
            setAnkDate={setAnkDate}
            ankBids={ankBids}
            setAnkBids={setAnkBids}
          />
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8fb', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* Sticky Admin Top Header */}
      <AdminHeader
        adminName={adminName}
        adminCoins={adminCoins}
        onLogout={handleLogout}
        showPasswordModal={showPasswordModal}
        setShowPasswordModal={setShowPasswordModal}
      />

      <div style={{ display: 'flex' }}>
        {/* Left Navigation Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openMenus={openMenus}
          toggleMenu={toggleMenu}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

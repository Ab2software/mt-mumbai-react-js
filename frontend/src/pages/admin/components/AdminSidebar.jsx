import React from 'react';
import {
  LayoutDashboard,
  Users,
  Percent,
  FileSpreadsheet,
  Wallet,
  Gamepad2,
  ListOrdered,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Trophy,
  Sliders,
  HelpCircle,
  PhoneCall,
  RotateCcw,
  UserPlus
} from 'lucide-react';

const AdminSidebar = ({
  activeTab,
  setActiveTab,
  openMenus,
  toggleMenu,
  onLogout
}) => {
  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#2a3042',
      minHeight: 'calc(100vh - 70px)',
      color: '#a6b0cf',
      padding: '20px 0',
      flexShrink: 0
    }}>
      <div style={{ padding: '0 20px 12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#6a7187', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Navigation
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Dashboards */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboards')}
          style={navButtonStyle(activeTab === 'dashboards')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboards</span>
        </button>

        {/* User Management */}
        <button
          type="button"
          onClick={() => setActiveTab('user_management')}
          style={navButtonStyle(activeTab === 'user_management')}
        >
          <Users size={18} />
          <span>User Management</span>
        </button>

        {/* User Commission Submenu */}
        <div>
          <button
            type="button"
            onClick={() => toggleMenu('commission')}
            style={submenuHeaderStyle(openMenus.commission)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Percent size={18} />
              <span>User Commission</span>
            </div>
            {openMenus.commission ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {openMenus.commission && (
            <div style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#262b3c' }}>
              <button
                type="button"
                onClick={() => setActiveTab('user_commission')}
                style={subItemStyle(activeTab === 'user_commission')}
              >
                Referral / Commission Report
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('user_commission_pay_list')}
                style={subItemStyle(activeTab === 'user_commission_pay_list')}
              >
                User Commission Pay List
              </button>
            </div>
          )}
        </div>

        {/* Declare Result */}
        <button
          type="button"
          onClick={() => setActiveTab('declare_result')}
          style={navButtonStyle(activeTab === 'declare_result')}
        >
          <Trophy size={18} style={{ color: '#f59e0b' }} />
          <span>Declare Result</span>
        </button>

        {/* Reports Submenu */}
        <div>
          <button
            type="button"
            onClick={() => toggleMenu('reports')}
            style={submenuHeaderStyle(openMenus.reports)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileSpreadsheet size={18} />
              <span>Report Details</span>
            </div>
            {openMenus.reports ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {openMenus.reports && (
            <div style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#262b3c' }}>
              <button type="button" onClick={() => setActiveTab('bid_history_report')} style={subItemStyle(activeTab === 'bid_history_report')}>Bid History Report</button>
              <button type="button" onClick={() => setActiveTab('customer_sell_report')} style={subItemStyle(activeTab === 'customer_sell_report')}>Customer Sell Report</button>
              <button type="button" onClick={() => setActiveTab('winning_report')} style={subItemStyle(activeTab === 'winning_report')}>Winning Report</button>
              <button type="button" onClick={() => setActiveTab('transfer_report')} style={subItemStyle(activeTab === 'transfer_report')}>Transfer Report</button>
              <button type="button" onClick={() => setActiveTab('withdraw_report')} style={subItemStyle(activeTab === 'withdraw_report')}>Withdraw Report</button>
              <button type="button" onClick={() => setActiveTab('add_fund_report')} style={subItemStyle(activeTab === 'add_fund_report')}>Add Fund Report</button>
              <button type="button" onClick={() => setActiveTab('report_auto_deposit')} style={subItemStyle(activeTab === 'report_auto_deposit')}>Auto Deposit History</button>
              <button type="button" onClick={() => setActiveTab('winning_prediction')} style={subItemStyle(activeTab === 'winning_prediction')}>Winning Prediction</button>
            </div>
          )}
        </div>

        {/* Wallet Management Submenu */}
        <div>
          <button
            type="button"
            onClick={() => toggleMenu('wallet')}
            style={submenuHeaderStyle(openMenus.wallet)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Wallet size={18} />
              <span>Wallet Management</span>
            </div>
            {openMenus.wallet ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {openMenus.wallet && (
            <div style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#262b3c' }}>
              <button type="button" onClick={() => setActiveTab('deposits')} style={subItemStyle(activeTab === 'deposits')}>Pending Auto Deposits</button>
              <button type="button" onClick={() => setActiveTab('withdrawals')} style={subItemStyle(activeTab === 'withdrawals')}>Pending Withdrawals</button>
              <button type="button" onClick={() => setActiveTab('add_fund_wallet')} style={subItemStyle(activeTab === 'add_fund_wallet')}>Add Fund User Wallet</button>
              <button type="button" onClick={() => setActiveTab('bid_revert')} style={subItemStyle(activeTab === 'bid_revert')}>Bid Revert List</button>
            </div>
          )}
        </div>

        {/* Games Management Submenu */}
        <div>
          <button
            type="button"
            onClick={() => toggleMenu('games')}
            style={submenuHeaderStyle(openMenus.games)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Gamepad2 size={18} />
              <span>Games Management</span>
            </div>
            {openMenus.games ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {openMenus.games && (
            <div style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#262b3c' }}>
              <button type="button" onClick={() => setActiveTab('game_names')} style={subItemStyle(activeTab === 'game_names')}>Game Names List</button>
              <button type="button" onClick={() => setActiveTab('rates')} style={subItemStyle(activeTab === 'rates')}>Game Rates Settings</button>
            </div>
          )}
        </div>

        {/* Game Numbers Submenu */}
        <div>
          <button
            type="button"
            onClick={() => toggleMenu('numbers')}
            style={submenuHeaderStyle(openMenus.numbers)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ListOrdered size={18} />
              <span>Game Numbers</span>
            </div>
            {openMenus.numbers ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {openMenus.numbers && (
            <div style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#262b3c' }}>
              <button type="button" onClick={() => setActiveTab('num_single_digit')} style={subItemStyle(activeTab === 'num_single_digit')}>Single Digit</button>
              <button type="button" onClick={() => setActiveTab('num_jodi_digit')} style={subItemStyle(activeTab === 'num_jodi_digit')}>Jodi Digit</button>
              <button type="button" onClick={() => setActiveTab('num_single_pana')} style={subItemStyle(activeTab === 'num_single_pana')}>Single Pana</button>
              <button type="button" onClick={() => setActiveTab('num_double_pana')} style={subItemStyle(activeTab === 'num_double_pana')}>Double Pana</button>
              <button type="button" onClick={() => setActiveTab('num_triple_pana')} style={subItemStyle(activeTab === 'num_triple_pana')}>Triple Pana</button>
              <button type="button" onClick={() => setActiveTab('num_half_sangam')} style={subItemStyle(activeTab === 'num_half_sangam')}>Half Sangam</button>
              <button type="button" onClick={() => setActiveTab('num_full_sangam')} style={subItemStyle(activeTab === 'num_full_sangam')}>Full Sangam</button>
            </div>
          )}
        </div>

        {/* App Settings Submenu */}
        <div>
          <button
            type="button"
            onClick={() => toggleMenu('settings')}
            style={submenuHeaderStyle(openMenus.settings)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Settings size={18} />
              <span>App Settings</span>
            </div>
            {openMenus.settings ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {openMenus.settings && (
            <div style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#262b3c' }}>
              <button type="button" onClick={() => setActiveTab('settings')} style={subItemStyle(activeTab === 'settings')}>General Settings</button>
              <button type="button" onClick={() => setActiveTab('contact_settings')} style={subItemStyle(activeTab === 'contact_settings')}>Contact Settings</button>
              <button type="button" onClick={() => setActiveTab('sliders')} style={subItemStyle(activeTab === 'sliders')}>Slider Images</button>
              <button type="button" onClick={() => setActiveTab('how_to_play')} style={subItemStyle(activeTab === 'how_to_play')}>How To Play</button>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          style={{
            ...navButtonStyle(false),
            marginTop: '20px',
            color: '#ef4444'
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
};

const navButtonStyle = (isActive) => ({
  width: '100%',
  padding: '12px 20px',
  border: 'none',
  background: isActive ? '#32394e' : 'transparent',
  color: isActive ? '#ffffff' : '#a6b0cf',
  fontWeight: isActive ? '700' : '500',
  fontSize: '0.88rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textAlign: 'left',
  borderLeft: isActive ? '4px solid #556ee6' : '4px solid transparent',
  transition: 'all 0.15s ease-in-out'
});

const submenuHeaderStyle = (isOpen) => ({
  width: '100%',
  padding: '12px 20px',
  border: 'none',
  background: 'transparent',
  color: isOpen ? '#ffffff' : '#a6b0cf',
  fontWeight: '500',
  fontSize: '0.88rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  textAlign: 'left'
});

const subItemStyle = (isActive) => ({
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  background: 'transparent',
  color: isActive ? '#556ee6' : '#a6b0cf',
  fontWeight: isActive ? '700' : '400',
  fontSize: '0.83rem',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'color 0.15s ease'
});

export default AdminSidebar;

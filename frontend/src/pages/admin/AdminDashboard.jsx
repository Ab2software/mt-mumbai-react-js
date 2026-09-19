import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import {
  SINGLE_DIGITS,
  JODI_DIGITS,
  SINGLE_PANAS_BY_ANK,
  DOUBLE_PANAS_BY_ANK,
  TRIPLE_PANAS,
  ALL_PANAS_220
} from '../../utils/gameNumbersData';

const AdminDashboard = ({ setAdminAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('admin_token');

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

  // Top-Right Profile Dropdown & Change Password Modal
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [retypePass, setRetypePass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  // General State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminCoins, setAdminCoins] = useState(0);
  const [adminName, setAdminName] = useState(() => localStorage.getItem('admin_name') || 'Admin');

  // Dashboard Stats (Image 2)
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

  // 10 Single Ank Cards State
  const [ankGameName, setAnkGameName] = useState('');
  const [ankMarketStatus, setAnkMarketStatus] = useState('open_digit');
  const [ankDate, setAnkDate] = useState(new Date().toISOString().slice(0, 10));
  const [ankBids, setAnkBids] = useState({
    0: { bids: 0, amount: 0 },
    1: { bids: 0, amount: 0 },
    2: { bids: 0, amount: 0 },
    3: { bids: 0, amount: 0 },
    4: { bids: 0, amount: 0 },
    5: { bids: 0, amount: 0 },
    6: { bids: 0, amount: 0 },
    7: { bids: 0, amount: 0 },
    8: { bids: 0, amount: 0 },
    9: { bids: 0, amount: 0 }
  });

  // Bid Winning Report State
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportGameName, setReportGameName] = useState('all');
  const [bidWinData, setBidWinData] = useState({ total_bid: 0, total_win: 0, profit: 0 });

  // Auto Deposits State
  const [autoDeposits, setAutoDeposits] = useState([]);
  const [autoDepositSearch, setAutoDepositSearch] = useState('');

  // User Management State (Image 3)
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('all'); // 'all' or 'unapproved'
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [walletAdjustPoints, setWalletAdjustPoints] = useState('');
  const [walletAdjustType, setWalletAdjustType] = useState('add');

  // Dedicated User Details View State
  const [selectedUserId, setSelectedUserId] = useState(() => localStorage.getItem('admin_selected_user_id') || null);
  const [userDetailsData, setUserDetailsData] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [walletAdjAmount, setWalletAdjAmount] = useState('');
  const [walletAdjType, setWalletAdjType] = useState('add');
  const [walletAdjRemark, setWalletAdjRemark] = useState('');
  const [walletAdjSubmitting, setWalletAdjSubmitting] = useState(false);
  const [activeUserSubTab, setActiveUserSubTab] = useState('wallet');

  // Referral Report State (Image 4)
  const [referrals, setReferrals] = useState([]);
  const [referralSearch, setReferralSearch] = useState('');

  // User Commission Pending State (Image 5)
  const [commissionFromDate, setCommissionFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [commissionToDate, setCommissionToDate] = useState(new Date().toISOString().slice(0, 10));
  const [commissionList, setCommissionList] = useState([]);
  const [selectedCommissionIds, setSelectedCommissionIds] = useState([]);

  // User Commission Pay List State (Matching User Screenshot)
  const [commissionPayList, setCommissionPayList] = useState([]);
  const [payListFromDate, setPayListFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [payListToDate, setPayListToDate] = useState(new Date().toISOString().slice(0, 10));

  // Existing Modules: Rates, Settings, Sliders, Deposits, Withdrawals
  const [rates, setRates] = useState([]);
  const [settingsData, setSettingsData] = useState({});
  const [contactData, setContactData] = useState({});
  const [withdrawDays, setWithdrawDays] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [settingsError, setSettingsError] = useState('');

  const [contactLoading, setContactLoading] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [contactError, setContactError] = useState('');

  const [howToPlayContent, setHowToPlayContent] = useState('');
  const [howToPlayLoading, setHowToPlayLoading] = useState(false);
  const [howToPlayMsg, setHowToPlayMsg] = useState('');

  const [sliders, setSliders] = useState([]);
  const [slidersLoading, setSlidersLoading] = useState(false);
  const [showAddSliderModal, setShowAddSliderModal] = useState(false);
  const [newSliderForm, setNewSliderForm] = useState({ slider_image: '', display_order: '1' });
  const [addSliderLoading, setAddSliderLoading] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);

  // ==========================================
  // GAMES MANAGEMENT STATES (PHP PARITY)
  // ==========================================
  const [adminGamesList, setAdminGamesList] = useState([]);
  const [adminGamesSearch, setAdminGamesSearch] = useState('');
  const [adminGamesLoading, setAdminGamesLoading] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [newGameForm, setNewGameForm] = useState({ game_name: '', open_time: '', close_time: '' });
  const [addGameLoading, setAddGameLoading] = useState(false);
  const [addGameError, setAddGameError] = useState('');
  const [addGameSuccess, setAddGameSuccess] = useState('');

  // Edit Week Game Modal State
  const [editWeekModal, setEditWeekModal] = useState(null);
  const [editWeekLoading, setEditWeekLoading] = useState(false);
  const [editWeekSaving, setEditWeekSaving] = useState(false);

  // Game Rates Form State
  const [gameRatesForm, setGameRatesForm] = useState({});
  const [gameRatesLoading, setGameRatesLoading] = useState(false);
  const [gameRatesMsg, setGameRatesMsg] = useState('');
  const [gameRatesError, setGameRatesError] = useState('');

  // Declare Result State
  const [declareSelectedGame, setDeclareSelectedGame] = useState('');
  const [declareDate, setDeclareDate] = useState(new Date().toISOString().slice(0, 10));
  const [declareSession, setDeclareSession] = useState('open');
  const [declareOpenPana, setDeclareOpenPana] = useState('');
  const [declareOpenResult, setDeclareOpenResult] = useState('');
  const [declareClosePana, setDeclareClosePana] = useState('');
  const [declareCloseResult, setDeclareCloseResult] = useState('');
  const [declareLoading, setDeclareLoading] = useState(false);
  const [declareError, setDeclareError] = useState('');
  const [declareSuccess, setDeclareSuccess] = useState('');

  // Searchable Pana Dropdown & Auto Digit Calculation Helpers
  const [showOpenPanaDropdown, setShowOpenPanaDropdown] = useState(false);
  const [showClosePanaDropdown, setShowClosePanaDropdown] = useState(false);

  const getPanaSingleDigit = (panaStr) => {
    if (!panaStr || panaStr.length !== 3) return '';
    const d1 = parseInt(panaStr[0], 10) || 0;
    const d2 = parseInt(panaStr[1], 10) || 0;
    const d3 = parseInt(panaStr[2], 10) || 0;
    const sum = d1 + d2 + d3;
    return (sum % 10).toString();
  };

  const handleOpenPanaSelect = (val) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 3);
    setDeclareOpenPana(digitsOnly);
    if (digitsOnly.length === 3) {
      setDeclareOpenResult(getPanaSingleDigit(digitsOnly));
    }
  };

  const handleClosePanaSelect = (val) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 3);
    setDeclareClosePana(digitsOnly);
    if (digitsOnly.length === 3) {
      setDeclareCloseResult(getPanaSingleDigit(digitsOnly));
    }
  };

  // Image File Picker Helper (Converts selected file to Data URL base64)
  const handleImageFilePick = (e, callback) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please select a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Str = uploadEvent.target.result;
        callback(base64Str);
      };
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // REPORT MANAGEMENT STATES
  // ==========================================
  // 1. Users Bid History
  const [bidHistoryDate, setBidHistoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [bidHistoryGame, setBidHistoryGame] = useState('all');
  const [bidHistoryType, setBidHistoryType] = useState('all');
  const [bidHistoryList, setBidHistoryList] = useState([]);
  const [bidHistoryLoading, setBidHistoryLoading] = useState(false);
  const [editBidModal, setEditBidModal] = useState(null);
  const [editBidForm, setEditBidForm] = useState({ open_pana: '', open_digit: '', close_pana: '', close_digit: '', points_action: '' });
  const [editBidLoading, setEditBidLoading] = useState(false);

  // 2. Customer Sell Report
  const [sellDate, setSellDate] = useState(new Date().toISOString().slice(0, 10));
  const [sellGame, setSellGame] = useState('all');
  const [sellType, setSellType] = useState('all');
  const [sellSession, setSellSession] = useState('open');
  const [sellReportData, setSellReportData] = useState({});
  const [sellGrandTotal, setSellGrandTotal] = useState(0);
  const [sellLoading, setSellLoading] = useState(false);

  // 3. Winning Report
  const [winningDate, setWinningDate] = useState(new Date().toISOString().slice(0, 10));
  const [winningGame, setWinningGame] = useState('all');
  const [winningSession, setWinningSession] = useState('all');
  const [winningList, setWinningList] = useState([]);
  const [winningTotalAmt, setWinningTotalAmt] = useState(0);
  const [winningTotalPoints, setWinningTotalPoints] = useState(0);
  const [winningLoading, setWinningLoading] = useState(false);

  // 4. Transfer Point Report
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferList, setTransferList] = useState([]);
  const [transferTotal, setTransferTotal] = useState(0);
  const [transferLoading, setTransferLoading] = useState(false);

  // 5. Bid Win Report
  const [bidWinRepDate, setBidWinRepDate] = useState(new Date().toISOString().slice(0, 10));
  const [bidWinRepGame, setBidWinRepGame] = useState('all');
  const [bidWinRepData, setBidWinRepData] = useState({ total_bid: 0, total_win: 0, profit: 0 });
  const [bidWinRepDetails, setBidWinRepDetails] = useState('none');
  const [bidWinRepDetailList, setBidWinRepDetailList] = useState([]);
  const [bidWinRepLoading, setBidWinRepLoading] = useState(false);

  // 6. Withdraw Report
  const [withdrawRepDate, setWithdrawRepDate] = useState('');
  const [withdrawRepList, setWithdrawRepList] = useState([]);
  const [withdrawRepTotal, setWithdrawRepTotal] = useState(0);
  const [withdrawRepLoading, setWithdrawRepLoading] = useState(false);

  // 7. Auto Deposit History
  const [autoDepDate, setAutoDepDate] = useState('');
  const [autoDepList, setAutoDepList] = useState([]);
  const [autoDepTotals, setAutoDepTotals] = useState({ total_transfer: 0, total_approved: 0, total_rejected: 0, total_pending: 0 });
  const [autoDepLoading, setAutoDepLoading] = useState(false);

  // ==========================================
  // WALLET MANAGEMENT & ADD FUND REPORT STATES
  // ==========================================
  // 1. Fund Request (deposits)
  const [fundReqDate, setFundReqDate] = useState('');
  const [fundReqList, setFundReqList] = useState([]);
  const [fundReqTotal, setFundReqTotal] = useState(0);
  const [fundReqLoading, setFundReqLoading] = useState(false);

  // 2. Withdraw Request (withdrawals)
  const [withReqDate, setWithReqDate] = useState('');
  const [withReqList, setWithReqList] = useState([]);
  const [withReqTotals, setWithReqTotals] = useState({ total_amount: 0, total_approved: 0, total_rejected: 0, total_pending: 0 });
  const [withReqLoading, setWithReqLoading] = useState(false);
  const [selectedWithdrawModal, setSelectedWithdrawModal] = useState(null);

  // 3. Add Fund (User Wallet)
  const [addFundUserPhone, setAddFundUserPhone] = useState('');
  const [addFundAmount, setAddFundAmount] = useState('');
  const [addFundLoading, setAddFundLoading] = useState(false);
  const [addFundMsg, setAddFundMsg] = useState('');
  const [addFundError, setAddFundError] = useState('');

  // 4. Bid Revert
  const [bidRevertDate, setBidRevertDate] = useState(new Date().toISOString().slice(0, 10));
  const [bidRevertGame, setBidRevertGame] = useState('');
  const [bidRevertList, setBidRevertList] = useState([]);
  const [bidRevertLoading, setBidRevertLoading] = useState(false);
  const [bidRevertMsg, setBidRevertMsg] = useState('');
  const [showRevertConfirmModal, setShowRevertConfirmModal] = useState(false);

  // 5. Add Fund Report
  const [addFundRepDate, setAddFundRepDate] = useState('');
  const [addFundRepList, setAddFundRepList] = useState([]);
  const [addFundRepLoading, setAddFundRepLoading] = useState(false);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchAdminCoins = async () => {
    if (!token) return;
    try {
      const res = await api.get('/admin/metrics', getHeaders());
      if (res.data.success === '1') {
        setAdminCoins(res.data.metrics.admin_wallet || 0);
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserFullDetails = async (userId) => {
    setUserDetailsLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}/details`, getHeaders());
      if (res.data.success === '1') {
        setUserDetailsData(res.data.data);
      } else {
        alert(res.data.msg || 'Failed to fetch user details');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching user details');
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const handleOpenUserDetails = (user) => {
    setSelectedUserId(user.id);
    localStorage.setItem('admin_selected_user_id', user.id);
    setActiveTab('user-details');
    fetchUserFullDetails(user.id);
  };

  useEffect(() => {
    if (activeTab === 'user-details') {
      if (users.length === 0) {
        fetchUsers();
      }
      const targetId = selectedUserId || localStorage.getItem('admin_selected_user_id') || 'first';
      fetchUserFullDetails(targetId);
    }
  }, [activeTab]);

  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.trim() === '') {
      alert('Please enter a new password');
      return;
    }
    setPasswordUpdating(true);
    try {
      const res = await api.post('/admin/users/update-password', {
        userId: selectedUserId,
        newPassword: newPasswordInput.trim()
      }, getHeaders());
      if (res.data.success === '1') {
        alert(res.data.msg || 'Password updated successfully!');
        setNewPasswordInput('');
        fetchUserFullDetails(selectedUserId);
        fetchUsers();
      } else {
        alert(res.data.msg || 'Failed to update password');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating password');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleAdjustWalletSubmit = async (e) => {
    e.preventDefault();
    if (!walletAdjAmount || parseFloat(walletAdjAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!userDetailsData || !userDetailsData.user) return;

    setWalletAdjSubmitting(true);
    try {
      const res = await api.post('/admin/users/adjust-wallet', {
        phone: userDetailsData.user.phone,
        type: walletAdjType,
        amount: walletAdjAmount,
        remark: walletAdjRemark
      }, getHeaders());

      if (res.data.success === '1') {
        alert(res.data.msg || 'Wallet updated successfully!');
        setWalletAdjAmount('');
        setWalletAdjRemark('');
        fetchUserFullDetails(selectedUserId);
        fetchUsers();
      } else {
        alert(res.data.msg || 'Failed to adjust wallet');
      }
    } catch (err) {
      console.error(err);
      alert('Error adjusting wallet');
    } finally {
      setWalletAdjSubmitting(false);
    }
  };

  const fetchGames = async () => {
    try {
      const res = await api.get('/games', getHeaders());
      setGames(res.data.result || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnkBids = async () => {
    try {
      const res = await api.get(`/admin/metrics/ank-bids?game_name=${ankGameName}&market_status=${ankMarketStatus}&date=${ankDate}`, getHeaders());
      if (res.data.success === '1') {
        setAnkBids(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBidWinReport = async () => {
    try {
      const res = await api.get(`/admin/metrics/bid-win-report?date=${reportDate}&game_name=${reportGameName}`, getHeaders());
      if (res.data.success === '1') {
        setBidWinData({
          total_bid: res.data.total_bid,
          total_win: res.data.total_win,
          profit: res.data.profit
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAutoDeposits = async () => {
    try {
      const res = await api.get('/admin/auto-deposits', getHeaders());
      if (res.data.success === '1') {
        setAutoDeposits(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', getHeaders());
      if (res.data.success === '1') {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReferrals = async () => {
    try {
      const res = await api.get('/admin/referrals', getHeaders());
      if (res.data.success === '1') {
        setReferrals(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCommissions = async () => {
    try {
      const res = await api.get(`/admin/commission/pending?from_date=${commissionFromDate}&to_date=${commissionToDate}`, getHeaders());
      if (res.data.success === '1') {
        setCommissionList(res.data.data);
        setSelectedCommissionIds([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCommissionPayList = async () => {
    try {
      const res = await api.get(`/admin/commission/paid?from_date=${payListFromDate}&to_date=${payListToDate}`, getHeaders());
      if (res.data.success === '1') {
        setCommissionPayList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const format12To24 = (time12) => {
    if (!time12) return '';
    if (!time12.toLowerCase().includes('am') && !time12.toLowerCase().includes('pm')) {
      return time12.trim();
    }
    const parts = time12.trim().split(' ');
    if (parts.length < 2) return time12;
    const [hm, modifier] = parts;
    let [h, m] = hm.split(':').map(Number);
    if (modifier.toLowerCase() === 'pm' && h < 12) h += 12;
    if (modifier.toLowerCase() === 'am' && h === 12) h = 0;
    return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
  };

  // ==========================================
  // GAMES MANAGEMENT FETCH & ACTION FUNCTIONS
  // ==========================================
  const fetchAdminGames = async () => {
    setAdminGamesLoading(true);
    try {
      const res = await api.get('/admin/games', getHeaders());
      if (res.data.success === '1') {
        setAdminGamesList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminGamesLoading(false);
    }
  };

  const handleAddGameSubmit = async (e) => {
    e.preventDefault();
    if (!newGameForm.game_name || !newGameForm.open_time || !newGameForm.close_time) {
      setAddGameError('Please fill in Game Name, Open Time and Close Time');
      return;
    }
    setAddGameLoading(true);
    setAddGameError('');
    setAddGameSuccess('');
    try {
      const res = await api.post('/admin/games/add', newGameForm, getHeaders());
      if (res.data.success === '1') {
        setAddGameSuccess(res.data.msg || 'Game Added Successfully');
        setNewGameForm({ game_name: '', open_time: '', close_time: '' });
        fetchAdminGames();
        fetchGames();
        setTimeout(() => {
          setShowAddGameModal(false);
          setAddGameSuccess('');
        }, 1200);
      } else {
        setAddGameError(res.data.msg || 'Failed to add game');
      }
    } catch (err) {
      console.error(err);
      setAddGameError('Error adding game');
    } finally {
      setAddGameLoading(false);
    }
  };

  const handleOpenEditWeek = async (gameName) => {
    setEditWeekLoading(true);
    try {
      const res = await api.get(`/admin/games/week/${encodeURIComponent(gameName)}`, getHeaders());
      if (res.data.success === '1') {
        const formattedDays = (res.data.days || []).map(d => ({
          ...d,
          open_time_24: format12To24(d.open_time),
          close_time_24: format12To24(d.close_time),
          status: String(d.status)
        }));
        setEditWeekModal({ game_name: gameName, days: formattedDays });
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching game week schedule');
    } finally {
      setEditWeekLoading(false);
    }
  };

  const handleSaveWeekSchedule = async (e) => {
    e.preventDefault();
    if (!editWeekModal) return;
    setEditWeekSaving(true);
    try {
      const payload = {
        game_name: editWeekModal.game_name,
        days: editWeekModal.days.map(d => ({
          day: d.day,
          open_time: d.open_time_24,
          close_time: d.close_time_24,
          status: d.status
        }))
      };
      const res = await api.post('/admin/games/week/update', payload, getHeaders());
      if (res.data.success === '1') {
        alert(res.data.msg || 'Game Week Schedule Updated Successfully');
        setEditWeekModal(null);
        fetchAdminGames();
      } else {
        alert(res.data.msg || 'Failed to update week schedule');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating week schedule');
    } finally {
      setEditWeekSaving(false);
    }
  };

  const handleDeleteGame = async (gameName) => {
    if (!window.confirm(`Are you sure you want to delete "${gameName}"?`)) return;
    try {
      const res = await api.post('/admin/games/delete', { game_name: gameName }, getHeaders());
      if (res.data.success === '1') {
        fetchAdminGames();
        fetchGames();
      } else {
        alert(res.data.msg || 'Failed to delete game');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting game');
    }
  };

  const fetchRates = async () => {
    setGameRatesLoading(true);
    try {
      const res = await api.get('/admin/rates', getHeaders());
      if (res.data.success === '1') {
        setRates(res.data.data || []);
        const formData = {};
        (res.data.data || []).forEach(r => {
          formData[r.type] = { min_value: r.min_value, max_value: r.max_value, id: r.id };
        });
        setGameRatesForm(formData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGameRatesLoading(false);
    }
  };

  const handleUpdateGameRates = async (e) => {
    e.preventDefault();
    setGameRatesLoading(true);
    setGameRatesMsg('');
    setGameRatesError('');
    try {
      const ratesArray = Object.entries(gameRatesForm).map(([type, vals]) => ({
        id: vals.id,
        type,
        min_value: vals.min_value,
        max_value: vals.max_value
      }));
      const res = await api.post('/admin/rates/update', { rates: ratesArray }, getHeaders());
      if (res.data.success === '1') {
        setGameRatesMsg(res.data.msg || 'Game Rates Updated Successfully!');
        fetchRates();
      } else {
        setGameRatesError(res.data.msg || 'Failed to update rates');
      }
    } catch (err) {
      console.error(err);
      setGameRatesError('Error updating game rates');
    } finally {
      setGameRatesLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await api.get('/admin/settings', getHeaders());
      if (res.data.success === '1') {
        setSettingsData(res.data.settings || {});
        setContactData(res.data.contact || {});
        setWithdrawDays(res.data.withdraw_days || []);
        setHowToPlayContent(res.data.settings?.how_to_play || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    setSettingsError('');
    try {
      const res = await api.post('/admin/settings/update', {
        settings: {
          ac_name: settingsData.ac_name || '',
          ac_number: settingsData.ac_number || '',
          ifsc_code: settingsData.ifsc_code || ''
        }
      }, getHeaders());
      if (res.data.success === '1') {
        setSettingsMsg('Bank Details Updated Successfully!');
        fetchSettings();
      } else {
        setSettingsError(res.data.msg || 'Failed to update bank details');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('Error updating bank details');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveUpiQr = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    setSettingsError('');
    try {
      const isShowUpi = settingsData.show_upi === 1 || settingsData.show_upi === '1' || settingsData.show_upi === true;
      const isShowQr = settingsData.show_qr === 1 || settingsData.show_qr === '1' || settingsData.show_qr === true;
      const res = await api.post('/admin/settings/update', {
        settings: {
          payment_upi_id: settingsData.payment_upi_id || settingsData.upi_payment_id || '',
          payment_barcode_image: settingsData.payment_barcode_image || '',
          show_upi: isShowUpi ? 1 : 0,
          show_qr: isShowQr ? 1 : 0
        }
      }, getHeaders());
      if (res.data.success === '1') {
        setSettingsMsg('UPI / QR Settings Updated Successfully!');
        fetchSettings();
      } else {
        setSettingsError(res.data.msg || 'Failed to update UPI/QR');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('Error updating UPI/QR');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveMpinSetting = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    setSettingsError('');
    try {
      const res = await api.post('/admin/settings/update', {
        settings: {
          mpin_status: settingsData.mpin_status !== undefined ? String(settingsData.mpin_status) : '1'
        }
      }, getHeaders());
      if (res.data.success === '1') {
        setSettingsMsg('M-PIN Lock Screen Setting Updated Successfully!');
        fetchSettings();
      } else {
        setSettingsError(res.data.msg || 'Failed to update M-PIN Setting');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('Error updating M-PIN setting');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSliderSetting = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    setSettingsError('');
    try {
      const res = await api.post('/admin/settings/update', {
        settings: {
          slider_status: settingsData.slider_status !== undefined ? String(settingsData.slider_status) : '1'
        }
      }, getHeaders());
      if (res.data.success === '1') {
        setSettingsMsg('Slider Images Display Setting Updated Successfully!');
        fetchSettings();
      } else {
        setSettingsError(res.data.msg || 'Failed to update Slider Setting');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('Error updating slider setting');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveValuesAndLimits = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    setSettingsError('');
    try {
      const res = await api.post('/admin/settings/update', {
        settings: {
          min_deposite: settingsData.min_deposite,
          max_deposite: settingsData.max_deposite,
          min_withdrawal: settingsData.min_withdrawal,
          max_withdrawal: settingsData.max_withdrawal,
          min_transfer: settingsData.min_transfer,
          max_transfer: settingsData.max_transfer,
          min_bid_amt: settingsData.min_bid_amt,
          max_bid_amt: settingsData.max_bid_amt,
          Dragon_bonus: settingsData.Dragon_bonus,
          referral_commission: settingsData.referral_commission,
          min_wallet_amount: settingsData.min_wallet_amount,
          withdraw_open_time: settingsData.withdraw_open_time,
          withdraw_close_time: settingsData.withdraw_close_time,
          alert_message: settingsData.alert_message,
          withdraw_days: withdrawDays
        }
      }, getHeaders());
      if (res.data.success === '1') {
        setSettingsMsg('System Values & Limits Updated Successfully!');
        fetchSettings();
      } else {
        setSettingsError(res.data.msg || 'Failed to update limits');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('Error updating limits');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleToggleWithdrawDay = (dayName) => {
    if (withdrawDays.includes(dayName)) {
      setWithdrawDays(withdrawDays.filter(d => d !== dayName));
    } else {
      setWithdrawDays([...withdrawDays, dayName]);
    }
  };

  const handleSaveContactDetails = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactMsg('');
    setContactError('');
    try {
      const res = await api.post('/admin/settings/contact/update', contactData, getHeaders());
      if (res.data.success === '1') {
        setContactMsg('Contact Details Updated Successfully!');
        fetchSettings();
      } else {
        setContactError(res.data.msg || 'Failed to update contact details');
      }
    } catch (err) {
      console.error(err);
      setContactError('Error updating contact details');
    } finally {
      setContactLoading(false);
    }
  };

  const fetchSliders = async () => {
    setSlidersLoading(true);
    try {
      const res = await api.get('/admin/sliders', getHeaders());
      if (res.data.success === '1') setSliders(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSlidersLoading(false);
    }
  };

  const handleAddSliderSubmit = async (e) => {
    e.preventDefault();
    if (!newSliderForm.slider_image) {
      alert('Please enter image URL or path');
      return;
    }
    setAddSliderLoading(true);
    try {
      const res = await api.post('/admin/sliders/add', newSliderForm, getHeaders());
      if (res.data.success === '1') {
        setNewSliderForm({ slider_image: '', display_order: '1' });
        setShowAddSliderModal(false);
        fetchSliders();
      } else {
        alert(res.data.msg || 'Failed to add slider');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding slider');
    } finally {
      setAddSliderLoading(false);
    }
  };

  const handleToggleSliderStatus = async (id) => {
    try {
      const res = await api.post('/admin/sliders/status', { id }, getHeaders());
      if (res.data.success === '1') {
        fetchSliders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlider = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slider image?')) return;
    try {
      const res = await api.post('/admin/sliders/delete', { id }, getHeaders());
      if (res.data.success === '1') {
        fetchSliders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveHowToPlay = async (e) => {
    e.preventDefault();
    setHowToPlayLoading(true);
    setHowToPlayMsg('');
    try {
      const res = await api.post('/admin/settings/update', {
        settings: {
          how_to_play: howToPlayContent
        }
      }, getHeaders());
      if (res.data.success === '1') {
        setHowToPlayMsg('How To Play Content Saved Successfully!');
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHowToPlayLoading(false);
    }
  };

  const fetchDeposits = async () => {
    try {
      const res = await api.get('/admin/deposits/pending', getHeaders());
      if (res.data.success === '1') setPendingDeposits(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await api.get('/admin/withdrawals/pending', getHeaders());
      if (res.data.success === '1') setPendingWithdrawals(res.data.data);
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // REPORT MANAGEMENT FETCH FUNCTIONS
  // ==========================================
  const fetchReportBidHistory = async () => {
    setBidHistoryLoading(true);
    try {
      const res = await api.get(`/admin/reports/bid-history?date=${bidHistoryDate}&game_name=${bidHistoryGame}&game_type=${bidHistoryType}`, getHeaders());
      if (res.data.success === '1') {
        setBidHistoryList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBidHistoryLoading(false);
    }
  };

  const handleUpdateBid = async (e) => {
    e.preventDefault();
    if (!editBidModal) return;
    setEditBidLoading(true);
    try {
      const res = await api.post('/admin/reports/bid-history/update', {
        id: editBidModal.id,
        ...editBidForm
      }, getHeaders());
      if (res.data.success === '1') {
        setEditBidModal(null);
        fetchReportBidHistory();
      } else {
        alert(res.data.msg || 'Failed to update bid');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating bid');
    } finally {
      setEditBidLoading(false);
    }
  };

  const fetchReportSell = async () => {
    setSellLoading(true);
    try {
      const res = await api.get(`/admin/reports/customer-sell?date=${sellDate}&game_name=${sellGame}&game_type=${sellType}&market_status=${sellSession}`, getHeaders());
      if (res.data.success === '1') {
        setSellReportData(res.data.results || {});
        setSellGrandTotal(res.data.grand_total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSellLoading(false);
    }
  };

  const fetchReportWinning = async () => {
    setWinningLoading(true);
    try {
      const res = await api.get(`/admin/reports/winning?date=${winningDate}&game_name=${winningGame}&market_status=${winningSession}`, getHeaders());
      if (res.data.success === '1') {
        setWinningList(res.data.data || []);
        setWinningTotalAmt(res.data.total_winning || 0);
        setWinningTotalPoints(res.data.total_points || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWinningLoading(false);
    }
  };

  const fetchReportTransfer = async () => {
    setTransferLoading(true);
    try {
      const res = await api.get(`/admin/reports/transfers?date=${transferDate}`, getHeaders());
      if (res.data.success === '1') {
        setTransferList(res.data.data || []);
        setTransferTotal(res.data.total_amount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransferLoading(false);
    }
  };

  const fetchReportBidWin = async () => {
    setBidWinRepLoading(true);
    try {
      const res = await api.get(`/admin/metrics/bid-win-report?date=${bidWinRepDate}&game_name=${bidWinRepGame}`, getHeaders());
      if (res.data.success === '1') {
        setBidWinRepData({
          total_bid: res.data.total_bid || 0,
          total_win: res.data.total_win || 0,
          profit: res.data.profit || 0
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBidWinRepLoading(false);
    }
  };

  const handleOpenBidWinDetails = async (detailType) => {
    setBidWinRepDetails(detailType);
    try {
      if (detailType === 'bids') {
        const res = await api.get(`/admin/reports/bid-history?date=${bidWinRepDate}&game_name=${bidWinRepGame}&game_type=all`, getHeaders());
        if (res.data.success === '1') setBidWinRepDetailList(res.data.data || []);
      } else if (detailType === 'wins') {
        const res = await api.get(`/admin/reports/winning?date=${bidWinRepDate}&game_name=${bidWinRepGame}&market_status=all`, getHeaders());
        if (res.data.success === '1') setBidWinRepDetailList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReportWithdraw = async () => {
    setWithdrawRepLoading(true);
    try {
      const res = await api.get(`/admin/reports/withdrawals?date=${withdrawRepDate}`, getHeaders());
      if (res.data.success === '1') {
        setWithdrawRepList(res.data.data || []);
        setWithdrawRepTotal(res.data.total_amount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWithdrawRepLoading(false);
    }
  };

  const fetchReportAutoDeposit = async () => {
    setAutoDepLoading(true);
    try {
      const res = await api.get(`/admin/auto-deposits?date=${autoDepDate}`, getHeaders());
      if (res.data.success === '1') {
        setAutoDepList(res.data.data || []);
        setAutoDepTotals(res.data.totals || { total_transfer: 0, total_approved: 0, total_rejected: 0, total_pending: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAutoDepLoading(false);
    }
  };

  // ==========================================
  // WALLET MANAGEMENT & ADD FUND REPORT FUNCTIONS
  // ==========================================
  const fetchFundRequests = async () => {
    setFundReqLoading(true);
    try {
      const res = await api.get(`/admin/deposits/requests?date=${fundReqDate}`, getHeaders());
      if (res.data.success === '1') {
        setFundReqList(res.data.data || []);
        setFundReqTotal(res.data.total_amount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFundReqLoading(false);
    }
  };

  const handleFundRequestAction = async (id, action) => {
    const confirmMsg = action === 'approve' ? 'Are you sure you want to Approve this fund request?' : 'Are you sure you want to Reject this fund request?';
    if (!window.confirm(confirmMsg)) return;
    try {
      const endpoint = action === 'approve' ? '/admin/deposits/approve' : '/admin/deposits/reject';
      const res = await api.post(endpoint, { requestId: id }, getHeaders());
      if (res.data.success === '1') {
        alert(res.data.msg || (action === 'approve' ? 'Fund request approved successfully' : 'Fund request rejected'));
        fetchFundRequests();
        fetchAdminCoins();
      } else {
        alert(res.data.msg || 'Failed to process fund request.');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing fund request');
    }
  };

  const fetchWithRequests = async () => {
    setWithReqLoading(true);
    try {
      const res = await api.get(`/admin/withdrawals/requests?date=${withReqDate}`, getHeaders());
      if (res.data.success === '1') {
        setWithReqList(res.data.data || []);
        setWithReqTotals(res.data.totals || { total_amount: 0, total_approved: 0, total_rejected: 0, total_pending: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWithReqLoading(false);
    }
  };

  const handleWithRequestAction = async (id, action) => {
    const confirmMsg = action === 'approve' ? 'Are you sure you want to Approve?' : 'Are you sure you want to Reject?';
    if (!window.confirm(confirmMsg)) return;
    try {
      const endpoint = action === 'approve' ? '/admin/withdrawals/approve' : '/admin/withdrawals/reject';
      const res = await api.post(endpoint, { withdrawId: id, requestId: id, id: id }, getHeaders());
      if (res.data.success === '1') {
        alert(res.data.msg || (action === 'approve' ? 'Withdrawal request approved successfully' : 'Withdrawal request rejected'));
        fetchWithRequests();
        fetchAdminCoins();
        if (selectedWithdrawModal) setSelectedWithdrawModal(null);
      } else {
        alert(res.data.msg || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing withdrawal request');
    }
  };

  const handleAddFundSubmit = async (e) => {
    e.preventDefault();
    if (!addFundUserPhone || !addFundAmount) {
      setAddFundError('Please select a user and enter an amount');
      return;
    }
    setAddFundLoading(true);
    setAddFundMsg('');
    setAddFundError('');
    try {
      const res = await api.post('/admin/wallet/add-fund', {
        phone: addFundUserPhone,
        amount: addFundAmount
      }, getHeaders());
      if (res.data.success === '1') {
        setAddFundMsg(res.data.msg || 'Points added to user wallet successfully!');
        setAddFundAmount('');
        fetchAdminCoins();
        fetchUsers();
      } else {
        setAddFundError(res.data.msg || 'Failed to add fund');
      }
    } catch (err) {
      console.error(err);
      setAddFundError('Error adding points to user wallet');
    } finally {
      setAddFundLoading(false);
    }
  };

  const fetchBidRevertList = async () => {
    setBidRevertLoading(true);
    setBidRevertMsg('');
    try {
      const game = bidRevertGame || (games[0]?.games_name || '');
      const res = await api.get(`/admin/wallet/bid-revert?date=${bidRevertDate}&game_name=${encodeURIComponent(game)}`, getHeaders());
      if (res.data.success === '1') {
        setBidRevertList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBidRevertLoading(false);
    }
  };

  const handleExecuteBidRevert = async () => {
    const game = bidRevertGame || (games[0]?.games_name || '');
    setShowRevertConfirmModal(false);
    setBidRevertLoading(true);
    try {
      const res = await api.post('/admin/wallet/bid-revert/execute', {
        date: bidRevertDate,
        game_name: game
      }, getHeaders());
      if (res.data.success === '1') {
        setBidRevertMsg(res.data.msg || 'All bids reverted and points refunded successfully!');
        fetchBidRevertList();
        fetchAdminCoins();
      } else {
        alert(res.data.msg || 'Failed to revert bids');
      }
    } catch (err) {
      console.error(err);
      alert('Error reverting bids');
    } finally {
      setBidRevertLoading(false);
    }
  };

  const fetchAddFundReport = async () => {
    setAddFundRepLoading(true);
    try {
      const res = await api.get(`/admin/reports/add-fund?date=${addFundRepDate}`, getHeaders());
      if (res.data.success === '1') {
        setAddFundRepList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddFundRepLoading(false);
    }
  };

  useEffect(() => {
    const curToken = localStorage.getItem('admin_token');
    if (!curToken) {
      if (setAdminAuth) setAdminAuth(false);
      navigate('/admin/login', { replace: true });
      return;
    }
    fetchAdminCoins();
    api.get('/app-info').then(res => {
      if (res.data?.app_name) setAdminName(res.data.app_name);
    }).catch(() => { });
    fetchGames();
    fetchAnkBids();
    fetchBidWinReport();
    fetchAutoDeposits();
  }, [setAdminAuth]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === 'dashboards') {
      fetchAdminCoins();
      fetchAnkBids();
      fetchBidWinReport();
      fetchAutoDeposits();
    } else if (activeTab === 'user_management') {
      fetchUsers();
    } else if (activeTab === 'referrals') {
      fetchReferrals();
    } else if (activeTab === 'user_commission') {
      fetchCommissions();
    } else if (activeTab === 'user_commission_pay_list') {
      fetchCommissionPayList();
    } else if (activeTab === 'game_names') {
      fetchAdminGames();
    } else if (activeTab === 'rates') {
      fetchRates();
    } else if (['settings', 'contact_settings', 'how_to_play'].includes(activeTab)) {
      fetchSettings();
    } else if (activeTab === 'sliders') {
      fetchSliders();
    } else if (activeTab === 'deposits') {
      fetchFundRequests();
    } else if (activeTab === 'withdrawals') {
      fetchWithRequests();
    } else if (activeTab === 'add_fund_wallet') {
      fetchUsers();
    } else if (activeTab === 'bid_revert') {
      if (games.length > 0 && !bidRevertGame) {
        setBidRevertGame(games[0].games_name);
      }
      fetchBidRevertList();
    } else if (activeTab === 'report_bid_history') {
      fetchReportBidHistory();
    } else if (activeTab === 'report_sell') {
      fetchReportSell();
    } else if (activeTab === 'report_winning') {
      fetchReportWinning();
    } else if (activeTab === 'report_transfer') {
      fetchReportTransfer();
    } else if (activeTab === 'report_bid_win') {
      fetchReportBidWin();
    } else if (activeTab === 'report_withdraw') {
      fetchReportWithdraw();
    } else if (activeTab === 'report_auto_deposit') {
      fetchReportAutoDeposit();
    } else if (activeTab === 'report_add_fund') {
      fetchAddFundReport();
    }
  }, [activeTab]);

  // Event Handlers
  const handleToggleUserField = async (userId, field) => {
    try {
      const res = await api.post('/admin/users/toggle-field', { userId, field }, getHeaders());
      if (res.data.success === '1') {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: res.data.newVal } : u));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update field');
    }
  };

  const handleWalletAdjust = async () => {
    if (!selectedUserModal || !walletAdjustPoints) return;
    try {
      const currentWallet = Number(selectedUserModal.wallet) || 0;
      const adjustPoints = Number(walletAdjustPoints) || 0;
      const newWallet = walletAdjustType === 'add' ? (currentWallet + adjustPoints) : Math.max(0, currentWallet - adjustPoints);

      const res = await api.post('/admin/users/update', {
        userId: selectedUserModal.id,
        wallet: newWallet
      }, getHeaders());

      if (res.data.success === '1') {
        alert('Wallet updated successfully');
        setUsers(prev => prev.map(u => u.id === selectedUserModal.id ? { ...u, wallet: newWallet } : u));
        setSelectedUserModal(null);
        setWalletAdjustPoints('');
      } else {
        alert(res.data.msg || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating user wallet');
    }
  };

  const handleAutoDepositAction = async (id, responseVal) => {
    const confirmMsg = responseVal === '1' ? 'Are you sure you want to Approve this deposit?' : 'Are you sure you want to Decline this deposit?';
    if (!window.confirm(confirmMsg)) return;
    try {
      const res = await api.post('/admin/auto-deposits/status', { id, response: responseVal }, getHeaders());
      if (res.data.success === '1') {
        alert(res.data.msg || (responseVal === '1' ? 'Deposit Approved' : 'Deposit Rejected'));
        fetchAutoDeposits();
        fetchReportAutoDeposit();
        fetchAdminCoins();
      } else {
        alert(res.data.msg || 'Failed to process auto deposit.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process auto deposit');
    }
  };

  const handleCommissionApprove = async (ids) => {
    try {
      const res = await api.post('/admin/commission/approve', { ids }, getHeaders());
      if (res.data.success === '1') {
        alert('Commission approved successfully');
        fetchCommissions();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to approve commission');
    }
  };

  const handleDeclareSubmit = async (e) => {
    e.preventDefault();
    setDeclareError('');
    setDeclareSuccess('');

    const targetGame = declareSelectedGame || (games[0]?.games_name || '');
    if (!targetGame) {
      setDeclareError('Please select a game');
      return;
    }

    const payload = {
      game_name: targetGame,
      date: declareDate,
      session: declareSession
    };

    if (declareSession === 'open') {
      if (!/^\d{3}$/.test(declareOpenPana) || !/^\d$/.test(declareOpenResult)) {
        setDeclareError('Open Pana must be 3 digits and Open Digit must be a single digit');
        return;
      }
      payload.open_pana = declareOpenPana;
      payload.open_result = declareOpenResult;
    } else {
      if (!/^\d{3}$/.test(declareClosePana) || !/^\d$/.test(declareCloseResult)) {
        setDeclareError('Close Pana must be 3 digits and Close Digit must be a single digit');
        return;
      }
      payload.close_pana = declareClosePana;
      payload.close_result = declareCloseResult;
    }

    setDeclareLoading(true);
    try {
      const res = await api.post('/admin/declare-result', payload, getHeaders());
      if (res.data.success === '1') {
        setDeclareSuccess(res.data.msg || 'Result declared successfully!');
        setDeclareOpenPana('');
        setDeclareOpenResult('');
        setDeclareClosePana('');
        setDeclareCloseResult('');
      } else {
        setDeclareError(res.data.msg || 'Declaration failed');
      }
    } catch (err) {
      console.error(err);
      setDeclareError('Error declaring result. Please check open result is declared before close.');
    } finally {
      setDeclareLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassMsg('');
    if (newPass !== retypePass) {
      setPassError('New password and confirm password do not match');
      return;
    }
    try {
      const res = await api.post('/admin/change-password', {
        oldpass: oldPass,
        newpass: newPass,
        retypepass: retypePass
      }, getHeaders());
      if (res.data.success === '1') {
        setPassMsg('Password updated successfully');
        setOldPass('');
        setNewPass('');
        setRetypePass('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPassMsg('');
        }, 1500);
      } else {
        setPassError(res.data.msg || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      setPassError('Failed to update password');
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    if (setAdminAuth) {
      setAdminAuth(false);
    }
    navigate('/admin/login', { replace: true });
  };

  // Ank Card Colors (Matching PHP card_0 to card_9)
  const ankColors = [
    { border: '#556ee6', header: '#556ee6', footer: '#556ee6' }, // 0
    { border: '#34c38f', header: '#34c38f', footer: '#34c38f' }, // 1
    { border: '#50a5f1', header: '#50a5f1', footer: '#50a5f1' }, // 2
    { border: '#f1b44c', header: '#f1b44c', footer: '#f1b44c' }, // 3
    { border: '#af3ede', header: '#af3ede', footer: '#af3ede' }, // 4
    { border: '#f1673e', header: '#f1673e', footer: '#f1673e' }, // 5
    { border: '#ea31ba', header: '#ea31ba', footer: '#ea31ba' }, // 6
    { border: '#5a3cff', header: '#5a3cff', footer: '#5a3cff' }, // 7
    { border: '#ff3c84', header: '#ff3c84', footer: '#ff3c84' }, // 8
    { border: '#0dcebc', header: '#0dcebc', footer: '#0dcebc' }, // 9
  ];

  // Helper styles
  const sidebarItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    color: isActive ? '#ffffff' : '#a6b0cf',
    backgroundColor: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
    borderLeft: isActive ? '4px solid #f1673e' : '4px solid transparent',
    fontSize: '0.88rem',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s ease'
  });

  const submenuItemStyle = (isActive) => ({
    display: 'block',
    padding: '9px 20px 9px 48px',
    color: isActive ? '#ffffff' : '#7985a9',
    fontSize: '0.84rem',
    fontWeight: isActive ? '600' : '400',
    cursor: 'pointer',
    backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
    transition: 'all 0.15s ease'
  });

  const digitBoxStyle = {
    border: '1px solid #34c38f',
    borderRadius: '4px',
    backgroundColor: 'rgba(52, 195, 143, 0.15)',
    color: '#1e7e34',
    fontWeight: '700',
    width: '45px',
    height: '42px',
    margin: '6px 8px',
    fontSize: '0.95rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'default',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
  };

  const panaBoxStyle = {
    border: '1px solid #34c38f',
    borderRadius: '4px',
    backgroundColor: 'rgba(52, 195, 143, 0.15)',
    color: '#1e7e34',
    fontWeight: '700',
    minWidth: '52px',
    padding: '0 8px',
    height: '42px',
    margin: '6px 8px',
    fontSize: '0.88rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'default',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
  };

  const ankBoxStyle = {
    border: '1px solid #f46a6a',
    borderRadius: '4px',
    backgroundColor: 'rgba(244, 106, 106, 0.18)',
    color: '#f46a6a',
    width: '45px',
    height: '42px',
    margin: '0',
    fontWeight: '700',
    fontSize: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'default',
    outline: 'none'
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    if (userFilter === 'unapproved' && u.status !== '0') return false;
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  });

  const filteredReferrals = referrals.filter(r => {
    if (!referralSearch) return true;
    const term = referralSearch.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.phone && r.phone.includes(term)) ||
      (r.referred_by_phone && r.referred_by_phone.includes(term)) ||
      (r.referrer_name && r.referrer_name.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f5f8', color: '#495057', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" }}>

      {/* 1. Left Sidebar Navigation (Matching Image 1 & 5) */}
      <div style={{
        width: '260px',
        backgroundColor: '#2a3042',
        color: '#a6b0cf',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 6px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Brand Header */}
        <div style={{
          textAlign: 'center',
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img
            src="/img/logo.png"
            alt="Logo"
            style={{ height: '36px', maxWidth: '140px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: 'bold', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {adminName || 'Admin'}
          </h3>
        </div>

        {/* Menu Items */}
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>

          {/* Dashboards */}
          <div onClick={() => setActiveTab('dashboards')} style={sidebarItemStyle(activeTab === 'dashboards')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.1rem' }}>🏠</span>
              <span>Dashboards</span>
            </div>
          </div>

          {/* User Management */}
          <div onClick={() => setActiveTab('user_management')} style={sidebarItemStyle(activeTab === 'user_management')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.1rem' }}>👥</span>
              <span>User Management</span>
            </div>
          </div>

          {/* Referral Report */}
          <div onClick={() => setActiveTab('referrals')} style={sidebarItemStyle(activeTab === 'referrals')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.1rem' }}>🔗</span>
              <span>Referral Report</span>
            </div>
          </div>

          {/* User Commission (Collapsible) */}
          {/* <div>
            <div onClick={() => toggleMenu('commission')} style={sidebarItemStyle(activeTab.startsWith('user_commission'))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>💵</span>
                <span>User Commission</span>
              </div>
              <span style={{ fontSize: '0.75rem' }}>{openMenus.commission ? '▾' : '▸'}</span>
            </div>
            {openMenus.commission && (
              <div>
                <div onClick={() => setActiveTab('user_commission')} style={submenuItemStyle(activeTab === 'user_commission')}>
                  User Commission
                </div>
                <div onClick={() => setActiveTab('user_commission_pay_list')} style={submenuItemStyle(activeTab === 'user_commission_pay_list')}>
                  User Commission Pay List
                </div>
              </div>
            )}
          </div> */}

          {/* Declare Result */}
          <div onClick={() => setActiveTab('declare_result')} style={sidebarItemStyle(activeTab === 'declare_result')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.1rem' }}>🎯</span>
              <span>Declare Result</span>
            </div>
          </div>

          {/* Winning Prediction */}
          {/* <div onClick={() => setActiveTab('winning_prediction')} style={sidebarItemStyle(activeTab === 'winning_prediction')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.1rem' }}>🎯</span>
              <span>Winning Prediction</span>
            </div>
          </div> */}

          {/* Report Management (Collapsible) */}
          <div>
            <div onClick={() => toggleMenu('reports')} style={sidebarItemStyle(activeTab.startsWith('report_'))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>📄</span>
                <span>Report Management</span>
              </div>
              <span style={{ fontSize: '0.75rem' }}>{openMenus.reports ? '▾' : '▸'}</span>
            </div>
            {openMenus.reports && (
              <div>
                <div onClick={() => setActiveTab('report_bid_history')} style={submenuItemStyle(activeTab === 'report_bid_history')}>
                  Users Bid History
                </div>
                <div onClick={() => setActiveTab('report_sell')} style={submenuItemStyle(activeTab === 'report_sell')}>
                  Customer Sell Report
                </div>
                <div onClick={() => setActiveTab('report_winning')} style={submenuItemStyle(activeTab === 'report_winning')}>
                  Winning Report
                </div>
                {/* <div onClick={() => setActiveTab('report_transfer')} style={submenuItemStyle(activeTab === 'report_transfer')}>
                  Transfer Point Report
                </div> */}
                <div onClick={() => setActiveTab('report_bid_win')} style={submenuItemStyle(activeTab === 'report_bid_win')}>
                  Bid Win Report
                </div>
                <div onClick={() => setActiveTab('report_withdraw')} style={submenuItemStyle(activeTab === 'report_withdraw')}>
                  Withdraw Report
                </div>
                <div onClick={() => setActiveTab('report_auto_deposit')} style={submenuItemStyle(activeTab === 'report_auto_deposit')}>
                  Auto Deposit History
                </div>
                <div onClick={() => setActiveTab('report_add_fund')} style={submenuItemStyle(activeTab === 'report_add_fund')}>
                  Add Fund Report
                </div>
              </div>
            )}
          </div>

          {/* Wallet Management (Collapsible) */}
          <div>
            <div onClick={() => toggleMenu('wallet')} style={sidebarItemStyle(['deposits', 'withdrawals', 'add_fund_wallet', 'bid_revert'].includes(activeTab))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>👛</span>
                <span>Wallet Management</span>
              </div>
              <span style={{ fontSize: '0.75rem' }}>{openMenus.wallet ? '▾' : '▸'}</span>
            </div>
            {openMenus.wallet && (
              <div>
                <div onClick={() => setActiveTab('deposits')} style={submenuItemStyle(activeTab === 'deposits')}>
                  Fund Request
                </div>
                <div onClick={() => setActiveTab('withdrawals')} style={submenuItemStyle(activeTab === 'withdrawals')}>
                  Withdraw Request
                </div>
                <div onClick={() => setActiveTab('add_fund_wallet')} style={submenuItemStyle(activeTab === 'add_fund_wallet')}>
                  Add Fund (User Wallet)
                </div>
                <div onClick={() => setActiveTab('bid_revert')} style={submenuItemStyle(activeTab === 'bid_revert')}>
                  Bid Revert
                </div>
              </div>
            )}
          </div>

          {/* Games Management (Collapsible) */}
          <div>
            <div onClick={() => toggleMenu('games')} style={sidebarItemStyle(['game_names', 'rates'].includes(activeTab))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>🎯</span>
                <span>Games Management</span>
              </div>
              <span style={{ fontSize: '0.75rem' }}>{openMenus.games ? '▾' : '▸'}</span>
            </div>
            {openMenus.games && (
              <div>
                <div onClick={() => setActiveTab('game_names')} style={submenuItemStyle(activeTab === 'game_names')}>
                  Game Name
                </div>
                <div onClick={() => setActiveTab('rates')} style={submenuItemStyle(activeTab === 'rates')}>
                  Game Rates
                </div>
              </div>
            )}
          </div>

          {/* Game & Numbers (Collapsible) */}
          <div>
            <div onClick={() => toggleMenu('numbers')} style={sidebarItemStyle(activeTab.startsWith('num_'))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>🎯</span>
                <span>Game & Numbers</span>
              </div>
              <span style={{ fontSize: '0.75rem' }}>{openMenus.numbers ? '▾' : '▸'}</span>
            </div>
            {openMenus.numbers && (
              <div>
                <div onClick={() => setActiveTab('num_single')} style={submenuItemStyle(activeTab === 'num_single')}>Single Digit</div>
                <div onClick={() => setActiveTab('num_jodi')} style={submenuItemStyle(activeTab === 'num_jodi')}>Jodi Digit</div>
                <div onClick={() => setActiveTab('num_single_pana')} style={submenuItemStyle(activeTab === 'num_single_pana')}>Single Pana</div>
                <div onClick={() => setActiveTab('num_double_pana')} style={submenuItemStyle(activeTab === 'num_double_pana')}>Double Pana</div>
                <div onClick={() => setActiveTab('num_triple_pana')} style={submenuItemStyle(activeTab === 'num_triple_pana')}>Tripple Pana</div>
                <div onClick={() => setActiveTab('num_half_sangam')} style={submenuItemStyle(activeTab === 'num_half_sangam')}>Half Sangam</div>
                <div onClick={() => setActiveTab('num_full_sangam')} style={submenuItemStyle(activeTab === 'num_full_sangam')}>Full Sangam</div>
              </div>
            )}
          </div>

          {/* Settings (Collapsible) */}
          <div>
            <div onClick={() => toggleMenu('settings')} style={sidebarItemStyle(['settings', 'contact_settings', 'sliders', 'how_to_play'].includes(activeTab))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>⚙️</span>
                <span>Settings</span>
              </div>
              <span style={{ fontSize: '0.75rem' }}>{openMenus.settings ? '▾' : '▸'}</span>
            </div>
            {openMenus.settings && (
              <div>
                <div onClick={() => setActiveTab('settings')} style={submenuItemStyle(activeTab === 'settings')}>
                  Main Settings
                </div>
                <div onClick={() => setActiveTab('contact_settings')} style={submenuItemStyle(activeTab === 'contact_settings')}>
                  Contact Settings
                </div>
                <div onClick={() => setActiveTab('sliders')} style={submenuItemStyle(activeTab === 'sliders')}>
                  Slider Images
                </div>
                <div onClick={() => setActiveTab('how_to_play')} style={submenuItemStyle(activeTab === 'how_to_play')}>
                  How To Play
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Sidebar Footer Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#f46a6a',
              border: '1px solid rgba(244,106,106,0.4)',
              borderRadius: '4px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Top Header Navbar (Matching Screenshot) */}
        <div style={{
          height: '70px',
          backgroundColor: '#2a3042',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '1.25rem', cursor: 'pointer', color: '#ffffff' }}>☰</span>
            <span
              style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer' }}
              onClick={() => setActiveTab('dashboards')}
            >
              Home
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', position: 'relative' }}>


            {/* Fullscreen Button */}
            <button
              onClick={toggleFullScreen}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a6b0cf',
                fontSize: '1.3rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '6px'
              }}
              title="Fullscreen"
            >
              ⛶
            </button>

            {/* User Profile Button */}
            <div
              onClick={() => setShowProfileDropdown(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: showProfileDropdown ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'background 0.2s ease'
              }}
            >
              <img
                src="/assets/images/avatar-1.jpg"
                alt="Avatar"
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.25)' }}
                onError={(e) => { e.target.src = '/assets/images/logo1.png'; }}
              />
              <span style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: '500' }}>Admin</span>
              <span style={{ fontSize: '0.75rem', color: '#a6b0cf' }}>▾</span>
            </div>

            {/* Top-Right Profile Dropdown Card (Matching Screenshot) */}
            {showProfileDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '55px',
                  right: '0px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.18)',
                  borderRadius: '6px',
                  width: '180px',
                  border: '1px solid #eff2f7',
                  overflow: 'hidden',
                  zIndex: 999
                }}
              >
                <div
                  onClick={() => {
                    setShowProfileDropdown(false);
                    setShowPasswordModal(true);
                  }}
                  style={{
                    padding: '11px 16px',
                    color: '#495057',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span>👤</span>
                  <span>Change Password</span>
                </div>

                <div
                  onClick={() => {
                    setShowProfileDropdown(false);
                    setActiveTab('settings');
                  }}
                  style={{
                    padding: '11px 16px',
                    color: '#495057',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </div>

                <div style={{ height: '1px', backgroundColor: '#eff2f7', margin: '2px 0' }} />

                <div
                  onClick={() => {
                    setShowProfileDropdown(false);
                    handleLogout();
                  }}
                  style={{
                    padding: '11px 16px',
                    color: '#f46a6a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(244,106,106,0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span>⏻</span>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Screen Views */}
        <div style={{ padding: '24px 28px', flex: 1 }}>



          {/* VIEW 1: DASHBOARDS (Matching Image 2) */}
          {activeTab === 'dashboards' && (
            <div>
              {/* Page Title & Breadcrumb */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Dashboard
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Dashboards / <span style={{ color: '#556ee6' }}>Dashboard</span>
                </div>
              </div>

              {/* Grid Row 1: Left Welcome Card + Right 3 Stat Cards & Ank Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>

                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Welcome Profile Card */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                    <div style={{ backgroundColor: 'rgba(255, 192, 203, 0.45)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h5 style={{ color: '#e53e3e', fontSize: '1.05rem', margin: '0 0 4px 0', fontWeight: '600' }}>Welcome Back !</h5>
                        <p style={{ color: '#74788d', fontSize: '0.82rem', margin: 0 }}>Admin Dashboard</p>
                      </div>
                      <img src="/assets/images/profile-img.png" alt="" style={{ width: '90px', height: 'auto' }} />
                    </div>
                    <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255, 192, 203, 0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                        <img src="/assets/images/avatar-1.jpg" alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #fff' }} />
                        <div>
                          <h6 style={{ margin: 0, fontSize: '0.95rem', color: '#495057', fontWeight: '600' }}>Lucky</h6>
                          <span style={{ fontSize: '0.78rem', color: '#74788d' }}>Admin</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px' }}>
                        <div style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('user_management'); setUserFilter('unapproved'); }}>
                          <h5 style={{ margin: '0 0 2px 0', color: '#e53e3e', fontSize: '1.15rem' }}>{metrics.unapproved_users || 0}</h5>
                          <span style={{ fontSize: '0.75rem', color: '#74788d' }}>Unapproved Users</span>
                        </div>
                        <div style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('user_management'); setUserFilter('all'); }}>
                          <h5 style={{ margin: '0 0 2px 0', color: '#34c38f', fontSize: '1.15rem' }}>{metrics.approved_users || 0}</h5>
                          <span style={{ fontSize: '0.75rem', color: '#74788d' }}>Approved Users</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market Bid Details Card */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7' }}>
                    <h5 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: '#495057', fontWeight: '600' }}>Market Bid Details</h5>
                    <label style={{ fontSize: '0.8rem', color: '#74788d', display: 'block', marginBottom: '6px' }}>Game Name</label>
                    <select
                      value={selectedGameForMarket}
                      onChange={(e) => {
                        setSelectedGameForMarket(e.target.value);
                        setMarketBidAmount(e.target.value ? '0' : 'N/A');
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem', color: '#495057', marginBottom: '14px', outline: 'none' }}
                    >
                      <option value="">-Select Game Name-</option>
                      <option value="all">All Games</option>
                      {games.map(g => (
                        <option key={g.id} value={g.games_name}>{g.games_name}</option>
                      ))}
                    </select>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '1.5rem', color: '#343a40' }}>{marketBidAmount}</h3>
                    <span style={{ fontSize: '0.78rem', color: '#74788d' }}>Market Amount</span>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* 3 Stat Cards Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    {/* Users */}
                    <div style={{ backgroundColor: 'rgba(0, 128, 255, 0.22)', padding: '16px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('user_management')}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#000000', fontWeight: '500' }}>Users</span>
                        <h4 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', color: '#000000', fontWeight: '600' }}>{metrics.total_users || 0}</h4>
                      </div>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#556ee6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                        👤
                      </div>
                    </div>

                    {/* Games */}
                    <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.22)', padding: '16px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('rates')}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#000000', fontWeight: '500' }}>Games</span>
                        <h4 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', color: '#000000', fontWeight: '600' }}>{metrics.total_games || games.length || 0}</h4>
                      </div>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#556ee6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                        🎲
                      </div>
                    </div>

                    {/* Bid Amount */}
                    <div style={{ backgroundColor: 'rgba(255, 128, 0, 0.22)', padding: '16px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#000000', fontWeight: '500' }}>Bid Amount</span>
                        <h4 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', color: '#000000', fontWeight: '600' }}>{metrics.today_bid_amount || 0}</h4>
                      </div>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#556ee6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                        🏷️
                      </div>
                    </div>
                  </div>

                  {/* Total Bids On Single Ank Section */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7' }}>
                    <h5 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#495057', fontWeight: '600' }}>
                      Total Bids On Single Ank Of Date {ankDate ? new Date(ankDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </h5>

                    {/* Filters */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1fr', gap: '14px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Date</label>
                        <input
                          type="date"
                          value={ankDate}
                          onChange={(e) => setAnkDate(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem', color: '#495057' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Game Name</label>
                        <select
                          value={ankGameName}
                          onChange={(e) => setAnkGameName(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem', color: '#495057' }}
                        >
                          <option value="">-Select Game Name-</option>
                          <option value="all">All Games</option>
                          {games.map(g => (
                            <option key={g.id} value={g.games_name}>{g.games_name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Market Time</label>
                        <select
                          value={ankMarketStatus}
                          onChange={(e) => setAnkMarketStatus(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem', color: '#495057' }}
                        >
                          <option value="open_digit">Open Market</option>
                          <option value="close_digit">Close Market</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          onClick={fetchAnkBids}
                          style={{ width: '100%', padding: '9px 12px', backgroundColor: '#f1673e', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Get
                        </button>
                      </div>
                    </div>

                    {/* 10 Ank Cards Grid (Ank 0 - 9) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((ank) => {
                        const styleConfig = ankColors[ank];
                        const data = ankBids[ank] || { bids: 0, amount: 0 };
                        return (
                          <div
                            key={ank}
                            style={{
                              border: `1px solid ${styleConfig.border}`,
                              borderRadius: '6px',
                              overflow: 'hidden',
                              backgroundColor: '#ffffff',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ padding: '8px', borderBottom: `1px solid ${styleConfig.border}`, backgroundColor: 'transparent' }}>
                              <span style={{ color: styleConfig.header, fontSize: '0.78rem', fontWeight: '600' }}>
                                Total Bids <span>{data.bids}</span>
                              </span>
                            </div>
                            <div style={{ padding: '12px 6px' }}>
                              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.25rem', color: '#343a40', fontWeight: 'bold' }}>
                                {data.amount}
                              </h3>
                              <span style={{ fontSize: '0.7rem', color: '#74788d' }}>Total Bid Amount</span>
                            </div>
                            <div style={{ backgroundColor: styleConfig.footer, color: '#ffffff', padding: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                              Ank <span>{ank}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>

              </div>

              {/* Grid Row 2: Bid Winning Report */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#495057', fontWeight: '600' }}>Bid Winning Report</h5>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Date</label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Game Name</label>
                    <select
                      value={reportGameName}
                      onChange={(e) => setReportGameName(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                    >
                      <option value="all">-All-</option>
                      {games.map(g => (
                        <option key={g.id} value={g.games_name}>{g.games_name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={fetchBidWinReport}
                      style={{ width: '100%', padding: '9px 12px', backgroundColor: '#f1673e', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Submit
                    </button>
                  </div>
                </div>

                {/* Summary Strips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ border: '1px dotted #495057', padding: '10px 16px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#74788d', fontWeight: '500' }}>Total Bid Amount</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#343a40' }}>₹ {bidWinData.total_bid}</span>
                    <button onClick={() => setActiveTab('report_bid_history')} style={{ backgroundColor: '#f1673e', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      View
                    </button>
                  </div>

                  <div style={{ border: '1px dotted #495057', padding: '10px 16px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#74788d', fontWeight: '500' }}>Total Win Amount</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#343a40' }}>₹ {bidWinData.total_win}</span>
                    <button onClick={() => setActiveTab('report_winning')} style={{ backgroundColor: '#f1673e', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      View
                    </button>
                  </div>

                  <div style={{ backgroundColor: '#34c38f', color: '#ffffff', padding: '12px 16px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Total Profit Amount</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>₹ {bidWinData.profit}</span>
                  </div>
                </div>

              </div>

              {/* Grid Row 3: Fund Request Auto Deposit History */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h5 style={{ margin: 0, fontSize: '0.95rem', color: '#495057', fontWeight: '600' }}>
                    Fund Request Auto Deposit History
                  </h5>
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={autoDepositSearch}
                    onChange={(e) => setAutoDepositSearch(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#2a3042', color: '#ffffff', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>#</th>
                        <th style={{ padding: '10px 12px' }}>User Name</th>
                        <th style={{ padding: '10px 12px' }}>Amount</th>
                        <th style={{ padding: '10px 12px' }}>UTR / Transaction No.</th>
                        <th style={{ padding: '10px 12px' }}>Request No.</th>
                        <th style={{ padding: '10px 12px' }}>Date</th>
                        <th style={{ padding: '10px 12px' }}>Screenshot</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                        <th style={{ padding: '10px 12px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {autoDeposits.filter(d => !autoDepositSearch || (d.username && d.username.includes(autoDepositSearch))).map((dep, idx) => (
                        <tr key={dep.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>{dep.user_name || dep.username}</td>
                          <td style={{ padding: '10px 12px', fontWeight: '600' }}>₹{dep.amount}</td>
                          <td style={{ padding: '10px 12px' }}>{dep.txt_request || dep.txt_id || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{dep.id}</td>
                          <td style={{ padding: '10px 12px' }}>{dep.txt_date}</td>
                          <td style={{ padding: '10px 12px' }}>-</td>
                          <td style={{ padding: '10px 12px' }}>
                            {dep.status === '1' ? (
                              <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Accepted</span>
                            ) : dep.status === '0' ? (
                              <span style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Pending</span>
                            ) : (
                              <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Rejected</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {dep.status === '0' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => handleAutoDepositAction(dep.id, '1')}
                                  style={{ backgroundColor: '#51bb25', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleAutoDepositAction(dep.id, '-1')}
                                  style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {autoDeposits.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#74788d' }}>
                            No auto deposit requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* VIEW 2: USER MANAGEMENT (Matching Image 3) */}
          {activeTab === 'user_management' && (
            <div>
              {/* Header Title & Breadcrumb */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  User List
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Dashboards / <span style={{ color: '#556ee6' }}>User List</span>
                </div>
              </div>

              {/* Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                {/* Top Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <input
                    type="text"
                    placeholder="Search users (name, phone, email)..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ width: '320px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                  />
                  <button
                    onClick={() => setUserFilter(userFilter === 'all' ? 'unapproved' : 'all')}
                    style={{
                      backgroundColor: '#f1673e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {userFilter === 'all' ? 'Un-approved Users List' : 'All Users List'}
                  </button>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#2a3042', color: '#ffffff', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>#</th>
                        <th style={{ padding: '12px' }}>User Name</th>
                        <th style={{ padding: '12px' }}>Mobile</th>
                        <th style={{ padding: '12px' }}>Email</th>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Balance</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Betting</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Transfer</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Active</th>
                        <th style={{ padding: '12px' }}>Referral (Referred by)</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, idx) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '12px' }}>{idx + 1}</td>
                          <td style={{ padding: '12px', color: '#f1673e', fontWeight: '500' }}>{u.name || 'User'}</td>
                          <td style={{ padding: '12px' }}>{u.phone}</td>
                          <td style={{ padding: '12px' }}>{u.email || '-'}</td>
                          <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{u.date || '-'}</td>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.wallet || 0}</td>

                          {/* Betting Toggle */}
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleToggleUserField(u.id, 'betting_status')}
                              style={{
                                cursor: 'pointer',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: (u.betting_status === '1' || u.betting_status === 1) ? '#2BC155' : '#FF4847',
                                backgroundColor: (u.betting_status === '1' || u.betting_status === 1) ? 'rgba(43,193,85,0.18)' : 'rgba(255,72,71,0.18)'
                              }}
                            >
                              {(u.betting_status === '1' || u.betting_status === 1) ? 'Yes' : 'No'}
                            </span>
                          </td>

                          {/* Transfer Toggle */}
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleToggleUserField(u.id, 'transfer_status')}
                              style={{
                                cursor: 'pointer',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: (u.transfer_status === '1' || u.transfer_status === 1) ? '#2BC155' : '#FF4847',
                                backgroundColor: (u.transfer_status === '1' || u.transfer_status === 1) ? 'rgba(43,193,85,0.18)' : 'rgba(255,72,71,0.18)'
                              }}
                            >
                              {(u.transfer_status === '1' || u.transfer_status === 1) ? 'Yes' : 'No'}
                            </span>
                          </td>

                          {/* Active Toggle */}
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span
                              onClick={() => handleToggleUserField(u.id, 'status')}
                              style={{
                                cursor: 'pointer',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: (u.status === '1' || u.status === 1) ? '#2BC155' : '#FF4847',
                                backgroundColor: (u.status === '1' || u.status === 1) ? 'rgba(43,193,85,0.18)' : 'rgba(255,72,71,0.18)'
                              }}
                            >
                              {(u.status === '1' || u.status === 1) ? 'Yes' : 'No'}
                            </span>
                          </td>

                          <td style={{ padding: '12px' }}>{u.referred_by_phone || '-'}</td>

                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenUserDetails(u)}
                              style={{
                                backgroundColor: '#f1673e',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 12px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DEDICATED USER DETAILS */}
          {activeTab === 'user-details' && (
            <div>
              {/* Page Title & Back Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('user_management')}
                    style={{
                      backgroundColor: '#556ee6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ← Back to User List
                  </button>
                  <select
                    value={selectedUserId || ''}
                    onChange={(e) => {
                      const uId = e.target.value;
                      if (uId) {
                        setSelectedUserId(uId);
                        localStorage.setItem('admin_selected_user_id', uId);
                        fetchUserFullDetails(uId);
                      }
                    }}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', backgroundColor: '#ffffff', outline: 'none' }}
                  >
                    <option value="">-- Select User --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.phone})</option>
                    ))}
                  </select>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', fontWeight: '700' }}>
                    User Details {userDetailsData?.user ? `| ${userDetailsData.user.name} (${userDetailsData.user.phone})` : ''}
                  </h4>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Dashboards / User List / <span style={{ color: '#556ee6' }}>User Details</span>
                </div>
              </div>

              {userDetailsLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#74788d' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
                  Fetching full user profile & transaction data...
                </div>
              ) : userDetailsData && userDetailsData.user ? (
                <div>
                  {/* Top Control Grid: 3 Main Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>

                    {/* CARD 1: USER PROFILE & PERMISSIONS */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', borderBottom: '1px solid #eff2f7', paddingBottom: '14px' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#556ee6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                          👤
                        </div>
                        <div>
                          <h5 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '700' }}>
                            {userDetailsData.user.name || 'User Profile'}
                          </h5>
                          <span style={{ fontSize: '0.8rem', color: '#74788d' }}>
                            Phone: <strong>{userDetailsData.user.phone}</strong> | Email: {userDetailsData.user.email || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.84rem', marginBottom: '16px' }}>
                        <div>
                          <span style={{ color: '#74788d', display: 'block', fontSize: '0.75rem' }}>Wallet Balance</span>
                          <span style={{ color: '#2bc155', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{userDetailsData.user.wallet || 0}</span>
                        </div>
                        <div>
                          <span style={{ color: '#74788d', display: 'block', fontSize: '0.75rem' }}>Registration Date</span>
                          <span style={{ color: '#495057', fontWeight: '600' }}>{userDetailsData.user.date || 'N/A'}</span>
                        </div>
                        <div>
                          <span style={{ color: '#74788d', display: 'block', fontSize: '0.75rem' }}>Referred By</span>
                          <span style={{ color: '#556ee6', fontWeight: '600' }}>{userDetailsData.user.referred_by_phone || 'None'}</span>
                        </div>
                        <div>
                          <span style={{ color: '#74788d', display: 'block', fontSize: '0.75rem' }}>M-PIN</span>
                          <span style={{ color: '#495057', fontWeight: '600' }}>{userDetailsData.user.m_pin || 'Not Set'}</span>
                        </div>
                      </div>

                      {/* Permissions Toggles */}
                      <div style={{ borderTop: '1px dashed #ced4da', paddingTop: '12px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#74788d', fontWeight: '600', display: 'block', marginBottom: '8px' }}>User Permissions (Click to Toggle)</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={async () => {
                              await handleToggleUserField(userDetailsData.user.id, 'status');
                              fetchUserFullDetails(selectedUserId);
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              color: '#ffffff',
                              backgroundColor: (userDetailsData.user.status === '1' || userDetailsData.user.status === 1) ? '#2bc155' : '#ef4444'
                            }}
                          >
                            Account: {(userDetailsData.user.status === '1' || userDetailsData.user.status === 1) ? 'Active ✅' : 'Inactive ❌'}
                          </button>

                          <button
                            onClick={async () => {
                              await handleToggleUserField(userDetailsData.user.id, 'betting_status');
                              fetchUserFullDetails(selectedUserId);
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              color: '#ffffff',
                              backgroundColor: (userDetailsData.user.betting_status === '1' || userDetailsData.user.betting_status === 1) ? '#2bc155' : '#ef4444'
                            }}
                          >
                            Betting: {(userDetailsData.user.betting_status === '1' || userDetailsData.user.betting_status === 1) ? 'Allowed 🎯' : 'Blocked 🛑'}
                          </button>

                          <button
                            onClick={async () => {
                              await handleToggleUserField(userDetailsData.user.id, 'transfer_status');
                              fetchUserFullDetails(selectedUserId);
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              color: '#ffffff',
                              backgroundColor: (userDetailsData.user.transfer_status === '1' || userDetailsData.user.transfer_status === 1) ? '#2bc155' : '#ef4444'
                            }}
                          >
                            Transfer: {(userDetailsData.user.transfer_status === '1' || userDetailsData.user.transfer_status === 1) ? 'Yes 💸' : 'No 🔒'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: PASSWORD SECURITY & CHANGE PASSWORD */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                      <h5 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: '#495057', fontWeight: '700', borderBottom: '1px solid #eff2f7', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🔑 Password & Security
                      </h5>

                      {/* Show Password Widget */}
                      <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #e9ecef' }}>
                        <span style={{ fontSize: '0.75rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Current User Password</span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#2a3042' }}>
                            {showPassword ? (userDetailsData.user.password || 'Not Set') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#556ee6', fontWeight: '600' }}
                          >
                            {showPassword ? '🙈 Hide' : '👁️ Show Password'}
                          </button>
                        </div>
                      </div>

                      {/* Change Password Form */}
                      <form onSubmit={handleUpdatePasswordSubmit}>
                        <label style={{ fontSize: '0.78rem', color: '#495057', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                          Change User Password
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Enter new password"
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            required
                            style={{ flex: 1, padding: '8px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                          />
                          <button
                            type="submit"
                            disabled={passwordUpdating}
                            style={{
                              backgroundColor: '#556ee6',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {passwordUpdating ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* CARD 3: WALLET ADD / MINUS AMOUNT CONTROLS */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                      <h5 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: '#495057', fontWeight: '700', borderBottom: '1px solid #eff2f7', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        💰 Wallet Control (Add / Deduct)
                      </h5>

                      <form onSubmit={handleAdjustWalletSubmit}>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '0.75rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Operation Type</label>
                          <div style={{ display: 'flex', gap: '14px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', cursor: 'pointer', color: '#2bc155', fontWeight: 'bold' }}>
                              <input
                                type="radio"
                                name="walletType"
                                value="add"
                                checked={walletAdjType === 'add'}
                                onChange={() => setWalletAdjType('add')}
                              />
                              ➕ Add Amount (+)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}>
                              <input
                                type="radio"
                                name="walletType"
                                value="deduct"
                                checked={walletAdjType === 'deduct'}
                                onChange={() => setWalletAdjType('deduct')}
                              />
                              ➖ Deduct Amount (-)
                            </label>
                          </div>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '0.75rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="Enter amount"
                            value={walletAdjAmount}
                            onChange={(e) => setWalletAdjAmount(e.target.value)}
                            min="1"
                            required
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                          />
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ fontSize: '0.75rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Remark</label>
                          <input
                            type="text"
                            placeholder="Remark (e.g. Deposit Bonus / Correction)"
                            value={walletAdjRemark}
                            onChange={(e) => setWalletAdjRemark(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={walletAdjSubmitting}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            backgroundColor: walletAdjType === 'add' ? '#2bc155' : '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.88rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {walletAdjSubmitting ? 'Processing...' : walletAdjType === 'add' ? 'Add Amount To Wallet' : 'Deduct Amount From Wallet'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* BOTTOM SECTION: 4 RICH INTERACTIVE DATA TABLES */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #eff2f7', marginBottom: '20px' }}>
                      <button
                        onClick={() => setActiveUserSubTab('wallet')}
                        style={{
                          padding: '10px 18px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          borderBottom: activeUserSubTab === 'wallet' ? '3px solid #556ee6' : '3px solid transparent',
                          color: activeUserSubTab === 'wallet' ? '#556ee6' : '#74788d',
                          fontWeight: activeUserSubTab === 'wallet' ? 'bold' : '500',
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        💳 Wallet History ({(userDetailsData.walletHistory || []).length})
                      </button>

                      <button
                        onClick={() => setActiveUserSubTab('bids')}
                        style={{
                          padding: '10px 18px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          borderBottom: activeUserSubTab === 'bids' ? '3px solid #556ee6' : '3px solid transparent',
                          color: activeUserSubTab === 'bids' ? '#556ee6' : '#74788d',
                          fontWeight: activeUserSubTab === 'bids' ? 'bold' : '500',
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        🎲 Bid History ({(userDetailsData.bids || []).length})
                      </button>

                      <button
                        onClick={() => setActiveUserSubTab('winnings')}
                        style={{
                          padding: '10px 18px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          borderBottom: activeUserSubTab === 'winnings' ? '3px solid #556ee6' : '3px solid transparent',
                          color: activeUserSubTab === 'winnings' ? '#556ee6' : '#74788d',
                          fontWeight: activeUserSubTab === 'winnings' ? 'bold' : '500',
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        🏆 Winning Report ({(userDetailsData.winnings || []).length})
                      </button>

                      <button
                        onClick={() => setActiveUserSubTab('referrals')}
                        style={{
                          padding: '10px 18px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          borderBottom: activeUserSubTab === 'referrals' ? '3px solid #556ee6' : '3px solid transparent',
                          color: activeUserSubTab === 'referrals' ? '#556ee6' : '#74788d',
                          fontWeight: activeUserSubTab === 'referrals' ? 'bold' : '500',
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        👥 Referrals List ({(userDetailsData.referrals || []).length})
                      </button>
                    </div>

                    {/* TAB 1: WALLET HISTORY */}
                    {activeUserSubTab === 'wallet' && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#2a3042', color: '#ffffff', textAlign: 'left' }}>
                              <th style={{ padding: '10px 12px' }}>#</th>
                              <th style={{ padding: '10px 12px' }}>Date & Time</th>
                              <th style={{ padding: '10px 12px' }}>Amount</th>
                              <th style={{ padding: '10px 12px' }}>Updated Balance</th>
                              <th style={{ padding: '10px 12px' }}>Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(userDetailsData.walletHistory || []).map((w, idx) => {
                              const isPlus = (w.amount || '').toString().startsWith('+') || parseFloat(w.amount || '0') > 0;
                              return (
                                <tr key={w.id || idx} style={{ borderBottom: '1px solid #eff2f7' }}>
                                  <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{w.date} {w.time || ''}</td>
                                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: isPlus ? '#2bc155' : '#ef4444' }}>
                                    {w.amount}
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: '600' }}>₹{w.updated_amount || w.amount}</td>
                                  <td style={{ padding: '10px 12px' }}>{w.remark || '-'}</td>
                                </tr>
                              );
                            })}
                            {(!userDetailsData.walletHistory || userDetailsData.walletHistory.length === 0) && (
                              <tr>
                                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>
                                  No wallet transaction records found for this user.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB 2: BID HISTORY */}
                    {activeUserSubTab === 'bids' && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#2a3042', color: '#ffffff', textAlign: 'left' }}>
                              <th style={{ padding: '10px 12px' }}>#</th>
                              <th style={{ padding: '10px 12px' }}>Game Name</th>
                              <th style={{ padding: '10px 12px' }}>Game Type</th>
                              <th style={{ padding: '10px 12px' }}>Session</th>
                              <th style={{ padding: '10px 12px' }}>Open Pana / Digit</th>
                              <th style={{ padding: '10px 12px' }}>Close Pana / Digit</th>
                              <th style={{ padding: '10px 12px' }}>Points (₹)</th>
                              <th style={{ padding: '10px 12px' }}>Date & Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(userDetailsData.bids || []).map((b, idx) => (
                              <tr key={b.id || idx} style={{ borderBottom: '1px solid #eff2f7' }}>
                                <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                                <td style={{ padding: '10px 12px', fontWeight: '600', color: '#556ee6' }}>{b.game_name}</td>
                                <td style={{ padding: '10px 12px' }}>{b.game_type}</td>
                                <td style={{ padding: '10px 12px' }}>{b.session}</td>
                                <td style={{ padding: '10px 12px' }}>{b.open_pana && b.open_pana !== 'NA' ? `${b.open_pana} - ` : ''}{b.open_digit || '-'}</td>
                                <td style={{ padding: '10px 12px' }}>{b.close_pana && b.close_pana !== 'NA' ? `${b.close_pana} - ` : ''}{b.close_digit || '-'}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#f1673e' }}>₹{b.points_action}</td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{b.date} {b.time || ''}</td>
                              </tr>
                            ))}
                            {(!userDetailsData.bids || userDetailsData.bids.length === 0) && (
                              <tr>
                                <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>
                                  No bid records found for this user.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB 3: WINNING REPORT */}
                    {activeUserSubTab === 'winnings' && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#2a3042', color: '#ffffff', textAlign: 'left' }}>
                              <th style={{ padding: '10px 12px' }}>#</th>
                              <th style={{ padding: '10px 12px' }}>Game Name</th>
                              <th style={{ padding: '10px 12px' }}>Game Type</th>
                              <th style={{ padding: '10px 12px' }}>Session</th>
                              <th style={{ padding: '10px 12px' }}>Winning Points (₹)</th>
                              <th style={{ padding: '10px 12px' }}>Date & Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(userDetailsData.winnings || []).map((w, idx) => (
                              <tr key={w.id || idx} style={{ borderBottom: '1px solid #eff2f7' }}>
                                <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                                <td style={{ padding: '10px 12px', fontWeight: '600', color: '#556ee6' }}>{w.game_name}</td>
                                <td style={{ padding: '10px 12px' }}>{w.game_type || '-'}</td>
                                <td style={{ padding: '10px 12px' }}>{w.session || '-'}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#2bc155' }}>₹{w.winning_points}</td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{w.date} {w.time || ''}</td>
                              </tr>
                            ))}
                            {(!userDetailsData.winnings || userDetailsData.winnings.length === 0) && (
                              <tr>
                                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>
                                  No winning records found for this user.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB 4: REFERRALS LIST */}
                    {activeUserSubTab === 'referrals' && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#2a3042', color: '#ffffff', textAlign: 'left' }}>
                              <th style={{ padding: '10px 12px' }}>#</th>
                              <th style={{ padding: '10px 12px' }}>Referred User Name</th>
                              <th style={{ padding: '10px 12px' }}>Mobile Phone</th>
                              <th style={{ padding: '10px 12px' }}>Email</th>
                              <th style={{ padding: '10px 12px' }}>Registration Date</th>
                              <th style={{ padding: '10px 12px' }}>Wallet Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(userDetailsData.referrals || []).map((ref, idx) => (
                              <tr key={ref.id || idx} style={{ borderBottom: '1px solid #eff2f7' }}>
                                <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                                <td style={{ padding: '10px 12px', fontWeight: '600', color: '#f1673e' }}>{ref.name}</td>
                                <td style={{ padding: '10px 12px' }}>{ref.phone}</td>
                                <td style={{ padding: '10px 12px' }}>{ref.email || '-'}</td>
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{ref.date || '-'}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>₹{ref.wallet || 0}</td>
                              </tr>
                            ))}
                            {(!userDetailsData.referrals || userDetailsData.referrals.length === 0) && (
                              <tr>
                                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>
                                  No referral registrations found for this user.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
                  Failed to load user profile. User not found.
                </div>
              )}
            </div>
          )}

          {/* User Modal with Contrast Fix */}
          {selectedUserModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}>
              <div style={{ backgroundColor: '#ffffff', color: '#495057', width: '460px', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h5 style={{ margin: 0, color: '#343a40', fontWeight: 'bold', fontSize: '1.05rem' }}>User Profile & Wallet Points</h5>
                  <span style={{ cursor: 'pointer', fontSize: '1.3rem', color: '#74788d', lineHeight: 1 }} onClick={() => setSelectedUserModal(null)}>✕</span>
                </div>

                <div style={{ marginBottom: '16px', fontSize: '0.88rem', color: '#495057', backgroundColor: '#f8f9fa', padding: '14px 16px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                  <p style={{ margin: '6px 0', color: '#495057' }}><strong style={{ color: '#343a40', minWidth: '120px', display: 'inline-block' }}>Name:</strong> {selectedUserModal.name}</p>
                  <p style={{ margin: '6px 0', color: '#495057' }}><strong style={{ color: '#343a40', minWidth: '120px', display: 'inline-block' }}>Phone:</strong> {selectedUserModal.phone}</p>
                  <p style={{ margin: '6px 0', color: '#495057' }}><strong style={{ color: '#343a40', minWidth: '120px', display: 'inline-block' }}>Email:</strong> {selectedUserModal.email || 'N/A'}</p>
                  <p style={{ margin: '6px 0', color: '#495057' }}><strong style={{ color: '#343a40', minWidth: '120px', display: 'inline-block' }}>Current Wallet:</strong> <span style={{ color: '#2BC155', fontWeight: 'bold', fontSize: '1.05rem' }}>₹{selectedUserModal.wallet || 0}</span></p>
                </div>

                <h6 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#343a40', fontWeight: 'bold' }}>Adjust Wallet Balance</h6>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <select
                    value={walletAdjustType}
                    onChange={(e) => setWalletAdjustType(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', backgroundColor: '#ffffff', outline: 'none' }}
                  >
                    <option value="add">Add (+)</option>
                    <option value="deduct">Deduct (-)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Enter points"
                    value={walletAdjustPoints}
                    onChange={(e) => setWalletAdjustPoints(e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', backgroundColor: '#ffffff', outline: 'none' }}
                  />
                </div>

                <button
                  onClick={handleWalletAdjust}
                  style={{
                    width: '100%',
                    backgroundColor: '#556ee6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '11px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(85, 110, 230, 0.3)'
                  }}
                >
                  Update Wallet
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: REFERRAL REPORT (Matching Image 4) */}
          {activeTab === 'referrals' && (
            <div>
              {/* Header Title & Breadcrumb */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Referral Report
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  User Management / <span style={{ color: '#556ee6' }}>Referral Report</span>
                </div>
              </div>

              {/* Card Container */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#74788d' }}>Referrals List</span>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={referralSearch}
                    onChange={(e) => setReferralSearch(e.target.value)}
                    style={{ width: '250px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#2a3042', color: '#ffffff', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>#</th>
                        <th style={{ padding: '12px' }}>Referred User (Name)</th>
                        <th style={{ padding: '12px' }}>Referred User (Phone)</th>
                        <th style={{ padding: '12px' }}>Referred By (Phone)</th>
                        <th style={{ padding: '12px' }}>Referrer Name</th>
                        <th style={{ padding: '12px' }}>Signup Date</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferrals.map((row, idx) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '12px' }}>{idx + 1}</td>
                          <td style={{ padding: '12px' }}>{row.name}</td>
                          <td style={{ padding: '12px' }}>{row.phone}</td>
                          <td style={{ padding: '12px' }}>{row.referred_by_phone}</td>
                          <td style={{ padding: '12px' }}>{row.referrer_name || '—'}</td>
                          <td style={{ padding: '12px' }}>{row.date}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                const found = users.find(u => u.phone === row.phone);
                                if (found) setSelectedUserModal(found);
                              }}
                              style={{
                                backgroundColor: '#f1673e',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 12px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredReferrals.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>
                            No referral data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4A: USER COMMISSION (PENDING APPROVAL - Matching Image 5) */}
          {activeTab === 'user_commission' && (
            <div>
              {/* Header Title & Breadcrumb */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  USER COMMISSION (PENDING APPROVAL)
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  User Commission / <span style={{ color: '#556ee6' }}>Pending List</span>
                </div>
              </div>

              {/* Card Container */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7' }}>
                <p style={{ color: '#74788d', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
                  Referral commission list (date-wise). Approve single or select multiple and approve.
                </p>

                {/* Filters Row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>From Date</label>
                    <input
                      type="date"
                      value={commissionFromDate}
                      onChange={(e) => setCommissionFromDate(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>To Date</label>
                    <input
                      type="date"
                      value={commissionToDate}
                      onChange={(e) => setCommissionToDate(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    onClick={fetchCommissions}
                    style={{
                      backgroundColor: '#f1673e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '9px 18px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Filter
                  </button>

                  {selectedCommissionIds.length > 0 && (
                    <button
                      onClick={() => handleCommissionApprove(selectedCommissionIds)}
                      style={{
                        backgroundColor: '#34c38f',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '9px 18px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Approve Selected ({selectedCommissionIds.length})
                    </button>
                  )}
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#2a3042', color: '#ffffff', textAlign: 'left' }}>
                        <th style={{ padding: '12px', width: '30px' }}>
                          <input
                            type="checkbox"
                            checked={commissionList.length > 0 && selectedCommissionIds.length === commissionList.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCommissionIds(commissionList.map(c => c.id));
                              } else {
                                setSelectedCommissionIds([]);
                              }
                            }}
                          />
                        </th>
                        <th style={{ padding: '12px' }}>#</th>
                        <th style={{ padding: '12px' }}>Referrer (Name)</th>
                        <th style={{ padding: '12px' }}>Referrer (Phone)</th>
                        <th style={{ padding: '12px' }}>Referred User</th>
                        <th style={{ padding: '12px' }}>Amount (₹)</th>
                        <th style={{ padding: '12px' }}>Game / Date</th>
                        <th style={{ padding: '12px' }}>Created</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionList.map((comm, idx) => (
                        <tr key={comm.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '12px' }}>
                            <input
                              type="checkbox"
                              checked={selectedCommissionIds.includes(comm.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCommissionIds(prev => [...prev, comm.id]);
                                } else {
                                  setSelectedCommissionIds(prev => prev.filter(id => id !== comm.id));
                                }
                              }}
                            />
                          </td>
                          <td style={{ padding: '12px' }}>{idx + 1}</td>
                          <td style={{ padding: '12px' }}>{comm.referrer_name || '-'}</td>
                          <td style={{ padding: '12px' }}>{comm.referrer_phone}</td>
                          <td style={{ padding: '12px' }}>{comm.referred_user_phone}</td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>₹{comm.amount}</td>
                          <td style={{ padding: '12px' }}>{comm.game_name} ({comm.bid_date})</td>
                          <td style={{ padding: '12px' }}>{comm.created_at}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleCommissionApprove([comm.id])}
                              style={{
                                backgroundColor: '#51bb25',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                      {commissionList.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>
                            No pending commission in this date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* VIEW 4B: USER COMMISSION PAY LIST (Matching User Screenshot) */}
          {activeTab === 'user_commission_pay_list' && (
            <div>
              {/* Header Title & Breadcrumb */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  USER COMMISSION PAY LIST
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  User Commission / <span style={{ color: '#556ee6' }}>Pay List</span>
                </div>
              </div>

              {/* Card Container */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7' }}>
                <p style={{ color: '#74788d', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
                  Report of commission already paid to referrers (date-wise).
                </p>

                {/* Filters Row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>From Date</label>
                    <input
                      type="date"
                      value={payListFromDate}
                      onChange={(e) => setPayListFromDate(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>To Date</label>
                    <input
                      type="date"
                      value={payListToDate}
                      onChange={(e) => setPayListToDate(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    onClick={fetchCommissionPayList}
                    style={{
                      backgroundColor: '#f1673e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '9px 18px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Filter
                  </button>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#2a3042', color: '#ffffff', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>#</th>
                        <th style={{ padding: '12px' }}>Referrer (Name)</th>
                        <th style={{ padding: '12px' }}>Referrer (Phone)</th>
                        <th style={{ padding: '12px' }}>Referred User (Phone)</th>
                        <th style={{ padding: '12px' }}>Amount (₹)</th>
                        <th style={{ padding: '12px' }}>Game / Bid Date</th>
                        <th style={{ padding: '12px' }}>Approved (Created)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionPayList.map((comm, idx) => (
                        <tr key={comm.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '12px' }}>{idx + 1}</td>
                          <td style={{ padding: '12px' }}>{comm.referrer_name || '-'}</td>
                          <td style={{ padding: '12px' }}>{comm.referrer_phone}</td>
                          <td style={{ padding: '12px' }}>{comm.referred_user_phone}</td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#2BC155' }}>₹{comm.amount}</td>
                          <td style={{ padding: '12px' }}>{comm.game_name} ({comm.bid_date})</td>
                          <td style={{ padding: '12px' }}>{comm.created_at}</td>
                        </tr>
                      ))}
                      {commissionPayList.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>
                            No paid commission in this date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* VIEW: GAMES MANAGEMENT - GAME NAME (PHP game-name.php parity) */}
          {activeTab === 'game_names' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Game Name List
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Games Management / <span style={{ color: '#556ee6' }}>Game Name</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h5 style={{ margin: 0, fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>Game Name List</h5>
                    <span style={{ fontSize: '0.82rem', color: '#74788d', backgroundColor: '#f8f9fa', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e9ecef' }}>
                      Total: {adminGamesList.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Search game..."
                      value={adminGamesSearch}
                      onChange={(e) => setAdminGamesSearch(e.target.value)}
                      style={{ padding: '7px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem', width: '200px' }}
                    />
                    <button
                      onClick={() => setShowAddGameModal(true)}
                      style={{
                        backgroundColor: '#556ee6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      + Add Game
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Game Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Today Open</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Today Close</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Active</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Market Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminGamesList
                        .filter(g => !adminGamesSearch || g.game.toLowerCase().includes(adminGamesSearch.toLowerCase()))
                        .map((g, idx) => (
                          <tr key={g.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                            <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#343a40' }}>{g.game}</td>
                            <td style={{ padding: '10px 12px' }}>{g.open_time}</td>
                            <td style={{ padding: '10px 12px' }}>{g.close_time}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              {(g.status === '1' || g.status === 1) ? (
                                <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>YES</span>
                              ) : (
                                <span style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>NO</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              {g.market_status === 'Market Running' ? (
                                <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Market Running</span>
                              ) : (
                                <span style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Market Closed</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleOpenEditWeek(g.game)}
                                  style={{ backgroundColor: '#556ee6', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  EDIT
                                </button>
                                <button
                                  onClick={() => handleDeleteGame(g.game)}
                                  style={{ backgroundColor: '#f46a6a', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  DELETE
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {adminGamesList.length === 0 && !adminGamesLoading && (
                        <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Games Added!</td></tr>
                      )}
                      {adminGamesLoading && (
                        <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Games...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GAMES MANAGEMENT - GAME RATES (PHP game-rates.php parity) */}
          {activeTab === 'rates' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Game Rates Management
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Games Management / <span style={{ color: '#556ee6' }}>Game Rates</span>
                </div>
              </div>

              <div style={{ maxWidth: '850px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '28px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <h5 style={{ margin: '0 0 18px 0', fontSize: '1.1rem', color: '#495057', fontWeight: '600' }}>
                  Add Games Rate
                </h5>

                {gameRatesMsg && (
                  <div style={{ backgroundColor: '#def7ec', color: '#03543f', border: '1px solid #bcf0da', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                    ✓ {gameRatesMsg}
                  </div>
                )}
                {gameRatesError && (
                  <div style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: '1px solid #f8b4b4', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                    ⚠️ {gameRatesError}
                  </div>
                )}

                <form onSubmit={handleUpdateGameRates}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    {[
                      { key: 'Single Digit', label: 'Single Digit' },
                      { key: 'Jodi Digit', label: 'Jodi Digit' },
                      { key: 'Single Pana', label: 'Single Pana' },
                      { key: 'Double Pana', label: 'Double Pana' },
                      { key: 'Triple Pana', label: 'Tripple Pana' },
                      { key: 'Half Sangam', label: 'Half Sangam' },
                      { key: 'Full Sangam', label: 'Full Sangam' }
                    ].map(({ key, label }) => {
                      const currentVal = gameRatesForm[key] || { min_value: '', max_value: '' };
                      return (
                        <React.Fragment key={key}>
                          <div>
                            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                              {label} Value 1
                            </label>
                            <input
                              type="number"
                              value={currentVal.min_value || ''}
                              onChange={(e) => setGameRatesForm({
                                ...gameRatesForm,
                                [key]: { ...currentVal, min_value: e.target.value }
                              })}
                              required
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                              {label} Value 2
                            </label>
                            <input
                              type="number"
                              value={currentVal.max_value || ''}
                              onChange={(e) => setGameRatesForm({
                                ...gameRatesForm,
                                [key]: { ...currentVal, max_value: e.target.value }
                              })}
                              required
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                            />
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    disabled={gameRatesLoading}
                    style={{
                      backgroundColor: '#556ee6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '11px 28px',
                      fontSize: '0.92rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(85, 110, 230, 0.3)'
                    }}
                  >
                    {gameRatesLoading ? 'Saving...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: GAME & NUMBERS - SINGLE DIGIT (PHP single-digit.php parity) */}
          {activeTab === 'num_single' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Single Digit Numbers
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Game & Numbers / <span style={{ color: '#556ee6' }}>Single Digit</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                  Single Digit Numbers
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {SINGLE_DIGITS.map(d => (
                    <button key={d} style={digitBoxStyle}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GAME & NUMBERS - JODI DIGIT (PHP jodi-digit.php parity) */}
          {activeTab === 'num_jodi' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Jodi Digit Numbers
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Game & Numbers / <span style={{ color: '#556ee6' }}>Jodi Digit</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                  Jodi Digit Numbers (Total 100)
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {JODI_DIGITS.map(j => (
                    <button key={j} style={digitBoxStyle}>{j}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GAME & NUMBERS - SINGLE PANA (PHP single-pana.php parity) */}
          {activeTab === 'num_single_pana' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Single Pana Numbers
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Game & Numbers / <span style={{ color: '#556ee6' }}>Single Pana</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <h5 style={{ margin: '0 0 18px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                  Single Pana Numbers
                </h5>

                {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(ank => (
                  <div key={ank} style={{ marginBottom: '22px', paddingBottom: '16px', borderBottom: ank !== '9' ? '1px dashed #eff2f7' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h6 style={{ margin: 0, fontSize: '0.92rem', color: '#495057', fontWeight: '700' }}>Single Ank</h6>
                      <button style={ankBoxStyle}>{ank}</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(SINGLE_PANAS_BY_ANK[ank] || []).map(p => (
                        <button key={p} style={panaBoxStyle}>{p}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: GAME & NUMBERS - DOUBLE PANA (PHP double-pana.php parity) */}
          {activeTab === 'num_double_pana' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Double Pana Numbers
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Game & Numbers / <span style={{ color: '#556ee6' }}>Double Pana</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <h5 style={{ margin: '0 0 18px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                  Double Pana Numbers
                </h5>

                {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(ank => (
                  <div key={ank} style={{ marginBottom: '22px', paddingBottom: '16px', borderBottom: ank !== '9' ? '1px dashed #eff2f7' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h6 style={{ margin: 0, fontSize: '0.92rem', color: '#495057', fontWeight: '700' }}>Single Ank</h6>
                      <button style={ankBoxStyle}>{ank}</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(DOUBLE_PANAS_BY_ANK[ank] || []).map(p => (
                        <button key={p} style={panaBoxStyle}>{p}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: GAME & NUMBERS - TRIPPLE PANA (PHP tripple-pana.php parity) */}
          {activeTab === 'num_triple_pana' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Tripple Pana Numbers
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Game & Numbers / <span style={{ color: '#556ee6' }}>Tripple Pana</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                  Tripple Pana Numbers
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {TRIPLE_PANAS.map(p => (
                    <button key={p} style={panaBoxStyle}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GAME & NUMBERS - HALF SANGAM (PHP half-sangam.php parity) */}
          {activeTab === 'num_half_sangam' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Half Sangam Numbers
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Game & Numbers / <span style={{ color: '#556ee6' }}>Half Sangam</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ marginBottom: '28px' }}>
                  <h5 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '700' }}>
                    Open Ank
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {SINGLE_DIGITS.map(d => (
                      <button key={d} style={digitBoxStyle}>{d}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '700' }}>
                    Close Ank (Total 220 Panas)
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {ALL_PANAS_220.map(p => (
                      <button key={'hs_' + p} style={panaBoxStyle}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GAME & NUMBERS - FULL SANGAM (PHP full-sangam.php parity) */}
          {activeTab === 'num_full_sangam' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Full Sangam Numbers
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Game & Numbers / <span style={{ color: '#556ee6' }}>Full Sangam</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ marginBottom: '28px' }}>
                  <h5 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '700' }}>
                    Open Ank (Total 220 Panas)
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {ALL_PANAS_220.map(p => (
                      <button key={'fs_open_' + p} style={panaBoxStyle}>{p}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '700' }}>
                    Close Ank (Total 220 Panas)
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {ALL_PANAS_220.map(p => (
                      <button key={'fs_close_' + p} style={panaBoxStyle}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS - MAIN SETTINGS (PHP main-settings.php parity) */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Main Settings
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Settings / <span style={{ color: '#556ee6' }}>Main Settings</span>
                </div>
              </div>

              {settingsMsg && (
                <div style={{ backgroundColor: '#def7ec', color: '#03543f', border: '1px solid #bcf0da', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                  ✓ {settingsMsg}
                </div>
              )}
              {settingsError && (
                <div style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: '1px solid #f8b4b4', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                  ⚠️ {settingsError}
                </div>
              )}

              {/* Top Row: Bank Details & UPI/QR */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* 1. Add Bank Details */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                  <h5 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                    Add Bank Details
                  </h5>
                  <form onSubmit={handleSaveBankDetails}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Account Holder Name</label>
                      <input
                        type="text"
                        placeholder="Enter Account Holder Name"
                        value={settingsData.ac_name || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, ac_name: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Account Number</label>
                      <input
                        type="text"
                        placeholder="Enter Account Number"
                        value={settingsData.ac_number || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, ac_number: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>IFSC Code</label>
                      <input
                        type="text"
                        placeholder="Enter IFSC Code"
                        value={settingsData.ifsc_code || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, ifsc_code: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      style={{ backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '9px 24px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {settingsLoading ? 'Saving...' : 'Submit'}
                    </button>
                  </form>
                </div>

                {/* 2. UPI & QR Code */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                    UPI &amp; QR Code (Add Fund)
                  </h5>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#74788d' }}>
                    Sirf ek UPI ID aur ek QR image. Frontend par checkbox ke hisaab se UPI ya QR ya dono dikhenge.
                  </p>
                  <form onSubmit={handleSaveUpiQr}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>UPI ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210@paytm"
                        value={settingsData.payment_upi_id || settingsData.upi_payment_id || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, payment_upi_id: e.target.value, upi_payment_id: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>QR Code Image (Pick File or Enter URL)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFilePick(e, (base64) => setSettingsData(prev => ({ ...prev, payment_barcode_image: base64 })))}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            fontSize: '0.85rem',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer'
                          }}
                        />

                        <input
                          type="text"
                          placeholder="e.g. uploads/qr/qr_code.png or Data URL"
                          value={settingsData.payment_barcode_image || ''}
                          onChange={(e) => setSettingsData({ ...settingsData, payment_barcode_image: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.82rem', color: '#495057' }}
                        />

                        {settingsData.payment_barcode_image && (
                          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8f9fa', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                            <img
                              src={settingsData.payment_barcode_image.startsWith('http') || settingsData.payment_barcode_image.startsWith('data:') ? settingsData.payment_barcode_image : `/uploads/${settingsData.payment_barcode_image}`}
                              alt="QR Code Preview"
                              style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #ced4da', backgroundColor: '#fff' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span style={{ fontSize: '0.78rem', color: '#2BC155', fontWeight: 'bold' }}>✓ QR Code Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="show_upi"
                        checked={Boolean(settingsData.show_upi === 1 || settingsData.show_upi === '1' || settingsData.show_upi === true)}
                        onChange={(e) => setSettingsData({ ...settingsData, show_upi: e.target.checked ? 1 : 0 })}
                      />
                      <label htmlFor="show_upi" style={{ fontSize: '0.85rem', color: '#495057', cursor: 'pointer' }}>
                        Show UPI on frontend (Add Point)
                      </label>
                    </div>
                    <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="show_qr"
                        checked={Boolean(settingsData.show_qr === 1 || settingsData.show_qr === '1' || settingsData.show_qr === true)}
                        onChange={(e) => setSettingsData({ ...settingsData, show_qr: e.target.checked ? 1 : 0 })}
                      />
                      <label htmlFor="show_qr" style={{ fontSize: '0.85rem', color: '#495057', cursor: 'pointer' }}>
                        Show QR Code on frontend (Add Point)
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      style={{ backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '9px 24px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {settingsLoading ? 'Saving...' : 'Save'}
                    </button>
                  </form>
                </div>

                {/* 3. M-PIN Lock Screen Setting */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                    M-PIN Lock Screen Setting
                  </h5>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#74788d' }}>
                    User app opening par 4-digit M-PIN lock screen enable/disable karein.
                  </p>
                  <form onSubmit={handleSaveMpinSetting}>
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '8px' }}>M-PIN Status</label>
                      <select
                        value={String(settingsData.mpin_status ?? '1')}
                        onChange={(e) => setSettingsData({ ...settingsData, mpin_status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da',
                          fontSize: '0.88rem',
                          fontWeight: '600',
                          color: settingsData.mpin_status === '0' ? '#e53e3e' : '#28a745',
                          backgroundColor: '#f8f9fa'
                        }}
                      >
                        <option value="1">🟢 Active (Enable M-PIN Lock Screen)</option>
                        <option value="0">🔴 Inactive (Disable M-PIN Lock Screen)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      style={{ backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '9px 24px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {settingsLoading ? 'Saving...' : 'Update M-PIN Setting'}
                    </button>
                  </form>
                </div>

                {/* 4. Slider Images Display Setting */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                    Slider Images Display Setting
                  </h5>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#74788d' }}>
                    Home page par Multiple Slider Images dikhane ya chhipane ki setting.
                  </p>
                  <form onSubmit={handleSaveSliderSetting}>
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '8px' }}>Slider Display Status</label>
                      <select
                        value={String(settingsData.slider_status ?? '1')}
                        onChange={(e) => setSettingsData({ ...settingsData, slider_status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da',
                          fontSize: '0.88rem',
                          fontWeight: '600',
                          color: settingsData.slider_status === '0' ? '#e53e3e' : '#28a745',
                          backgroundColor: '#f8f9fa'
                        }}
                      >
                        <option value="1">🟢 Active (Show Slider Images on Home Page)</option>
                        <option value="0">🔴 Inactive (Hide Slider Images on Home Page)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      style={{ backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '9px 24px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {settingsLoading ? 'Saving...' : 'Update Slider Setting'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Bottom Card: Add Value's (System Limits & Times) */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <h5 style={{ margin: '0 0 18px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                  Add Value's
                </h5>
                <form onSubmit={handleSaveValuesAndLimits}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Minimum Deposite</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.min_deposite ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, min_deposite: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Maximum Deposite</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.max_deposite ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, max_deposite: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Minimum Withdrawal</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.min_withdrawal ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, min_withdrawal: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Maximum Withdrawal</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.max_withdrawal ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, max_withdrawal: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Minimum Transfer</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.min_transfer ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, min_transfer: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Maximum Transfer</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.max_transfer ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, max_transfer: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Minimum Bid Amount</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.min_bid_amt ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, min_bid_amt: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Maximum Bid Amount</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.max_bid_amt ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, max_bid_amt: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Welcome Bonus</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.Dragon_bonus ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, Dragon_bonus: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Referral Commission (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settingsData.referral_commission ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, referral_commission: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Minimum Wallet Amount</label>
                      <input
                        type="number"
                        min="0"
                        value={settingsData.min_wallet_amount ?? ''}
                        onChange={(e) => setSettingsData({ ...settingsData, min_wallet_amount: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Alert Marquee Message</label>
                      <input
                        type="text"
                        value={settingsData.alert_message || ''}
                        onChange={(e) => setSettingsData({ ...settingsData, alert_message: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', maxWidth: '500px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Withdraw Open Time</label>
                      <input
                        type="time"
                        value={settingsData.withdraw_open_time ? String(settingsData.withdraw_open_time).slice(0, 5) : ''}
                        onChange={(e) => setSettingsData({ ...settingsData, withdraw_open_time: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Withdraw Close Time</label>
                      <input
                        type="time"
                        value={settingsData.withdraw_close_time ? String(settingsData.withdraw_close_time).slice(0, 5) : ''}
                        onChange={(e) => setSettingsData({ ...settingsData, withdraw_close_time: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  {/* Allowed Withdrawal Days */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '10px' }}>
                      Allowed Withdrawal Days:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const isSelected = withdrawDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => handleToggleWithdrawDay(day)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              border: isSelected ? '1px solid #34c38f' : '1px solid #ced4da',
                              backgroundColor: isSelected ? '#def7ec' : '#f8f9fa',
                              color: isSelected ? '#03543f' : '#74788d',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>{isSelected ? '✓' : '✕'}</span>
                            <span>{day}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={settingsLoading}
                    style={{ backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '10px 28px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {settingsLoading ? 'Saving...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS - CONTACT SETTINGS (PHP contact-settings.php parity) */}
          {activeTab === 'contact_settings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Contact Settings
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Settings / <span style={{ color: '#556ee6' }}>Contact Settings</span>
                </div>
              </div>

              {contactMsg && (
                <div style={{ backgroundColor: '#def7ec', color: '#03543f', border: '1px solid #bcf0da', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                  ✓ {contactMsg}
                </div>
              )}
              {contactError && (
                <div style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: '1px solid #f8b4b4', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                  ⚠️ {contactError}
                </div>
              )}

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '28px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', maxWidth: '900px' }}>
                <h5 style={{ margin: '0 0 18px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                  Contact Settings
                </h5>
                <form onSubmit={handleSaveContactDetails}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Mobile Number</label>
                      <input
                        type="text"
                        placeholder="eg. 9876543210"
                        value={contactData.mobile || ''}
                        onChange={(e) => setContactData({ ...contactData, mobile: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>WhatsApp Number</label>
                      <input
                        type="text"
                        placeholder="Enter Whatsapp Number"
                        value={contactData.wp_mobile || ''}
                        onChange={(e) => setContactData({ ...contactData, wp_mobile: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Landline 1 (Optional)</label>
                      <input
                        type="text"
                        placeholder="eg. 0141-9999999"
                        value={contactData.landline || ''}
                        onChange={(e) => setContactData({ ...contactData, landline: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Landline 2 (Optional)</label>
                      <input
                        type="text"
                        placeholder="Enter Landline Number (Optional)"
                        value={contactData.alt_landline || ''}
                        onChange={(e) => setContactData({ ...contactData, alt_landline: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Email 1</label>
                      <input
                        type="email"
                        placeholder="Enter Email Id"
                        value={contactData.email || ''}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Email 2 (Optional)</label>
                      <input
                        type="email"
                        placeholder="Enter Email Id (Optional)"
                        value={contactData.alt_email || ''}
                        onChange={(e) => setContactData({ ...contactData, alt_email: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Facebook (Optional)</label>
                      <input
                        type="text"
                        placeholder="Enter Facebook Link"
                        value={contactData.facebook || ''}
                        onChange={(e) => setContactData({ ...contactData, facebook: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Twitter (Optional)</label>
                      <input
                        type="text"
                        placeholder="Enter Twitter Link"
                        value={contactData.twitter || ''}
                        onChange={(e) => setContactData({ ...contactData, twitter: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Address</label>
                    <textarea
                      rows="3"
                      placeholder="Enter Address"
                      value={contactData.address || ''}
                      onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    style={{ backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '10px 28px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {contactLoading ? 'Saving...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS - SLIDER IMAGES (PHP slider-images-management.php parity) */}
          {activeTab === 'sliders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Slider Image Management
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Settings / <span style={{ color: '#556ee6' }}>Slider Images</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h5 style={{ margin: 0, fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>Slider Images List</h5>
                  <button
                    onClick={() => setShowAddSliderModal(true)}
                    style={{ backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    + Add Slider Image
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Slider Image</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Display Order</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Creation Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sliders.map((s, idx) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <img
                              src={
                                s.slider_image?.startsWith('http://') || s.slider_image?.startsWith('https://') || s.slider_image?.startsWith('data:')
                                  ? s.slider_image
                                  : s.slider_image?.startsWith('/')
                                  ? s.slider_image
                                  : `/uploads/${s.slider_image}`
                              }
                              alt="slider"
                              style={{ width: '150px', height: '65px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eff2f7', backgroundColor: '#f8f9fa' }}
                              onError={(e) => {
                                if (!e.target.dataset.triedFallback && !s.slider_image?.startsWith('http') && !s.slider_image?.startsWith('data:')) {
                                  e.target.dataset.triedFallback = 'true';
                                  e.target.src = `/${s.slider_image?.replace(/^\//, '')}`;
                                } else {
                                  e.target.src = 'https://placehold.co/150x65?text=Slider+Image';
                                }
                              }}
                            />
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600' }}>{s.display_order}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#74788d' }}>
                            {s.creation_date ? String(s.creation_date).slice(0, 10) : '-'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleSliderStatus(s.id)}
                              style={{
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                padding: '3px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                backgroundColor: (s.status === '1' || s.status === 1) ? '#def7ec' : '#fde8e8',
                                color: (s.status === '1' || s.status === 1) ? '#03543f' : '#9b1c1c'
                              }}
                            >
                              {(s.status === '1' || s.status === 1) ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteSlider(s.id)}
                              style={{ backgroundColor: '#f46a6a', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {sliders.length === 0 && !slidersLoading && (
                        <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Data Found!</td></tr>
                      )}
                      {slidersLoading && (
                        <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Slider Images...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS - HOW TO PLAY (PHP how-to-play.php parity) */}
          {activeTab === 'how_to_play' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  How To Play
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Settings / <span style={{ color: '#556ee6' }}>How To Play</span>
                </div>
              </div>

              {howToPlayMsg && (
                <div style={{ backgroundColor: '#def7ec', color: '#03543f', border: '1px solid #bcf0da', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                  ✓ {howToPlayMsg}
                </div>
              )}

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '28px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', maxWidth: '850px' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>
                  How To Play Content
                </h5>
                <form onSubmit={handleSaveHowToPlay}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                      Instructions / Rules Content
                    </label>
                    <textarea
                      rows="8"
                      placeholder="Enter How To Play instructions..."
                      value={howToPlayContent}
                      onChange={(e) => setHowToPlayContent(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', lineHeight: 1.6 }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={howToPlayLoading}
                    style={{ backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '10px 28px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {howToPlayLoading ? 'Saving...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW 8: WALLET MANAGEMENT - FUND REQUESTS */}
          {activeTab === 'deposits' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Fund Request Management
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Wallet Management / <span style={{ color: '#556ee6' }}>Fund Request</span>
                </div>
              </div>

              {/* Date Filter Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px', maxWidth: '320px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                    <input
                      type="date"
                      value={fundReqDate}
                      onChange={(e) => setFundReqDate(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                    />
                  </div>
                  <button
                    onClick={fetchFundRequests}
                    style={{ backgroundColor: '#34c38f', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Submit
                  </button>
                </div>
              </div>

              {/* Data Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <h5 style={{ margin: 0, fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>Fund Request List</h5>
                  <span style={{ backgroundColor: '#556ee6', color: '#ffffff', padding: '6px 14px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                    Total Amount is ₹ {fundReqTotal}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>S.No.</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>User Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Phone Number</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Points</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Receipt Image</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fundReqList.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{item.user_name || item.username}</strong>{' '}
                            <button
                              onClick={() => setSelectedUserModal({ name: item.user_name || item.username, phone: item.username, wallet: item.current_wallet || 0 })}
                              title="View User"
                              style={{ border: 'none', background: 'transparent', color: '#556ee6', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              🔗
                            </button>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{item.username}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#28a745' }}>₹ {item.amount}</td>
                          <td style={{ padding: '10px 12px' }}>{item.points || item.amount}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {item.receipe_image ? (
                              <a href={`/uploads/${item.receipe_image}`} target="_blank" rel="noreferrer" style={{ color: '#556ee6', textDecoration: 'underline' }}>
                                View Receipt
                              </a>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>{item.date}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {(item.status === '1' || item.status === 1) && (
                              <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Accepted</span>
                            )}
                            {(item.status === '0' || item.status === 0) && (
                              <span style={{ backgroundColor: '#e1effe', color: '#1e429f', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending</span>
                            )}
                            {(item.status === '-1' || item.status === -1) && (
                              <span style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Rejected</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {(item.status === '0' || item.status === 0) ? (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleFundRequestAction(item.id, 'approve')}
                                  style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleFundRequestAction(item.id, 'reject')}
                                  style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#74788d' }}>Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {fundReqList.length === 0 && !fundReqLoading && (
                        <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Report Found</td></tr>
                      )}
                      {fundReqLoading && (
                        <tr><td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Fund Requests...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 9: WALLET MANAGEMENT - WITHDRAW REQUESTS */}
          {activeTab === 'withdrawals' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Withdraw Request Management
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Wallet Management / <span style={{ color: '#556ee6' }}>Withdraw Request</span>
                </div>
              </div>

              {/* Date Filter Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px', maxWidth: '320px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                    <input
                      type="date"
                      value={withReqDate}
                      onChange={(e) => setWithReqDate(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                    />
                  </div>
                  <button
                    onClick={fetchWithRequests}
                    style={{ backgroundColor: '#34c38f', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Submit
                  </button>
                </div>
              </div>

              {/* Data Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <h5 style={{ margin: 0, fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>Withdraw Request List</h5>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: '#556ee6', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: '600' }}>
                      Total Amount is ₹ {withReqTotals.total_amount}
                    </span>
                    <span style={{ backgroundColor: '#34c38f', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: '600' }}>
                      Total Approved is ₹ {withReqTotals.total_approved}
                    </span>
                    <span style={{ backgroundColor: '#f46a6a', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: '600' }}>
                      Total Rejected is ₹ {withReqTotals.total_rejected}
                    </span>
                    <span style={{ backgroundColor: '#f1b44c', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: '600' }}>
                      Total Pending is ₹ {withReqTotals.total_pending}
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>User Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Mobile</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Request No.</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withReqList.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{item.user_name || item.username}</strong>{' '}
                            <button
                              onClick={() => setSelectedUserModal({ name: item.user_name || item.username, phone: item.username, wallet: item.current_wallet || 0 })}
                              title="View User"
                              style={{ border: 'none', background: 'transparent', color: '#556ee6', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              🔗
                            </button>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{item.username}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#f46a6a' }}>₹ {item.points}</td>
                          <td style={{ padding: '10px 12px' }}>{item.id}</td>
                          <td style={{ padding: '10px 12px' }}>{item.date}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {(item.status === '1' || item.status === 1) && (
                              <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Accepted</span>
                            )}
                            {(item.status === '0' || item.status === 0) && (
                              <span style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending</span>
                            )}
                            {(item.status === '-1' || item.status === -1) && (
                              <span style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Rejected</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              {(item.status === '0' || item.status === 0) && (
                                <>
                                  <button
                                    onClick={() => handleWithRequestAction(item.id, 'approve')}
                                    style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleWithRequestAction(item.id, 'reject')}
                                    style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setSelectedWithdrawModal(item)}
                                title="View Details"
                                style={{ backgroundColor: '#556ee6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                👁
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {withReqList.length === 0 && !withReqLoading && (
                        <tr><td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Report Found</td></tr>
                      )}
                      {withReqLoading && (
                        <tr><td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Withdraw Requests...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 10: WALLET MANAGEMENT - ADD FUND (USER WALLET) */}
          {activeTab === 'add_fund_wallet' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Add Fund (User Wallet)
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Wallet Management / <span style={{ color: '#556ee6' }}>Add Fund</span>
                </div>
              </div>

              <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '28px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#495057', fontWeight: '600' }}>
                  Add Balance In User Wallet
                </h5>

                {addFundError && (
                  <div style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: '1px solid #f8b4b4', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    ⚠️ {addFundError}
                  </div>
                )}
                {addFundMsg && (
                  <div style={{ backgroundColor: '#def7ec', color: '#03543f', border: '1px solid #bcf0da', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    ✓ {addFundMsg}
                  </div>
                )}

                <form onSubmit={handleAddFundSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                      Select User *
                    </label>
                    <select
                      value={addFundUserPhone}
                      onChange={(e) => setAddFundUserPhone(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                    >
                      <option value="">Select User</option>
                      {users.map(u => (
                        <option key={u.id} value={u.phone}>
                          {u.name} ({u.phone}) - Current Balance: ₹{u.wallet || 0}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                      Amount *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter Amount"
                      value={addFundAmount}
                      onChange={(e) => setAddFundAmount(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addFundLoading}
                    style={{
                      backgroundColor: '#556ee6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '11px 24px',
                      fontSize: '0.92rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                      boxShadow: '0 2px 6px rgba(85, 110, 230, 0.3)'
                    }}
                  >
                    {addFundLoading ? 'Processing...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW 11: WALLET MANAGEMENT - BID REVERT */}
          {activeTab === 'bid_revert' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Bid Revert Management
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Wallet Management / <span style={{ color: '#556ee6' }}>Bid Revert</span>
                </div>
              </div>

              {bidRevertMsg && (
                <div style={{ backgroundColor: '#def7ec', color: '#03543f', border: '1px solid #bcf0da', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                  ✓ {bidRevertMsg}
                </div>
              )}

              {/* Filter Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                    <input
                      type="date"
                      value={bidRevertDate}
                      onChange={(e) => setBidRevertDate(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Game Name</label>
                    <select
                      value={bidRevertGame || (games[0]?.games_name || '')}
                      onChange={(e) => setBidRevertGame(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                    >
                      {games.map(g => (
                        <option key={g.id} value={g.games_name}>{g.games_name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={fetchBidRevertList}
                    style={{ backgroundColor: '#556ee6', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Submit
                  </button>
                </div>
              </div>

              {/* Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <h5 style={{ margin: 0, fontSize: '1.05rem', color: '#495057', fontWeight: '600' }}>Bid History List</h5>
                  {bidRevertList.length > 0 && (
                    <button
                      onClick={() => setShowRevertConfirmModal(true)}
                      style={{ backgroundColor: '#f46a6a', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Clear &amp; Refund All
                    </button>
                  )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Username</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Game Type</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bidRevertList.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>{item.date}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{item.user_name || item.username}</strong>{' '}
                            <button
                              onClick={() => setSelectedUserModal({ name: item.user_name || item.username, phone: item.username, wallet: item.current_wallet || 0 })}
                              title="View User"
                              style={{ border: 'none', background: 'transparent', color: '#556ee6', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              🔗
                            </button>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{item.game_type}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#34c38f' }}>{item.points_action}</td>
                        </tr>
                      ))}
                      {bidRevertList.length === 0 && !bidRevertLoading && (
                        <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Bid Found</td></tr>
                      )}
                      {bidRevertLoading && (
                        <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Bids...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DECLARE RESULT */}
          {activeTab === 'declare_result' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Declare Game Result
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Game Operations / <span style={{ color: '#556ee6' }}>Declare Result</span>
                </div>
              </div>

              <div style={{ maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '8px', padding: '28px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#495057', fontWeight: '600' }}>Declare Numbers</h5>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#74788d' }}>
                    Declare Open/Close Pana & Result digits. Winner settlements and payouts will be executed automatically.
                  </p>
                </div>

                {declareError && (
                  <div style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: '1px solid #f8b4b4', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                    ⚠️ {declareError}
                  </div>
                )}
                {declareSuccess && (
                  <div style={{ backgroundColor: '#def7ec', color: '#03543f', border: '1px solid #bcf0da', padding: '10px 16px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '18px' }}>
                    ✓ {declareSuccess}
                  </div>
                )}

                <form onSubmit={handleDeclareSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Select Game *</label>
                    <select
                      value={declareSelectedGame || (games[0]?.games_name || '')}
                      onChange={(e) => setDeclareSelectedGame(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                      required
                    >
                      {games.map(g => (
                        <option key={g.id} value={g.games_name}>{g.games_name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Result Date *</label>
                      <input
                        type="date"
                        value={declareDate}
                        onChange={(e) => setDeclareDate(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Session *</label>
                      <select
                        value={declareSession}
                        onChange={(e) => setDeclareSession(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                        required
                      >
                        <option value="open">OPEN SESSION</option>
                        <option value="close">CLOSE SESSION</option>
                      </select>
                    </div>
                  </div>

                  {declareSession === 'open' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                          Open Pana (3 Digits) *
                        </label>
                        <input
                          type="text"
                          maxLength="3"
                          placeholder="Search or Select Pana (e.g. 123)"
                          value={declareOpenPana}
                          onFocus={() => setShowOpenPanaDropdown(true)}
                          onBlur={() => setTimeout(() => setShowOpenPanaDropdown(false), 200)}
                          onChange={(e) => {
                            handleOpenPanaSelect(e.target.value);
                            setShowOpenPanaDropdown(true);
                          }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                          required
                        />
                        {showOpenPanaDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '220px',
                            overflowY: 'auto',
                            backgroundColor: '#ffffff',
                            border: '1px solid #ced4da',
                            borderRadius: '0 0 6px 6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000
                          }}>
                            {ALL_PANAS_220.filter(p => !declareOpenPana || p.includes(declareOpenPana)).slice(0, 60).map(p => {
                              const digit = getPanaSingleDigit(p);
                              return (
                                <div
                                  key={p}
                                  onMouseDown={() => {
                                    handleOpenPanaSelect(p);
                                    setShowOpenPanaDropdown(false);
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justify: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #f0f0f0',
                                    backgroundColor: declareOpenPana === p ? '#eef2ff' : '#ffffff'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = declareOpenPana === p ? '#eef2ff' : '#ffffff'}
                                >
                                  <span><strong>Pana:</strong> {p}</span>
                                  <span style={{ color: '#556ee6', fontWeight: 'bold', backgroundColor: '#eff2f7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                    Digit: {digit}
                                  </span>
                                </div>
                              );
                            })}
                            {ALL_PANAS_220.filter(p => !declareOpenPana || p.includes(declareOpenPana)).length === 0 && (
                              <div style={{ padding: '10px', fontSize: '0.85rem', color: '#74788d', textAlign: 'center' }}>
                                No matching Pana found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Open Single Digit (0-9) *</label>
                        <input
                          type="text"
                          maxLength="1"
                          placeholder="Auto-calculated (e.g. 6)"
                          value={declareOpenResult}
                          onChange={(e) => setDeclareOpenResult(e.target.value.replace(/\D/g, ''))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none', backgroundColor: '#f8f9fa' }}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                          Close Pana (3 Digits) *
                        </label>
                        <input
                          type="text"
                          maxLength="3"
                          placeholder="Search or Select Pana (e.g. 456)"
                          value={declareClosePana}
                          onFocus={() => setShowClosePanaDropdown(true)}
                          onBlur={() => setTimeout(() => setShowClosePanaDropdown(false), 200)}
                          onChange={(e) => {
                            handleClosePanaSelect(e.target.value);
                            setShowClosePanaDropdown(true);
                          }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                          required
                        />
                        {showClosePanaDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '220px',
                            overflowY: 'auto',
                            backgroundColor: '#ffffff',
                            border: '1px solid #ced4da',
                            borderRadius: '0 0 6px 6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000
                          }}>
                            {ALL_PANAS_220.filter(p => !declareClosePana || p.includes(declareClosePana)).slice(0, 60).map(p => {
                              const digit = getPanaSingleDigit(p);
                              return (
                                <div
                                  key={p}
                                  onMouseDown={() => {
                                    handleClosePanaSelect(p);
                                    setShowClosePanaDropdown(false);
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justify: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #f0f0f0',
                                    backgroundColor: declareClosePana === p ? '#eef2ff' : '#ffffff'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = declareClosePana === p ? '#eef2ff' : '#ffffff'}
                                >
                                  <span><strong>Pana:</strong> {p}</span>
                                  <span style={{ color: '#556ee6', fontWeight: 'bold', backgroundColor: '#eff2f7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                    Digit: {digit}
                                  </span>
                                </div>
                              );
                            })}
                            {ALL_PANAS_220.filter(p => !declareClosePana || p.includes(declareClosePana)).length === 0 && (
                              <div style={{ padding: '10px', fontSize: '0.85rem', color: '#74788d', textAlign: 'center' }}>
                                No matching Pana found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Close Single Digit (0-9) *</label>
                        <input
                          type="text"
                          maxLength="1"
                          placeholder="Auto-calculated (e.g. 5)"
                          value={declareCloseResult}
                          onChange={(e) => setDeclareCloseResult(e.target.value.replace(/\D/g, ''))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none', backgroundColor: '#f8f9fa' }}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={declareLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      backgroundColor: '#556ee6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(85, 110, 230, 0.3)',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    {declareLoading ? 'Declaring & Processing Payouts...' : 'DECLARE GAME RESULT'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: 1. USERS BID HISTORY */}
          {activeTab === 'report_bid_history' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Bid History Report
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Report Management / <span style={{ color: '#556ee6' }}>Bid History</span>
                </div>
              </div>

              {/* Filter Form Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Filter Bids</h5>
                <form onSubmit={(e) => { e.preventDefault(); fetchReportBidHistory(); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                      <input
                        type="date"
                        value={bidHistoryDate}
                        onChange={(e) => setBidHistoryDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Game Name</label>
                      <select
                        value={bidHistoryGame}
                        onChange={(e) => setBidHistoryGame(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                      >
                        <option value="all">All Games</option>
                        {games.map(g => (
                          <option key={g.id} value={g.games_name}>{g.games_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Game Type</label>
                      <select
                        value={bidHistoryType}
                        onChange={(e) => setBidHistoryType(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                      >
                        <option value="all">All</option>
                        <option value="Single Digit">Single Digit</option>
                        <option value="Jodi Digit">Jodi Digit</option>
                        <option value="Single Pana">Single Pana</option>
                        <option value="Double Pana">Double Pana</option>
                        <option value="Triple Pana">Triple Pana</option>
                        <option value="Half Sangam">Half Sangam</option>
                        <option value="Full Sangam">Full Sangam</option>
                      </select>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={bidHistoryLoading}
                        style={{ width: '100%', padding: '10px 16px', backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 6px rgba(85, 110, 230, 0.3)' }}
                      >
                        {bidHistoryLoading ? 'Loading...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Data Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Bid History List</h5>
                  <span style={{ fontSize: '0.82rem', color: '#74788d' }}>Total Bids: <strong>{bidHistoryList.length}</strong></span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Username</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Game Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Game Type</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Session</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Open Pana</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Open Result</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Close Pana</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Close Result</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Points</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bidHistoryList.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{b.date}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div>
                              <strong>{b.user_name || b.username}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#74788d' }}>{b.username}</div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{b.game_name}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ backgroundColor: '#edf2f7', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>{b.game_type}</span>
                          </td>
                          <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{b.session}</td>
                          <td style={{ padding: '10px 12px' }}>{b.open_pana || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{b.open_digit || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{b.close_pana || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{b.close_digit || '-'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#556ee6' }}>₹ {b.points_action}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setEditBidModal(b);
                                setEditBidForm({
                                  open_pana: b.open_pana || '',
                                  open_digit: b.open_digit || '',
                                  close_pana: b.close_pana || '',
                                  close_digit: b.close_digit || '',
                                  points_action: b.points_action || ''
                                });
                              }}
                              style={{ padding: '4px 10px', fontSize: '0.75rem', border: '1px solid #556ee6', backgroundColor: '#fff', color: '#556ee6', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                            >
                              EDIT BID
                            </button>
                          </td>
                        </tr>
                      ))}
                      {bidHistoryList.length === 0 && !bidHistoryLoading && (
                        <tr><td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Bids Found for selected filters.</td></tr>
                      )}
                      {bidHistoryLoading && (
                        <tr><td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Bids...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: 2. CUSTOMER SELL REPORT */}
          {activeTab === 'report_sell' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Customer Sell Report
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Report Management / <span style={{ color: '#556ee6' }}>Customer Sell Report</span>
                </div>
              </div>

              {/* Filter Form Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Select Report Criteria</h5>
                <form onSubmit={(e) => { e.preventDefault(); fetchReportSell(); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                      <input
                        type="date"
                        value={sellDate}
                        onChange={(e) => setSellDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Game Name</label>
                      <select
                        value={sellGame}
                        onChange={(e) => setSellGame(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                      >
                        <option value="all">All Games</option>
                        {games.map(g => (
                          <option key={g.id} value={g.games_name}>{g.games_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Game Type</label>
                      <select
                        value={sellType}
                        onChange={(e) => setSellType(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                      >
                        <option value="all">All</option>
                        <option value="Single Digit">Single Digit</option>
                        <option value="Jodi Digit">Jodi Digit</option>
                        <option value="Single Pana">Single Pana</option>
                        <option value="Double Pana">Double Pana</option>
                        <option value="Triple Pana">Triple Pana</option>
                        <option value="Half Sangam">Half Sangam</option>
                        <option value="Full Sangam">Full Sangam</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Session</label>
                      <select
                        value={sellSession}
                        onChange={(e) => setSellSession(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                      >
                        <option value="open">Open</option>
                        <option value="close">Close</option>
                      </select>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={sellLoading}
                        style={{ width: '100%', padding: '10px 16px', backgroundColor: '#50a5f1', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 6px rgba(80, 165, 241, 0.3)' }}
                      >
                        {sellLoading ? 'Loading...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Total Sell Badge */}
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#28a745', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontSize: '0.92rem', fontWeight: 'bold' }}>
                  Total Sell Points: ₹ {sellGrandTotal}
                </span>
              </div>

              {/* Sell Grid Sections */}
              {Object.keys(sellReportData).map(typeKey => {
                const section = sellReportData[typeKey];
                return (
                  <div key={typeKey} style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dotted #495057', paddingBottom: '8px', marginBottom: '16px' }}>
                      <h5 style={{ margin: 0, fontWeight: 'bold', color: '#343a40', fontSize: '1.05rem' }}>{typeKey}</h5>
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#556ee6' }}>Subtotal: ₹ {section.total_points}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '8px' }}>
                      {section.data.map(item => (
                        <div
                          key={item.number}
                          style={{
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            padding: '6px',
                            textAlign: 'center',
                            backgroundColor: '#fafbfe'
                          }}
                        >
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#495057', marginBottom: '4px' }}>{item.number}</div>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                minWidth: '40px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: '#ffffff',
                                backgroundColor: item.sum > 0 ? '#28a745' : '#dc3545'
                              }}
                            >
                              {item.sum}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.keys(sellReportData).length === 0 && !sellLoading && (
                <div style={{ backgroundColor: '#fff', padding: '30px', textAlign: 'center', borderRadius: '8px', border: '1px solid #eff2f7', color: '#74788d' }}>
                  Please select filters and click Submit to view the sell report.
                </div>
              )}
            </div>
          )}

          {/* VIEW: 3. WINNING REPORT */}
          {activeTab === 'report_winning' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Winning History Report
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Report Management / <span style={{ color: '#556ee6' }}>Winning Report</span>
                </div>
              </div>

              {/* Filter Form Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Filter Winners</h5>
                <form onSubmit={(e) => { e.preventDefault(); fetchReportWinning(); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                      <input
                        type="date"
                        value={winningDate}
                        onChange={(e) => setWinningDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Game Name</label>
                      <select
                        value={winningGame}
                        onChange={(e) => setWinningGame(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                      >
                        <option value="all">All Games</option>
                        {games.map(g => (
                          <option key={g.id} value={g.games_name}>{g.games_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Market Time</label>
                      <select
                        value={winningSession}
                        onChange={(e) => setWinningSession(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                      >
                        <option value="all">All</option>
                        <option value="open">Open</option>
                        <option value="close">Close</option>
                      </select>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={winningLoading}
                        style={{ width: '100%', padding: '10px 16px', backgroundColor: '#50a5f1', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 6px rgba(80, 165, 241, 0.3)' }}
                      >
                        {winningLoading ? 'Loading...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Data Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Winning List</h5>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '4px 10px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                      Total Winning: ₹ {winningTotalAmt}
                    </span>
                    <span style={{ backgroundColor: '#e1effe', color: '#1e429f', padding: '4px 10px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                      Total Points: {winningTotalPoints}
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>User Phone</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>User Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Game Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Game Type</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Open Pana</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Open Digit</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Close Pana</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Close Digit</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Winning Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winningList.map(w => (
                        <tr key={w.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{w.date}</td>
                          <td style={{ padding: '10px 12px' }}>{w.username}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{w.user_name || 'N/A'}</strong>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{w.game_name}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ backgroundColor: '#edf2f7', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>{w.game_type}</span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{w.open_pana}</td>
                          <td style={{ padding: '10px 12px' }}>{w.open_digit}</td>
                          <td style={{ padding: '10px 12px' }}>{w.close_pana}</td>
                          <td style={{ padding: '10px 12px' }}>{w.close_digit}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#28a745' }}>₹ {w.winning_points}</td>
                          <td style={{ padding: '10px 12px' }}>{w.points_action}</td>
                        </tr>
                      ))}
                      {winningList.length === 0 && !winningLoading && (
                        <tr><td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Winners Found!!</td></tr>
                      )}
                      {winningLoading && (
                        <tr><td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Winners...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: 4. TRANSFER POINT REPORT */}
          {activeTab === 'report_transfer' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Transfer Point Report
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Report Management / <span style={{ color: '#556ee6' }}>Transfer Point Report</span>
                </div>
              </div>

              {/* Filter Form Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Filter Transfers</h5>
                <form onSubmit={(e) => { e.preventDefault(); fetchReportTransfer(); }}>
                  <div style={{ display: 'flex', gap: '16px', maxWidth: '500px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                      <input
                        type="date"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                        required
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={transferLoading}
                        style={{ padding: '10px 24px', backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 6px rgba(85, 110, 230, 0.3)' }}
                      >
                        {transferLoading ? 'Loading...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Data Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Transfer List</h5>
                  <span style={{ backgroundColor: '#556ee6', color: '#ffffff', padding: '6px 14px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    Total Transfer Amount: ₹ {transferTotal}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Sender Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Receiver Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferList.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px' }}>{t.sno}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{t.sender_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#74788d' }}>{t.sender_phone}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{t.receiver_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#74788d' }}>{t.receiver_phone}</div>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#556ee6' }}>₹ {t.amount}</td>
                          <td style={{ padding: '10px 12px' }}>{t.date} {t.time ? `(${t.time})` : ''}</td>
                        </tr>
                      ))}
                      {transferList.length === 0 && !transferLoading && (
                        <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Report Found</td></tr>
                      )}
                      {transferLoading && (
                        <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Transfers...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: 5. BID WIN REPORT */}
          {activeTab === 'report_bid_win' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Bid Winning Report
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Report Management / <span style={{ color: '#556ee6' }}>Bid Win Report</span>
                </div>
              </div>

              {/* Filter Form Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Select Date & Game</h5>
                <form onSubmit={(e) => { e.preventDefault(); fetchReportBidWin(); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                      <input
                        type="date"
                        value={bidWinRepDate}
                        onChange={(e) => setBidWinRepDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Game Name</label>
                      <select
                        value={bidWinRepGame}
                        onChange={(e) => setBidWinRepGame(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                      >
                        <option value="all">-All Games-</option>
                        {games.map(g => (
                          <option key={g.id} value={g.games_name}>{g.games_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={bidWinRepLoading}
                        style={{ width: '100%', padding: '10px 16px', backgroundColor: '#28a745', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)' }}
                      >
                        {bidWinRepLoading ? 'Loading...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Total Bid Amount */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px dashed #74788d', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#74788d', fontWeight: '500', marginBottom: '6px' }}>Total Bid Amount</div>
                      <h4 style={{ margin: 0, fontSize: '1.4rem', color: '#343a40', fontWeight: 'bold' }}>₹ {bidWinRepData.total_bid}</h4>
                    </div>
                    <button
                      onClick={() => handleOpenBidWinDetails('bids')}
                      style={{ padding: '6px 14px', backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      View
                    </button>
                  </div>
                </div>

                {/* Total Win Amount */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px dashed #74788d', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#74788d', fontWeight: '500', marginBottom: '6px' }}>Total Win Amount</div>
                      <h4 style={{ margin: 0, fontSize: '1.4rem', color: '#343a40', fontWeight: 'bold' }}>₹ {bidWinRepData.total_win}</h4>
                    </div>
                    <button
                      onClick={() => handleOpenBidWinDetails('wins')}
                      style={{ padding: '6px 14px', backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      View
                    </button>
                  </div>
                </div>

                {/* Profit / Loss */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  padding: '20px',
                  border: bidWinRepData.profit >= 0 ? '2px solid #28a745' : '2px solid #f1673e',
                  boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: bidWinRepData.profit >= 0 ? '#28a745' : '#f1673e', fontWeight: '600', marginBottom: '6px' }}>
                    {bidWinRepData.profit >= 0 ? 'Total Profit Amount' : 'Total Loss Amount'}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.4rem', color: bidWinRepData.profit >= 0 ? '#28a745' : '#f1673e', fontWeight: 'bold' }}>
                    ₹ {Math.abs(bidWinRepData.profit)}
                  </h4>
                </div>
              </div>

              {/* Details Table if opened */}
              {bidWinRepDetails !== 'none' && (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h5 style={{ margin: 0, fontSize: '1rem', color: '#495057', fontWeight: '600' }}>
                      {bidWinRepDetails === 'bids' ? 'Detailed Bids List' : 'Detailed Winners List'}
                    </h5>
                    <button
                      onClick={() => setBidWinRepDetails('none')}
                      style={{ padding: '4px 10px', fontSize: '0.78rem', backgroundColor: '#f46a6a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Close Details
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>User</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Game Name</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Game Type</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Session</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Points / Win</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bidWinRepDetailList.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eff2f7' }}>
                            <td style={{ padding: '10px 12px' }}>{item.user_name || item.username} ({item.username})</td>
                            <td style={{ padding: '10px 12px' }}>{item.game_name}</td>
                            <td style={{ padding: '10px 12px' }}>{item.game_type}</td>
                            <td style={{ padding: '10px 12px' }}>{item.session}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 'bold', color: bidWinRepDetails === 'bids' ? '#556ee6' : '#28a745' }}>
                              ₹ {bidWinRepDetails === 'bids' ? item.points_action : item.winning_points}
                            </td>
                          </tr>
                        ))}
                        {bidWinRepDetailList.length === 0 && (
                          <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No records found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: 6. WITHDRAW REPORT */}
          {activeTab === 'report_withdraw' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Withdraw History Report
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Report Management / <span style={{ color: '#556ee6' }}>Withdraw Report</span>
                </div>
              </div>

              {/* Filter Form Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Filter Withdrawals</h5>
                <form onSubmit={(e) => { e.preventDefault(); fetchReportWithdraw(); }}>
                  <div style={{ display: 'flex', gap: '16px', maxWidth: '500px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                      <input
                        type="date"
                        value={withdrawRepDate}
                        onChange={(e) => setWithdrawRepDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                        required
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={withdrawRepLoading}
                        style={{ padding: '10px 24px', backgroundColor: '#28a745', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 6px rgba(40, 167, 69, 0.3)' }}
                      >
                        {withdrawRepLoading ? 'Loading...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Data Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Withdraw List</h5>
                  <span style={{ backgroundColor: '#28a745', color: '#ffffff', padding: '6px 14px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    Total Transfer Amount is ₹ {withdrawRepTotal}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>S.No.</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>User Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Phone Number</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawRepList.map(w => (
                        <tr key={w.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px' }}>{w.sno}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{w.user_name}</strong>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{w.phone_number}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#dc3545' }}>₹ {w.amount}</td>
                          <td style={{ padding: '10px 12px' }}>{w.date} {w.time ? `(${w.time})` : ''}</td>
                        </tr>
                      ))}
                      {withdrawRepList.length === 0 && !withdrawRepLoading && (
                        <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Report Found</td></tr>
                      )}
                      {withdrawRepLoading && (
                        <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Withdrawals...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: 7. AUTO DEPOSIT HISTORY */}
          {activeTab === 'report_auto_deposit' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Auto Deposit History
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Report Management / <span style={{ color: '#556ee6' }}>Auto Deposit</span>
                </div>
              </div>

              {/* Filter Form Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)', marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Filter Auto Deposits</h5>
                <div style={{ display: 'flex', gap: '16px', maxWidth: '400px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                    <input
                      type="date"
                      value={autoDepDate}
                      onChange={(e) => {
                        setAutoDepDate(e.target.value);
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={fetchReportAutoDeposit}
                      disabled={autoDepLoading}
                      style={{ padding: '10px 20px', backgroundColor: '#556ee6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* Summary Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}>
                  <span style={{ backgroundColor: '#556ee6', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: '600' }}>
                    Total Transfer: ₹ {autoDepTotals.total_transfer}
                  </span>
                  <span style={{ backgroundColor: '#28a745', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: '600' }}>
                    Total Approved: ₹ {autoDepTotals.total_approved}
                  </span>
                  <span style={{ backgroundColor: '#dc3545', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: '600' }}>
                    Total Rejected: ₹ {autoDepTotals.total_rejected}
                  </span>
                  <span style={{ backgroundColor: '#ffc107', color: '#212529', padding: '6px 12px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: '600' }}>
                    Total Pending: ₹ {autoDepTotals.total_pending}
                  </span>
                </div>
              </div>

              {/* Data Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Auto Deposit List</h5>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>S.No.</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>User Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Phone Number</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', color: '#495057' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {autoDepList.map((d, index) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px' }}>{index + 1}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{d.user_name || 'N/A'}</strong>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{d.username}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#28a745' }}>₹ {d.amount}</td>
                          <td style={{ padding: '10px 12px' }}>{d.txt_date}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {(d.status === '1' || d.status === 1) && (
                              <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Sent</span>
                            )}
                            {(d.status === '-1' || d.status === -1) && (
                              <span style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Cancelled</span>
                            )}
                            {(d.status === '0' || d.status === 0) && (
                              <span style={{ backgroundColor: '#e1effe', color: '#1e429f', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {(d.status === '0' || d.status === 0) ? (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleAutoDepositAction(d.id, '1')}
                                  style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleAutoDepositAction(d.id, '-1')}
                                  style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#74788d' }}>Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {autoDepList.length === 0 && !autoDepLoading && (
                        <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Report Found</td></tr>
                      )}
                      {autoDepLoading && (
                        <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Auto Deposits...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: REPORT MANAGEMENT - ADD FUND REPORT */}
          {activeTab === 'report_add_fund' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#495057', textTransform: 'uppercase', fontWeight: '700' }}>
                  Add Fund Report
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#74788d' }}>
                  Report Management / <span style={{ color: '#556ee6' }}>Add Fund Report</span>
                </div>
              </div>

              {/* Date Filter Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #eff2f7', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px', maxWidth: '320px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>Date</label>
                    <input
                      type="date"
                      value={addFundRepDate}
                      onChange={(e) => setAddFundRepDate(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                    />
                  </div>
                  <button
                    onClick={fetchAddFundReport}
                    style={{ backgroundColor: '#34c38f', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: '4px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Submit
                  </button>
                </div>
              </div>

              {/* Data Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', border: '1px solid #eff2f7', boxShadow: '0 0.75rem 1.5rem rgba(18,38,63,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', color: '#495057', fontWeight: '600' }}>Add Fund List</h5>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eff2f7' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>S.No.</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>User Name</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Phone Number</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Amount</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#495057' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addFundRepList.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eff2f7' }}>
                          <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{item.user_name || item.phone_number}</strong>{' '}
                            <button
                              onClick={() => setSelectedUserModal({ name: item.user_name || item.phone_number, phone: item.phone_number, wallet: item.current_wallet || 0 })}
                              title="View User"
                              style={{ border: 'none', background: 'transparent', color: '#556ee6', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              🔗
                            </button>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{item.phone_number}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#28a745' }}>₹ {item.amount}</td>
                          <td style={{ padding: '10px 12px' }}>{item.date}</td>
                        </tr>
                      ))}
                      {addFundRepList.length === 0 && !addFundRepLoading && (
                        <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#74788d' }}>No Report Found</td></tr>
                      )}
                      {addFundRepLoading && (
                        <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#556ee6' }}>Loading Add Fund Report...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Edit Bid Modal */}
      {editBidModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ backgroundColor: '#ffffff', color: '#495057', width: '420px', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h5 style={{ margin: 0, color: '#343a40', fontWeight: 'bold', fontSize: '1.05rem' }}>Update Bid (#{editBidModal.id})</h5>
              <span style={{ cursor: 'pointer', fontSize: '1.3rem', color: '#74788d', lineHeight: 1 }} onClick={() => setEditBidModal(null)}>✕</span>
            </div>

            <form onSubmit={handleUpdateBid}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: '#495057', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Open Pana</label>
                <input
                  type="text"
                  value={editBidForm.open_pana}
                  onChange={(e) => setEditBidForm({ ...editBidForm, open_pana: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: '#495057', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Open Result Digit</label>
                <input
                  type="text"
                  maxLength="1"
                  value={editBidForm.open_digit}
                  onChange={(e) => setEditBidForm({ ...editBidForm, open_digit: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: '#495057', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Close Pana</label>
                <input
                  type="text"
                  value={editBidForm.close_pana}
                  onChange={(e) => setEditBidForm({ ...editBidForm, close_pana: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: '#495057', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Close Result Digit</label>
                <input
                  type="text"
                  maxLength="1"
                  value={editBidForm.close_digit}
                  onChange={(e) => setEditBidForm({ ...editBidForm, close_digit: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.8rem', color: '#495057', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Points Action</label>
                <input
                  type="number"
                  value={editBidForm.points_action}
                  onChange={(e) => setEditBidForm({ ...editBidForm, points_action: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditBidModal(null)}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#74788d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editBidLoading}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {editBidLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ backgroundColor: '#ffffff', color: '#495057', width: '420px', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h5 style={{ margin: 0, color: '#343a40', fontWeight: 'bold', fontSize: '1.05rem' }}>Change Password</h5>
              <span style={{ cursor: 'pointer', fontSize: '1.3rem', color: '#74788d', lineHeight: 1 }} onClick={() => setShowPasswordModal(false)}>✕</span>
            </div>

            {passError && (
              <div style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '8px 12px', borderRadius: '4px', fontSize: '0.82rem', marginBottom: '14px' }}>
                {passError}
              </div>
            )}
            {passMsg && (
              <div style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '8px 12px', borderRadius: '4px', fontSize: '0.82rem', marginBottom: '14px' }}>
                {passMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.8rem', color: '#495057', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Old Password</label>
                <input
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  placeholder="Enter Old Password"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.8rem', color: '#495057', fontWeight: '500', display: 'block', marginBottom: '6px' }}>New Password</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter New Password"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.8rem', color: '#495057', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
                <input
                  type="password"
                  value={retypePass}
                  onChange={(e) => setRetypePass(e.target.value)}
                  placeholder="Enter Confirm Password"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem', color: '#495057', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#556ee6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '11px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(85, 110, 230, 0.3)'
                }}
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bid Revert Confirmation Modal */}
      {showRevertConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ backgroundColor: '#ffffff', color: '#495057', width: '440px', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h5 style={{ margin: 0, color: '#343a40', fontWeight: 'bold', fontSize: '1.05rem' }}>Confirm Bid Revert</h5>
              <span style={{ cursor: 'pointer', fontSize: '1.3rem', color: '#74788d', lineHeight: 1 }} onClick={() => setShowRevertConfirmModal(false)}>✕</span>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '0.92rem', color: '#495057', lineHeight: 1.5 }}>
              Are you sure you want to clean and refund bid amount for <strong>{bidRevertGame || games[0]?.games_name}</strong> on <strong>{bidRevertDate}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowRevertConfirmModal(false)}
                style={{ padding: '9px 18px', backgroundColor: '#74788d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBidRevert}
                style={{ padding: '9px 18px', backgroundColor: '#f46a6a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
              >
                Yes, Clean &amp; Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Request Detail Modal */}
      {selectedWithdrawModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ backgroundColor: '#ffffff', color: '#495057', width: '460px', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h5 style={{ margin: 0, color: '#343a40', fontWeight: 'bold', fontSize: '1.05rem' }}>Withdraw Request Detail</h5>
              <span style={{ cursor: 'pointer', fontSize: '1.3rem', color: '#74788d', lineHeight: 1 }} onClick={() => setSelectedWithdrawModal(null)}>✕</span>
            </div>

            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '6px', border: '1px solid #e9ecef', marginBottom: '18px', fontSize: '0.88rem' }}>
              <p style={{ margin: '6px 0' }}><strong style={{ minWidth: '120px', display: 'inline-block', color: '#343a40' }}>Request No:</strong> #{selectedWithdrawModal.id}</p>
              <p style={{ margin: '6px 0' }}><strong style={{ minWidth: '120px', display: 'inline-block', color: '#343a40' }}>User Name:</strong> {selectedWithdrawModal.user_name || selectedWithdrawModal.username}</p>
              <p style={{ margin: '6px 0' }}><strong style={{ minWidth: '120px', display: 'inline-block', color: '#343a40' }}>Mobile:</strong> {selectedWithdrawModal.username}</p>
              <p style={{ margin: '6px 0' }}><strong style={{ minWidth: '120px', display: 'inline-block', color: '#343a40' }}>Amount:</strong> <span style={{ color: '#f46a6a', fontWeight: 'bold', fontSize: '1.05rem' }}>₹{selectedWithdrawModal.points}</span></p>
              <p style={{ margin: '6px 0' }}><strong style={{ minWidth: '120px', display: 'inline-block', color: '#343a40' }}>Date:</strong> {selectedWithdrawModal.date}</p>
              <p style={{ margin: '6px 0' }}>
                <strong style={{ minWidth: '120px', display: 'inline-block', color: '#343a40' }}>Status:</strong>
                {(selectedWithdrawModal.status === '1' || selectedWithdrawModal.status === 1) && (
                  <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '6px' }}>Accepted</span>
                )}
                {(selectedWithdrawModal.status === '0' || selectedWithdrawModal.status === 0) && (
                  <span style={{ backgroundColor: '#e1effe', color: '#1e429f', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '6px' }}>Pending</span>
                )}
                {(selectedWithdrawModal.status === '-1' || selectedWithdrawModal.status === -1) && (
                  <span style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '6px' }}>Rejected</span>
                )}
              </p>
            </div>

            {(selectedWithdrawModal.status === '0' || selectedWithdrawModal.status === 0) ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleWithRequestAction(selectedWithdrawModal.id, 'approve')}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleWithRequestAction(selectedWithdrawModal.id, 'reject')}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Reject
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedWithdrawModal(null)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Game Modal (PHP game-name.php parity) */}
      {showAddGameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ backgroundColor: '#ffffff', color: '#495057', width: '480px', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h5 style={{ margin: 0, color: '#343a40', fontWeight: 'bold', fontSize: '1.05rem' }}>Add Game</h5>
              <span
                style={{ cursor: 'pointer', fontSize: '1.3rem', color: '#74788d', lineHeight: 1 }}
                onClick={() => { setShowAddGameModal(false); setAddGameError(''); setAddGameSuccess(''); }}
              >
                ✕
              </span>
            </div>

            {addGameError && (
              <div style={{ backgroundColor: '#fde8e8', color: '#e53e3e', border: '1px solid #f8b4b4', padding: '8px 12px', borderRadius: '4px', fontSize: '0.82rem', marginBottom: '12px' }}>
                ⚠️ {addGameError}
              </div>
            )}
            {addGameSuccess && (
              <div style={{ backgroundColor: '#def7ec', color: '#03543f', border: '1px solid #bcf0da', padding: '8px 12px', borderRadius: '4px', fontSize: '0.82rem', marginBottom: '12px' }}>
                ✓ {addGameSuccess}
              </div>
            )}

            <form onSubmit={handleAddGameSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                  Game Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Game Name (e.g. KALYAN)"
                  value={newGameForm.game_name}
                  onChange={(e) => setNewGameForm({ ...newGameForm, game_name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                    Open Time
                  </label>
                  <input
                    type="time"
                    value={newGameForm.open_time}
                    onChange={(e) => setNewGameForm({ ...newGameForm, open_time: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                    Close Time
                  </label>
                  <input
                    type="time"
                    value={newGameForm.close_time}
                    onChange={(e) => setNewGameForm({ ...newGameForm, close_time: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowAddGameModal(false); setAddGameError(''); setAddGameSuccess(''); }}
                  style={{ padding: '8px 18px', backgroundColor: '#74788d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addGameLoading}
                  style={{ padding: '8px 20px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {addGameLoading ? 'Adding...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Game Week Schedule Modal (PHP edit-week-game.php parity) */}
      {editWeekModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '650px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            padding: '24px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h5 style={{ margin: 0, color: '#343a40', fontWeight: 'bold', fontSize: '1.05rem' }}>
                Edit Game Time - {editWeekModal.game_name}
              </h5>
              <span
                style={{ cursor: 'pointer', fontSize: '1.3rem', color: '#74788d', lineHeight: 1 }}
                onClick={() => setEditWeekModal(null)}
              >
                ✕
              </span>
            </div>

            <form onSubmit={handleSaveWeekSchedule} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '4px' }}>
                  Game Name
                </label>
                <input
                  type="text"
                  value={editWeekModal.game_name}
                  readOnly
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', backgroundColor: '#e9ecef', fontWeight: 'bold', color: '#343a40' }}
                />
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '55vh', paddingRight: '6px', marginBottom: '16px' }}>
                {editWeekModal.days.map((dayItem, idx) => (
                  <div key={dayItem.day} style={{ border: '1px solid #e9ecef', borderRadius: '6px', padding: '12px', marginBottom: '10px', backgroundColor: '#f8f9fa' }}>
                    <div style={{ fontWeight: '700', color: '#343a40', marginBottom: '8px', fontSize: '0.88rem' }}>
                      {dayItem.day}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Open Time</label>
                        <input
                          type="time"
                          value={dayItem.open_time_24 || ''}
                          onChange={(e) => {
                            const updated = [...editWeekModal.days];
                            updated[idx] = { ...updated[idx], open_time_24: e.target.value };
                            setEditWeekModal({ ...editWeekModal, days: updated });
                          }}
                          required
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Close Time</label>
                        <input
                          type="time"
                          value={dayItem.close_time_24 || ''}
                          onChange={(e) => {
                            const updated = [...editWeekModal.days];
                            updated[idx] = { ...updated[idx], close_time_24: e.target.value };
                            setEditWeekModal({ ...editWeekModal, days: updated });
                          }}
                          required
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#74788d', display: 'block', marginBottom: '4px' }}>Status</label>
                        <select
                          value={String(dayItem.status)}
                          onChange={(e) => {
                            const updated = [...editWeekModal.days];
                            updated[idx] = { ...updated[idx], status: e.target.value };
                            setEditWeekModal({ ...editWeekModal, days: updated });
                          }}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.85rem', backgroundColor: '#fff' }}
                        >
                          <option value="1">Active</option>
                          <option value="0">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #eff2f7' }}>
                <button
                  type="button"
                  onClick={() => setEditWeekModal(null)}
                  style={{ padding: '8px 18px', backgroundColor: '#74788d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editWeekSaving}
                  style={{ padding: '8px 22px', backgroundColor: '#34c38f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {editWeekSaving ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Slider Image Modal */}
      {showAddSliderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h5 style={{ margin: 0, color: '#343a40', fontWeight: 'bold', fontSize: '1.05rem' }}>
                Add Slider Image
              </h5>
              <span
                style={{ cursor: 'pointer', fontSize: '1.3rem', color: '#74788d', lineHeight: 1 }}
                onClick={() => setShowAddSliderModal(false)}
              >
                ✕
              </span>
            </div>

            <form onSubmit={handleAddSliderSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                  Select Slider Image File *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFilePick(e, (base64) => setNewSliderForm(prev => ({ ...prev, slider_image: base64 })))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      fontSize: '0.85rem',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Or enter image URL / filename (e.g. banner.jpg)"
                    value={newSliderForm.slider_image}
                    onChange={(e) => setNewSliderForm({ ...newSliderForm, slider_image: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.82rem', color: '#495057' }}
                  />

                  {newSliderForm.slider_image && (
                    <div style={{ marginTop: '4px', textAlign: 'center', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px', border: '1px dashed #ced4da' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.78rem', color: '#74788d', fontWeight: 'bold' }}>Image Preview:</p>
                      <img
                        src={
                          newSliderForm.slider_image.startsWith('http://') || newSliderForm.slider_image.startsWith('https://') || newSliderForm.slider_image.startsWith('data:')
                            ? newSliderForm.slider_image
                            : newSliderForm.slider_image.startsWith('/')
                            ? newSliderForm.slider_image
                            : `/uploads/${newSliderForm.slider_image}`
                        }
                        alt="Slider Preview"
                        style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }}
                        onError={(e) => {
                          if (!e.target.dataset.triedFallback && !newSliderForm.slider_image.startsWith('http') && !newSliderForm.slider_image.startsWith('data:')) {
                            e.target.dataset.triedFallback = 'true';
                            e.target.src = `/${newSliderForm.slider_image.replace(/^\//, '')}`;
                          } else {
                            e.target.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#495057', display: 'block', marginBottom: '6px' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  placeholder="Enter Image Display Order"
                  value={newSliderForm.display_order}
                  onChange={(e) => setNewSliderForm({ ...newSliderForm, display_order: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #eff2f7' }}>
                <button
                  type="button"
                  onClick={() => {
                    setNewSliderForm({ slider_image: '', display_order: '1' });
                    setShowAddSliderModal(false);
                  }}
                  style={{ padding: '8px 18px', backgroundColor: '#74788d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSliderLoading}
                  style={{ padding: '8px 22px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {addSliderLoading ? 'Adding...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

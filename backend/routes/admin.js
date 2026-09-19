const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middlewares/auth');

// Admin Auth (Unprotected)
router.post('/login', authController.adminLogin);

// Admin Control endpoints (Protected)
router.get('/metrics', verifyAdmin, adminController.getDashboardMetrics);
router.get('/users', verifyAdmin, adminController.getUsers);
router.post('/users/update', verifyAdmin, adminController.updateUser);

// Deposit screen approvals
router.get('/deposits/pending', verifyAdmin, adminController.getPendingDeposits);
router.post('/deposits/approve', verifyAdmin, adminController.approveDeposit);
router.post('/deposits/reject', verifyAdmin, adminController.rejectDeposit);

// Withdrawal approvals
router.get('/withdrawals/pending', verifyAdmin, adminController.getPendingWithdrawals);
router.post('/withdrawals/approve', verifyAdmin, adminController.approveWithdrawal);
router.post('/withdrawals/reject', verifyAdmin, adminController.rejectWithdrawal);

// Declare Result and settlement
router.post('/declare-result', verifyAdmin, adminController.declareResult);

// System Settings Management
router.get('/settings', verifyAdmin, adminController.getSettings);
router.post('/settings/update', verifyAdmin, adminController.updateSettings);
router.post('/settings/contact/update', verifyAdmin, adminController.updateContact);

// Game Rates Management
router.get('/rates', verifyAdmin, adminController.getGameRates);
router.post('/rates/update', verifyAdmin, adminController.updateGameRates);

// Game Names Management (PHP game-name.php parity)
router.get('/games', verifyAdmin, adminController.getAdminGamesList);
router.post('/games/add', verifyAdmin, adminController.addGame);
router.get('/games/week/:gameName', verifyAdmin, adminController.getGameWeekSchedule);
router.post('/games/week/update', verifyAdmin, adminController.updateGameWeekSchedule);
router.post('/games/delete', verifyAdmin, adminController.deleteGame);

// Slider Banners Management
router.get('/sliders', verifyAdmin, adminController.getSliderImages);
router.post('/sliders/add', verifyAdmin, adminController.addSliderImage);
router.post('/sliders/status', verifyAdmin, adminController.toggleSliderStatus);
router.post('/sliders/delete', verifyAdmin, adminController.deleteSliderImage);

// Additional PHP Parity Endpoints
router.get('/metrics/ank-bids', verifyAdmin, adminController.getSingleAnkBids);
router.get('/metrics/bid-win-report', verifyAdmin, adminController.getBidWinReport);
router.post('/users/toggle-field', verifyAdmin, adminController.toggleUserField);
router.get('/referrals', verifyAdmin, adminController.getReferralReport);
router.get('/commission/pending', verifyAdmin, adminController.getCommissionReport);
router.post('/commission/approve', verifyAdmin, adminController.approveCommission);
router.get('/auto-deposits', verifyAdmin, adminController.getAutoDeposits);
router.post('/auto-deposits/status', verifyAdmin, adminController.handleAutoDeposit);
// Report Management Endpoints (PHP Parity)
router.get('/reports/bid-history', verifyAdmin, adminController.getBidHistoryReport);
router.post('/reports/bid-history/update', verifyAdmin, adminController.updateBidHistory);
router.get('/reports/customer-sell', verifyAdmin, adminController.getCustomerSellReport);
router.get('/reports/winning', verifyAdmin, adminController.getWinningReport);
router.get('/reports/transfers', verifyAdmin, adminController.getTransferReport);
router.get('/reports/withdrawals', verifyAdmin, adminController.getWithdrawalReport);
router.get('/commission/paid', verifyAdmin, adminController.getCommissionPayList);
// Wallet Management Endpoints (PHP Parity)
router.get('/deposits/requests', verifyAdmin, adminController.getFundRequests);
router.get('/withdrawals/requests', verifyAdmin, adminController.getWithdrawalRequests);
router.post('/wallet/add-fund', verifyAdmin, adminController.addFundToUserWallet);
router.get('/wallet/bid-revert', verifyAdmin, adminController.getBidRevertList);
router.post('/wallet/bid-revert/execute', verifyAdmin, adminController.executeBidRevert);
router.get('/reports/add-fund', verifyAdmin, adminController.getAddFundReport);
router.post('/change-password', verifyAdmin, adminController.changePassword);

// User Full Detail & Control Endpoints
router.get('/users/:userId/details', verifyAdmin, adminController.getUserFullDetails);
router.post('/users/update-password', verifyAdmin, adminController.updateUserPassword);
router.post('/users/adjust-wallet', verifyAdmin, adminController.adjustUserWallet);

module.exports = router;

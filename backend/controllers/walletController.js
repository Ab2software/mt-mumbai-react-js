const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Get Wallet Information & Settings
exports.getWalletInfo = async (req, res) => {
  const phone = req.user.phone;

  try {
    const [users] = await db.query('SELECT * FROM user_info WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.json({ success: '0', msg: 'User Not Found!' });
    }
    const user = users[0];

    const [contacts] = await db.query('SELECT * FROM contact_detail LIMIT 1');
    const contact = contacts[0] || { mobile: '', wp_mobile: '' };

    const [settings] = await db.query('SELECT * FROM admin_settings LIMIT 1');
    const setting = settings[0] || {};

    const showUpi = setting.show_upi !== undefined ? parseInt(setting.show_upi, 10) : 1;
    const showQr = setting.show_qr !== undefined ? parseInt(setting.show_qr, 10) : 1;
    const barcodePaymentMode = (showQr || showUpi) ? 1 : 0;
    const mpinStatus = (setting.mpin_status !== undefined && setting.mpin_status !== null) ? String(setting.mpin_status) : '1';

    const [admins] = await db.query('SELECT wallet FROM admin WHERE id = 1');
    const adminCoins = admins.length > 0 ? parseFloat(admins[0].wallet || '0') : 0;

    const data = {
      phone_number: user.phone,
      wallet: user.wallet,
      admin_coins: adminCoins,
      can_bid: true,
      status: user.status,
      start_time: '01:00',
      admin_mobile: contact.mobile,
      admin_wp: contact.wp_mobile,
      upi_name: 'Kalyan',
      upi_payment_id: setting.upi_payment_id || setting.payment_upi_id || '',
      payment_upi_id: setting.upi_payment_id || setting.payment_upi_id || '',
      payment_barcode_image: setting.payment_barcode_image || '',
      show_upi: showUpi,
      show_qr: showQr,
      mpin_status: mpinStatus,
      barcode_payment_mode: barcodePaymentMode,
      upi_phone: setting.phonepepay_upi || '',
      upi_google: setting.gpay_upi || '',
      alert_message: setting.alert_message || '',
      how_to_play: setting.how_to_play || '',
      m_pin: user.m_pin,
      min_limit: parseInt(setting.min_bid_amt, 10) > 0 ? setting.min_bid_amt : '10',
      max_limit: parseInt(setting.max_bid_amt, 10) > 0 ? setting.max_bid_amt : '50000',
      share_url: setting.app_link || '',
      share_message: setting.content || '',
      min_withdraw: setting.withdraw_open_time,
      max_withdraw: setting.withdraw_close_time,
      min_withdrawal: setting.min_withdrawal || '1000',
      max_withdrawal: setting.max_withdrawal || '50000',
      min_deposite: setting.min_deposite,
      max_deposite: setting.max_deposite
    };

    return res.json({
      success: '1',
      data: data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Submit Add Fund Request (manual screenshot / UTR check)
exports.submitFundRequest = async (req, res) => {
  const phone = req.user.phone;
  const name = req.user.name;
  const { amount, utr_no, image } = req.body; // image can be a base64 encoded string

  const amtNum = parseFloat(amount);
  if (isNaN(amtNum) || amtNum <= 0) {
    return res.json({ success: '0', msg: 'Valid amount is required.' });
  }

  try {
    let receipe_image = '';
    
    // Decode base64 image if uploaded
    if (image && image.trim() !== '') {
      const uploadDir = path.join(__dirname, '..', '..', '_public_html (1)', 'uploads', 'fund');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileName = Date.now() + '.jpg';
      const filePath = path.join(uploadDir, fileName);
      
      // Clean up base64 prefix if exists
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      receipe_image = 'uploads/fund/' + fileName;
    }

    const trans_details = 'Fund Request';
    const currentDateStr = new Date().toISOString().slice(0, 10);
    const todayDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 1. Insert in user_fund_request
    const [fundResult] = await db.query(
      "INSERT INTO user_fund_request (username, points, amount, trans_details, receipe_image, date, status, action) VALUES (?, ' ', ?, ?, ?, ?, '0', '')",
      [phone, amount, trans_details, receipe_image, currentDateStr]
    );

    // 2. Insert in user_auto_deposite
    let transaction_note = name ? `Fund Request - ${name}` : 'Fund Request';
    if (utr_no) {
      transaction_note += ` | UTR: ${utr_no}`;
    }

    const [depositResult] = await db.query(
      "INSERT INTO user_auto_deposite (username, transaction_note, amount, txt_request, txt_id, txt_date, status) VALUES (?, ?, ?, ?, '0', ?, '0')",
      [phone, transaction_note, amount, utr_no || '', todayDateTime]
    );

    if (fundResult.affectedRows > 0 && depositResult.affectedRows > 0) {
      return res.json({
        success: '1',
        msg: 'Fund request submitted. It will appear in Fund Request Auto Deposit History for admin approval.'
      });
    } else {
      return res.json({ success: '0', msg: 'Failed to submit fund request. Please try again.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Submit Withdrawal Request
exports.submitWithdrawRequest = async (req, res) => {
  const phone = req.user.phone;
  const { amount, remark } = req.body;

  const points = parseInt(amount, 10);
  if (isNaN(points) || points <= 0) {
    return res.json({ success: '0', msg: 'Invalid withdrawal amount.' });
  }

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = daysOfWeek[new Date().getDay()];
  const currentDateStr = new Date().toISOString().slice(0, 10);

  try {
    const [settings] = await db.query("SELECT * FROM admin_settings LIMIT 1");
    const limits = settings[0] || {};

    const [users] = await db.query("SELECT wallet FROM user_info WHERE phone = ? LIMIT 1", [phone]);
    if (users.length === 0) {
      return res.json({ success: '0', msg: 'User Not Found' });
    }

    const [dayLimits] = await db.query(
      "SELECT * FROM withdraw_limit_days WHERE name = ? AND status = 1 AND role = 'Days' LIMIT 1",
      [currentDayName]
    );

    if (dayLimits.length === 0) {
      return res.json({ success: '0', msg: `Withdraw Request Not Allowed on ${currentDayName}` });
    }

    // Timings validation
    const currentTime = new Date();
    const openTime = new Date(currentDateStr + 'T' + (limits.withdraw_open_time || '00:00:00'));
    const closeTime = new Date(currentDateStr + 'T' + (limits.withdraw_close_time || '23:59:59'));

    if (currentTime < openTime || currentTime > closeTime) {
      return res.json({
        success: '0',
        msg: `We are closed. Opening time ${limits.withdraw_open_time} Closing time ${limits.withdraw_close_time}`
      });
    }

    const walletAmount = parseInt(users[0].wallet, 10);
    const fixLimit = parseInt(limits.min_wallet_amount || '0', 10);
    const remainingAmount = walletAmount - fixLimit;
    const minLimit = parseInt(limits.min_withdrawal || '0', 10);
    const maxLimit = parseInt(limits.max_withdrawal || '0', 10);

    if (points < minLimit || points > maxLimit) {
      return res.json({
        success: '0',
        msg: `Limit does not match! Minimum Limit is ${minLimit} & Maximum Limit is ${maxLimit}`
      });
    }

    if (points > remainingAmount) {
      return res.json({
        success: '0',
        msg: 'Insufficient balance. Please recharge your wallet.'
      });
    }

    // Check for pending requests
    const [pendingRequests] = await db.query(
      "SELECT * FROM user_withdraw_request WHERE username = ? AND status = '0'",
      [phone]
    );

    if (pendingRequests.length > 0) {
      return res.json({ success: '0', msg: 'Still pending your last request' });
    }

    // Insert request
    const [insertResult] = await db.query(
      "INSERT INTO user_withdraw_request (username, points, amount, request_no, receipe_image, date, remark, status, action) VALUES (?, ?, 0, '', '', ?, ?, '0', '')",
      [phone, points, currentDateStr, remark || '']
    );

    if (insertResult.affectedRows > 0) {
      return res.json({ success: '1', msg: 'Withdraw Request Added Successfully!!' });
    } else {
      return res.json({ success: '0', msg: 'Some Error Occurred! Try Again Later!!' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get User Wallet History
exports.getWalletHistory = async (req, res) => {
  const phone = req.user.phone;
  const { date1, date2 } = req.query;
  try {
    let sql = "SELECT * FROM wallet_history WHERE phone_number = ?";
    const params = [phone];
    if (date1 && date2) {
      sql += " AND date BETWEEN ? AND ?";
      params.push(date1, date2);
    }
    sql += " ORDER BY date DESC, time DESC LIMIT 100";
    const [history] = await db.query(sql, params);
    return res.json({ success: '1', data: history, result: history });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get User Withdrawal History
exports.getWithdrawHistory = async (req, res) => {
  const phone = req.user.phone;
  const { date1, date2 } = req.query;
  try {
    let sql = "SELECT * FROM user_withdraw_request WHERE username = ?";
    const params = [phone];
    if (date1 && date2) {
      sql += " AND date BETWEEN ? AND ?";
      params.push(date1, date2);
    }
    sql += " ORDER BY date DESC LIMIT 100";
    const [history] = await db.query(sql, params);
    return res.json({ success: '1', data: history, result: history });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get User Deposit Request Status (PHP deposit-request-status.php parity)
exports.getDepositRequestStatus = async (req, res) => {
  const phone = req.user.phone;
  try {
    const [deposits] = await db.query(
      "SELECT id, amount, txt_request, txt_date, status FROM user_auto_deposite WHERE username = ? ORDER BY id DESC LIMIT 100",
      [phone]
    );
    const result = deposits.map(row => {
      let status_text = 'Pending';
      if (row.status == '1') status_text = 'Approved';
      else if (row.status == '-1') status_text = 'Rejected';
      return {
        id: row.id,
        amount: row.amount,
        utr: row.txt_request || '',
        date: row.txt_date,
        status: String(row.status),
        status_text
      };
    });
    return res.json({ success: '1', result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

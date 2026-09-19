const db = require('../config/db');

// Helper: Deduct Admin Coins (Disabled - direct deposit without coin requirement)
async function deductAdminCoins(amount) {
  return;
}

// Get Admin Dashboard Metrics
exports.getDashboardMetrics = async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM user_info');
    const [[{ unapproved_users }]] = await db.query("SELECT COUNT(*) as unapproved_users FROM user_info WHERE status = '0'");
    const [[{ approved_users }]] = await db.query("SELECT COUNT(*) as approved_users FROM user_info WHERE status = '1'");
    const [[{ total_games }]] = await db.query('SELECT COUNT(DISTINCT game) as total_games FROM game_time');
    const [[{ today_bid_amount }]] = await db.query('SELECT SUM(points_action) as today_bid_amount FROM user_bid_history WHERE date = CURDATE()');

    const [[{ total_bids }]] = await db.query('SELECT COUNT(*) as total_bids FROM user_bid_history');
    const [[{ total_withdrawals }]] = await db.query("SELECT SUM(points) as total_withdrawals FROM user_withdraw_request WHERE status = '1'");
    const [[{ total_wallet_balance }]] = await db.query('SELECT SUM(wallet) as total_wallet_balance FROM user_info');
    const [[{ admin_wallet }]] = await db.query('SELECT wallet as admin_wallet FROM admin WHERE id = 1');
    
    // Recent 5 Bids
    const [recentBids] = await db.query('SELECT * FROM user_bid_history ORDER BY id DESC LIMIT 5');

    return res.json({
      success: '1',
      metrics: {
        total_users,
        unapproved_users: unapproved_users || 0,
        approved_users: approved_users || 0,
        total_games: total_games || 0,
        today_bid_amount: today_bid_amount || 0,
        total_bids: total_bids || 0,
        total_withdrawals: total_withdrawals || 0,
        total_wallet_balance: total_wallet_balance || 0,
        admin_wallet: admin_wallet || 0
      },
      recentBids
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get List of Users
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, phone, password, m_pin, email, wallet, status, betting_status, transfer_status, date, referred_by_phone FROM user_info ORDER BY id DESC');
    return res.json({ success: '1', data: users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Update User Status, Betting Permissions, or Wallet Points
exports.updateUser = async (req, res) => {
  const { userId, status, betting_status, wallet } = req.body;

  try {
    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (betting_status !== undefined) {
      updates.push('betting_status = ?');
      values.push(betting_status);
    }
    if (wallet !== undefined) {
      const [currentUser] = await db.query('SELECT wallet FROM user_info WHERE id = ?', [userId]);
      if (currentUser.length > 0) {
        const oldWallet = parseFloat(currentUser[0].wallet || '0');
        const newWallet = parseFloat(wallet || '0');
        const diff = newWallet - oldWallet;
        if (diff > 0) {
          await deductAdminCoins(diff);
        }
      }
      updates.push('wallet = ?');
      values.push(wallet);
    }

    if (updates.length === 0) {
      return res.json({ success: '0', msg: 'No updates provided' });
    }

    values.push(userId);
    const [updateResult] = await db.query(`UPDATE user_info SET ${updates.join(', ')} WHERE id = ?`, values);

    if (updateResult.affectedRows > 0) {
      return res.json({ success: '1', msg: 'User updated successfully' });
    } else {
      return res.json({ success: '0', msg: 'Failed to update user' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Pending Deposits
exports.getPendingDeposits = async (req, res) => {
  try {
    const [deposits] = await db.query("SELECT * FROM user_auto_deposite WHERE status = '0' ORDER BY id DESC");
    return res.json({ success: '1', data: deposits });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Approve Deposit Request (handles both user_fund_request and user_auto_deposite)
exports.approveDeposit = async (req, res) => {
  const depositId = req.body.depositId || req.body.requestId || req.body.id;

  try {
    // Check user_fund_request first
    const [funds] = await db.query('SELECT * FROM user_fund_request WHERE id = ?', [depositId]);
    if (funds.length > 0) {
      const f = funds[0];
      const phone = f.username;
      const amount = parseFloat(f.amount || f.points || 0);

      const [users] = await db.query('SELECT wallet FROM user_info WHERE phone = ?', [phone]);
      if (users.length === 0) {
        return res.json({ success: '0', msg: 'User not found for this fund request' });
      }

      const currentWallet = parseFloat(users[0].wallet || '0');
      const updatedWallet = currentWallet + amount;

      await db.query('UPDATE user_info SET wallet = ? WHERE phone = ?', [updatedWallet, phone]);
      await deductAdminCoins(amount);
      const currentDateStr = new Date().toISOString().slice(0, 10);
      const currentTimeStr = new Date().toTimeString().slice(0, 8);
      const remark = 'Points Added By Admin ';

      await db.query(
        'INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['1', currentDateStr, currentTimeStr, amount, updatedWallet, remark, phone]
      );

      await db.query("UPDATE user_fund_request SET status = '1' WHERE id = ?", [depositId]);
      return res.json({ success: '1', msg: 'Fund request approved and wallet credited successfully' });
    }

    // Otherwise check user_auto_deposite
    const [deposits] = await db.query('SELECT * FROM user_auto_deposite WHERE id = ? AND status = 0', [depositId]);
    if (deposits.length === 0) {
      return res.json({ success: '0', msg: 'Deposit request not found or already processed' });
    }

    const dep = deposits[0];
    const phone = dep.username;
    const amount = parseFloat(dep.amount);

    const [users] = await db.query('SELECT wallet FROM user_info WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.json({ success: '0', msg: 'User not found for this deposit' });
    }

    const currentWallet = parseFloat(users[0].wallet || '0');
    const updatedWallet = currentWallet + amount;

    // Begin updates
    await db.query('UPDATE user_info SET wallet = ? WHERE phone = ?', [updatedWallet, phone]);
    await deductAdminCoins(amount);
    
    const currentDateStr = new Date().toISOString().slice(0, 10);
    const currentTimeStr = new Date().toTimeString().slice(0, 8);
    const remark = `Points Added By UPI Requested on ${dep.txt_date || currentDateStr}`;

    await db.query(
      'INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['1', currentDateStr, currentTimeStr, amount, updatedWallet, remark, phone]
    );

    // Update auto deposit request status to '1' (approved)
    await db.query("UPDATE user_auto_deposite SET status = '1' WHERE id = ?", [depositId]);

    // Update matching user_fund_request status if any
    await db.query("UPDATE user_fund_request SET status = '1' WHERE username = ? AND amount = ? AND status = '0' LIMIT 1", [phone, amount]);

    return res.json({ success: '1', msg: 'Deposit request approved and wallet credited successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Reject Deposit Request (handles both user_fund_request and user_auto_deposite)
exports.rejectDeposit = async (req, res) => {
  const depositId = req.body.depositId || req.body.requestId || req.body.id;

  try {
    const [fundRes] = await db.query("UPDATE user_fund_request SET status = '-1' WHERE id = ?", [depositId]);
    const [depRes] = await db.query("UPDATE user_auto_deposite SET status = '-1' WHERE id = ?", [depositId]);

    if (fundRes.affectedRows > 0 || depRes.affectedRows > 0) {
      return res.json({ success: '1', msg: 'Deposit request rejected' });
    } else {
      return res.json({ success: '0', msg: 'Deposit request not found' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Pending Withdrawals
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const [withdrawals] = await db.query("SELECT * FROM user_withdraw_request WHERE status = '0' ORDER BY id DESC");
    return res.json({ success: '1', data: withdrawals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Approve Withdrawal Request
exports.approveWithdrawal = async (req, res) => {
  const withdrawId = req.body.withdrawId || req.body.requestId || req.body.id;
  const remark = req.body.remark || '';

  if (!withdrawId) {
    return res.status(400).json({ success: '0', msg: 'Withdrawal ID is required' });
  }

  try {
    const [requests] = await db.query(
      'SELECT * FROM user_withdraw_request WHERE id = ? AND (status = "0" OR status = 0)',
      [withdrawId]
    );

    if (requests.length === 0) {
      return res.json({ success: '0', msg: 'Withdrawal request not found or already processed' });
    }

    const reqRow = requests[0];
    const phone = reqRow.username;
    const amount = parseFloat(reqRow.points || reqRow.amount || '0');

    const [users] = await db.query('SELECT wallet FROM user_info WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.json({ success: '0', msg: 'User not found' });
    }

    const wallet = parseFloat(users[0].wallet || '0');
    const updatedWallet = wallet - amount;

    if (updatedWallet < 0) {
      return res.json({ success: '0', msg: `Insufficient Funds in User Wallet! Current Balance: ₹${wallet}, Requested: ₹${amount}` });
    }

    // Deduct wallet balance
    await db.query('UPDATE user_info SET wallet = ? WHERE phone = ?', [updatedWallet, phone]);

    const currentDateStr = new Date().toISOString().slice(0, 10);
    const currentTimeStr = new Date().toTimeString().slice(0, 8);
    const walletRemark = remark || `${amount}₹ Transferred to your Account!`;

    await db.query(
      'INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['1', currentDateStr, currentTimeStr, `-${amount}`, updatedWallet, walletRemark, phone]
    );

    // Update status to '1' (approved)
    await db.query("UPDATE user_withdraw_request SET status = '1', remark = ? WHERE id = ?", [walletRemark, withdrawId]);

    return res.json({ success: '1', msg: 'Withdraw request approved and points deducted successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Reject Withdrawal Request
exports.rejectWithdrawal = async (req, res) => {
  const withdrawId = req.body.withdrawId || req.body.requestId || req.body.id;
  const remark = req.body.remark || 'Rejected by Admin';

  if (!withdrawId) {
    return res.status(400).json({ success: '0', msg: 'Withdrawal ID is required' });
  }

  try {
    const [updateResult] = await db.query(
      "UPDATE user_withdraw_request SET status = '-1', remark = ? WHERE id = ? AND (status = '0' OR status = 0)",
      [remark, withdrawId]
    );
    if (updateResult.affectedRows > 0) {
      return res.json({ success: '1', msg: 'Withdraw request rejected successfully' });
    } else {
      return res.json({ success: '0', msg: 'Withdraw request not found or already processed' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Helper: Calculate win amounts based on rates
async function processWinners(con, gameName, date, queryStr, params, winType, winRemark, openPanaVal, openDigitVal, closePanaVal, closeDigitVal, session) {
  const [bids] = await con.query(queryStr, params);
  
  if (bids.length === 0) return;

  const [rates] = await con.query('SELECT * FROM game_rates WHERE type = ? LIMIT 1', [winType]);
  if (rates.length === 0) return;

  const rateVal = parseFloat(rates[0].max_value) / parseFloat(rates[0].min_value);

  const currentDateStr = new Date().toISOString().slice(0, 10);
  const currentTimeStr = new Date().toTimeString().slice(0, 8);

  for (const b of bids) {
    const phone = b.username;
    const points = parseInt(b.points_action, 10);
    const winAmount = Math.round(rateVal * points);

    await con.query(
      'INSERT INTO user_winning_report (date, username, bid_id, game_name, game_type, session, open_pana, open_digit, close_pana, close_digit, winning_points, points_action) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [date, phone, gameName, winType, session, openPanaVal, openDigitVal, closePanaVal, closeDigitVal, winAmount, points]
    );

    // Credit wallet
    const [users] = await con.query('SELECT wallet FROM user_info WHERE phone = ?', [phone]);
    if (users.length > 0) {
      const currentWallet = parseFloat(users[0].wallet || '0');
      const newWallet = currentWallet + winAmount;

      await con.query('UPDATE user_info SET wallet = ? WHERE phone = ?', [newWallet, phone]);
      await con.query(
        'INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['1', currentDateStr, currentTimeStr, winAmount, newWallet, winRemark, phone]
      );
    }
  }
}

// Declare Game Result & Distribute Payouts
exports.declareResult = async (req, res) => {
  const { game_name, date, session, open_pana, open_result, close_pana, close_result } = req.body;

  if (!game_name || !date || !session) {
    return res.json({ success: '0', msg: 'Game name, date and session are required!' });
  }

  try {
    const panaVal = session === 'open' ? 'open_panna' : 'close_panna';
    const digitVal = session === 'open' ? 'open_digit' : 'close_digit';
    const declaredPana = session === 'open' ? open_pana : close_pana;
    const declaredDigit = session === 'open' ? open_result : close_result;

    if (!declaredPana || !declaredDigit) {
      return res.json({ success: '0', msg: 'Winning pana and digit are required!' });
    }

    // 1. Check if result already declared
    const [checkChart] = await db.query('SELECT * FROM result_chart WHERE date = ? AND game_name = ?', [date, game_name]);

    if (checkChart.length > 0) {
      const row = checkChart[0];
      if (session === 'close') {
        if (row.open_panna === '' || row.open_digit === '') {
          return res.json({ success: '0', msg: 'Please declare Open Result first!' });
        }
        if (row.close_panna !== '' && row.close_digit !== '') {
          return res.json({ success: '0', msg: 'Result Already Declared!' });
        }
        // Update close result
        await db.query(`UPDATE result_chart SET ${panaVal} = ?, ${digitVal} = ? WHERE game_name = ? AND date = ?`, [declaredPana, declaredDigit, game_name, date]);
      } else {
        if (row.open_panna !== '' && row.open_digit !== '') {
          return res.json({ success: '0', msg: 'Result Already Declared!' });
        }
        // Update open result
        await db.query(`UPDATE result_chart SET ${panaVal} = ?, ${digitVal} = ? WHERE game_name = ? AND date = ?`, [declaredPana, declaredDigit, game_name, date]);
      }
    } else {
      if (session === 'close') {
        return res.json({ success: '0', msg: 'Please declare Open Result first!' });
      }
      // Insert new open result
      await db.query(
        'INSERT INTO result_chart (game_name, date, open_panna, open_digit, close_panna, close_digit, status) VALUES (?, ?, ?, ?, "", "", "1")',
        [game_name, date, declaredPana, declaredDigit]
      );
    }

    // 2. Process winners based on declared results
    if (session === 'open') {
      // Open Pana Winners
      const openPanaQuery = `
        SELECT * FROM user_bid_history 
        WHERE game_name = ? AND date = ? AND open_pana = ? 
        AND game_type != 'Half Sangam' AND game_type != 'Full Sangam'
      `;
      await processWinners(db, game_name, date, openPanaQuery, [game_name, date, declaredPana], 'Open Pana', 'Open Panna Winning Reward', declaredPana, 'N/A', 'N/A', 'N/A', session);

      // Open Digit Winners
      const openDigitQuery = `
        SELECT * FROM user_bid_history 
        WHERE game_name = ? AND date = ? AND open_digit = ? AND close_digit = 'NA' AND game_type = 'Single Digit'
      `;
      await processWinners(db, game_name, date, openDigitQuery, [game_name, date, declaredDigit], 'Single Digit', 'Open Digit Winning Reward', 'N/A', declaredDigit, 'N/A', 'N/A', session);
    } else {
      // Close Pana Winners
      const closePanaQuery = `
        SELECT * FROM user_bid_history 
        WHERE game_name = ? AND date = ? AND close_pana = ? 
        AND game_type != 'Half Sangam' AND game_type != 'Full Sangam'
      `;
      await processWinners(db, game_name, date, closePanaQuery, [game_name, date, declaredPana], 'Close Pana', 'Close Panna Winning Reward', 'N/A', 'N/A', declaredPana, 'N/A', session);

      // Close Digit Winners
      const closeDigitQuery = `
        SELECT * FROM user_bid_history 
        WHERE game_name = ? AND date = ? AND close_digit = ? AND open_digit = 'NA' AND game_type = 'Single Digit'
      `;
      await processWinners(db, game_name, date, closeDigitQuery, [game_name, date, declaredDigit], 'Single Digit', 'Close Digit Winning Reward', 'N/A', 'N/A', 'N/A', declaredDigit, session);

      // Fetch the full chart entry to solve Jodi and Sangams
      const [[chartRow]] = await db.query('SELECT * FROM result_chart WHERE game_name = ? AND date = ?', [game_name, date]);
      const openRe = chartRow.open_digit;
      const closeRe = chartRow.close_digit;
      const openPa = chartRow.open_panna;
      const closePa = chartRow.close_panna;

      // Jodi Winners
      const jodiQuery = `
        SELECT * FROM user_bid_history 
        WHERE game_name = ? AND date = ? AND game_type = 'Jodi Digit' AND open_digit = ? AND close_digit = ?
      `;
      await processWinners(db, game_name, date, jodiQuery, [game_name, date, openRe, closeRe], 'Jodi Digit', 'Jodi Digit Winning Reward', 'N/A', openRe, 'N/A', closeRe, session);

      // Half Sangam Winners
      const halfSangamQuery = `
        SELECT * FROM user_bid_history 
        WHERE game_name = ? AND date = ? AND game_type = 'Half Sangam' AND open_digit = ? AND close_pana = ?
      `;
      await processWinners(db, game_name, date, halfSangamQuery, [game_name, date, openRe, closePa], 'Half Sangam', 'Half Sangam Winning Reward', 'N/A', openRe, closePa, 'N/A', session);

      // Full Sangam Winners
      const fullSangamQuery = `
        SELECT * FROM user_bid_history 
        WHERE game_name = ? AND date = ? AND game_type = 'Full Sangam' AND open_pana = ? AND close_pana = ?
      `;
      await processWinners(db, game_name, date, fullSangamQuery, [game_name, date, openPa, closePa], 'Full Sangam', 'Full Sangam Winning Reward', openPa, 'N/A', closePa, 'N/A', session);
    }

    return res.json({ success: '1', msg: 'Result Declared and Winners credited successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Admin Settings and Contacts (PHP Parity)
exports.getSettings = async (req, res) => {
  try {
    const [[settings]] = await db.query('SELECT * FROM admin_settings WHERE id = 1');
    const [[contact]] = await db.query('SELECT * FROM contact_detail WHERE id = 1');
    const [daysRows] = await db.query("SELECT name FROM withdraw_limit_days WHERE role = 'Days' AND status = 1");
    const withdraw_days = daysRows.map(r => r.name);
    return res.json({ success: '1', settings: settings || {}, contact: contact || {}, withdraw_days });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Update Admin Settings (Bank Details, UPI/QR, Limits & Days - PHP main-settings.php parity)
exports.updateSettings = async (req, res) => {
  try {
    const body = req.body.settings || req.body;
    const {
      ac_name,
      ac_number,
      ifsc_code,
      alert_message,
      min_deposite,
      max_deposite,
      min_withdrawal,
      max_withdrawal,
      min_transfer,
      max_transfer,
      min_bid_amt,
      max_bid_amt,
      Dragon_bonus,
      referral_commission,
      min_wallet_amount,
      withdraw_open_time,
      withdraw_close_time,
      payment_upi_id,
      upi_payment_id,
      payment_barcode_image,
      show_upi,
      show_qr,
      how_to_play,
      withdraw_days,
      mpin_status,
      slider_status
    } = body;

    // Helper for bool/int values
    const parseFlag = (val) => {
      if (val === undefined || val === null) return null;
      if (val === 1 || val === '1' || val === true || val === 'true') return 1;
      return 0;
    };

    const upiVal = (payment_upi_id !== undefined || upi_payment_id !== undefined) ? (payment_upi_id || upi_payment_id || '') : undefined;

    // Update admin_settings
    await db.query(
      `UPDATE admin_settings SET 
        ac_name = COALESCE(?, ac_name),
        ac_number = COALESCE(?, ac_number),
        ifsc_code = COALESCE(?, ifsc_code),
        alert_message = COALESCE(?, alert_message),
        min_deposite = COALESCE(?, min_deposite),
        max_deposite = COALESCE(?, max_deposite),
        min_withdrawal = COALESCE(?, min_withdrawal),
        max_withdrawal = COALESCE(?, max_withdrawal),
        min_transfer = COALESCE(?, min_transfer),
        max_transfer = COALESCE(?, max_transfer),
        min_bid_amt = COALESCE(?, min_bid_amt),
        max_bid_amt = COALESCE(?, max_bid_amt),
        Dragon_bonus = COALESCE(?, Dragon_bonus),
        referral_commission = COALESCE(?, referral_commission),
        min_wallet_amount = COALESCE(?, min_wallet_amount),
        withdraw_open_time = COALESCE(?, withdraw_open_time),
        withdraw_close_time = COALESCE(?, withdraw_close_time),
        payment_upi_id = COALESCE(?, payment_upi_id),
        upi_payment_id = COALESCE(?, upi_payment_id),
        payment_barcode_image = COALESCE(?, payment_barcode_image),
        show_upi = COALESCE(?, show_upi),
        show_qr = COALESCE(?, show_qr),
        how_to_play = COALESCE(?, how_to_play),
        mpin_status = COALESCE(?, mpin_status),
        slider_status = COALESCE(?, slider_status)
       WHERE id = 1`,
      [
        ac_name !== undefined ? ac_name : null,
        ac_number !== undefined ? ac_number : null,
        ifsc_code !== undefined ? ifsc_code : null,
        alert_message !== undefined ? alert_message : null,
        min_deposite !== undefined ? min_deposite : null,
        max_deposite !== undefined ? max_deposite : null,
        min_withdrawal !== undefined ? min_withdrawal : null,
        max_withdrawal !== undefined ? max_withdrawal : null,
        min_transfer !== undefined ? min_transfer : null,
        max_transfer !== undefined ? max_transfer : null,
        min_bid_amt !== undefined ? min_bid_amt : null,
        max_bid_amt !== undefined ? max_bid_amt : null,
        Dragon_bonus !== undefined ? Dragon_bonus : null,
        referral_commission !== undefined ? referral_commission : null,
        min_wallet_amount !== undefined ? min_wallet_amount : null,
        withdraw_open_time !== undefined ? withdraw_open_time : null,
        withdraw_close_time !== undefined ? withdraw_close_time : null,
        upiVal !== undefined ? upiVal : null,
        upiVal !== undefined ? upiVal : null,
        payment_barcode_image !== undefined ? payment_barcode_image : null,
        parseFlag(show_upi),
        parseFlag(show_qr),
        how_to_play !== undefined ? how_to_play : null,
        mpin_status !== undefined && mpin_status !== null ? String(mpin_status) : null,
        slider_status !== undefined && slider_status !== null ? String(slider_status) : null
      ]
    );

    // Update withdraw allowed days if provided
    if (Array.isArray(withdraw_days)) {
      await db.query("DELETE FROM withdraw_limit_days WHERE role = 'Days'");
      for (const day of withdraw_days) {
        await db.query(
          "INSERT INTO withdraw_limit_days (name, status, role, updated_on) VALUES (?, 1, 'Days', NOW())",
          [day]
        );
      }
    }

    return res.json({ success: '1', msg: 'Main Settings updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Update Contact Details (PHP contact-settings.php parity)
exports.updateContact = async (req, res) => {
  try {
    const {
      mobile,
      alt_mobile,
      wp_mobile,
      landline,
      alt_landline,
      email,
      alt_email,
      facebook,
      twitter,
      youtube,
      instagram,
      address
    } = req.body;

    await db.query(
      `UPDATE contact_detail SET 
        mobile = ?, 
        alt_mobile = ?,
        wp_mobile = ?, 
        landline = ?,
        alt_landline = ?,
        email = ?,
        alt_email = ?,
        facebook = ?,
        twitter = ?,
        youtube = ?,
        instagram = ?,
        address = ?
       WHERE id = 1`,
      [
        mobile || '',
        alt_mobile || '',
        wp_mobile || '',
        landline || '',
        alt_landline || '',
        email || '',
        alt_email || '',
        facebook || '',
        twitter || '',
        youtube || '',
        instagram || '',
        address || ''
      ]
    );

    return res.json({ success: '1', msg: 'Contact Details updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Game Payout Rates
exports.getGameRates = async (req, res) => {
  try {
    const [rates] = await db.query('SELECT * FROM game_rates ORDER BY id ASC');
    return res.json({ success: '1', data: rates });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Update Game Payout Rates
exports.updateGameRates = async (req, res) => {
  try {
    const body = req.body;
    if (Array.isArray(body.rates)) {
      for (const rate of body.rates) {
        if (rate.id) {
          await db.query(
            'UPDATE game_rates SET min_value = ?, max_value = ? WHERE id = ?',
            [rate.min_value, rate.max_value, rate.id]
          );
        } else if (rate.type) {
          await db.query(
            'UPDATE game_rates SET min_value = ?, max_value = ? WHERE type = ?',
            [rate.min_value, rate.max_value, rate.type]
          );
        }
      }
    } else if (body.rates && typeof body.rates === 'object') {
      for (const [type, val] of Object.entries(body.rates)) {
        await db.query(
          'UPDATE game_rates SET min_value = ?, max_value = ? WHERE type = ?',
          [val.min_value, val.max_value, type]
        );
      }
    } else {
      // Direct keys like single_digit_1, single_digit_2 matching PHP update-game-rates.php
      const mapping = {
        'Single Digit': [body.single_digit_1, body.single_digit_2],
        'Jodi Digit': [body.jodi_digit_1, body.jodi_digit_2],
        'Single Pana': [body.single_pana_1, body.single_pana_2],
        'Double Pana': [body.double_pana_1, body.double_pana_2],
        'Triple Pana': [body.triple_pana_1, body.triple_pana_2],
        'Half Sangam': [body.half_sangam_1, body.half_sangam_2],
        'Full Sangam': [body.full_sangam_1, body.full_sangam_2]
      };
      for (const [type, [v1, v2]] of Object.entries(mapping)) {
        if (v1 !== undefined && v2 !== undefined) {
          await db.query(
            'UPDATE game_rates SET min_value = ?, max_value = ? WHERE type = ?',
            [v1, v2, type]
          );
        }
      }
    }
    return res.json({ success: '1', msg: 'Game rates updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Slider Images
exports.getSliderImages = async (req, res) => {
  try {
    const [sliders] = await db.query('SELECT * FROM slider_images ORDER BY id DESC');
    return res.json({ success: '1', data: sliders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Add Slider Image
exports.addSliderImage = async (req, res) => {
  try {
    const { slider_image, display_order } = req.body;
    if (!slider_image) {
      return res.status(400).json({ success: '0', msg: 'Slider image path or URL is required' });
    }
    await db.query(
      'INSERT INTO slider_images (slider_image, display_order, creation_date, status, action) VALUES (?, ?, CURDATE(), "1", "")',
      [slider_image, display_order || '1']
    );
    return res.json({ success: '1', msg: 'Slider image added successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Toggle Slider Status
exports.toggleSliderStatus = async (req, res) => {
  try {
    const { id } = req.body;
    await db.query("UPDATE slider_images SET status = IF(status = '1', '0', '1') WHERE id = ?", [id]);
    return res.json({ success: '1', msg: 'Slider status updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Delete Slider Image
exports.deleteSliderImage = async (req, res) => {
  try {
    const { id } = req.body;
    await db.query('DELETE FROM slider_images WHERE id = ?', [id]);
    return res.json({ success: '1', msg: 'Slider image deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Single Ank Bids (Ank 0 through 9)
exports.getSingleAnkBids = async (req, res) => {
  try {
    const { game_name, market_status, date } = req.query;
    const targetDate = (date && date.trim() !== '') ? date : new Date().toISOString().slice(0, 10);

    let query = `
      SELECT open_digit, close_digit, session, points_action 
      FROM user_bid_history 
      WHERE (date = ? OR DATE_FORMAT(date, '%Y-%m-%d') = ?)
        AND (game_type LIKE '%Single%' OR game_type = 'Single Digit' OR game_type = 'Single Ank')
    `;
    const params = [targetDate, targetDate];

    if (game_name && game_name !== '' && game_name !== 'all') {
      query += ' AND game_name = ?';
      params.push(game_name);
    }

    if (market_status === 'close_digit') {
      query += " AND (LOWER(session) = 'close' OR (close_digit IS NOT NULL AND close_digit != 'NA'))";
    } else if (market_status === 'open_digit') {
      query += " AND (LOWER(session) = 'open' OR (open_digit IS NOT NULL AND open_digit != 'NA'))";
    }

    const [rows] = await db.query(query, params);

    const anks = {};
    for (let i = 0; i <= 9; i++) {
      anks[i] = { bids: 0, amount: 0 };
    }

    rows.forEach(r => {
      let digitVal = null;
      if (market_status === 'close_digit') {
        digitVal = (r.close_digit && r.close_digit !== 'NA') ? r.close_digit : r.open_digit;
      } else {
        digitVal = (r.open_digit && r.open_digit !== 'NA') ? r.open_digit : r.close_digit;
      }

      const digit = parseInt(digitVal, 10);
      if (!isNaN(digit) && digit >= 0 && digit <= 9 && anks[digit]) {
        anks[digit].bids += 1;
        anks[digit].amount += Number(r.points_action) || 0;
      }
    });

    return res.json({ success: '1', data: anks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Bid Win Report for Game & Date
exports.getBidWinReport = async (req, res) => {
  try {
    const { date, game_name } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    let bidQuery = 'SELECT SUM(points_action) as total_bid FROM user_bid_history WHERE date = ?';
    let winQuery = 'SELECT SUM(winning_points) as total_win FROM user_winning_report WHERE date = ?';
    const params = [targetDate];

    if (game_name && game_name !== 'all') {
      bidQuery += ' AND game_name = ?';
      winQuery += ' AND game_name = ?';
      params.push(game_name);
    }

    const [[{ total_bid }]] = await db.query(bidQuery, params);
    const [[{ total_win }]] = await db.query(winQuery, params);

    const totalBidAmt = Number(total_bid) || 0;
    const totalWinAmt = Number(total_win) || 0;
    const profitAmt = totalBidAmt - totalWinAmt;

    return res.json({
      success: '1',
      total_bid: totalBidAmt,
      total_win: totalWinAmt,
      profit: profitAmt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Toggle User Field (status, betting_status, transfer_status)
exports.toggleUserField = async (req, res) => {
  try {
    const { userId, field } = req.body;
    if (!['status', 'betting_status', 'transfer_status'].includes(field)) {
      return res.status(400).json({ success: '0', msg: 'Invalid field' });
    }

    const [user] = await db.query('SELECT ?? FROM user_info WHERE id = ?', [field, userId]);
    if (!user.length) {
      return res.status(404).json({ success: '0', msg: 'User not found' });
    }

    const currentVal = user[0][field];
    const newVal = currentVal === '1' || currentVal === 1 ? '0' : '1';

    await db.query('UPDATE user_info SET ?? = ? WHERE id = ?', [field, newVal, userId]);
    return res.json({ success: '1', msg: 'Updated successfully', newVal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Referral Report
exports.getReferralReport = async (req, res) => {
  try {
    const [list] = await db.query(`
      SELECT u.id, u.name, u.phone, u.date, u.referred_by_phone, r.name AS referrer_name
      FROM user_info u
      LEFT JOIN user_info r ON r.phone = u.referred_by_phone
      WHERE u.referred_by_phone IS NOT NULL AND TRIM(u.referred_by_phone) != ''
      ORDER BY u.date DESC
    `);
    return res.json({ success: '1', data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Commission Report (Pending approval)
exports.getCommissionReport = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let query = 'SELECT c.*, r.name as referrer_name FROM user_referral_commission c LEFT JOIN user_info r ON r.phone = c.referrer_phone WHERE c.status = "0"';
    const params = [];
    if (from_date && to_date) {
      query += ' AND c.bid_date BETWEEN ? AND ?';
      params.push(from_date, to_date);
    }
    query += ' ORDER BY c.id DESC';
    const [rows] = await db.query(query, params);
    return res.json({ success: '1', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Approve Commission (Single or Bulk)
exports.approveCommission = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ success: '0', msg: 'No commission IDs provided' });
    }
    for (const id of ids) {
      const [comm] = await db.query('SELECT * FROM user_referral_commission WHERE id = ? AND status = "0"', [id]);
      if (comm.length > 0) {
        const { referrer_phone, amount } = comm[0];
        await db.query('UPDATE user_referral_commission SET status = "1" WHERE id = ?', [id]);
        await db.query('UPDATE user_info SET wallet = wallet + ? WHERE phone = ?', [amount, referrer_phone]);
        const today = new Date().toISOString().slice(0, 10);
        const time = new Date().toTimeString().slice(0, 8);
        await db.query('INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES ("1", ?, ?, ?, ?, "Referral Commission", ?)', [today, time, amount, amount, referrer_phone]);
      }
    }
    return res.json({ success: '1', msg: 'Commissions approved successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Auto Deposits History (Enhanced with date filter and summaries)
exports.getAutoDeposits = async (req, res) => {
  try {
    const { date, search } = req.query;
    let query = `
      SELECT d.*, u.name as user_name, u.id as user_id
      FROM user_auto_deposite d
      LEFT JOIN user_info u ON u.phone = d.username
    `;
    const params = [];
    const conditions = [];

    if (date && date !== 'all' && date.trim() !== '') {
      conditions.push('(d.txt_date LIKE ? OR DATE(d.txt_date) = ?)');
      params.push(`%${date}%`, date);
    }

    if (search && search.trim() !== '') {
      conditions.push('(d.username LIKE ? OR u.name LIKE ? OR d.txt_id LIKE ? OR d.amount LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY d.id DESC LIMIT 500';

    const [deposits] = await db.query(query, params);

    // Calculate totals
    let totalTransfer = 0;
    let totalApproved = 0;
    let totalRejected = 0;
    let totalPending = 0;

    deposits.forEach(d => {
      const amt = Math.abs(Number(d.amount) || 0);
      totalTransfer += amt;
      if (d.status === '1' || d.status === 1) {
        totalApproved += amt;
      } else if (d.status === '-1' || d.status === -1) {
        totalRejected += amt;
      } else {
        totalPending += amt;
      }
    });

    return res.json({
      success: '1',
      data: deposits,
      totals: {
        total_transfer: totalTransfer,
        total_approved: totalApproved,
        total_rejected: totalRejected,
        total_pending: totalPending
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Handle Auto Deposit Action (Approve / Decline)
exports.handleAutoDeposit = async (req, res) => {
  try {
    const { id, response } = req.body; // response: "1" (approve) or "-1" (reject)
    const [dep] = await db.query('SELECT * FROM user_auto_deposite WHERE id = ?', [id]);
    if (!dep.length) {
      return res.status(404).json({ success: '0', msg: 'Record not found' });
    }
    const { username, amount } = dep[0];
    const depAmt = parseFloat(amount || 0);

    if (response === '1') {
      await db.query('UPDATE user_auto_deposite SET status = ? WHERE id = ?', [response, id]);
      await db.query('UPDATE user_info SET wallet = wallet + ? WHERE phone = ?', [depAmt, username]);
      await deductAdminCoins(depAmt);
      const today = new Date().toISOString().slice(0, 10);
      const time = new Date().toTimeString().slice(0, 8);
      await db.query('INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES ("1", ?, ?, ?, ?, "Auto Deposit Approved", ?)', [today, time, depAmt, depAmt, username]);
    } else {
      await db.query('UPDATE user_auto_deposite SET status = ? WHERE id = ?', [response, id]);
    }
    return res.json({ success: '1', msg: response === '1' ? 'Deposit Approved' : 'Deposit Rejected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Paid Commission Report (status = '1')
exports.getCommissionPayList = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let query = 'SELECT c.*, r.name as referrer_name FROM user_referral_commission c LEFT JOIN user_info r ON r.phone = c.referrer_phone WHERE c.status = "1"';
    const params = [];
    if (from_date && to_date) {
      query += ' AND DATE(c.created_at) BETWEEN ? AND ?';
      params.push(from_date, to_date);
    }
    query += ' ORDER BY c.created_at DESC';
    const [rows] = await db.query(query, params);
    return res.json({ success: '1', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Change Admin Password
exports.changePassword = async (req, res) => {
  try {
    const { oldpass, newpass, retypepass } = req.body;
    if (!oldpass || !newpass || !retypepass) {
      return res.status(400).json({ success: '0', msg: 'All password fields are required' });
    }
    if (newpass !== retypepass) {
      return res.status(400).json({ success: '0', msg: 'New password and confirm password do not match' });
    }
    const adminId = req.user.id;
    const [admins] = await db.query('SELECT * FROM admin WHERE id = ?', [adminId]);
    if (!admins.length || admins[0].password !== oldpass) {
      return res.status(400).json({ success: '0', msg: 'Incorrect old password' });
    }
    await db.query('UPDATE admin SET password = ? WHERE id = ?', [newpass, adminId]);
    return res.json({ success: '1', msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// ==========================================
// REPORT MANAGEMENT CONTROLLERS (PHP PARITY)
// ==========================================

// 1. Get Bid History Report
exports.getBidHistoryReport = async (req, res) => {
  try {
    const { date, game_name, game_type } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);
    
    let query = `
      SELECT b.*, u.name as user_name, u.id as user_id
      FROM user_bid_history b
      LEFT JOIN user_info u ON u.phone = b.username
      WHERE b.date = ?
    `;
    const params = [targetDate];

    if (game_name && game_name !== 'all') {
      query += ' AND b.game_name = ?';
      params.push(game_name);
    }
    if (game_type && game_type !== 'all') {
      query += ' AND b.game_type = ?';
      params.push(game_type);
    }

    query += ' ORDER BY b.id DESC';
    const [rows] = await db.query(query, params);
    return res.json({ success: '1', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Update Bid in History (PHP edit_bid1.php parity)
exports.updateBidHistory = async (req, res) => {
  try {
    const { id, open_pana, open_digit, close_pana, close_digit, points_action } = req.body;
    if (!id) {
      return res.status(400).json({ success: '0', msg: 'Bid ID is required' });
    }
    const [existing] = await db.query('SELECT * FROM user_bid_history WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: '0', msg: 'Bid not found' });
    }

    await db.query(
      'UPDATE user_bid_history SET open_pana = ?, open_digit = ?, close_pana = ?, close_digit = ?, points_action = ? WHERE id = ?',
      [
        open_pana !== undefined ? open_pana : existing[0].open_pana,
        open_digit !== undefined ? open_digit : existing[0].open_digit,
        close_pana !== undefined ? close_pana : existing[0].close_pana,
        close_digit !== undefined ? close_digit : existing[0].close_digit,
        points_action !== undefined ? points_action : existing[0].points_action,
        id
      ]
    );

    return res.json({ success: '1', msg: 'Bid updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 2. Get Customer Sell Report
exports.getCustomerSellReport = async (req, res) => {
  try {
    const { date, game_name, game_type, market_status } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const session = market_status || 'open';

    const getNumbersData = async (typeFilter, fieldName) => {
      let numbersQuery = 'SELECT number FROM game_number WHERE ';
      if (typeFilter === 'Single Digit') {
        numbersQuery += "type = 'Single Digit'";
      } else if (typeFilter === 'Jodi Digit') {
        numbersQuery += "type = 'Jodi Digit'";
      } else if (typeFilter === 'Single Pana') {
        numbersQuery += "type LIKE '%Single Pana%'";
      } else if (typeFilter === 'Double Pana') {
        numbersQuery += "type LIKE '%Double Pana%'";
      } else if (typeFilter === 'Triple Pana') {
        numbersQuery += "(type LIKE '%Tripple Pana%' OR type LIKE '%Triple Pana%')";
      }
      numbersQuery += ' ORDER BY id ASC';

      const [numRows] = await db.query(numbersQuery);

      let bidsQuery = `
        SELECT 
          ${typeFilter === 'Jodi Digit' ? "CONCAT(open_digit, close_digit) as num" : `?? as num`},
          SUM(CAST(points_action AS UNSIGNED)) as total_points
        FROM user_bid_history
        WHERE date = ? AND game_type = ?
      `;
      const bidsParams = typeFilter === 'Jodi Digit' 
        ? [targetDate, typeFilter] 
        : [fieldName, targetDate, typeFilter];

      if (game_name && game_name !== 'all') {
        bidsQuery += ' AND game_name = ?';
        bidsParams.push(game_name);
      }

      bidsQuery += ` GROUP BY ${typeFilter === 'Jodi Digit' ? 'CONCAT(open_digit, close_digit)' : '??'}`;
      if (typeFilter !== 'Jodi Digit') {
        bidsParams.push(fieldName);
      }

      const [bidSums] = await db.query(bidsQuery, bidsParams);
      const pointsMap = {};
      bidSums.forEach(b => {
        if (b.num !== null && b.num !== undefined) {
          pointsMap[b.num.toString().trim()] = Number(b.total_points) || 0;
        }
      });

      return numRows.map(n => {
        const numStr = n.number.toString().trim();
        return {
          number: numStr,
          sum: pointsMap[numStr] || 0
        };
      });
    };

    const targetTypes = (!game_type || game_type === 'all')
      ? ['Single Digit', 'Jodi Digit', 'Single Pana', 'Double Pana', 'Triple Pana']
      : [game_type];

    const results = {};
    let grandTotal = 0;

    for (const t of targetTypes) {
      const field = (t === 'Single Digit') ? `${session}_digit` : `${session}_pana`;
      const data = await getNumbersData(t, field);
      const typeTotal = data.reduce((acc, curr) => acc + curr.sum, 0);
      grandTotal += typeTotal;
      results[t] = {
        data,
        total_points: typeTotal
      };
    }

    return res.json({
      success: '1',
      date: targetDate,
      game_name,
      market_status: session,
      results,
      grand_total: grandTotal
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 3. Get Winning Report
exports.getWinningReport = async (req, res) => {
  try {
    const { date, game_name, market_status } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    let query = `
      SELECT w.*, u.name as user_name, u.id as user_id
      FROM user_winning_report w
      LEFT JOIN user_info u ON u.phone = w.username
      WHERE w.date = ?
    `;
    const params = [targetDate];

    if (game_name && game_name !== 'all') {
      query += ' AND w.game_name = ?';
      params.push(game_name);
    }
    if (market_status && market_status !== 'all') {
      query += ' AND w.session = ?';
      params.push(market_status);
    }

    query += ' ORDER BY w.id DESC';
    const [rows] = await db.query(query, params);

    let totalWinning = 0;
    let totalPoints = 0;
    rows.forEach(r => {
      totalWinning += Number(r.winning_points) || 0;
      totalPoints += Number(r.points_action) || 0;
    });

    return res.json({
      success: '1',
      data: rows,
      total_winning: totalWinning,
      total_points: totalPoints
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 4. Get Transfer Point Report
exports.getTransferReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const [rows] = await db.query(`
      SELECT id, status, DATE_FORMAT(date, '%Y-%m-%d') as date, time, amount, updated_amount, remark, phone_number
      FROM wallet_history
      WHERE DATE(date) = ? AND remark LIKE '%Points Transferred%' AND CAST(amount AS SIGNED) > 0
      ORDER BY id DESC
    `, [targetDate]);

    const phones = new Set();
    rows.forEach(r => {
      const senderPhone = r.remark ? r.remark.trim().slice(-10) : '';
      if (senderPhone) phones.add(senderPhone);
      if (r.phone_number) phones.add(r.phone_number.trim());
    });

    let userMap = {};
    if (phones.size > 0) {
      const [users] = await db.query('SELECT id, name, phone FROM user_info WHERE phone IN (?)', [Array.from(phones)]);
      users.forEach(u => {
        userMap[u.phone] = u;
      });
    }

    let totalAmount = 0;
    const data = rows.map((r, index) => {
      const senderPhone = r.remark ? r.remark.trim().slice(-10) : '';
      const receiverPhone = r.phone_number ? r.phone_number.trim() : '';
      const amt = Number(r.amount) || 0;
      totalAmount += amt;

      return {
        sno: index + 1,
        id: r.id,
        sender_name: userMap[senderPhone] ? userMap[senderPhone].name : 'N/A',
        sender_phone: senderPhone,
        sender_user_id: userMap[senderPhone] ? userMap[senderPhone].id : null,
        receiver_name: userMap[receiverPhone] ? userMap[receiverPhone].name : 'N/A',
        receiver_phone: receiverPhone,
        receiver_user_id: userMap[receiverPhone] ? userMap[receiverPhone].id : null,
        amount: amt,
        date: r.date,
        time: r.time
      };
    });

    return res.json({
      success: '1',
      total_amount: totalAmount,
      data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 5. Get Withdraw Report
exports.getWithdrawalReport = async (req, res) => {
  try {
    const { date, search } = req.query;

    let query = `
      SELECT w.id, w.status, DATE_FORMAT(w.date, '%Y-%m-%d') as date, w.time, w.amount, w.updated_amount, w.remark, w.phone_number,
             u.name as user_name, u.id as user_id
      FROM wallet_history w
      LEFT JOIN user_info u ON u.phone = w.phone_number
      WHERE (w.remark LIKE '%Withdraw%' OR w.remark LIKE '%Transferred to your Account%' OR w.remark LIKE '%Withdrawal%')
    `;
    const params = [];

    if (date && date !== 'all' && date.trim() !== '') {
      query += " AND (DATE(w.date) = ? OR w.date LIKE ?)";
      params.push(date, `%${date}%`);
    }

    if (search && search.trim() !== '') {
      query += " AND (w.phone_number LIKE ? OR u.name LIKE ? OR w.remark LIKE ?)";
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY w.id DESC LIMIT 500';

    const [rows] = await db.query(query, params);

    let totalAmount = 0;
    const data = rows.map((r, index) => {
      const amt = Math.abs(Number(r.amount) || 0);
      totalAmount += amt;
      return {
        sno: index + 1,
        id: r.id,
        user_name: r.user_name || 'N/A',
        phone_number: r.phone_number,
        user_id: r.user_id,
        amount: amt,
        date: r.date,
        time: r.time,
        remark: r.remark
      };
    });

    return res.json({
      success: '1',
      total_amount: totalAmount,
      data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// ==========================================
// WALLET MANAGEMENT CONTROLLERS (PHP PARITY)
// ==========================================

// 1. Get Fund Requests (PHP fund-request-management.php parity)
exports.getFundRequests = async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT f.*, u.name as user_name, u.id as user_id
      FROM user_fund_request f
      LEFT JOIN user_info u ON u.phone = f.username
    `;
    const params = [];
    if (date) {
      query += ' WHERE f.date LIKE ?';
      params.push(`%${date}%`);
    }
    query += ' ORDER BY f.id DESC LIMIT 200';

    const [rows] = await db.query(query, params);
    let totalAmount = 0;
    rows.forEach(r => {
      totalAmount += parseFloat(r.amount || r.points || 0);
    });

    return res.json({
      success: '1',
      total_amount: totalAmount,
      data: rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 2. Get Withdrawal Requests (PHP withdraw-request-management.php parity)
exports.getWithdrawalRequests = async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT w.*, u.name as user_name, u.id as user_id
      FROM user_withdraw_request w
      LEFT JOIN user_info u ON u.phone = w.username
    `;
    const params = [];
    if (date) {
      query += ' WHERE w.date LIKE ?';
      params.push(`%${date}%`);
    }
    query += ' ORDER BY w.id DESC LIMIT 200';

    const [rows] = await db.query(query, params);

    let totalAmount = 0;
    let totalApproved = 0;
    let totalRejected = 0;
    let totalPending = 0;

    rows.forEach(r => {
      const amt = parseFloat(r.points || r.amount || 0);
      totalAmount += amt;
      if (r.status === '1' || r.status === 1) {
        totalApproved += amt;
      } else if (r.status === '-1' || r.status === -1) {
        totalRejected += amt;
      } else if (r.status === '0' || r.status === 0) {
        totalPending += amt;
      }
    });

    return res.json({
      success: '1',
      totals: {
        total_amount: totalAmount,
        total_approved: totalApproved,
        total_rejected: totalRejected,
        total_pending: totalPending
      },
      data: rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 3. Add Fund To User Wallet (PHP action-code/add-fund-user-wallet.php parity)
exports.addFundToUserWallet = async (req, res) => {
  try {
    const { phone, amount } = req.body;
    if (!phone || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: '0', msg: 'Valid phone and amount are required' });
    }

    const addedAmount = parseFloat(amount);

    const [users] = await db.query('SELECT * FROM user_info WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.status(404).json({ success: '0', msg: 'User not found' });
    }

    const currentWallet = parseFloat(users[0].wallet || '0');
    const newWallet = currentWallet + addedAmount;

    await db.query('UPDATE user_info SET wallet = ? WHERE phone = ?', [newWallet, phone]);

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 8);
    const receivedAmount = `+${addedAmount}`;
    const remark = 'Points Added By Admin ';

    await db.query(
      'INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['1', dateStr, timeStr, receivedAmount, newWallet, remark, phone]
    );

    // Deduct admin coins for added funds (1 Rs = 1 coin)
    await deductAdminCoins(addedAmount);

    return res.json({ success: '1', msg: 'Points Added Successfully!!', new_wallet: newWallet });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 4. Get Bids for Revert (PHP ajax/get-bid-revert.php parity)
exports.getBidRevertList = async (req, res) => {
  try {
    const { date, game_name } = req.query;
    if (!date || !game_name) {
      return res.status(400).json({ success: '0', msg: 'Date and Game Name are required' });
    }

    const [rows] = await db.query(`
      SELECT b.*, u.name as user_name, u.id as user_id
      FROM user_bid_history b
      LEFT JOIN user_info u ON u.phone = b.username
      WHERE b.game_name = ? AND b.date = ?
      ORDER BY b.id DESC
    `, [game_name, date]);

    return res.json({ success: '1', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 5. Execute Bid Revert & Refund All (PHP delete/bid-revert.php parity)
exports.executeBidRevert = async (req, res) => {
  try {
    const { date, game_name } = req.body;
    if (!date || !game_name) {
      return res.status(400).json({ success: '0', msg: 'Date and Game Name are required' });
    }

    const [bids] = await db.query(
      'SELECT * FROM user_bid_history WHERE game_name = ? AND date = ?',
      [game_name, date]
    );

    if (bids.length === 0) {
      return res.json({ success: '0', msg: 'No bids found to revert for this game and date' });
    }

    // Refund points to each user
    for (const b of bids) {
      const amount = parseFloat(b.points_action || '0');
      const user = b.username;
      if (amount > 0 && user) {
        await db.query('UPDATE user_info SET wallet = wallet + ? WHERE phone = ?', [amount, user]);
      }
    }

    // Delete wallet debits and bid records
    const remark = `Bid Placed For ${game_name}`;
    await db.query('DELETE FROM wallet_history WHERE date = ? AND remark LIKE ?', [date, `%${remark}%`]);
    await db.query('DELETE FROM user_bid_history WHERE game_name = ? AND date = ?', [game_name, date]);

    return res.json({ success: '1', msg: 'Bids Reverted & Refunded Successfully!', count: bids.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 6. Get Add Fund (Admin) Report (PHP add-fund-report.php parity)
exports.getAddFundReport = async (req, res) => {
  try {
    const { date, search } = req.query;

    let query = `
      SELECT w.id, w.status, DATE_FORMAT(w.date, '%Y-%m-%d') as date, w.time, w.amount, w.updated_amount, w.remark, w.phone_number, u.name as user_name, u.id as user_id
      FROM wallet_history w
      LEFT JOIN user_info u ON u.phone = w.phone_number
      WHERE (w.remark LIKE '%Points Added By Admin%' OR w.remark LIKE '%Added By Admin%' OR w.amount LIKE '+%')
    `;
    const params = [];

    if (date && date !== 'all' && date.trim() !== '') {
      query += " AND (DATE(w.date) = ? OR w.date LIKE ?)";
      params.push(date, `%${date}%`);
    }

    if (search && search.trim() !== '') {
      query += " AND (w.phone_number LIKE ? OR u.name LIKE ? OR w.remark LIKE ?)";
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY w.id DESC LIMIT 500';

    const [rows] = await db.query(query, params);

    return res.json({ success: '1', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// ==========================================
// GAMES MANAGEMENT CONTROLLERS (PHP PARITY)
// ==========================================

// Helper: Convert HH:mm to hh:mm a
function formatTimeTo12Hour(timeStr) {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr.trim();
  }
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2).padStart(2, '0');
  const modifier = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hStr = hours < 10 ? '0' + hours : '' + hours;
  return `${hStr}:${minutes} ${modifier}`;
}

// 1. Get Game Names List with Today's Open/Close and Market Status (PHP game-name.php parity)
exports.getAdminGamesList = async (req, res) => {
  try {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayDayName = daysOfWeek[new Date().getDay()];

    const [games] = await db.query(
      `SELECT * FROM game_time WHERE day = ? GROUP BY game ORDER BY id ASC`,
      [todayDayName]
    );

    const [settings] = await db.query('SELECT market_open_time FROM admin_settings LIMIT 1');
    const marketOpenTimeStr = settings.length > 0 ? settings[0].market_open_time : '00:00';

    const now = new Date();
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const parts = timeStr.trim().split(' ');
      if (parts.length < 2) return 0;
      const [hm, modifier] = parts;
      let [hours, minutes] = hm.split(':').map(Number);
      if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
      if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
      const d = new Date(now);
      d.setHours(hours, minutes, 0, 0);
      return d.getTime();
    };

    const parseOpenSettingTime = (str) => {
      if (!str) return 0;
      const [hours, minutes] = str.split(':').map(Number);
      const d = new Date(now);
      d.setHours(hours || 0, minutes || 0, 0, 0);
      return d.getTime();
    };

    const currentTimeMs = now.getTime();
    const startTimeMs = parseOpenSettingTime(marketOpenTimeStr);

    const formattedGames = games.map((g) => {
      const openTimeMs = parseTime(g.open_time);
      const closeTimeMs = parseTime(g.close_time);
      const isStatusInactive = g.status === '0' || g.status === 0;

      let isMarketClosed = false;
      if (currentTimeMs < startTimeMs || (currentTimeMs > openTimeMs && currentTimeMs > closeTimeMs) || isStatusInactive) {
        isMarketClosed = true;
      }

      return {
        id: g.id,
        game: g.game,
        day: g.day,
        open_time: g.open_time,
        close_time: g.close_time,
        status: g.status,
        market_status: isMarketClosed ? 'Market Closed' : 'Market Running'
      };
    });

    return res.json({ success: '1', data: formattedGames });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 2. Add New Game with all 7 days (PHP action-code/add-game.php parity)
exports.addGame = async (req, res) => {
  try {
    const { game_name, open_time, close_time } = req.body;
    if (!game_name || !open_time || !close_time) {
      return res.status(400).json({ success: '0', msg: 'Game name, open time and close time are required' });
    }

    const trimmedName = game_name.trim();
    const [existing] = await db.query('SELECT id FROM game_time WHERE game = ? LIMIT 1', [trimmedName]);
    if (existing.length > 0) {
      return res.status(400).json({ success: '0', msg: 'Game with this name already exists!' });
    }

    const formattedOpen = formatTimeTo12Hour(open_time);
    const formattedClose = formatTimeTo12Hour(close_time);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const day of days) {
      await db.query(
        'INSERT INTO game_time (game, day, open_time, close_time, status) VALUES (?, ?, ?, ?, "1")',
        [trimmedName, day, formattedOpen, formattedClose]
      );
    }

    return res.json({ success: '1', msg: 'Game Added Successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 3. Get Game Week Schedule (PHP edit-week-game.php parity)
exports.getGameWeekSchedule = async (req, res) => {
  try {
    const { gameName } = req.params;
    if (!gameName) {
      return res.status(400).json({ success: '0', msg: 'Game name is required' });
    }

    const [rows] = await db.query(
      'SELECT * FROM game_time WHERE game = ? ORDER BY FIELD(day, "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")',
      [gameName]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: '0', msg: 'Game not found' });
    }

    return res.json({ success: '1', game_name: gameName, days: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 4. Update Game Week Schedule (PHP edit/edit-game-time.php parity)
exports.updateGameWeekSchedule = async (req, res) => {
  try {
    const { game_name, days } = req.body;
    if (!game_name || !days || !Array.isArray(days)) {
      return res.status(400).json({ success: '0', msg: 'Game name and days array are required' });
    }

    for (const d of days) {
      const openTime = formatTimeTo12Hour(d.open_time);
      const closeTime = formatTimeTo12Hour(d.close_time);
      const status = (d.status === '1' || d.status === 1 || d.status === true) ? '1' : '0';

      await db.query(
        'UPDATE game_time SET open_time = ?, close_time = ?, status = ? WHERE game = ? AND day = ?',
        [openTime, closeTime, status, game_name, d.day]
      );
    }

    return res.json({ success: '1', msg: 'Game Week Schedule Updated Successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// 5. Delete Game (PHP delete/delete-game-name.php parity)
exports.deleteGame = async (req, res) => {
  try {
    const { game_name } = req.body;
    if (!game_name) {
      return res.status(400).json({ success: '0', msg: 'Game name is required' });
    }

    await db.query('DELETE FROM game_time WHERE game = ?', [game_name]);
    return res.json({ success: '1', msg: 'Game Deleted Successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Get Full Details for a Single User (Profile, Wallet History, Bids, Winnings, Referrals)
exports.getUserFullDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    let users = [];

    if (!userId || userId === 'null' || userId === 'undefined' || userId === 'first') {
      [users] = await db.query('SELECT * FROM user_info ORDER BY id DESC LIMIT 1');
    } else {
      [users] = await db.query('SELECT * FROM user_info WHERE id = ? OR phone = ?', [userId, userId]);
    }

    if (users.length === 0) {
      return res.status(404).json({ success: '0', msg: 'User not found' });
    }

    const user = users[0];
    const phone = user.phone;

    // Fetch Wallet History
    let walletHistory = [];
    try {
      const [rows] = await db.query('SELECT * FROM wallet_history WHERE phone_number = ? ORDER BY id DESC', [phone]);
      walletHistory = rows;
    } catch (e) {
      console.error('Error fetching walletHistory for user:', e.message);
    }

    // Fetch Bid History
    let bids = [];
    try {
      const [rows] = await db.query('SELECT * FROM user_bid_history WHERE username = ? ORDER BY id DESC', [phone]);
      bids = rows;
    } catch (e) {
      console.error('Error fetching bids for user:', e.message);
    }

    // Fetch Winning History
    let winnings = [];
    try {
      const [rows] = await db.query('SELECT * FROM user_winning_report WHERE username = ? ORDER BY id DESC', [phone]);
      winnings = rows;
    } catch (e) {
      console.error('Error fetching winnings for user:', e.message);
    }

    // Fetch Referrals
    let referrals = [];
    try {
      const [rows] = await db.query('SELECT id, name, phone, email, date, wallet FROM user_info WHERE referred_by_phone = ? ORDER BY id DESC', [phone]);
      referrals = rows;
    } catch (e) {
      console.error('Error fetching referrals for user:', e.message);
    }

    // Fetch Referral Commissions
    let commissions = [];
    try {
      const [rows] = await db.query('SELECT * FROM user_referral_commission WHERE referrer_phone = ? ORDER BY id DESC', [phone]);
      commissions = rows;
    } catch (e) {
      console.error('Error fetching commissions for user:', e.message);
    }

    return res.json({
      success: '1',
      data: {
        user,
        walletHistory,
        bids,
        winnings,
        referrals,
        commissions
      }
    });
  } catch (err) {
    console.error('getUserFullDetails main error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin Change User Password
exports.updateUserPassword = async (req, res) => {
  try {
    const { userId, phone, newPassword } = req.body;
    if ((!userId && !phone) || !newPassword || newPassword.trim() === '') {
      return res.status(400).json({ success: '0', msg: 'User identifier and new password are required' });
    }

    const target = userId || phone;
    const [result] = await db.query('UPDATE user_info SET password = ? WHERE id = ? OR phone = ?', [newPassword.trim(), target, target]);

    if (result.affectedRows > 0) {
      return res.json({ success: '1', msg: 'User password updated successfully!' });
    } else {
      return res.status(404).json({ success: '0', msg: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin Adjust User Wallet (Add / Deduct Amount)
exports.adjustUserWallet = async (req, res) => {
  try {
    const { phone, type, amount, remark } = req.body;
    const adjAmt = parseFloat(amount);

    if (!phone || isNaN(adjAmt) || adjAmt <= 0) {
      return res.status(400).json({ success: '0', msg: 'Valid phone and positive amount are required' });
    }

    const [users] = await db.query('SELECT * FROM user_info WHERE phone = ? OR id = ?', [phone, phone]);
    if (users.length === 0) {
      return res.status(404).json({ success: '0', msg: 'User not found' });
    }

    const user = users[0];
    const userPhone = user.phone;
    const currentWallet = parseFloat(user.wallet || '0');

    let newWallet = currentWallet;
    let histAmount = '';
    let defaultRemark = '';

    if (type === 'add' || type === 'credit' || type === 'plus') {
      newWallet = currentWallet + adjAmt;
      histAmount = `+${adjAmt}`;
      defaultRemark = 'Points Added By Admin';
    } else if (type === 'deduct' || type === 'debit' || type === 'minus') {
      if (currentWallet < adjAmt) {
        return res.json({ success: '0', msg: `User wallet balance (${currentWallet}) is less than deduction amount (${adjAmt})` });
      }
      newWallet = Math.max(0, currentWallet - adjAmt);
      histAmount = `-${adjAmt}`;
      defaultRemark = 'Points Deducted By Admin';
    } else {
      return res.status(400).json({ success: '0', msg: 'Invalid operation type. Must be add or deduct' });
    }

    await db.query('UPDATE user_info SET wallet = ? WHERE phone = ?', [newWallet, userPhone]);

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 8);
    const finalRemark = remark && remark.trim() !== '' ? remark.trim() : defaultRemark;

    await db.query(
      'INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['1', dateStr, timeStr, histAmount, newWallet, finalRemark, userPhone]
    );

    return res.json({
      success: '1',
      msg: `Wallet ${type === 'add' ? 'credited' : 'debited'} successfully!`,
      new_wallet: newWallet
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};




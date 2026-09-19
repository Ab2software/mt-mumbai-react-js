const db = require('../config/db');

// Helper to convert time format "hh:mm AM/PM" or "hh:mm" to Date object (case-insensitive PHP strtotime parity)
function getTodayTime(timeStr) {
  if (!timeStr) return new Date(0);
  const clean = String(timeStr).trim().toLowerCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return new Date(0);
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[4];
  if (modifier === 'pm' && hours < 12) {
    hours += 12;
  } else if (modifier === 'am' && hours === 12) {
    hours = 0;
  }
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// Fetch Active Games for Today
exports.getGames = async (req, res) => {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = daysOfWeek[new Date().getDay()];

  try {
    // 1. Get all game times for today
    const [games] = await db.query(
      "SELECT * FROM game_time WHERE day = ? ORDER BY STR_TO_DATE(open_time, '%l:%i %p') ASC",
      [todayDayName]
    );

    // 2. Fetch current market status from games_management
    const [management] = await db.query("SELECT market_status FROM games_management LIMIT 1");
    const marketStatus = management.length > 0 ? management[0].market_status : '1';

    // 3. Fetch admin settings market open time
    const [settings] = await db.query("SELECT market_open_time FROM admin_settings LIMIT 1");
    const marketOpenTime = settings.length > 0 ? settings[0].market_open_time : '00:00:00';

    const currentTimeObj = new Date();
    // Fixed start time: 05:00 AM (PHP default) or admin_settings.market_open_time if set
    const fixedStartTime = getTodayTime(marketOpenTime && marketOpenTime !== '00:00:00' ? marketOpenTime : '05:00 am');

    // Calculate today's date based on market open time logic
    let todayDateStr = new Date().toISOString().slice(0, 10);
    if (currentTimeObj < fixedStartTime) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      todayDateStr = yesterday.toISOString().slice(0, 10);
    }

    // 4. Assemble result
    const result = [];
    for (const g of games) {
      let open_pana = "***";
      let close_pana = "***";
      let open_digit = "*";
      let close_digit = "*";

      if (g.game) {
        const [resChart] = await db.query(
          "SELECT * FROM result_chart WHERE game_name = ? AND date = ?",
          [g.game, todayDateStr]
        );
        if (resChart.length > 0) {
          const row = resChart[0];
          open_pana = row.open_panna === "" ? "***" : row.open_panna;
          close_pana = row.close_panna === "" ? "***" : row.close_panna;
          open_digit = row.open_digit === "" ? "*" : row.open_digit;
          close_digit = row.close_digit === "" ? "*" : row.close_digit;
        }
      }

      // PHP parity:
      // $closeTimeInSeconds = timeConvert($item['close_time']);
      // $withinTimeWindow = ($currentTimeInSeconds >= $fixedStartTime && $currentTimeInSeconds <= $closeTimeInSeconds);
      // $gameEnabled = !(isset($item['game_status']) && $item['game_status'] == "0");
      // $marketStatus = $gameEnabled && $withinTimeWindow;
      const openTimeObj = getTodayTime(g.open_time);
      const closeTimeObj = getTodayTime(g.close_time);
      const gameEnabled = g.status !== '0';
      const withinTimeWindow = currentTimeObj >= fixedStartTime && currentTimeObj <= closeTimeObj;
      const isRunning = gameEnabled && withinTimeWindow;
      const isOpenSessionActive = currentTimeObj < openTimeObj;

      result.push({
        id: g.id,
        games_name: g.game,
        open_time: g.open_time,
        close_time: g.close_time,
        market_status: marketStatus,
        game_status: g.status || '0',
        is_running: isRunning,
        is_open_session: isOpenSessionActive,
        open_pana,
        close_pana,
        open_digit,
        close_digit
      });
    }

    return res.json({ result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Fetch Game Rates
exports.getRates = async (req, res) => {
  try {
    const [rates] = await db.query("SELECT * FROM game_rates");
    return res.json({ success: '1', data: rates });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Place Bids
exports.placeBid = async (req, res) => {
  let bids = req.body;
  if (!Array.isArray(bids)) {
    bids = [bids];
  }

  if (bids.length === 0) {
    return res.json({ success: '0', msg: 'Empty Bid Request' });
  }

  try {
    const [settings] = await db.query("SELECT * FROM admin_settings LIMIT 1");
    const limits = settings[0] || {};
    const minBidAmt = parseInt(limits.min_bid_amt, 10) > 0 ? parseInt(limits.min_bid_amt, 10) : 10;
    const maxBidAmt = parseInt(limits.max_bid_amt, 10) > 0 ? parseInt(limits.max_bid_amt, 10) : 50000;

    const currentTimeObj = new Date();
    const marketOpenTimeStr = limits.market_open_time && limits.market_open_time !== '00:00:00' ? limits.market_open_time : '05:00 am';
    const start_time = getTodayTime(marketOpenTimeStr);

    for (const b of bids) {
      const phone = req.user.phone; // get phone number from verified token
      const { game_name, game_type, session, points_action } = b;
      let { open_pana, open_digit, close_pana, close_digit } = b;

      const points = parseInt(points_action, 10);
      if (isNaN(points) || points < minBidAmt || points > maxBidAmt) {
        return res.json({ success: '0', msg: `Invalid Bid Amount: must be between ${minBidAmt} and ${maxBidAmt}` });
      }

      // Check game exist and get timings for today (with trimmed comparison)
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayDayName = daysOfWeek[new Date().getDay()];
      let [games] = await db.query(
        "SELECT * FROM game_time WHERE TRIM(game) = TRIM(?) AND day = ? LIMIT 1",
        [game_name, todayDayName]
      );
      if (games.length === 0) {
        [games] = await db.query(
          "SELECT * FROM game_time WHERE TRIM(game) = TRIM(?) LIMIT 1",
          [game_name]
        );
      }
      if (games.length === 0) {
        return res.json({ success: '0', msg: 'Invalid Game Name' });
      }
      const gameTime = games[0];

      if (gameTime.status === '0') {
        return res.json({ success: '0', msg: 'Market is closed for today' });
      }

      // Validate market open/close timings (PHP set_bid_new.php parity)
      const openTimeObj = getTodayTime(gameTime.open_time);
      const closeTimeObj = getTodayTime(gameTime.close_time);

      let allowed = true;
      if (session === 'Open') {
        if (currentTimeObj > openTimeObj || currentTimeObj < start_time) {
          allowed = false;
        }
      } else if (session === 'Close') {
        if (currentTimeObj > closeTimeObj || currentTimeObj < start_time) {
          allowed = false;
        }
      }

      // If game type is Jodi Digit, Half Sangam, or Full Sangam, it cannot be bid after Open time!
      if (game_type === 'Jodi' || game_type === 'Jodi Digit' || game_type === 'Half Sangam' || game_type === 'Full Sangam') {
        if (currentTimeObj > openTimeObj) {
          allowed = false;
        }
      }

      if (!allowed) {
        return res.json({
          success: '0',
          msg: session === 'Open' ? 'Open Market Closed' : 'Market Closed',
          current_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          open_time: gameTime.open_time,
          close_time: gameTime.close_time
        });
      }

      // Defaulting values
      open_pana = open_pana || 'NA';
      close_pana = close_pana || 'NA';
      open_digit = open_digit || 'NA';
      close_digit = close_digit || 'NA';

      if (game_type === 'Jodi') {
        if (open_digit !== 'NA' && open_digit.length === 2) {
          close_digit = open_digit.charAt(1);
          open_digit = open_digit.charAt(0);
        } else if (close_digit !== 'NA' && close_digit.length === 2) {
          open_digit = close_digit.charAt(0);
          close_digit = close_digit.charAt(1);
        } else {
          open_digit = 'NA';
          close_digit = 'NA';
        }
      }

      // Check user wallet
      const [users] = await db.query("SELECT wallet FROM user_info WHERE phone = ?", [phone]);
      if (users.length === 0) {
        return res.json({ success: '0', msg: 'User Not Found' });
      }

      const balance = parseInt(users[0].wallet, 10);
      if (balance - points < 0) {
        return res.json({ success: '0', msg: 'Insufficient Funds' });
      }

      // Insert bid
      const currentDateStr = new Date().toISOString().slice(0, 10);
      const currentTimeStr = new Date().toTimeString().slice(0, 8);

      const [insertResult] = await db.query(
        "INSERT INTO user_bid_history (username, game_name, game_type, session, open_pana, open_digit, close_pana, close_digit, points_action, date, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [phone, game_name, game_type, session, open_pana, open_digit, close_pana, close_digit, points, currentDateStr, currentTimeStr]
      );

      if (insertResult.affectedRows > 0) {
        const newBalance = balance - points;
        await db.query("UPDATE user_info SET wallet = ? WHERE phone = ?", [newBalance, phone]);
        await db.query(
          "INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)",
          ['0', currentDateStr, currentTimeStr, points, newBalance, 'Deduct for Bid', phone]
        );
      } else {
        return res.json({ success: '0', msg: 'Database Error while placing bid' });
      }
    }

    // Return new wallet balance of the user
    const [updatedUser] = await db.query("SELECT wallet FROM user_info WHERE phone = ?", [req.user.phone]);
    return res.json({
      success: '1',
      msg: 'Bid Added Successfully',
      balance: updatedUser[0].wallet
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Fetch User Bid History
exports.getBidHistory = async (req, res) => {
  const phone = req.user.phone;
  const { date1, date2 } = req.query;
  try {
    let sql = "SELECT * FROM user_bid_history WHERE username = ?";
    const params = [phone];
    if (date1 && date2) {
      sql += " AND date BETWEEN ? AND ?";
      params.push(date1, date2);
    }
    sql += " ORDER BY date DESC, time DESC LIMIT 100";
    const [bids] = await db.query(sql, params);
    return res.json({ success: '1', data: bids, result: bids });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Fetch User Win History
exports.getWinReport = async (req, res) => {
  const phone = req.user.phone;
  const { date1, date2 } = req.query;
  try {
    let sql = "SELECT * FROM user_winning_report WHERE username = ?";
    const params = [phone];
    if (date1 && date2) {
      sql += " AND date BETWEEN ? AND ?";
      params.push(date1, date2);
    }
    sql += " ORDER BY date DESC LIMIT 100";
    const [wins] = await db.query(sql, params);
    return res.json({ success: '1', data: wins, result: wins });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Fetch Game Chart
exports.getGameChart = async (req, res) => {
  const { game_name } = req.query;
  try {
    const [chart] = await db.query(
      "SELECT * FROM result_chart WHERE game_name = ? ORDER BY date DESC LIMIT 30",
      [game_name]
    );
    return res.json({ success: '1', data: chart });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

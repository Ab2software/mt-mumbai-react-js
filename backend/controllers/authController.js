const db = require('../config/db');
const jwt = require('jsonwebtoken');

// User Registration
exports.signup = async (req, res) => {
  const { user_name, user_phone, user_password, user_mpin, user_email, token_id, referral_phone } = req.body;

  if (!user_phone || !user_password || !user_name) {
    return res.json({ success: '0', msg: 'Username, phone and password are required!' });
  }

  try {
    // Check if phone already registered
    const [existing] = await db.query('SELECT * FROM user_info WHERE phone = ?', [user_phone]);
    if (existing.length > 0) {
      return res.json({ success: '0', msg: 'You are Already Signed Up!!' });
    }

    // Determine referred by
    let referred_by_value = null;
    if (referral_phone && referral_phone.trim() !== '' && /^\d{10}$/.test(referral_phone) && referral_phone !== user_phone) {
      const [refUser] = await db.query('SELECT phone FROM user_info WHERE phone = ? LIMIT 1', [referral_phone]);
      if (refUser.length > 0) {
        referred_by_value = referral_phone;
      }
    }

    // Check signup activation status
    const [activation] = await db.query('SELECT status FROM activate_rule');
    const status = (activation.length > 0 && activation[0].status === '1') ? '1' : '0';

    // Get settings like bonus
    const [settings] = await db.query('SELECT Dragon_bonus FROM admin_settings LIMIT 1');
    const bonus = settings.length > 0 ? settings[0].Dragon_bonus : '0';

    // Insert user
    const today = new Date().toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS
    const insertSql = `
      INSERT INTO user_info 
      (user_id, name, phone, password, m_pin, email, wallet, date, status, transfer_status, phonepay, googlepay, paytm, referred_by_phone) 
      VALUES ('', ?, ?, ?, ?, ?, ?, ?, ?, '0', '', '', '', ?)
    `;
    const [insertResult] = await db.query(insertSql, [
      user_name,
      user_phone,
      user_password,
      user_mpin || '',
      user_email || '',
      bonus,
      today,
      status,
      referred_by_value
    ]);

    if (insertResult.affectedRows > 0) {
      // Add wallet history entry if bonus is given
      if (bonus !== '0') {
        const currentDateStr = new Date().toISOString().slice(0, 10);
        const currentTimeStr = new Date().toTimeString().slice(0, 8);
        await db.query(
          'INSERT INTO wallet_history (status, date, time, amount, updated_amount, remark, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['1', currentDateStr, currentTimeStr, bonus, bonus, 'Welcome Bonus', user_phone]
        );
      }

      // Handle Device Token
      if (token_id) {
        const [tokenExists] = await db.query('SELECT * FROM device_token WHERE mobile = ?', [user_phone]);
        if (tokenExists.length > 0) {
          await db.query('UPDATE device_token SET token_id = ? WHERE mobile = ?', [token_id, user_phone]);
        } else {
          await db.query('INSERT INTO device_token (mobile, token_id, status) VALUES (?, ?, ?)', [user_phone, token_id, '1']);
        }
      }

      // Prepare response data
      const data = {
        msg: 'Registered Successfully',
        phone_number: user_phone,
        name: user_name,
        email: user_email || '',
        m_pin: user_mpin || '',
        wallet: bonus,
        status: status,
        phonepay: '',
        googlepay: '',
        paytm: ''
      };

      return res.json({
        success: '1',
        msg: 'Registered Successfully',
        data: data
      });
    } else {
      return res.json({ success: '0', msg: 'Some Error Occurred! Try Again Later!!' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', msg: 'Internal server error' });
  }
};

// User Login
exports.login = async (req, res) => {
  const { phone_number, password, token_id } = req.body;

  if (!phone_number || !password) {
    return res.json({ success: '0', data: { msg: 'Phone number and password required' } });
  }

  try {
    const [users] = await db.query('SELECT * FROM user_info WHERE phone = ?', [phone_number]);
    if (users.length === 0) {
      return res.json({ success: '0', data: { msg: 'User Not Found!' } });
    }

    const user = users[0];
    if (user.password !== password) {
      return res.json({ success: '0', data: { msg: 'Wrong Password!' } });
    }

    if (user.status !== '1') {
      return res.json({ success: '0', data: { msg: 'Contact Admin to Activate your Account!' } });
    }

    // Save token if provided
    if (token_id) {
      const [tokenExists] = await db.query('SELECT * FROM device_token WHERE mobile = ?', [phone_number]);
      if (tokenExists.length > 0) {
        await db.query('UPDATE device_token SET token_id = ? WHERE mobile = ?', [token_id, phone_number]);
      } else {
        await db.query('INSERT INTO device_token (mobile, token_id, status) VALUES (?, ?, ?)', [phone_number, token_id, '1']);
      }
    }

    // Create JWT Token
    const jwtToken = jwt.sign(
      { phone: user.phone, name: user.name, role: 'user' },
      process.env.JWT_SECRET || 'lucky_matka_super_secret_jwt_key_99',
      { expiresIn: '30d' }
    );

    const data = {
      msg: 'Login Successfully',
      phone_number: user.phone,
      name: user.name,
      email: user.email,
      m_pin: user.m_pin,
      wallet: user.wallet,
      status: user.status,
      phonepay: user.phonepay,
      googlepay: user.googlepay,
      paytm: user.paytm,
      token: jwtToken
    };

    return res.json({
      success: '1',
      data: data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', data: { msg: 'Internal server error' } });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body; // username can be email or phone

  if (!username || !password) {
    return res.json({ success: '0', msg: 'Username/Email and Password are required!' });
  }

  try {
    const [admins] = await db.query(
      'SELECT * FROM admin WHERE (email = ? OR mobile = ?) AND password = ?',
      [username, username, password]
    );

    if (admins.length === 0) {
      return res.json({ success: '0', msg: 'Invalid Email/Mobile or Password!' });
    }

    const admin = admins[0];

    // Create JWT Token for admin
    const jwtToken = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'lucky_matka_super_secret_jwt_key_99',
      { expiresIn: '7d' }
    );

    return res.json({
      success: '1',
      msg: 'Logged in successfully',
      token: jwtToken,
      admin: {
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', msg: 'Internal server error' });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  const phone = req.user.phone;

  try {
    const [users] = await db.query('SELECT * FROM user_info WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.json({ success: '0', data: { msg: 'User Not Found!' } });
    }

    const user = users[0];
    const data = {
      phone_number: user.phone,
      name: user.name,
      email: user.email,
      wallet: user.wallet,
      phonepay: user.phonepay,
      googlepay: user.googlepay,
      paytm: user.paytm,
      bank_name: user.bank_name || '',
      branch_name: user.branch_name || '',
      account_holder_name: user.account_holder_name || '',
      account_number: user.account_number || '',
      ifsc_code: user.ifsc_code || '',
      betting_status: user.betting_status,
      status: user.status,
      date: user.date,
      phone: user.phone
    };

    return res.json({
      success: '1',
      data: data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', data: { msg: 'Internal server error' } });
  }
};

// Edit Profile
exports.editProfile = async (req, res) => {
  const phone = req.user.phone;
  const { phonpe, gpay, paytm, name, email, bank_name, branch_name, account_holder_name, account_number, ifsc_code } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM user_info WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.json({ success: '0', msg: 'User Not Found!' });
    }

    const user = users[0];

    const finalPhonepay = (phonpe !== undefined) ? phonpe : (user.phonepay || '');
    const finalGooglepay = (gpay !== undefined) ? gpay : (user.googlepay || '');
    const finalPaytm = (paytm !== undefined) ? paytm : (user.paytm || '');

    const fields = {
      phonepay: finalPhonepay,
      googlepay: finalGooglepay,
      paytm: finalPaytm
    };

    if (bank_name !== undefined) fields.bank_name = bank_name;
    if (branch_name !== undefined) fields.branch_name = branch_name;
    if (account_holder_name !== undefined) fields.account_holder_name = account_holder_name;
    if (account_number !== undefined) fields.account_number = account_number;
    if (ifsc_code !== undefined) fields.ifsc_code = ifsc_code;
    if (name !== undefined && name !== '') fields.name = name;
    if (email !== undefined && email !== '') fields.email = email;

    const setClause = Object.keys(fields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(fields);
    values.push(phone);

    const [updateResult] = await db.query(`UPDATE user_info SET ${setClause} WHERE phone = ?`, values);

    if (updateResult.affectedRows > 0) {
      return res.json({ success: '1', msg: 'Profile Updated Successfully' });
    } else {
      return res.json({ success: '0', msg: 'Some Error Occurred! Try Again Later' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', msg: 'Internal server error' });
  }
};

// Verify M-PIN
exports.verifyMpin = async (req, res) => {
  const phone = req.user.phone;
  const { mpin } = req.body;

  if (!mpin) {
    return res.json({ success: '0', msg: 'M-PIN is required' });
  }

  try {
    const [users] = await db.query('SELECT m_pin FROM user_info WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.json({ success: '0', msg: 'User Not Found!' });
    }

    const userMpin = users[0].m_pin;
    if (String(userMpin) === String(mpin)) {
      return res.json({ success: '1', msg: 'M-PIN Verified Successfully' });
    } else {
      return res.json({ success: '0', msg: 'Incorrect M-PIN! Please try again.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', msg: 'Internal server error' });
  }
};

// Change M-PIN
exports.changeMpin = async (req, res) => {
  const phone = req.user.phone;
  const { old_mpin, new_mpin } = req.body;

  if (!old_mpin || !new_mpin) {
    return res.json({ success: '0', msg: 'Old M-PIN and New M-PIN are required!' });
  }

  if (!/^\d{4}$/.test(new_mpin)) {
    return res.json({ success: '0', msg: 'New M-PIN must be a 4-digit number!' });
  }

  try {
    const [users] = await db.query('SELECT m_pin FROM user_info WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.json({ success: '0', msg: 'User Not Found!' });
    }

    const currentMpin = users[0].m_pin;
    if (currentMpin && String(currentMpin).trim() !== '' && String(currentMpin) !== String(old_mpin)) {
      return res.json({ success: '0', msg: 'Incorrect Old M-PIN! Please try again.' });
    }

    const [updateResult] = await db.query('UPDATE user_info SET m_pin = ? WHERE phone = ?', [new_mpin, phone]);

    if (updateResult.affectedRows > 0) {
      return res.json({ success: '1', msg: 'M-PIN Updated Successfully!' });
    } else {
      return res.json({ success: '0', msg: 'Failed to update M-PIN. Try again.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: '0', msg: 'Internal server error' });
  }
};


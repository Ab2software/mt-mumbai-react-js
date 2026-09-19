const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization'] || req.headers['x-access-token'];
  if (!token) {
    return res.status(403).json({ success: '0', msg: 'No token provided' });
  }

  try {
    const bearer = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    const decoded = jwt.verify(bearer, process.env.JWT_SECRET || 'lucky_matka_super_secret_jwt_key_99');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: '0', msg: 'Unauthorized: Invalid token' });
  }
};

exports.verifyAdmin = (req, res, next) => {
  const token = req.headers['authorization'] || req.headers['x-access-token'];
  if (!token) {
    return res.status(403).json({ success: '0', msg: 'No token provided' });
  }

  try {
    const bearer = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    const decoded = jwt.verify(bearer, process.env.JWT_SECRET || 'lucky_matka_super_secret_jwt_key_99');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: '0', msg: 'Require Admin Role' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: '0', msg: 'Unauthorized: Invalid token' });
  }
};

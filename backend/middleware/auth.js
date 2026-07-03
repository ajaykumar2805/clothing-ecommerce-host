const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization token required.' });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7, authHeader.length).trimLeft() 
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: 'Malformed authorization token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clothing_ecommerce_secret_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

const admin = (req, res, next) => {
  auth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }
  });
};

module.exports = { auth, admin };

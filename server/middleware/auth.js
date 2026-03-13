/**
 * Middleware: requireAuth
 * Protects API routes — returns 401 if the user is not logged in.
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Please log in.' });
};

module.exports = { requireAuth };

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'User unauthorized. Please refresh and re-login.' });
}

module.exports = isLoggedIn;
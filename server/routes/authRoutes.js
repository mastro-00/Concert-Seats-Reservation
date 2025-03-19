const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const passport = require('../config/passportConfig'); // Use the configured passport object
const isLoggedIn = require('../middleware/authMiddleware'); // Middleware to check if the user is logged in

// POST /api/session
// This route is used for logging in the user.
router.post('/', [
    body("username", "Username is not a valid email").isEmail(),
    body("password", "Password cannot be empty").isString().notEmpty()
], function (req, res, next) {
    // Check if validation is ok
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(element => element.msg).join(', ');
        return res.status(400).json({ error: errorMessages });
    }

    // Perform the actual authentication
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user)
            return res.status(401).json({ error: info }); // display wrong login messages
        // success, perform the login and extablish a login session
        req.login(user, (err) => {
            if (err)
                return next(err);
            // req.user contains the authenticated user, we send all the user info back
            // this is coming from userDao.getUser() in LocalStratecy Verify Fn
            return res.json(req.user);
        });
    })(req, res, next);
});

// GET /api/sessions
// This route checks whether the user is logged in or not.
router.get('/', isLoggedIn, (req, res) => {
    res.status(200).json(req.user);
});

// DELETE /api/session
// This route is used for loggin out the current user.
router.delete('/', isLoggedIn, (req, res) => {
    req.logout(() => {
        res.status(200).json({message: "User logged out"});
    });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/authMiddleware'); // Middleware to check if the user is logged in

const jsonwebtoken = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
const expireTime = 60; //seconds

// GET /api/auth-token
// This route returns a JWT token for the user.
router.get('/', isLoggedIn, (req, res) => {
    const userID = req.user.user_id;
    const userStatus = req.user.status;
  
    // Create a new token with the user ID and user status in the payload
    const payloadToSign = { userID: userID, userStatus: userStatus };
    const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, {expiresIn: expireTime});
  
    res.json({token: jwtToken});
  });

module.exports = router;
  
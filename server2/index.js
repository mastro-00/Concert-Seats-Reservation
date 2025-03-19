'use strict';

const express = require('express');
const morgan = require('morgan'); // logging middleware
const cors = require('cors');
require('dotenv').config();
const { expressjwt: jwt } = require('express-jwt');
const { body, validationResult } = require("express-validator");

const app = new express();
const port = 3002;

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// JWT secret key
const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';

// Check token validity: token from HTTP Authorization: header
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"]
}));

// To return a better object in case of errors
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: `Token Error: ${err.code}` });
  } else {
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
  next();
});

// POST /api/discount
app.post('/api/discount',
  body('seats', 'Invalid array of seats').isArray({ min: 1 }),
  (req, res) => {
    // Check if validation is ok
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(element => element.msg).join(', ');
      return res.status(400).json({ error: errorMessages });
    }

    const seats = req.body.seats;

    const seatRegex = /^\d+[A-Z]$/;
    if (!seats.every(seat => seatRegex.test(seat)))
      return res.status(400).json({ error: 'Invalid seat format. Seats should be in the format like 1A, 2C, etc.' });

    const userID = req.auth?.userID; // Access JWT payload
    const userStatus = req.auth?.userStatus; // Access JWT payload
    

    // Helper function to extract row number from seat code
    const extractRowNumber = (seatCode) => {
      const match = seatCode.match(/^(\d+)/); // Extract the row number part
      return match ? parseInt(match[0], 10) : 0;
    };

    // Calculate sum of row numbers
    const sumOfSeatsNumber = seats.reduce((sum, seat) => sum + extractRowNumber(seat), 0);

    // Compute discount based on user status
    const isLoyalCustomer = userStatus === 'loyal';

    // Compute discount percentage
    const computeDiscount = (sumOfRows, isLoyalCustomer) => {
      // Compute discount based on the sum of row numbers (sumOfRows) and user status (isLoyalCustomer)
      let discount = isLoyalCustomer ? sumOfRows : sumOfRows / 3;
      // Generate a random number between 5 and 20
      const randomNumber = Math.random() * (20 - 5) + 5; //const randomNumber = Math.random() * (max - min) + min;
      // Math.random(): Generates a random floating-point number between 0 (inclusive) and 1 (exclusive)
      // 1. Math.random() * (20 - 5): Produces a random number between 0 and 15
      // 2. +5: Shifts the range from [0, 15] to [5, 20]
      // Round the discount to the nearest integer
      discount = Math.round(discount + randomNumber);
      // Ensure the discount is between 5 and 50
      discount = Math.max(5, Math.min(50, discount));
      return { discount, randomNumber };
    };

    const discountRes = computeDiscount(sumOfSeatsNumber, isLoyalCustomer);

    // Log the results for debugging
    // console.log("User status: ", userStatus);
    // console.log("Random number: ", discountRes.randomNumber);
    // console.log("Discount: ", discountRes.discount);

    res.json({ discount: discountRes.discount });
  });

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

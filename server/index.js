'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = new express();
const port = 3001;

app.use(express.json());
app.use(morgan('dev'));

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

/** Import the passport configuration */
const passport = require('./config/passportConfig');

/** Creating the session */
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || "default_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: app.get('env') === 'production' ? true : false },
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'));

/** Import the routes */
const authRoutes = require('./routes/authRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const tokenRoutes = require('./routes/tokenRoutes');

/** Use the routes */
app.use('/api/session', authRoutes);
app.use('/api/auth-token', tokenRoutes);
app.use('/api/reservation', reservationRoutes);

// require('./database/init-database'); // DEBUG: Initialize the database

/** Activate the server */
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

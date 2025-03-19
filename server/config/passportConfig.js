/*** Passport ***/

/** Authentication-related imports */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const userDao = require('../database/dao/dao-user'); // Import user data access object (DAO)

/** Session handling */
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if(!user)
    return callback(null, false, 'Incorrect username or password');  // login failed
  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser: user-id, username, email, status)
}));

// serialize and de-serialize the user (user object <-> session)

/**  Serializing in the session the user object given from LocalStrategy(verify). */
passport.serializeUser(function (user, callback) { // this user is id + username + email + status
  callback(null, user);
});

/** Starting from the data in the session, we extract the current (logged-in) user. */
passport.deserializeUser(function (user, callback) { // this user is id + username + email + status
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
  // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));
  userDao.getUserById(user.user_id)
    .then(user => 
      callback(null, user)
    ).catch(err => 
      callback(err, null)
    );
});

module.exports = passport; // Export the configured passport object
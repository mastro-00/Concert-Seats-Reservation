'use strict';

/* Data Access Object (DAO) module for accessing users data */

const db = require('../connect-db');
const { verifyPassword } = require('../utils/passwordUtils');

// This function is used at log-in time to verify username and password.
exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email=?';
    db.get(sql, [email], (err, row) => {
      if (err)
        return reject(err);
      if (row === undefined)
        return resolve(false);
      
      const user = { user_id: row.user_id, username: row.username, email: row.email, status: row.status };
      const isPasswordValid = verifyPassword(password, row.salt, row.password);
      if (isPasswordValid)
          resolve(user);
      else
          resolve(false);
    });
  });
};

// This function returns user's information given its id.
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE user_id=?';
    db.get(sql, [id], (err, row) => {
      if (err)
        return reject(err);
      if (row === undefined)
        return resolve({ error: 'User not found.' });
      // By default, the local strategy looks for "username"
      const user = { user_id: row.user_id, username: row.email, name: row.username, status: row.status };
      resolve(user);
    });
  });
};
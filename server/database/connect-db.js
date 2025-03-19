'use strict';

/** DB access module **/
const sqlite3 = require('sqlite3');

// open the database
const db = new sqlite3.Database('database/database.db', (err) => {
    if (err) throw err;
});

// export the database
module.exports = db;
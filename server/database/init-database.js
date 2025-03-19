const db = require('./connect-db');
const { generateSalt, hashPasswordWithKeyDerivation } = require('./utils/passwordUtils');

let sql;

db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // create users table
    sql = `CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'loyal'))
    )`;
    db.run(sql);

    // create theaters table
    sql = `CREATE TABLE IF NOT EXISTS theaters (
        theater_id INTEGER PRIMARY KEY AUTOINCREMENT,
        theater_name TEXT NOT NULL,
        city TEXT,
        rows INTEGER NOT NULL,
        columns INTEGER NOT NULL
    )`;
    db.run(sql);

    // create concerts table
    sql = `CREATE TABLE IF NOT EXISTS concerts (
        concert_id INTEGER PRIMARY KEY AUTOINCREMENT,
        theater_id INTEGER NOT NULL,
        artist TEXT NOT NULL,
        date DATE,
        FOREIGN KEY (theater_id) REFERENCES theaters(theater_id)
    )`;
    db.run(sql);

    // create reservation table
    sql = `CREATE TABLE IF NOT EXISTS reservations (
        reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
        concert_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        reservation_date DATE,
        FOREIGN KEY (concert_id) REFERENCES concerts(concert_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )`;
    db.run(sql);

    // create tickets table
    sql = `CREATE TABLE IF NOT EXISTS tickets (
        ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER NOT NULL,
        seat TEXT NOT NULL,
        FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id)
    )`;
    db.run(sql);

    // Insert users into the database
    const users = [
        { username: "user1", email: "u1@polito.it", password: "password1", status: "loyal" },
        { username: "user2", email: "u2@polito.it", password: "password2", status: "normal" },
        { username: "user3", email: "u3@polito.it", password: "password3", status: "normal" },
        { username: "user4", email: "u4@polito.it", password: "password4", status: "loyal" },
        { username: "user5", email: "u5@polito.it", password: "password5", status: "normal" },
        { username: "user6", email: "u6@polito.it", password: "password6", status: "loyal" }
    ];
    users.forEach(user => {
        const salt = generateSalt();
        const hashedPassword = hashPasswordWithKeyDerivation(user.password, salt);
        const sql = `INSERT INTO users (username, email, password, salt, status) VALUES(?,?,?,?,?)`;
        db.run(
            sql,
            [user.username, user.email, hashedPassword, salt, user.status],
            (err) => {
                if (err) return console.error(err.message);
            }
        );
    });

    const theaters = [
        { theater_name: "Wembley Stadium", city: "London", rows: 9, columns: 14 },
        { theater_name: "Unipol Arena", city: "Bologna", rows: 4, columns: 8 },
        { theater_name: "Ippodromo Snai", city: "Milan", rows: 9, columns: 14 },
        { theater_name: "Mediolanum Forum", city: "Milan", rows: 6, columns: 10 },
        { theater_name: "Inalpi Arena", city: "Turin", rows: 4, columns: 8 },
        { theater_name: "Stadio Olimpico", city: "Rome", rows: 9, columns: 14 }
    ];

    theaters.forEach(theater => {
        const sql = `INSERT INTO theaters (theater_name, city, rows, columns) VALUES(?,?,?,?)`;
        db.run(
            sql,
            [theater.theater_name, theater.city, theater.rows, theater.columns],
            (err) => {
                if (err) return console.error(err.message);
            }
        );
    });

    const concerts = [
        { theater_id: 1, artist: "Oasis", date: "2025-07-26" },
        { theater_id: 3, artist: "Green Day", date: "2025-06-16" },
        { theater_id: 4, artist: "Machine Gun Kelly", date: "2026-06-14" },
        { theater_id: 5, artist: "Salmo", date: "2026-07-04" },
        { theater_id: 2, artist: "Blink 182", date: "2025-06-05" },
        { theater_id: 6, artist: "Sum 41", date: "2026-05-06" }
    ];

    concerts.forEach(concert => {
        const sql = `INSERT INTO concerts (theater_id, artist, date) VALUES(?,?,?)`;
        db.run(
            sql,
            [concert.theater_id, concert.artist, concert.date],
            (err) => {
                if (err) return console.error(err.message);
            }
        );
    });

    const reservation = [
        { concert_id: 1, user_id: 1, reservation_date: "2023-07-25" },
        { concert_id: 1, user_id: 2, reservation_date: "2024-06-15" },
        { concert_id: 1, user_id: 3, reservation_date: "2023-06-13" },
        { concert_id: 1, user_id: 4, reservation_date: "2023-06-13" },
        { concert_id: 2, user_id: 2, reservation_date: "2024-02-03" },
        { concert_id: 2, user_id: 3, reservation_date: "2024-06-03" },
        { concert_id: 3, user_id: 1, reservation_date: "2024-07-03" },
        { concert_id: 3, user_id: 4, reservation_date: "2024-05-03" },
        { concert_id: 4, user_id: 2, reservation_date: "2022-06-04" },
        { concert_id: 5, user_id: 4, reservation_date: "2021-05-05" }
    ];

    reservation.forEach(reservation => {
        const sql = `INSERT INTO reservations (concert_id, user_id, reservation_date) VALUES(?,?,?)`;
        db.run(
            sql,
            [reservation.concert_id, reservation.user_id, reservation.reservation_date],
            (err) => {
                if (err) return console.error(err.message);
            }
        );
    });

    const tickets = [
        { reservation_id: 1, seat: "1A" },
        { reservation_id: 1, seat: "2A" },
        { reservation_id: 1, seat: "3A" },
        { reservation_id: 2, seat: "1B" },
        { reservation_id: 2, seat: "2B" },
        { reservation_id: 2, seat: "3B" },
        { reservation_id: 3, seat: "1C" },
        { reservation_id: 3, seat: "2C" },
        { reservation_id: 3, seat: "3C" },
        { reservation_id: 4, seat: "1D" },
        { reservation_id: 4, seat: "2D" },
        { reservation_id: 4, seat: "3D" },

        { reservation_id: 5, seat: "1A" },
        { reservation_id: 5, seat: "2B" },
        { reservation_id: 5, seat: "3C" },
        { reservation_id: 6, seat: "4D" },
        { reservation_id: 6, seat: "4E" },
        { reservation_id: 6, seat: "4F" },

        { reservation_id: 7, seat: "3A" },
        { reservation_id: 7, seat: "3B" },
        { reservation_id: 7, seat: "3C" },
        { reservation_id: 8, seat: "2D" },
        { reservation_id: 8, seat: "2E" },
        { reservation_id: 8, seat: "2F" },

        { reservation_id: 9, seat: "2A" },
        { reservation_id: 9, seat: "3B" },
        { reservation_id: 9, seat: "4C" },

        { reservation_id: 10, seat: "1D" },
        { reservation_id: 10, seat: "2C" },
        { reservation_id: 10, seat: "3D" },
        { reservation_id: 10, seat: "2E" }
    ];

    tickets.forEach(ticket => {
        const sql = `INSERT INTO tickets (reservation_id, seat) VALUES(?,?)`;
        db.run(
            sql,
            [ticket.reservation_id, ticket.seat],
            (err) => {
                if (err) return console.error(err.message);
            }
        );
    });

    db.run('COMMIT');
});
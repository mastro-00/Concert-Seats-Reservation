'use strict';
const db = require('../connect-db');

/* Data Access Object (DAO) module for accessing reservation data */

// This function makes a reservation in the database.
exports.makeReservation = (concert_id, user_id, seats) => {
    return new Promise((resolve, reject) => {
        const seatRegex = /^\d+[A-Z]$/;
        if (!seats.every(seat => seatRegex.test(seat)))
            return reject({ code: 400, error: 'Invalid seat format. Seats should be in the format like 1A, 2C, etc.' });

        const reservation_date = new Date().toISOString().slice(0, 10).replace('T', ' ');

        db.serialize(() => {
            // Query 1: Get the theater dimensions for this concert to check if all the seats are within the theater
            const dimensionSql = `
                SELECT t.rows, t.columns 
                FROM concerts c 
                JOIN theaters t ON c.theater_id = t.theater_id 
                WHERE c.concert_id = ?`;
            db.get(dimensionSql, [concert_id], (err, theater) => {
                if (err) return reject({ code: 500, error: 'Error fetching theater dimensions: ' + err });
                if (!theater) return reject({ code: 404, error: 'Concert or theater not found.' });
                const maxRow = theater.rows;
                const maxCol = theater.columns;

                const isSeatValid = (seat) => {
                    const row = parseInt(seat.match(/\d+/)[0], 10); // Extract the number (row)
                    const col = seat.match(/[A-Z]/)[0].charCodeAt(0) - 'A'.charCodeAt(0) + 1; // Convert letter to column index
                    return row <= maxRow && col <= maxCol;
                };

                if (!seats.every((seat) => isSeatValid(seat)))
                    return reject({ code: 400, error: 'One or more seats are outside the valid theater dimensions.' });

                // Query 2: Check if the user has already made a reservation for this concert
                const checkSql = 'SELECT * FROM reservations WHERE concert_id = ? AND user_id = ?';
                db.get(checkSql, [concert_id, user_id], (err, row) => {
                    if (err) return reject({ code: 500, error: 'Error checking existing reservations: ' + err });
                    if (row) return reject({ code: 400, error: 'You have already made a reservation for this concert.' });

                    // Query 3: Check if the seats are already reserved
                    const checkSeatsSql = `
                        SELECT seat FROM tickets 
                        WHERE seat IN (${seats.map(() => '?').join(',')}) 
                        AND reservation_id IN (SELECT reservation_id FROM reservations WHERE concert_id = ?)`;
                    db.all(checkSeatsSql, [...seats, concert_id], (err, rows) => {
                        if (err) return reject({ code: 500, error: 'Error checking seat availability: ' + err });
                        if (rows.length > 0) {
                            const reservedSeats = rows.map(row => row.seat).join(', ');
                            return reject({ code: 409, error: `The following seats are already reserved: ${reservedSeats}` });
                        }

                        db.run('BEGIN TRANSACTION;', (err) => {
                            if (err)
                                return reject(err);

                            // Query 4: Insert reservation
                            const sql = 'INSERT INTO reservations (concert_id, user_id, reservation_date) VALUES (?, ?, ?)';
                            db.run(sql, [concert_id, user_id, reservation_date], function (err) {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject({ code: 500, error: 'Error inserting reservation: ' + err });
                                }
                                const reservation_id = this.lastID;

                                // Query 5: Insert tickets
                                const sql = 'INSERT INTO tickets (reservation_id, seat) VALUES (?, ?)';
                                seats.forEach(seat => {
                                    db.run(sql, [reservation_id, seat], function (err) {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            return reject({ code: 500, error: 'Error inserting tickets: ' + err });
                                        }
                                    });
                                })
                                // Commit INSERT transactions
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        return reject({ code: 500, error: 'Error committing transaction: ' + err });
                                    }
                                    return resolve({ message: 'Reservation made successfully.', seats: seats });
                                });
                            });
                        });
                    });
                });
            });
        });
    }).catch((err) => {
        return err;
    });
}

// This function makes n random seats reservation in the database.
exports.makeRandomReservation = (concert_id, user_id, num_seats) => {
    return new Promise((resolve, reject) => {

        const reservation_date = new Date().toISOString().slice(0, 10).replace('T', ' ');

        let rows, columns;

        db.serialize(() => {
            // Query 1: Check if there are at least num_seats available
            const checkSql = `
                SELECT COALESCE(COUNT(tk.ticket_id), 0) AS reservedSeatsCount, t.rows AS rows, t.columns AS columns
                FROM theaters t
                LEFT JOIN concerts c ON t.theater_id = c.theater_id
                LEFT JOIN reservations r ON c.concert_id = r.concert_id
                LEFT JOIN tickets tk ON r.reservation_id = tk.reservation_id
                WHERE c.concert_id = ?;
            `;
            db.get(checkSql, [concert_id], (err, row) => {
                if (err) return reject(err);
                if (!row) return reject({ code: 404, error: 'Concert not found.' });
                rows = row.rows;
                columns = row.columns;
                const reservedSeats = row.reservedSeatsCount;
                const totalSeats = row.rows * row.columns;
                const availableSeats = totalSeats - reservedSeats;
                if (num_seats > availableSeats)
                    return reject({ code: 400, error: 'Not enough available seats for this reservation.' });

                // Query 2: Check if the user has already made a reservation for this concert
                const checkSql = 'SELECT * FROM reservations WHERE concert_id = ? AND user_id = ?';
                db.get(checkSql, [concert_id, user_id], (err, row) => {
                    if (err) return reject({ code: 500, error: 'Error checking existing reservations: ' + err });
                    if (row) return reject({ code: 400, error: 'You have already made a reservation for this concert.' });

                    // Query 3: Get all the reserved seats for this concert
                    const reservedSeatsSql = `
                        SELECT GROUP_CONCAT(t.seat) AS seats
                        FROM concerts c
                        LEFT JOIN reservations r ON c.concert_id = r.concert_id
                        LEFT JOIN tickets t ON r.reservation_id = t.reservation_id
                        WHERE c.concert_id = ?;
                    `;
                    db.get(reservedSeatsSql, [concert_id], (err, row) => {
                        if (err) return reject({ code: 500, error: 'Error fetching reserved seats: ' + err });

                        const reservedSeats = (row && row.seats) ? row.seats.split(',') : [];
                        
                        // Query 4: Generate n row for row filling
                        const seatsToReserve = [];
                        let count = 0;
                        for (let i = 1; i <= rows; i++) {
                            for (let j = 1; j <= columns; j++) {
                                if (count >= num_seats)
                                    break;
                                const seat = i + String.fromCharCode(64 + j);
                                if (!reservedSeats.includes(seat)){
                                    seatsToReserve.push(seat);
                                    count++;
                                }
                            }
                        }
                        
                        db.run('BEGIN TRANSACTION;', (err) => {
                            if (err)
                                return reject(err);

                            // Query 5: Insert reservation
                            const sql = 'INSERT INTO reservations (concert_id, user_id, reservation_date) VALUES (?, ?, ?)';
                            db.run(sql, [concert_id, user_id, reservation_date], function (err) {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject({ code: 500, error: 'Error inserting reservation: ' + err });
                                }
                                const reservation_id = this.lastID;

                                // Query 6: Insert tickets
                                const sql = 'INSERT INTO tickets (reservation_id, seat) VALUES (?, ?)';
                                seatsToReserve.forEach(seat => {
                                    db.run(sql, [reservation_id, seat], function (err) {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            return reject({ code: 500, error: 'Error inserting tickets: ' + err });
                                        }
                                    });
                                })
                                // Commit INSERT transactions
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        return reject({ code: 500, error: 'Error committing transaction: ' + err });
                                    }
                                    return resolve({ message: 'Reservation made successfully.', seats: seatsToReserve });
                                });
                            });
                        });
                    });

                });
            });
        });
    }).catch((err) => {
        return err;
    });
}

// This function deletes a reservation from the database.
exports.deleteReservation = (reservation_id, user_id) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get('SELECT user_id FROM reservations WHERE reservation_id = ?', [reservation_id], (err, row) => {
                if (err)
                    return reject(err);
                if (row == undefined)
                    return reject({ code: 404, error: 'No reservation found.' });
                if (row.user_id !== user_id)
                    return reject({ code: 403, error: 'You are not authorized to delete this reservation.' });

                db.run('BEGIN TRANSACTION;', (err) => {
                    if (err)
                        return reject(err);
                    db.run('DELETE FROM tickets WHERE reservation_id = ?', [reservation_id], (err) => {
                        if (err)
                            return reject(err);
                        db.run('DELETE FROM reservations WHERE reservation_id = ?', [reservation_id], (err) => {
                            if (err)
                                return reject(err);
                            db.run('COMMIT;', (err) => {
                                if (err)
                                    return reject(err);
                                resolve({ message: 'Reservation deleted successfully.' });
                            });
                        });
                    });
                });
            });
        });
    });
}

// This function retrieves all concerts from the database.
exports.getConcerts = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT c.concert_id, c.theater_id, c.artist, c.date, t.theater_name, t.city, t.rows, t.columns
                    FROM concerts c 
                    JOIN theaters t ON c.theater_id = t.theater_id`;
        db.all(sql, [], (err, rows) => {
            if (err)
                return reject(err);
            if (rows == undefined)
                return resolve({ error: 'Concerts not found.' });
            resolve(rows);
        });
    });
}

// This function retrieves all reserved seats of a concert_id from the database. (or at least the artist if there is no reservation)
exports.getConcertReservedSeats = (concert_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT c.artist, GROUP_CONCAT(t.seat) AS seats
            FROM concerts c
            LEFT JOIN reservations r ON c.concert_id = r.concert_id
            LEFT JOIN tickets t ON r.reservation_id = t.reservation_id
            WHERE c.concert_id = ?;
        `;
        db.get(sql, [concert_id], (err, row) => {
            if (err)
                return reject(err);
            if (!row)
                return reject({ code: 404, error: 'No reservation found for this user' });
            const result = {
                concert_id: concert_id, // Ensure concert_id is always returned
                artist: row ? row.artist : '', // Default to '' if no artist is found
                seats: row && row.seats ? row.seats.split(',') : [] // Convert string to array if seats are found
            };
            resolve(result);
        });
    });
}

// This function retrieves all reservations of a concert_id and user_id from the database.
exports.getConcertReservedSeatsByUserId = (concert_id, user_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT c.artist, GROUP_CONCAT(t.seat) AS seats
            FROM concerts c
            LEFT JOIN reservations r ON c.concert_id = r.concert_id AND r.user_id = ?
            LEFT JOIN tickets t ON r.reservation_id = t.reservation_id
            WHERE c.concert_id = ?;
        `;
        db.get(sql, [user_id, concert_id], (err, row) => {
            if (err)
                return reject(err);
            if (!row || !row.artist || !row.seats)
                return reject({ code: 404, error: 'No reservation found for this user' });
            resolve({
                user_id: user_id,
                concert_id: concert_id,
                artist: row.artist,
                seats: row.seats ? row.seats.split(',') : []
            });
        });
    });
}


// This function retrieves reserved, available, total seats and dimension of a theatre of a concert_id from the database.
exports.countAvailableSeats = (concert_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COALESCE(COUNT(tk.ticket_id), 0) AS reservedSeatsCount,
                t.rows AS rows,
                t.columns AS columns
            FROM 
                theaters t
                LEFT JOIN concerts c ON t.theater_id = c.theater_id
                LEFT JOIN reservations r ON c.concert_id = r.concert_id
                LEFT JOIN tickets tk ON r.reservation_id = tk.reservation_id
            WHERE 
                c.concert_id = ? ;
        `;
        db.get(sql, [concert_id], (err, row) => {
            if (err)
                return reject(err);
            if (!row || !row.rows || !row.columns)
                return reject({ code: 404, error: 'No reservation found for this concert' });
            resolve({
                concert_id: concert_id,
                reserved: row?.reservedSeatsCount,
                available: row?.rows * row?.columns - row?.reservedSeatsCount,
                total: row?.rows * row?.columns,
                rows: row?.rows,
                columns: row?.columns
            });
        });
    });
};

// This function retrieves all reservations of an user_id from the database.
exports.getReservationByUserId = (user_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                r.reservation_id,
                r.reservation_date,
                c.concert_id,
                c.artist AS concert_artist,
                c.date AS concert_date,
                t.theater_name,
                t.city,
                GROUP_CONCAT(tk.seat, ', ') AS reserved_seats
            FROM 
                reservations r
                JOIN concerts c ON r.concert_id = c.concert_id
                JOIN theaters t ON c.theater_id = t.theater_id
                LEFT JOIN tickets tk ON r.reservation_id = tk.reservation_id
            WHERE 
                r.user_id = ?
            GROUP BY 
                r.reservation_id
            ORDER BY 
                r.reservation_date, c.date ASC;
        `;
        db.all(sql, [user_id], (err, rows) => {
            if (err)
                return reject(err);
            if (rows == undefined)
                return resolve({ code: 404, error: 'No reservation found for this user' });
            rows.forEach(row => {
                row.reserved_seats = row.reserved_seats?.split(', ');
            });
            resolve(rows);
        });
    });
}



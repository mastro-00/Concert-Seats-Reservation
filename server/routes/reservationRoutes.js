const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/authMiddleware'); // Middleware to check if the user is logged in
const reservationDao = require('../database/dao/dao-reservation'); // module for accessing the DB

const { check, validationResult, oneOf } = require('express-validator');

// POST /api/reservation
// This route makes a reservation in the database.
router.post('/', isLoggedIn, [
    check('concert_id').isInt().withMessage('concert_id must be an integer'),
    check('seat').isArray().withMessage('Seat must be an array'),
    check('seat').notEmpty().withMessage('Seat array cannot be empty'),
    check('seat.*').isString().withMessage('Single seat must be an array of strings')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(element => element.msg).join(', ');
        return res.status(400).json({ error: errorMessages });
    }
    const concert_id = req.body.concert_id;
    const user_id = req.user.user_id;
    const seat = req.body.seat;
    if (seat.length === 0)
        return res.status(400).json({ error: 'Seat array cannot be empty' });
    reservationDao.makeReservation(concert_id, user_id, seat).then((result) => {
        if (result.error)
            return res.status(result.code ? result.code : 500).json({ error: result.error });
        return res.json(result);
    })
    .catch((err) => {
        return res.status(err.code ? err.code : 500).json({ error: err.error });
    });
});

// POST /api/reservation/random
// This route makes n random seats reservation in the database.
router.post('/random', isLoggedIn, [
    check('concert_id').isInt().withMessage('concert_id must be an integer'),
    check('num_seats').isInt().withMessage('user_id must be an integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(element => element.msg).join(', ');
        return res.status(400).json({ error: errorMessages });
    }
    const concert_id = req.body.concert_id;
    const user_id = req.user.user_id;
    const num_seats = req.body.num_seats;
    reservationDao.makeRandomReservation(concert_id, user_id, num_seats).then((result) => {
        if (result.error)
            return res.status(result.code ? result.code : 500).json({ error: result.error });
        return res.json(result);
    })
    .catch((err) => {
        return res.status(err.code ? err.code : 500).json({ error: err.error });
    });
});

// DELETE /api/reservation/:reservation_id
// This route deletes a reservation from the database.
router.delete('/:reservation_id', isLoggedIn, [
    check('reservation_id').isInt().withMessage('reservation_id must be an integer').toInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(element => element.msg).join(', ');
        return res.status(400).json({ error: errorMessages });
    }
    const loggedUserId = req.user.user_id;
    reservationDao.deleteReservation(req.params.reservation_id, loggedUserId).then((result) => {
        res.json(result);
    }).catch((err) => {
        return res.status(err.code ? err.code : 500).json({ error: err.error });
    });
});

// GET /api/reservation/concerts
// This route retrieves all concerts from the database.
router.get('/concerts', (req, res) => {
    reservationDao.getConcerts().then((result) => {
        res.json(result);
    }).catch((err) => {
        // for security reasons, do not expose the error message
        res.status(500).json({ error: "SQLITE_ERROR. Contact server administrator." });
        // console.log(err.message);
    });
});

// GET /api/reservation/concert/:concert_id
// This route retrieves all reservations of a concert_id from the database.
router.get('/concert/:concert_id', [
    check('concert_id').isInt().withMessage('concert_id must be an integer').toInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(element => element.msg).join(', ');
        return res.status(400).json({ error: errorMessages });
    }
    reservationDao.getConcertReservedSeats(req.params.concert_id).then((result) => {
        res.json(result);
    }).catch((err) => {
        return res.status(err.code ? err.code : 500).json({ error: err.error });
    });
});

// GET /api/reservation/concert/:concert_id/user/:user_id
// This route retrieves all reservations of a concert_id and user_id from the database.
router.get('/concert/:concert_id/user/:user_id', isLoggedIn, [
    check('concert_id').isInt().withMessage('concert_id must be an integer').toInt(),
    check('user_id').isInt().withMessage('user_id must be an integer').toInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(element => element.msg).join(', ');
        return res.status(400).json({ error: errorMessages });
    }
    const loggedUserId = req.user.user_id;
    const requestedUserId = parseInt(req.params.user_id, 10); // Convert :user_id param to integer
    // Check if the logged-in user's ID matches the requested user ID
    if (loggedUserId !== requestedUserId)
        return res.status(403).json({ error: 'You are not authorized to view this information.' });
    reservationDao.getConcertReservedSeatsByUserId(req.params.concert_id, loggedUserId).then((result) => {
        res.json(result);
    }).catch((err) => {
        return res.status(err.code ? err.code : 500).json({ error: err.error });
    });
});

// GET /api/reservation/concert/:concert_id/count
// This route retrieves the number of free seats of a concert_id from the database.
router.get('/concert/:concert_id/count', [
    check('concert_id').isInt().withMessage('concert_id must be an integer').toInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(element => element.msg).join(', ');
        return res.status(400).json({ error: errorMessages });
    }
    reservationDao.countAvailableSeats(req.params.concert_id).then((result) => {
        res.json(result);
    }).catch((err) => {
        return res.status(err.code ? err.code : 500).json({ error: err.error });
    });
});

// GET /api/reservation/user/:user_id
// This route retrieves all reservations of an user_id from the database.
router.get('/user/:user_id', isLoggedIn, [
    check('user_id').isInt().withMessage('user_id must be an integer').toInt()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(element => element.msg).join(', ');
        return res.status(400).json({ error: errorMessages });
    }
    const loggedUserId = req.user.user_id;
    const requestedUserId = parseInt(req.params.user_id, 10); // Convert :user_id param to integer
    // Check if the logged-in user's ID matches the requested user ID
    if (loggedUserId !== requestedUserId) {
        return res.status(403).json({ error: 'You are not authorized to view this information.' });
    }
    reservationDao.getReservationByUserId(req.params.user_id).then((result) => {
        res.json(result);
    }).catch((err) => {
        return res.status(err.code ? err.code : 500).json({ error: err.error });
    });
});

module.exports = router;
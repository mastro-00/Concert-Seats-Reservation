const SERVER1_URL = 'http://localhost:3001/api/';
const SERVER2_URL = 'http://localhost:3002/api/';

// This file contains all the functions that interact with the API server endpoints.

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
    // server API always return JSON, in case of error the format is the following { error: <message> } 
    return new Promise((resolve, reject) => {
        httpResponsePromise
            .then((response) => {
                if (response.ok) {
                    // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
                    response.json()
                        .then(json => resolve(json))
                        .catch(err => reject({ error: "Cannot parse server response" }))

                } else {
                    // analyzing the cause of error
                    response.json()
                        .then(obj => reject({ "status": response.status, "message": obj })) // error msg in the response body
                        .catch(err => reject({ error: "Cannot parse server response" }))
                }
            })
            .catch(err =>
                reject({ error: "Cannot communicate" })
            ) // connection error
    });
}

/** AUTHENTICATION FUNCTIONS */

/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
 */
const logIn = async (credentials) => {
    return getJson(fetch(SERVER1_URL + 'session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // this parameter specifies that authentication cookie must be forwarded
        body: JSON.stringify(credentials),
    }))
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
    return getJson(fetch(SERVER1_URL + 'session', {
        // this parameter specifies that authentication cookie must be forwarded
        credentials: 'include'
    }))
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async () => {
    return getJson(fetch(SERVER1_URL + 'session', {
        method: 'DELETE',
        credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
    }))
}

/** TOKEN FUNCTIONS */

/**
 * This function is used to get the authentication token.
 */
const getAuthToken = async () => {
    return getJson(fetch(SERVER1_URL + 'auth-token', {
        // this parameter specifies that authentication cookie must be forwarded
        credentials: 'include'
    }))
}

/** RESERVATION FUNCTIONS */

/**
 * This function makes a reservation.
 */
const makeReservation = async (concert_id, seat) => {
    return getJson(fetch(SERVER1_URL + 'reservation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // this parameter specifies that authentication cookie must be forwarded
        body: JSON.stringify({ concert_id, seat }),
    }))
}

/**
 * This function makes a random reservation.
 */
const makeRandomReservation = async (concert_id, num_seats) => {
    return getJson(fetch(SERVER1_URL + 'reservation/random', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // this parameter specifies that authentication cookie must be forwarded
        body: JSON.stringify({ concert_id, num_seats }),
    }))
}

/**
 * This function deletes a reservation from the database.
 */
const deleteReservation = async (reservation_id) => {
    return getJson(fetch(SERVER1_URL + 'reservation/' + reservation_id, {
        method: 'DELETE',
        credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
    }))
}

/**
 * This function returns all concerts from the database.
 */
const getConcerts = async () => {
    return getJson(fetch(SERVER1_URL + 'reservation/concerts', {
        credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
    }))
}

/**
 * This function returns all reserved seats of a concert_id from the database.
 */
const getConcertReservedSeats = async (concert_id) => {
    return getJson(fetch(SERVER1_URL + 'reservation/concert/' + concert_id, {
        credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
    }))
}

/**
 * This function returns all reserved seats of a concert_id and user_id from the database.
 */
const getConcertReservedSeatsByUserId = async (concert_id, user_id) => {
    return getJson(fetch(SERVER1_URL + 'reservation/concert/' + concert_id + '/user/' + user_id, {
        credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
    }))
}

/**
 * This function returns the number of free seats of a concert_id from the database.
 */
const countAvailableSeats = async (concert_id) => {
    return getJson(fetch(SERVER1_URL + 'reservation/concert/' + concert_id + '/count', {
        credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
    }))
}

/**
 * This function returns all reservations of an user_id from the database.
 */
const getReservationByUserId = async (user_id) => {
    return getJson(fetch(SERVER1_URL + 'reservation/user/' + user_id, {
        credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
    }))
}

/**
 * This function return the discount percentage of a concert reservation.
 */
const getDiscount = async (authToken, seats) => {
    return getJson(fetch(SERVER2_URL + 'discount', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({seats: seats}),
    }))
}

const API = { logIn, getUserInfo, logOut, getAuthToken, getConcerts, getConcertReservedSeats, getConcertReservedSeatsByUserId, countAvailableSeats, getReservationByUserId, makeReservation, makeRandomReservation, deleteReservation, getDiscount };
export default API;
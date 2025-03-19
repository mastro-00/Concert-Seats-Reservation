import API from './API';

// This file use API.js to interact with the server endpoints.

/**
 * This function makes a reservation in the database.
 */
export const makeReservation = async (concert_id, seat) => {
  try {
    const result = await API.makeReservation(concert_id, seat);
    return result;
  } catch (err) {
    if (err.status === 401)
      window.location.href = '/';
    else
      throw err;
  }
}

/**
 * This function makes a random reservation in the database.
 */
export const makeRandomReservation = async (concert_id, num_seats) => {
  try {
    const result = await API.makeRandomReservation(concert_id, num_seats);
    return result;
  } catch (err) {
    if (err.status === 401)
      window.location.href = '/';
    else
      throw err.message; // Re-throw the error if it's not a 401
  }
}

/**
 * This function deletes a reservation from the database.
 */
export const deleteReservation = async (reservation_id) => {
  try {
    const result = await API.deleteReservation(reservation_id);
    return result;
  } catch (err) {
    if (err.status === 401)
      window.location.href = '/';
    else
      throw err.message; // Re-throw the error if it's not a 401
  }
}

/**
 * This function returns all concerts from the database.
 */
export const getConcerts = async () => {
  try {
    const concerts = await API.getConcerts();
    return concerts;
  } catch (err) {
    throw err.message;
  }
};

/**
 * This function returns all reserved seats of a concert_id from the database.
 */
export const getConcertReservedSeats = async (concert_id) => {
  try {
    const seats = await API.getConcertReservedSeats(concert_id);
    return seats;
  } catch (err) {
    throw err.message;
  }
}

/**
 * This function returns all reserved seats of a concert_id and user_id from the database.
 */
export const getConcertReservedSeatsByUserId = async (concert_id, user_id) => {
  try {
    const seats = await API.getConcertReservedSeatsByUserId(concert_id, user_id);
    return seats;
  } catch (err) {
    throw err.message;
  }
}

/**
 * This function returns the number of free seats of a concert_id from the database.
 */
export const countAvailableSeats = async (concert_id) => {
  try {
    const count = await API.countAvailableSeats(concert_id);
    return count;
  } catch (err) {
    throw err.message;
  }
}

/**
 * This function returns all reservations of an user_id from the database.
 */
export const getReservationByUserId = async (user_id) => {
  try {
    const reservations = await API.getReservationByUserId(user_id);
    return reservations;
  } catch (err) {
    if (err.status === 401)
      window.location.href = '/';
    else
      throw err.message; // Re-throw the error if it's not a 401
  }
}

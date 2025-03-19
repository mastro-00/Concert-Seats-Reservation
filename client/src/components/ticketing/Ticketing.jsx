import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";

import { Alert } from 'react-bootstrap';

import "./ticketing.css"

import { getConcerts, countAvailableSeats, getReservationByUserId } from '../../utils/reservationService';

const Ticketing = (props) => {
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState('');
  const [concerts, setConcerts] = useState([]);
  const [reservations, setReservations] = useState([]);

  // Fetch all concerts and their reserved seats
  const fetchConcerts = async () => {
    try {
      const concerts = await getConcerts();
      const concertPromises = concerts.map(async (concert) => {
        concert.totalSeats = concert.rows * concert.columns;
        concert.size =
          concert.totalSeats >= 126 ? "Large" :
            concert.totalSeats >= 60 ? "Medium" :
              concert.totalSeats >= 32 ? "Small" : "?";
        concert.reserved = await fetchReservedSeats(concert.concert_id);
        return concert;
      });
      const updatedConcerts = await Promise.all(concertPromises);
      setConcerts(updatedConcerts);
    } catch (error) {
      setErrorMessage(error?.error || 'An unexpected error occurred. Maybe the server is down?');
    }
  };

  // Fetch the number of reserved seats for a concert
  const fetchReservedSeats = async (concert_id) => {
    try {
      const count = await countAvailableSeats(concert_id);
      return count?.reserved || 0;
    } catch (error) {
      setErrorMessage(error?.error || 'An unexpected error occurred. Maybe the server is down?');
    }
  }

  // Fetch reservations by user ID to check if an user has a reservation for that concert
  const fetchReservationsByID = async () => {
    try {
      const reservationList = await getReservationByUserId(props.user?.user_id);
      setReservations(reservationList);
    } catch (error) {
      setErrorMessage(error?.error || 'Error fetching reservations.');
    }
  };

  useEffect(() => {
    fetchConcerts();
    fetchReservationsByID();
  }, []);

  // Open the seat map for a concert
  const openSeatMap = (concertID) => {
    navigate(`/seatmap/${concertID}`);
  }

  // Check if the user has a reservation for a concert
  const userHasReservationForConcert = (concertId) => {
    return reservations.some(reservation => reservation.concert_id === concertId);
  };

  return (
    <div className="grid">
      <div className="head title mb-0">
        Concert List - {props.user.name} View
      </div>
      <p className="head small text-muted">
        Click on a concert to reserve tickets.
      </p>
      {errorMessage ? <Alert dismissible onClose={() => setErrorMessage('')} variant="danger">{errorMessage}</Alert> : null}
      <div className="list-group concerts">
        {concerts.map((concert, index) => (
          <button className="list-group-item list-group-item-action" onClick={() => openSeatMap(concert?.concert_id)} key={index}>
            <div className="d-flex w-100 justify-content-between">
              <h5 className={`${userHasReservationForConcert(concert.concert_id) ? 'text-success' : ''} mb-1`} style={{ display: 'inline' }}>
                {concert.artist}
                <span className="text-body-secondary" style={{ display: 'inline', marginLeft: '5px', fontSize: '1rem' }}>
                  on {concert.date}
                </span>
              </h5>
              <small className="text-body-secondary">
                {concert.totalSeats} seats total ({concert.totalSeats - concert.reserved > 0 ? `${concert.totalSeats - concert.reserved} available` : 'Sold Out'})
                {userHasReservationForConcert(concert.concert_id) && (
                  <span className="text-success ms-2" style={{ fontSize: '1rem' }}>
                    Booked
                  </span>
                )}
              </small>
            </div>
            <div className="d-flex w-100 justify-content-between">
              <small className="text-body-secondary">
                {concert.theater_name} ({concert.city})
              </small>
              <small className="text-body-secondary">
                Size: {concert.size}
              </small>
            </div>
          </button>
        ))}

      </div>
    </div>
  )
}

export default Ticketing
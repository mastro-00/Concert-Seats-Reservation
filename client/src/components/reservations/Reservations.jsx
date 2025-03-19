import React, { useState, useEffect } from 'react'
import './reservations.css'
import { Modal, Button, Alert } from 'react-bootstrap';

import { getReservationByUserId, deleteReservation } from '../../utils/reservationService';

const Reservations = (props) => {

  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch reservations by user ID
  const fetchReservations = async () => {
    try {
      const reservationList = await getReservationByUserId(props.user?.user_id);
      setReservations(reservationList);
    } catch (error) {
      setErrorMessage(error?.error || 'Error fetching reservations.');
    }
  };

  useEffect(() => {
    fetchReservations(); // Call the async function
  }, []);

  const handleShow = (reservation) => {
    setSelectedReservation(reservation);
    setSuccessMessage('');
    setErrorMessage('');
    setShow(true);
  };

  const handleClose = () => setShow(false);

  // Delete reservation
  const handleDelete = async (reservationId) => {
    try {
      const result = await deleteReservation(reservationId);
      setSuccessMessage(result.message);
      fetchReservations();
    } catch (error) {
      setErrorMessage(error?.error || 'Error deleting reservation.');
    }
    handleClose();
  };

  return (
    <div className="grid">
      <div className="head title mb-0">
        Reservation List for {props.user.name}
      </div>
      <p className="head small text-muted">
        Click on a reservation to view details or delete it.
      </p>
      {errorMessage ? <Alert dismissible onClose={() => setErrorMessage('')} variant="danger">{errorMessage}</Alert> : null}
      {successMessage ? <Alert dismissible onClose={() => setSuccessMessage('')} variant="success">{successMessage}</Alert> : null}
      <div className="list-group concerts">
        {reservations.length > 0 ?
          (
            reservations.map((reservation, index) => (
              <button className="list-group-item list-group-item-action" onClick={() => handleShow(reservation)} key={reservation.reservation_id}>
                <div className="d-flex w-100 justify-content-between">
                  <h5 className="mb-1">
                    {reservation.concert_artist}
                    <span className="text-body-secondary" style={{ marginLeft: '10px', fontSize: '1rem' }}>
                      {reservation.theater_name} ({reservation.city})
                    </span>
                  </h5>
                  <small className="text-body-secondary">Reserved on {reservation.reservation_date}</small>
                </div>
                <div className="d-flex w-100 justify-content-between">
                  <h6>
                    Reserved seats:
                    <small className="text-body-secondary" style={{ marginLeft: '10px', fontSize: '1rem', fontWeight: 'bold' }}>
                      {reservation.reserved_seats.join(', ')}
                    </small>
                  </h6>
                  <small className="text-body-secondary">Concert on {reservation.concert_date}</small>
                </div>
              </button>
            ))
          ) : (
            <div className="list-group-item list-group-item-action text-center py-4">
              <div className="d-flex flex-column align-items-center justify-content-center">
                <h6 className='mt-3'>
                  No reservations found.
                </h6>
                <p className="small text-muted">
                  You haven’t made any reservations yet. Explore concerts and reserve your seat today!
                </p>
              </div>
            </div>
          )
        }

        <Modal show={show} onHide={handleClose} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedReservation?.concert_artist} Reservation by {props.user.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column justify-content-center text-center">
            <p className='mb-0'>
              <strong>Concert Artist:</strong> {selectedReservation?.concert_artist}
            </p>
            <p className='mb-0'>
              <strong>Concert Date:</strong> {selectedReservation?.concert_date}
            </p>
            <p className='mb-0'>
              <strong>Theater:</strong> {selectedReservation?.theater_name} ({selectedReservation?.city})
            </p>
            <p className='mb-0'>
              <strong>Reserved Seats:</strong> {selectedReservation?.reserved_seats.join(', ')}
            </p>
            <p className='mb-2'>
              <strong>Reservation Date:</strong> {selectedReservation?.reservation_date}
            </p>
            <p className='mb-0'>
              Are you sure you want to delete this reservation?
            </p>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-center">
            <Button variant="danger" onClick={() => handleDelete(selectedReservation?.reservation_id)}>
              Delete
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </div>
  )
}

export default Reservations
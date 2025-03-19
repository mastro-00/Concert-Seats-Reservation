import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import "./seatmap.css";

import { getConcertReservedSeats, getConcertReservedSeatsByUserId, countAvailableSeats, makeReservation, makeRandomReservation } from '../../utils/reservationService';

import API from '../../utils/API';

const SeatMap = (props) => {
    const { concertID } = useParams();

    const [authToken, setAuthToken] = useState(undefined);
    const [seatsToSend, setSeatsToSend] = useState([]);
    const [discount, setDiscount] = useState(0);

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [seats, setSeats] = useState([]);
    const [seatsData, setSeatsData] = useState({});
    const [availableSeats, setAvailableSeats] = useState(0);
    const [occupiedSeats, setOccupiedSeats] = useState(0);
    const [totalSeats, setTotalSeats] = useState(0);
    const [columns, setColumns] = useState(0);

    const [selectedIndex, setSelectedIndex] = useState([]);
    const [selected3DIndex, setSelected3DIndex] = useState([]);
    
    const [alreadyReserved, setAlreadyReserved] = useState(false);
    const [reservedSeatList, setReservedSeatList] = useState([]);

    const [highlightedSeats, setHighlightedSeats] = useState([]);

    const [show, setShow] = useState(false);
    const [show2, setShow2] = useState(false);
    const [numSeats, setNumSeats] = useState(1);

    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);

    const handleShow2 = () => setShow2(true);
    const handleClose2 = () => setShow2(false);

    useEffect(() => {
        fetchData();
        checkAlreadyReserved();
    }, []);

    // Fetch reserved seats and theater data
    const fetchData = async () => {
        try {
            const seatList = await getConcertReservedSeats(concertID); // Fetch reserved seats
            setSeatsData(seatList);
            const count = await countAvailableSeats(concertID); // Fetch theater data
            setOccupiedSeats(count?.reserved);
            setAvailableSeats(count?.available);
            setTotalSeats(count?.total);
            setColumns(count?.columns);
        } catch (error) {
            setErrorMessage(error?.error || 'Error fetching data.');
        }
    };

    // Check if the user has already reserved seats for the concert
    const checkAlreadyReserved = async () => {
        try {
            const result = await getConcertReservedSeatsByUserId(concertID, props.user?.user_id);
            setReservedSeatList(result.seats);
            setAlreadyReserved(true);
        } catch (error) {
            setAlreadyReserved(false);
        }
    };

    // Convert seatsData.seats into a array map where each seat index is mapped to its status ("booked" or "")
    useEffect(() => {
        const seatMap = {};
        seatsData.seats?.forEach(seat => {
            const index = seat3DToIndex(seat, columns);
            seatMap[index] = "booked";
        });
        // Initialize seats with status
        setSeats(Array.from({ length: totalSeats }, (_, index) => seatMap[index] || ""));
    }, [seatsData, totalSeats]);

    // Handle seat selection
    const handleSeatSelection = (index, indexTo3D) => {
        if (seats[index] === "booked") return;

        let updatedSelectedIndex = [...selectedIndex];
        if (updatedSelectedIndex.includes(index))
            updatedSelectedIndex = updatedSelectedIndex.filter(seat => seat !== index);
        else
            updatedSelectedIndex.push(index);
        setSelectedIndex(updatedSelectedIndex);

        setSelected3DIndex(prevSeats => {
            if (prevSeats.includes(indexTo3D)) {
                return prevSeats.filter(seat => seat !== indexTo3D); // Deselect the seat
            } else {
                return [...prevSeats, indexTo3D]; // Select the seat
            }
        });
    };

    // Reserve selected seats
    const reserveSelectedSeats = async () => {
        setErrorMessage('');
        try {
            const result = await makeReservation(concertID, selected3DIndex);
            // const result = await makeReservation(4, ["1B", "2B", "4B"]);
            // setSuccessMessage(result.message);
            getDiscount(result.seats);
            setSelectedIndex([]);
            setSelected3DIndex([]);
            fetchData();
            checkAlreadyReserved();
        } catch (error) {
            setErrorMessage(error?.message.error || 'Error making reservation2.');
            if (error?.status === 409) {
                const alreadyReservedSeats = error?.message.error.split(": ")[1].split(", ");
                setHighlightedSeats(alreadyReservedSeats);
                setTimeout(() => {
                    setHighlightedSeats([]);
                    setSelectedIndex([]);
                    setSelected3DIndex([]);
                    fetchData();
                    checkAlreadyReserved();
                }, 5000);
            }
        } finally {
            handleClose();
        }
    };

    // Reserve random seats
    const reserveRandomSeats = async () => {
        setErrorMessage('');
        try {
            const result = await makeRandomReservation(concertID, numSeats);
            // setSuccessMessage(result.message);
            getDiscount(result.seats);
            fetchData();
            checkAlreadyReserved();
        } catch (error) {
            setErrorMessage(error?.error || 'Error making reservation.');
        } finally {
            setSelectedIndex([]);
            setSelected3DIndex([]);
            setNumSeats(1);
            handleClose2();
        }
    }

    // Get discount for next year's concert season
    const getDiscount = async (seats) => {
        setSeatsToSend(seats);
        try {
            const token = await API.getAuthToken();
            setAuthToken(token.token);
        } catch (err) {
            // setErrorMessage(err.message?.error || 'Error generating token.');
            console.log("DEBUG: generateToken err: ", err);
        }
    }

    useEffect(() => {
        const fetchDiscount = async () => {
            if (authToken && seatsToSend.length > 0) {
                try {
                    const discountData = await API.getDiscount(authToken, seatsToSend);
                    setDiscount(discountData.discount);
                    setSuccessMessage("Reservation made successfully. Discount for next year’s concert season: " + discountData.discount + "%");
                } catch (err) {
                    setErrorMessage(err.message?.error || 'Error fetching discount.');
                }
            }
        };
        fetchDiscount();
    }, [authToken]);

    const isButtonDisabled = () => selectedIndex.length === 0 || alreadyReserved;

    // Convert index to 3D seat
    function indexTo3D(index, C) {
        const row = Math.floor(index / C) + 1;
        const column = index % C;
        const columnLetter = String.fromCharCode('A'.charCodeAt(0) + column);
        return `${row}${columnLetter}`;
    }

    // Convert 3D seat to index
    function seat3DToIndex(seat, C) {
        const row = parseInt(seat.match(/\d+/)[0]); // Extract the number from the seat string
        const column = seat.match(/[A-Z]/)[0].charCodeAt(0) - 'A'.charCodeAt(0); // Extract the letter from the seat string and convert it to a number
        return (row - 1) * C + column;
    }

    return (
        <>
            {successMessage ? <Alert className="ms-4 me-4 mb-0" dismissible onClose={() => setSuccessMessage('')} variant="success">{successMessage}</Alert> : null}
            {errorMessage ? <Alert className="mt-2 ms-4 me-4 mb-0" dismissible onClose={() => setErrorMessage('')} variant="danger">{errorMessage}</Alert> : null}
            <div className="center">
                <div className="tickets">
                    <div className="ticket-selector">
                        <div className="head mb-0">
                            <div className="title">{seatsData.artist} Concert</div>
                        </div>
                        <p className="small text-muted mt-2 mb-2">Select seats from the map or auto-assign available seats based on your specified quantity</p>
                        <div className="seats">
                            <div className="status">
                                <div className="item">Available</div>
                                <div className="item">Booked</div>
                                <div className="item">Selected</div>
                            </div>
                            <div className="all-seats" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                                {seats.map((seat, index) => (
                                    <div key={index} className="seat-container">
                                        <input
                                            type="checkbox"
                                            id={`${indexTo3D(index, columns)}`}
                                            checked={selectedIndex.includes(index)}
                                            onChange={() => handleSeatSelection(index, indexTo3D(index, columns))}
                                            disabled={seat === "booked" || alreadyReserved}
                                        />
                                        <label
                                            htmlFor={`${indexTo3D(index, columns)}`}
                                            className={`seat2 ${seat} 
                                                ${selectedIndex.includes(index) ? "selected" : ""} 
                                                ${highlightedSeats.includes(indexTo3D(index, columns)) ? "highlighted" : ""}
                                            `}
                                            style={{ cursor: seat === "booked" || alreadyReserved ? "not-allowed" : "pointer" }}>
                                            <span className="seat-index">{indexTo3D(index, columns)}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="price">
                        <div className="total">
                            <span>
                                <span className="count">{selectedIndex.length}</span> Requested Seats
                            </span>
                            <span>
                                <span className="count">{occupiedSeats}</span> Occupied Seats
                            </span>
                            <span>
                                <span className="count">{availableSeats}</span> Available Seats
                            </span>
                            <span>
                                <span className="count">{totalSeats}</span> Total Seats
                            </span>
                            {!alreadyReserved ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleShow}
                                        disabled={isButtonDisabled()}
                                        className="mt-2">
                                        Book Selected Seats
                                    </button>
                                    <p className="mt-1 mb-1">OR</p>
                                    <button
                                        type="button"
                                        onClick={handleShow2}
                                        style={{ marginTop: "5px" }}>
                                        Book Random Seats
                                    </button>
                                </>
                            ) : (
                                <div className="mt-2" style={{ textAlign: 'center' }}>
                                    <p className="mb-0" style={{ margin: 0 }}>You have already reserved the following seats:</p>
                                    <p className="text-body-secondary" style={{ margin: 0 }}>{reservedSeatList.join(', ')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Modal show={show} onHide={handleClose} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Manual Ticketing for {seatsData?.artist} Concert</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="d-flex flex-column align-items-center">
                        <p>Do you want to confirm the reservation?</p>
                        <p className="mb-1">Seats: {selected3DIndex.join(', ')}</p>
                    </Modal.Body>
                    <Modal.Footer className="d-flex justify-content-center">
                        <Button variant="primary" onClick={reserveSelectedSeats}>
                            Reserve
                        </Button>
                        <Button variant="danger" onClick={handleClose}>
                            Cancel
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Modal show={show2} onHide={handleClose2} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Automatic Ticketing for {seatsData?.artist} Concert</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="d-flex flex-column align-items-center">
                        <p>Specify the number of seats to reserve (min: 1):</p>
                        <Form.Control
                            type="number"
                            min="1"
                            value={numSeats}
                            onChange={(e) => setNumSeats(Number(e.target.value))}
                            style={{ width: 'auto', minWidth: '60px' }}
                            className="mb-2" />
                        <p className="mb-2">Seats will be auto-assigned row by row based on the number you choose.</p>
                        <span>
                            <span className="count">{occupiedSeats}</span> Occupied Seats
                        </span>
                        <span>
                            <span className="count">{availableSeats}</span> Available Seats
                        </span>
                        <span>
                            <span className="count">{totalSeats}</span> Total Seats
                        </span>
                    </Modal.Body>
                    <Modal.Footer className="d-flex justify-content-center">
                        <Button variant="primary" onClick={reserveRandomSeats}>
                            Reserve
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </>
    )
}

export default SeatMap
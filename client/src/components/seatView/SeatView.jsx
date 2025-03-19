import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import "./seatview.css";

import { getConcertReservedSeats, countAvailableSeats } from '../../utils/reservationService';

const SeatView = () => {
    const location = useLocation();
    const concertID = new URLSearchParams(location.search).get('id');

    const [errorMessage, setErrorMessage] = useState('');
    const [seatsData, setSeatsData] = useState({});
    const [rows, setRows] = useState(0);
    const [columns, setColumns] = useState(0);
    const [seats, setSeats] = useState([]);

    useEffect(() => {
        fetchData(); // Call the async function
    }, []);

    const fetchData = async () => {
        try {
            // Fetch reserved seats
            const seatList = await getConcertReservedSeats(concertID);
            setSeatsData(seatList);
            // Fetch theater dimensions
            const count = await countAvailableSeats(concertID);
            setRows(count.rows);
            setColumns(count.columns);
        } catch (error) {
            setErrorMessage(error?.error || 'Error fetching data.');
        }
    };

    // Initialize seats with status
    useEffect(() => {
        // Convert seatsData.seats into a array map where each seat index is mapped to its status ("booked" or "")
        const seatMap = {};
        seatsData.seats?.forEach(seat => {
            const index = seat3DToIndex(seat, columns);
            seatMap[index] = "booked";
        });
        // Initialize seats with status
        setSeats(Array.from({ length: rows * columns }, (_, index) => seatMap[index] || ""));
    }, [seatsData, rows, columns]);

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

    // Count seats by status ("booked" or "")
    const countSeatsByStatus = (status) => seats.filter(seat => seat === status).length;

    return (
        <>
            {errorMessage ? <Alert className="ms-4 me-4 mb-0" dismissible onClose={() => setErrorMessage('')} variant="danger">{errorMessage}</Alert> : null}
            <div className="center">
                <div className="tickets">
                    <div className="ticket-selector">
                        <div className="head">
                            <div className="title">{seatsData.artist} Concert</div>
                        </div>
                        <div className="seats">
                            <div className="status">
                                <div className="item">Available</div>
                                <div className="item">Booked</div>
                            </div>
                            <div className="all-seats" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                                {seats?.map((seat, index) => (
                                    <div key={index}>
                                        <label
                                            className={`seat ${seat}`}>
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
                                <span className="count">{countSeatsByStatus("booked")}</span> Occupied Seats
                            </span>
                            <span>
                                <span className="count">{countSeatsByStatus("")}</span> Available Seats
                            </span>
                            <span>
                                <span className="count">{rows * columns}</span> Total Seats
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default SeatView
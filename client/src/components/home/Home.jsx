import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import { Alert } from 'react-bootstrap';
import './home.css'

import { getConcerts } from '../../utils/reservationService';

const Home = () => {

    const [errorMessage, setErrorMessage] = useState('');
    const [concerts, setConcerts] = useState([]);

    const navigate = useNavigate();

    const seatsShow = (concert) => {
        navigate('/seatview?id=' + concert.concert_id);
    };

    useEffect(() => {
        const fetchConcerts = async () => {
            try {
                const concertList = await getConcerts();
                concertList.forEach(concert => {
                    concert.totalSeats = concert.rows * concert.columns;
                    concert.size = concert.totalSeats >= 126 ? "Large" :
                        concert.totalSeats >= 60 ? "Medium" :
                            concert.totalSeats >= 32 ? "Small" : "?";
                });
                setConcerts(concertList);
            } catch (error) {
                // console.error('Error fetching concerts:', error);
                setErrorMessage(error?.error || 'An unexpected error occurred. Maybe the server is down?');
            }
        };
        fetchConcerts(); // Call the async function
    }, []);

    return (
        <div className="grid">
            <div className="head title mb-0">
                Concert List - Guest View
            </div>
            <p className="head small text-muted">
                Click on a concert to view the reserved seat map.
            </p>
            {errorMessage ? <Alert dismissible onClose={() => setErrorMessage('')} variant="danger">{errorMessage}</Alert> : null}
            <div className="list-group concerts">
            {concerts.length > 0 ?
                (
                    concerts.map((concert, index) => (
                        <button className="list-group-item list-group-item-action" onClick={() => seatsShow(concert)} key={concert.concert_id}>
                            <div className="d-flex w-100 justify-content-between">
                                <h5 className="mb-1">
                                    {concert.artist}
                                    <span className="text-body-secondary" style={{ marginLeft: '5px', fontSize: '1rem' }}>
                                        on {concert.date}
                                    </span>
                                </h5>
                                <small className="text-body-secondary">{concert.totalSeats} total seats</small>
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
                    ))
                ) : (
                    <div className="list-group-item list-group-item-action text-center py-4">
                        <div className="d-flex flex-column align-items-center justify-content-center">
                            <h6 className='mt-3'>
                            No concerts found.
                            </h6>
                            <p className="small text-muted">
                            No concerts are available at the moment.
                            </p>
                        </div>
                    </div>
                )
            }
            </div>
        </div>
    )
}

export default Home
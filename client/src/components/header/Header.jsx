import React from 'react';
import { Link, useLocation } from 'react-router-dom'

import './header.css'

export default function Header(props) {

    return (
        <>
            <div className="ms-4 me-4">
                <header className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-between py-3 mb-2 border-bottom">
                    <div className="col-md-3 mb-2 mb-md-0">
                        <Link to="/" className="d-inline-flex link-body-emphasis text-decoration-none">
                            <span className="fs-4">Concert Seats</span>
                        </Link>
                    </div>

                    <ul className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0">
                        <CustomItem to="/">Home</CustomItem>
                        {props.isAuthenticated && (
                            <>
                                <CustomItem to="/ticketing">Ticketing</CustomItem>
                                <CustomItem to="/reservations">Reservations</CustomItem>
                            </>
                        )}
                    </ul>
                    
                    <div className="col-md-3 text-end">
                    {!props.isAuthenticated ? (
                        <Link to="/login"><button type="button" className="btn btn-primary me-2">Login</button></Link>
                    ) : (
                        <button type="button" className="btn btn-primary me-2" onClick={props.logout}>Logout</button>
                    )}
                    </div>
                    
                </header>
            </div>
        </>
    )
}

// CustomItem component: a custom item for the navigation bar that highlights the active link
function CustomItem({ to, children }) {
    const { pathname } = useLocation();
    const isActive = pathname === to;
    return (
        <li>
            <Link to={to} className={isActive ? "nav-link px-2 link-secondary" : "nav-link px-2"}>
                {children}
            </Link>
        </li>
    )
  }

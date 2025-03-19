import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'

import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { useState } from 'react';

import Header from './components/header/Header'
import Home from './components/home/Home'
import Login from './components/login/Login';
import Ticketing from './components/ticketing/Ticketing';
import NotFound from './components/notFound/NotFound';
import SeatMap from './components/seatsMap/SeatMap';
import SeatView from './components/seatView/SeatView';
import Reservations from './components/reservations/Reservations';

import API from './utils/API';
import AuthChecker from './utils/AuthChecker';

export default function App() {

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
  * This function handles the login process.
  * It requires a username and a password inside a "credentials" object.
  */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setIsAuthenticated(!!user);
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err.message;
    }
  };

  /**
   * This function handles the logout process.
   */
  const handleLogout = async () => {
    await API.logOut();
    setIsAuthenticated(false);
    setUser(null);
    // clean up everything
  };

  return (
    <>
      <BrowserRouter>
        {/* AuthChecker is a component that checks if the user is logged in on every location pathname change */}
        <AuthChecker setUser={setUser} setIsAuthenticated={setIsAuthenticated} />
        <Header isAuthenticated={isAuthenticated} logout={handleLogout} />
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<Login login={handleLogin} />} path="/login" />
          <Route element={<SeatView />} path="/seatview" />
          <Route element={isAuthenticated ? <Outlet /> : <Navigate to="/" />}>
            <Route element={<Ticketing user={user} />} path="/ticketing" />
            <Route element={<SeatMap user={user} />} path="/seatmap/:concertID" />
            <Route element={<Reservations user={user} />} path="/reservations" />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}
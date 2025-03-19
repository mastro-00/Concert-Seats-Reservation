import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import "./login.css";

const Login = (props) => {
    const [username, setUsername] = useState('u1@polito.it');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const credentials = { username, password };
        if (!username) {
            setErrorMessage('Username cannot be empty');
        } else if (!password) {
            setErrorMessage('Password cannot be empty');
        } else {
            props.login(credentials)
                .then(() => navigate("/"))
                .catch((err) => {
                    setErrorMessage(err?.error || 'An unexpected error occurred. Maybe the server is down?');
                });
        }
    };

    return (
        <main className="form-signin w-100 m-auto mt-4">
            {errorMessage? <Alert dismissible onClose={() => setErrorMessage('')} variant="danger">{errorMessage}</Alert> : null}
            <form onSubmit={handleSubmit}>
                <h1 className="h3 mb-3 fw-normal">Login</h1>

                <div className="form-floating">
                    <input type="email" className="form-control"
                        id="email" value={username} onChange={(ev) => setUsername(ev.target.value)}
                        placeholder="name@example.com" />
                    <label htmlFor="floatingInput">Email address</label>
                </div>
                <div className="form-floating my-3">
                    <input type="password" className="form-control" 
                        id="password" value={password} onChange={(ev) => setPassword(ev.target.value)}
                        placeholder="Password" />
                    <label htmlFor="floatingPassword">Password</label>
                </div>

                <button className="btn btn-primary w-100 py-2" type="submit">Sign in</button>
            </form>
        </main>
    );
};

export default Login;


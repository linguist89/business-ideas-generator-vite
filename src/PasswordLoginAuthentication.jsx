// PasswordLoginAuthentication.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./Firebase.jsx";
import './PasswordLoginAuthentication.css';
import './Buttons.css';

function PasswordLoginAuthentication() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (event, setter) => {
    setter(event.target.value);
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <form className="authentication-form" onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(event) => handleInputChange(event, setEmail)}
        placeholder="Email"
        autoComplete="username"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => handleInputChange(event, setPassword)}
        placeholder="Password"
        autoComplete="current-password"
      />
      <button type="submit" className="solid-card-button">Login</button>
      {error && <p>{error}</p>}
    </form>
  )
}

export default PasswordLoginAuthentication;

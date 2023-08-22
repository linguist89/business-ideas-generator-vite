// PasswordSignupAuthentication.jsx
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "./Firebase.jsx";
import "./PasswordSignupAuthentication.css";
import "./Buttons.css";

function PasswordSignupAuthentication() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (event, setter) => {
    setter(event.target.value);
  };

  const handleSignup = async () => {
    try {
      console.log("Signing up.");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // After sign up, send an email verification link
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }
      //await auth.signOut();
    } catch (error) {
      setError("Error signing up. Please check your email and password.");
    }
  };

  return (
    <div className="authentication-form">
      <input
        type="email"
        value={email}
        onChange={(event) => handleInputChange(event, setEmail)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => handleInputChange(event, setPassword)}
        placeholder="Password"
      />
      <button className="solid-card-button" onClick={handleSignup}>
        Sign up
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}

export default PasswordSignupAuthentication;

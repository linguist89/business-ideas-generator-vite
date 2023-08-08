import React, { useState } from "react";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
import "./Buttons.css";
import EmailIcon from "./assets/images/EmailIcon.svg?component";
import "./PasswordlessLogin.css";

const actionCodeSettings = {
  url: "http://localhost:5173",
  handleCodeInApp: true,
};

function LoginWithEmailLink() {
  const [showInput, setShowInput] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const auth = getAuth();

  const sendLink = () => {
    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem("emailForSignIn", email);
        setShowInput(false);
        setEmail("");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        setErrorMessage(
          `Error code: ${errorCode}, Error message: ${errorMessage}`
        );
      });
  };

  const handleClick = () => {
    if (!showInput) {
      setShowInput(true);
    } else {
      sendLink();
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  return (
    <div className="PasswordlessWrapper">
      {!showInput && (
        <button
          className="transparent-black-button google-button"
          onClick={handleClick}
        >
          <img src={EmailIcon} alt="Email Icon" className="google-logo" />
          Login with email link
        </button>
      )}
      {showInput && (
        <div>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Email Address"
          />
          <button
            className="solid-card-button google-button button-top-padding"
            onClick={handleClick}
          >
            Send link
          </button>
        </div>
      )}
      {errorMessage && <div>There has been an error. Check your email.</div>}
    </div>
  );
}

export default LoginWithEmailLink;

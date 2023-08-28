import React, { useState } from "react";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
import "./Buttons.css";
import EmailIcon from "./assets/images/EmailIcon.svg?component";
import "./PasswordlessLogin.css";

const actionCodeSettings = {
  url: "https://business-ideas.spsdigitaltech.com/",
  //url: "http://localhost:5173/",
  handleCodeInApp: true,
};

function LoginWithEmailLink() {
  const [showInput, setShowInput] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const auth = getAuth();

  const sendLink = () => {
    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem("emailForSignIn", email);
        console.log(email);
        setShowInput(false);
        setEmail("");
        setLinkSent(true);
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
    <div>
      {!showInput && !linkSent && (
        <button
          className="transparent-black-button google-button"
          onClick={handleClick}
        >
          <img src={EmailIcon} alt="Email Icon" className="google-logo" />
          Login with email link
        </button>
      )}
      {showInput && (
        <div className="PasswordlessWrapper">
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Email Address"
          />
          <button
            className="solid-card-button button-top-padding"
            onClick={handleClick}
          >
            Send link
          </button>
        </div>
      )}
      {linkSent && <div>Check your email for login link.</div>}{" "}
      {errorMessage && (
        <div>
          There has been an error. Contact{" "}
          <a href="contact@spsdigitaltech.com">contact@spsdigitaltech.com</a> or
          try again.
        </div>
      )}
    </div>
  );
}

export default LoginWithEmailLink;

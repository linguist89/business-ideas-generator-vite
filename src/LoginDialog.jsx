import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./LoginDialog.css";
import "./Buttons.css";
import GoogleAuthentication from "./GoogleAuthentication";
import LoginWithEmailLink from "./PasswordlessLogin";
import PasswordSignupAuthentication from "./PasswordSignupAuthentication";
import PasswordLoginAuthentication from "./PasswordLoginAuthentication";
import OrLine from "./OrLine";
import { UserContext } from "./App";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./Firebase";

export const SelectedIdeaContext = React.createContext();

function LoginDialog({ open, onClose }) {
  const { user } = React.useContext(UserContext);
  const [showSignup, setShowSignup] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [isResetEmailSent, setIsResetEmailSent] = React.useState(false);

  const handleForgotPassword = () => {
    if (resetEmail) {
      sendPasswordResetEmail(auth, resetEmail)
        .then(() => {
          setIsResetEmailSent(true);
          // sleep for 10 seconds and then close the dialog
          setTimeout(() => {
            onClose(false);
            setIsResetEmailSent(false);
            setShowForgotPassword(false);
          }, 10000);
        })
        .catch((error) => {
          alert("Error sending password reset email: " + error.message);
        });
    }
  };

  React.useEffect(() => {
    if (user) {
      onClose(false);
    }
  }, [user, onClose]);

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="LoginDialogOverlay" />
        <Dialog.Content className="LoginDialogContent">
          {showForgotPassword ? (
            <>
              <h1 className="login-heading">Reset your password</h1>
              <div className="forgot-password-modal">
                {isResetEmailSent ? (
                  <div>Password reset email has been sent!</div> // This is the message after email has been sent.
                ) : (
                  <>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email address"
                    />
                    <div className="ResetButtons">
                      <button
                        className="solid-card-button"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="solid-card-button"
                        onClick={handleForgotPassword}
                      >
                        Submit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {!showSignup && <h1 className="login-heading">Login</h1>}
              {showSignup && <h1 className="login-heading">Sign Up</h1>}
              <div className="social-logins">
                {!showSignup && (
                  <>
                    <PasswordLoginAuthentication />
                    <OrLine />
                    <GoogleAuthentication />
                    <LoginWithEmailLink />
                  </>
                )}
                {showSignup ? (
                  <PasswordSignupAuthentication />
                ) : (
                  <p>
                    Don't have an account?{" "}
                    <button
                      className="link-button"
                      onClick={() => setShowSignup(true)}
                    >
                      Sign up
                    </button>
                  </p>
                )}
                {showSignup && (
                  <p>
                    Already have an account?{" "}
                    <button
                      className="link-button"
                      onClick={() => setShowSignup(false)}
                    >
                      Login instead
                    </button>
                  </p>
                )}
                <p>
                  Have an account, but{" "}
                  <button
                    className="link-button"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    forgot password?
                  </button>
                </p>
              </div>
            </>
          )}
          <Dialog.Close asChild>
            <button className="IconButton" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default LoginDialog;

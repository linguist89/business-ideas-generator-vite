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

export const SelectedIdeaContext = React.createContext();

function LoginDialog({ open, onClose }) {
  const { user } = React.useContext(UserContext);
  const [showSignup, setShowSignup] = React.useState(false);

  const handleForgotPassword = () => {
    // Firebase forgot password
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
                  Signup here
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
          </div>
          <p>
            {" "}
            Have an account, but{" "}
            <button className="link-button" onClick={handleForgotPassword}>
              forgot password?
            </button>
          </p>
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

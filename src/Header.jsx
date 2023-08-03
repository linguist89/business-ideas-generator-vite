import React, { useState } from "react";
import "./Header.css";
import { UserContext, CreditContext } from "./App";
import HeaderImage from "./assets/images/site_logo.png";
import LoginDialog from "./LoginDialog.jsx";
import PricingDialog from "./PricingDialog";
import ProfileDialog from "./ProfileDialog";
import useUserSubscription from "./useUserSubscription";
import { FiMenu } from "react-icons/fi"; // import the icon from react-icons

function Header() {
  const { user, setUser } = React.useContext(UserContext);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { credits, setCredits } = React.useContext(CreditContext);
  const { userPlan, userPlanActivity, renewalDate } = useUserSubscription(
    setUser,
    setCredits
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const Buttons = () => (
    <>
      <PricingDialog
        purchaseTypeFilter="recurring"
        title="Subscriptions"
      ></PricingDialog>
      <PricingDialog
        purchaseTypeFilter="one_time"
        title="Buy Credits"
      ></PricingDialog>
      <ProfileDialog></ProfileDialog>
    </>
  );

  return (
    <header className="header">
      <div className="header-wrapper">
        <div className="logo">
          <img src={HeaderImage} alt="Business Ideas logo" />
        </div>
        {user && (
          <div className="welcome-div">
            {
              <>
                <p>{`Welcome, ${
                  user.displayName ? user.displayName : user.email
                }`}</p>
                <p>{`You have ${credits} credits remaining`}</p>
              </>
            }
          </div>
        )}
        <div className="HeaderButtonsWrapper">
          {user ? (
            <div className="menu-desktop">
              <Buttons />
            </div>
          ) : (
            <button
              className="transparent-button"
              onClick={() => setShowLoginDialog(true)}
            >
              Login
            </button>
          )}
          <div className="menu-mobile">
            <FiMenu onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            {isMobileMenuOpen && <Buttons />}
          </div>
          <LoginDialog
            open={showLoginDialog}
            onClose={() => setShowLoginDialog(false)}
          />
        </div>
      </div>
    </header>
  );
}

export default Header;

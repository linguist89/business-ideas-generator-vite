import React, { useState } from "react";
import "./Header.css";
import { UserContext, CreditContext, PricingContext } from "./App";
import HeaderImage from "./assets/images/site_logo.png";
import LoginDialog from "./LoginDialog.jsx";
import PricingDialog from "./PricingDialog";
import ProfileDialog from "./ProfileDialog";
import useUserSubscription from "./useUserSubscription";
import "./MobileDialog.css";
import MobileDialog from "./MobileDialog";

function Header() {
  const { user, setUser } = React.useContext(UserContext);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { credits, setCredits } = React.useContext(CreditContext);
  const { showPricingDialog, setShowPricingDialog } =
    React.useContext(PricingContext);
  const { userPlan, userPlanActivity, renewalDate } = useUserSubscription(
    setUser,
    setCredits
  );

  const Buttons = () => (
    <>
      <PricingDialog
        open={showPricingDialog}
        onClose={() => setShowPricingDialog(false)}
        purchaseTypeFilter="recurring"
        title="Subscriptions"
        trigger={true}
      ></PricingDialog>
      <PricingDialog
        open={showPricingDialog}
        onClose={() => setShowPricingDialog(false)}
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
                <p className="HeaderText">{`Welcome, ${
                  user.displayName ? user.displayName : user.email
                }`}</p>
                <p className="HeaderText">{`You have ${credits} credits remaining`}</p>
              </>
            }
          </div>
        )}
        <div className="HeaderButtonsWrapper">
          {user ? (
            <div>
              <div className="menu-desktop">
                <Buttons />
              </div>
              <MobileDialog></MobileDialog>
            </div>
          ) : (
            <button
              className="transparent-button"
              onClick={() => setShowLoginDialog(true)}
            >
              Login
            </button>
          )}

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

import React, { useState } from "react";
import "./Header.css";
import { UserContext, CreditContext, PricingContext } from "./App";
import HeaderImage from "./assets/images/laptop_writing_vertical_125px_small_image_v2.png";
import LoginDialog from "./LoginDialog.jsx";
import PricingDialog from "./PricingDialog";
import ProfileDialog from "./ProfileDialog";
import useUserSubscription from "./useUserSubscription";
import "./MobileDialog.css";
import { FiMenu } from "react-icons/fi";
import { Cross2Icon } from "@radix-ui/react-icons";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerClass = `header-wrapper ${
    isMenuOpen ? "header-expanded-wrapper" : ""
  }`;
  const headerClassLoggedIn = `header-wrapper-logged-in ${
    isMenuOpen ? "header-expanded-wrapper" : ""
  }`;

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
    <header className={`header ${isMenuOpen ? "header-expanded" : ""}`}>
      <div className={user ? headerClassLoggedIn : headerClass}>
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
                {user.emailVerified ? (
                  <p className="HeaderText">{`You have ${credits} credits remaining`}</p>
                ) : (
                  <p className="HeaderText">Please verify your email</p>
                )}
              </>
            }
          </div>
        )}
        <div className={user ? "menu-mobile-logged-in" : "menu-mobile"}>
          {isMenuOpen ? (
            <Cross2Icon
              className="HamburgerIcon"
              onClick={() => {
                setIsMenuOpen(false);
                document.body.style.overflow = "";
              }}
            />
          ) : (
            <FiMenu
              className="HamburgerIcon mobile-trigger"
              onClick={() => {
                setIsMenuOpen(true);
                document.body.style.overflow = "hidden";
              }}
            />
          )}
        </div>
        <div className="HeaderButtonsWrapper">
          {user ? (
            <div className={isMenuOpen ? "mobile-menu" : "menu-desktop"}>
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

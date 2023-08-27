import React from "react";
import "./Footer.css";
import "./Buttons.css";
import InfoDialog from "./InfoDialog";
import termsAndConditions from "./TermsAndConditions.json";
import privacyPolicy from "./PrivacyPolicy.json";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-wrapper">
        <>
          <p className="FooterText">
            © {currentYear} SPS Digital Tech. All rights reserved. Contact:
            contact@spsdigitaltech.com
          </p>
          <p className="FooterText">Company CVR number: 42962554</p>
        </>
        <div className="FooterLinksWrapper">
          <InfoDialog
            title="Terms of Service"
            data={termsAndConditions}
            buttonType="button-link-footer"
          ></InfoDialog>
          <InfoDialog
            title="Privacy Policy"
            data={privacyPolicy}
            buttonType="button-link-footer"
          ></InfoDialog>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

import React from "react";
import "./Footer.css";
import "./Buttons.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  function getTermsOfService() {
    alert("TODO: Terms of Service");
  }

  function getPrivacyPolicy() {
    alert("TODO: Privacy Policy");
  }

  return (
    <footer className="footer">
      <div className="footer-wrapper">
        <p className="FooterText">
          © {currentYear} SPS Digital Tech. All rights reserved. Company CVR
          number: 42962554
        </p>
        <div className="FooterLinksWrapper">
          <button className="button-link-footer" onClick={getTermsOfService}>
            Terms of Service
          </button>
          <button className="button-link-footer" onClick={getPrivacyPolicy}>
            Privacy Policy
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

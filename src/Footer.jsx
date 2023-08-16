import React from "react";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-wrapper">
        <p className="FooterText">
          © {currentYear} SPS Digital Tech. All rights reserved.
        </p>
        <div className="FooterLinksWrapper">
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

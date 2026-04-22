import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Logo and App Name */}
        <div className="footer-logo">
          <img
            src="/logo2.png"
            alt="App Logo"
            className="logo"
            width={50}
          />
          <span className="app-name">Tradewaves</span>
        </div>

        {/* Buttons */}
        <div className="footer-buttons">
          <button className="btn about-btn">About Us</button>
          <button className="btn contact-btn">Contact Us</button>
        </div>

        {/* Copyright */}
        <p className="footer-text">© 2025 MyTradingApp. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

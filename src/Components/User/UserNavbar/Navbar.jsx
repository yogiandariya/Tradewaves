import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../Firebase";
import { doc, deleteDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
// import { Button, Space } from "antd";
import ProfileBtn from "./profilebtn";
// import React from "react";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, "activeUsers", user.uid)); // Remove from active users
        await signOut(auth);
        navigate("/login");
      }
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  };

  const handleSubmitQuery = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login to submit a query.");
      return;
    }
    const queryText = window.prompt("Enter your query for admin support:");
    if (!queryText || !queryText.trim()) return;
    try {
      await addDoc(collection(db, "queries"), {
        userId: user.uid,
        userEmail: user.email,
        message: queryText.trim(),
        status: "open",
        createdAt: serverTimestamp(),
        adminResponse: "",
        respondedAt: null,
      });
      alert("Your query has been submitted. We'll notify you when it's answered.");
    } catch (err) {
      alert("Failed to submit query: " + err.message);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img
          src="/logo2.png"
          alt="TradeWaves Logo"
          className="logo"
        />
        <span className="brand-name">TradeWaves</span>
      </div>
      
      <div className="nav-links">
        {[
          { label: "Dashboard", path: "/user-dashboard", icon: "fas fa-home" },
          { label: "Holdings", path: "/user-dashboard/holdings", icon: "fas fa-chart-line" },
          { label: "Order", path: "/user-dashboard/order", icon: "fas fa-shopping-cart" },
          { label: "Watchlist", path: "/user-dashboard/watchlist", icon: "fas fa-list" },
        ].map(({ label, path, icon }) => (
          <Link key={label} to={path} className="nav-item">
            <i className={icon}></i>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div className="navbar-right">
        <button
          className="nav-query-button"
          onClick={handleSubmitQuery}
          title="Submit a support query"
        >
          Query
        </button>
        <ProfileBtn onLogout={handleLogout} />
        <button
          className="logout-button"
          onClick={handleLogout}
          title="Logout"
        >
          {/* <img src="/logout.png" alt="Logout" className="logout-icon" /> */}
          Log Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

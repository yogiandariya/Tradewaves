import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGlobalUser } from "../../../hooks/useGlobalState";
import "./Profilebtn.css";

const ProfileBtn = ({ onLogout }) => {
  const [open, setOpen] = useState(false);
  const [globalUser] = useGlobalUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Fallback: use displayName or 'User' if name is not set
  const userName = globalUser.user?.name || globalUser.user?.displayName || "User";
  
  // Get user initials for profile photo
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = getInitials(userName);

  const handleProfileClick = () => {
    setOpen(!open);
  };

  const handleProfilePageClick = () => {
    setOpen(false);
    // Navigate to profile page
    navigate("/user-dashboard/profile");
  };

  const handleLogout = () => {
    setOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (e) => {
    if (!e.target.closest('.profile-container')) {
      setOpen(false);
    }
  };

  // Add click outside listener
  useEffect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="profile-container">
      <div 
        className="profile-photo" 
        onClick={handleProfileClick}
        title={`${userName}'s Profile`}
      >
        <div className="profile-initials">
          {userInitials}
        </div>
        <div className="profile-status"></div>
      </div>
      
      {open && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div className="profile-photo-small">
              <div className="profile-initials-small">
                {userInitials}
              </div>
            </div>
            <div className="profile-info">
              <h4>{userName}</h4>
              <p>{globalUser.user?.email}</p>
            </div>
          </div>
          
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-label">Total Funds</span>
              <span className="stat-value">₹{globalUser.funds.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Holdings</span>
              <span className="stat-value">{Object.keys(globalUser.holdings || {}).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Available Balance</span>
              <span className="stat-value">₹{(
                globalUser.funds - Object.values(globalUser.holdings || {}).reduce(
                  (total, holding) => total + holding.quantity * holding.avgPrice,
                  0
                )
              ).toFixed(2)}</span>
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              onClick={handleProfilePageClick} 
              className="profile-action-btn primary"
            >
              <i className="fas fa-user"></i>
              View Full Profile
            </button>
            <button 
              onClick={handleLogout} 
              className="profile-action-btn danger"
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileBtn;

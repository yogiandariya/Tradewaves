import React, { useEffect, useState } from "react";
import { useGlobalUser } from "../../../../hooks/useGlobalState";
import { db } from "../../../../Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import "./Profile.css";

const Profile = () => {
  const [globalUser] = useGlobalUser();
  const [userQueries, setUserQueries] = useState([]);
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [editing, setEditing] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: "",
    age: "",
    gender: "",
    email: "",
    address: "",
    mobile: ""
  });
  const [errors, setErrors] = useState({});
  const [tradeAllowed, setTradeAllowed] = useState(true);

  // Load user profile from Firestore
  useEffect(() => {
    if (!globalUser.user?.uid) return;

    const userDocRef = doc(db, "users", globalUser.user.uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserDetails({
          name: data.name || "",
          age: data.age || "",
          gender: data.gender || "",
          email: data.email || "",
          address: data.address || "",
          mobile: data.mobile || ""
        });
        if (data.age && data.age < 18) setTradeAllowed(false);
      } else {
        setUserDetails({
          name: "",
          age: "",
          gender: "",
          email: globalUser.user?.email || "",
          address: "",
          mobile: ""
        });
      }
    });
  }, [globalUser.user?.uid]);

  // Load user queries
  useEffect(() => {
    if (!globalUser.user?.uid) return;

    const q = query(
      collection(db, "queries"),
      where("userId", "==", globalUser.user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const queries = [];
      snapshot.forEach((doc) => {
        queries.push({ id: doc.id, ...doc.data() });
      });
      setUserQueries(queries);
      setLoadingQueries(false);
    });

    return () => unsubscribe();
  }, [globalUser.user?.uid]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return '';
    }
  };

  const getInitials = (name) => {
    if (!name) return "US";
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = userDetails.name || "User";
  const userInitials = getInitials(userName);

  // Portfolio statistics
  const totalFunds = globalUser.funds || 0;
  const holdings = globalUser.holdings || {};
  const totalHoldings = Object.keys(holdings).length;
  const investedAmount = Object.values(holdings).reduce(
    (total, holding) => total + holding.quantity * holding.avgPrice,
    0
  );
  const availableBalance = totalFunds - investedAmount;
  const totalValue = Object.values(holdings).reduce(
    (total, holding) => total + (holding.quantity * (holding.currentPrice || holding.avgPrice)),
    0
  );
  const totalPnL = totalValue - investedAmount;
  const totalPnLPercentage = investedAmount > 0 ? (totalPnL / investedAmount) * 100 : 0;

  // Validation
  const validate = () => {
    const errs = {};
    if (!userDetails.name) errs.name = "Name is required";
    if (!userDetails.age || userDetails.age < 0) errs.age = "Valid age is required";
    if (userDetails.age && userDetails.age < 18) setTradeAllowed(false);
    else setTradeAllowed(true);
    if (!userDetails.email) errs.email = "Email is required";
    if (!userDetails.mobile) errs.mobile = "Mobile number is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const userDocRef = doc(db, "users", globalUser.user.uid);
    await setDoc(userDocRef, userDetails, { merge: true });
    setEditing(false);
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header-section">
        <div className="profile-cover">
          <div className="profile-avatar-large">{userInitials}</div>
        </div>
        <div className="profile-info-section">
          <h1 className="profile-name">{userName}</h1>
          <p className="profile-email">{userDetails.email}</p>
          <div className="profile-status-badge">
            <span className="status-dot"></span>
            {tradeAllowed ? "Active Trader" : "Trading Not Allowed (Under 18)"}
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="profile-section user-details-section">
        <h2>User Information</h2>
        <div className="user-details-grid">
          {["name", "age", "gender", "email", "address", "mobile"].map((field) => (
            <div className="user-detail-item" key={field}>
              <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type={field === "age" ? "number" : "text"}
                value={userDetails[field]}
                onChange={(e) => setUserDetails({ ...userDetails, [field]: e.target.value })}
                disabled={!editing}
              />
              {errors[field] && <span className="error">{errors[field]}</span>}
            </div>
          ))}
        </div>
        <div className="user-details-actions">
          {editing ? (
            <>
              <button className="btn-save" onClick={handleSave}>Save</button>
              <button className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn-edit" onClick={() => setEditing(true)}>Edit</button>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-wallet"></i></div>
          <div className="stat-content">
            <h3>Total Funds</h3>
            <p className="stat-value">₹{totalFunds.toFixed(2)}</p>
            <span className="stat-label">Available for trading</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-chart-line"></i></div>
          <div className="stat-content">
            <h3>Portfolio Value</h3>
            <p className="stat-value">₹{totalValue.toFixed(2)}</p>
            <span className={`stat-label ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)} ({totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-coins"></i></div>
          <div className="stat-content">
            <h3>Total Holdings</h3>
            <p className="stat-value">{totalHoldings}</p>
            <span className="stat-label">Active positions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-piggy-bank"></i></div>
          <div className="stat-content">
            <h3>Available Balance</h3>
            <p className="stat-value">₹{availableBalance.toFixed(2)}</p>
            <span className="stat-label">Ready to invest</span>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="profile-section">
        <h2>Account Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Account ID</span>
            <span className="info-value">{globalUser.user?.uid || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Member Since</span>
            <span className="info-value">
              {globalUser.user?.metadata?.creationTime 
                ? new Date(globalUser.user.metadata.creationTime).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Account Type</span>
            <span className="info-value">Paper Trading</span>
          </div>
          <div className="info-item">
            <span className="info-label">Trading Status</span>
            <span className="info-value status-active">Active</span>
          </div>
        </div>
      </div>

      {/* User Queries */}
      <div className="profile-section">
        <h2>My Queries</h2>
        <div className="query-history">
          {loadingQueries ? (
            <div className="loading-queries">Loading your queries...</div>
          ) : userQueries.length > 0 ? (
            <div className="query-list">
              {userQueries.map((query) => (
                <div key={query.id} className="query-item">
                  <div className="query-header">
                    <span className="query-date">{formatDate(query.createdAt)}</span>
                    <span className={`query-status ${query.status || 'pending'}`}>
                      {query.status || 'Pending'}
                    </span>
                  </div>
                  <div className="query-message">
                    <strong>Your Query:</strong> {query.message}
                  </div>
                  {query.adminResponse && (
                    <div className="admin-responses">
                      <strong>Admin Response:</strong> {query.adminResponse}
                      {query.respondedAt && (
                        <span className="response-date">
                          Responded on: {formatDate(query.respondedAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-queries">You haven't submitted any queries yet.</div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="profile-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {totalHoldings > 0 ? (
            Object.entries(holdings).slice(0, 5).map(([symbol, holding]) => (
              <div key={symbol} className="activity-item">
                <div className="activity-icon"><i className="fas fa-chart-line"></i></div>
                <div className="activity-content">
                  <h4>{symbol}</h4>
                  <p>{holding.quantity} shares @ ₹{holding.avgPrice.toFixed(2)}</p>
                </div>
                <div className="activity-value">
                  <span className={`${holding.currentPrice > holding.avgPrice ? 'positive' : 'negative'}`}>
                    ₹{holding.currentPrice?.toFixed(2) || holding.avgPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <i className="fas fa-info-circle"></i>
              <p>No trading activity yet. Start your first trade!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

import { useEffect, useState } from "react";
import SearchStock from "../searchstock/StockSearch";
import { useGlobalUser } from "../../../../hooks/useGlobalState";
import axios from "axios";
import { UPSTOX_CONFIG } from "../../../../config/api";
import "./dashboard.css";

const UserDashboard = () => {
  const [globalUser] = useGlobalUser();
  const [summary, setSummary] = useState({
    totalBalance: 0,
    availableFunds: 0,
    holdingsValue: 0
  });

  useEffect(() => {
    const calculateSummary = async () => {
      if (!globalUser.isAuthenticated) return;

      try {
        let totalHoldingsValue = 0;
        const holdings = globalUser.holdings || {};

        // Calculate total holdings value
        for (const [instrumentKey, holding] of Object.entries(holdings)) {
          if (holding.quantity > 0) {
            try {
              const response = await axios.get(
                `https://api.upstox.com/v2/market-quote/ltp`,
                {
                  headers: {
                    Authorization: `Bearer ${UPSTOX_CONFIG.ACCESS_TOKEN}`,
                  },
                  params: {
                    instrument_key: instrumentKey
                  }
                }
              );
              const currentPrice = response.data?.data?.[`${holding.segment}:${holding.symbol}`]?.last_price || holding.avgPrice;
              totalHoldingsValue += currentPrice * holding.quantity;
            } catch (error) {
              console.error(`Error fetching price for ${holding.symbol}:`, error);
              totalHoldingsValue += holding.avgPrice * holding.quantity;
            }
          }
        }

        setSummary({
          totalBalance: globalUser.funds + totalHoldingsValue,
          availableFunds: globalUser.funds,
          holdingsValue: totalHoldingsValue
        });
      } catch (error) {
        console.error("Error calculating summary:", error);
      }
    };

    calculateSummary();
  }, [globalUser]);

  if (!globalUser.isAuthenticated) return <p>Loading user data...</p>;

  return (
    <div className="user-dashboard-container">
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Balance</h3>
          <p>₹{summary.totalBalance.toFixed(2)}</p>
          <small>Total of funds and holdings</small>
        </div>
        <div className="summary-card">
          <h3>Available Funds</h3>
          <p>₹{summary.availableFunds.toFixed(2)}</p>
          <small>Money available for trading</small>
        </div>
        <div className="summary-card">
          <h3>Holdings Value</h3>
          <p>₹{summary.holdingsValue.toFixed(2)}</p>
          <small>Current value of stocks</small>
        </div>
      </div>
      <div className="search-section">
        <h2>Search & Trade Stocks</h2>
        <SearchStock />
      </div>
    </div>
  );
};

export default UserDashboard;

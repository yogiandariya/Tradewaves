import { useState, useEffect } from "react";
import axios from "axios";
import { UPSTOX_CONFIG } from "../../../../config/api";
import { auth } from "../../../../Firebase";
import { useGlobalUser } from "../../../../hooks/useGlobalState";
import "./StockSearch.css";

const StockSearch = () => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [message, setMessage] = useState(null);
  const [completeData, setCompleteData] = useState([]);
  const [lastTradePrice, setLastTradePrice] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);
  const [globalUser, setGlobalUser] = useGlobalUser();
  const [availableBalance, setAvailableBalance] = useState(globalUser.funds);

  // Calculate available balance (funds - total holdings value)
  useEffect(() => {
    const calculateAvailableBalance = async () => {
      if (!globalUser.holdings) return;

      let totalHoldingsValue = 0;
      for (const holding of Object.values(globalUser.holdings)) {
        if (holding.quantity > 0) {
          try {
            const response = await axios.get(
              `https://api.upstox.com/v2/market-quote/ltp`,
              {
                headers: {
                  Authorization: `Bearer ${UPSTOX_CONFIG.ACCESS_TOKEN}`,
                },
                params: {
                  instrument_key: holding.instrumentKey
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
      setAvailableBalance(globalUser.funds - totalHoldingsValue);
    };

    calculateAvailableBalance();
  }, [globalUser.holdings, globalUser.funds]);

  console.log("Global User:", globalUser);

  useEffect(() => {
    const loadData = async () => {
      try {
        const module = await import('../../../../config/complete.json');
        const data = module.default;
        setCompleteData(data);
      } catch (error) {
        console.error('Error loading complete.json:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.trim() && completeData.length > 0) {
        const searchTerm = query.toUpperCase();
        const results = completeData.filter(item => item.instrument_type === 'EQ').filter(item =>
          item.trading_symbol?.toUpperCase().includes(searchTerm) ||
          item.name?.toUpperCase().includes(searchTerm)
        );
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [query, completeData]);

  const fetchLastTradePrice = async (stock) => {
    try {
      const response = await axios.get(
        // `https://api-sandbox.upstox.com/v2/market-quote/ltp`,
        `https://api.upstox.com/v2/market-quote/ltp`,
        {
          headers: {
            Authorization: `Bearer ${UPSTOX_CONFIG.ACCESS_TOKEN}`,
          },
          params: {
            instrument_key: stock.instrument_key
          }
        }
      );

      if (response.data && response.data.status === "success" && response.data.data) {
        const ltp = response.data?.data?.[`${stock.segment}:${stock.trading_symbol}`]?.last_price;
        setLastTradePrice(ltp);
        setMessage(`Selected ${stock.trading_symbol} - LTP: ₹${ltp}`);
      }
    } catch (error) {
      console.error('Error fetching LTP:', error);
      setMessage(`Selected ${stock.trading_symbol} - Could not fetch LTP`);
      setLastTradePrice(null);
    }
  };

  const handleBuy = async () => {
    if (!auth.currentUser) {
      setError("Please login to trade");
      return;
    }

    const totalCost = quantity * lastTradePrice;
    if (totalCost > globalUser.funds) {
      setError("Insufficient funds");
      return;
    }

    try {
      // Calculate new holdings
      const holdings = { ...globalUser.holdings };
      const existingHolding = holdings[selectedStock.instrument_key] || {
        quantity: 0,
        avgPrice: 0,
        totalInvestment: 0
      };

      const newQuantity = existingHolding.quantity + quantity;
      const newTotalInvestment = existingHolding.totalInvestment + totalCost;
      const newAvgPrice = newTotalInvestment / newQuantity;

      holdings[selectedStock.instrument_key] = {
        quantity: newQuantity,
        avgPrice: newAvgPrice,
        totalInvestment: newTotalInvestment,
        symbol: selectedStock.trading_symbol,
        instrumentKey: selectedStock.instrument_key,
        exchange: selectedStock.exchange,
        segment: selectedStock.segment,
        lastBuyPrice: lastTradePrice,
        lastBuyTime: new Date().getTime()
      };

      // Update global state with trade information
      await setGlobalUser({
        ...globalUser,
        funds: globalUser.funds - totalCost,
        holdings: holdings,
        lastTrade: {
          type: "BUY",
          symbol: selectedStock.trading_symbol,
          quantity: quantity,
          price: lastTradePrice,
          total: totalCost,
          instrumentKey: selectedStock.instrument_key,
          exchange: selectedStock.exchange,
          segment: selectedStock.segment,
          avgPrice: newAvgPrice,
          remainingQuantity: newQuantity
        }
      });
      setShowBuyModal(false);
      setMessage(`Successfully bought ${quantity} shares of ${selectedStock.trading_symbol}`);
    } catch (error) {
      console.error("Error buying stocks:", error);
      setError("Failed to process transaction");
    }
  };

  const selectStock = (stock) => {
    setSelectedStock(stock);
    setLastTradePrice(null);
    setError(null);
    fetchLastTradePrice(stock);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for stocks (e.g., EURINR)"
        className="search-input"
      />

      {message && <p className="success">{message}</p>}

      {searchResults.length > 0 && !selectedStock && (
        <div className="search-results">
          <h3>Search Results</h3>
          <ul className="stock-list">
            {searchResults.map((stock) => (
              <li
                key={stock.instrument_key}
                onClick={() => selectStock(stock)}
                className="stock-item"
              >
                {stock.asset_symbol} - {stock.trading_symbol} ({stock.exchange})
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {showBuyModal && selectedStock && lastTradePrice && (
        <div className="modal">
          <div className="modal-content">
            <h2>Buy {selectedStock.trading_symbol}</h2>
            <p>Current Price: ₹{lastTradePrice}</p>
            <p>Total Funds: ₹{globalUser.funds.toFixed(2)}</p>
            <p>Available Balance: ₹{availableBalance.toFixed(2)}</p>
            <div className="input-group">
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <p>Total Cost: ₹{(quantity * lastTradePrice).toFixed(2)}</p>
            <div className="modal-actions">
              <button onClick={handleBuy} className="buy-btn">Confirm Buy</button>
              <button onClick={() => setShowBuyModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

                {selectedStock && !showBuyModal && (
                    <>
                        <div className="button-group">
                            <button
                                className="back-button"
                                onClick={() => {
                                    setSelectedStock(null);
                                    setMessage(null);
                                }}
                            >
                                Back to Search
                            </button>
                            <button
                                className="watchlist-btn"
                                onClick={() => {
                                    const watchlist = { ...globalUser.watchlist };
                                    if (watchlist[selectedStock.instrument_key]) {
                                        delete watchlist[selectedStock.instrument_key];
                                        setMessage(`Removed ${selectedStock.trading_symbol} from watchlist`);
                                    } else {
                                        watchlist[selectedStock.instrument_key] = {
                                            symbol: selectedStock.trading_symbol,
                                            instrumentKey: selectedStock.instrument_key,
                                            exchange: selectedStock.exchange,
                                            segment: selectedStock.segment,
                                            addedAt: new Date().getTime()
                                        };
                                        setMessage(`Added ${selectedStock.trading_symbol} to watchlist`);
                                    }
                                    setGlobalUser({
                                        ...globalUser,
                                        watchlist
                                    });
                                }}
                            >
                                {globalUser.watchlist[selectedStock.instrument_key] ? 'Remove from Watchlist' : 'Add to Watchlist'}
                            </button>
                        </div>
          <div className="table-container">
            <h3>Stock Details</h3>
            <table className="stock-table">
              <tbody>
                <tr>
                  <th>Trading Symbol</th>
                  <td>{selectedStock.trading_symbol}</td>
                </tr>
                <tr>
                  <th>Asset Symbol</th>
                  <td>{selectedStock.asset_symbol}</td>
                </tr>
                <tr>
                  <th>Exchange</th>
                  <td>{selectedStock.exchange}</td>
                </tr>
                <tr>
                  <th>Instrument Type</th>
                  <td>{selectedStock.instrument_type}</td>
                </tr>
                <tr>
                  <th>Strike Price</th>
                  <td>₹{selectedStock.strike_price}</td>
                </tr>
                <tr>
                  <th>Lot Size</th>
                  <td>{selectedStock.lot_size}</td>
                </tr>
                <tr>
                  <th>Tick Size</th>
                  <td>{selectedStock.tick_size}</td>
                </tr>
                <tr>
                  <th>Asset Type</th>
                  <td>{selectedStock.asset_type}</td>
                </tr>
                <tr>
                  <th>Last Trade Price</th>
                  <td>{lastTradePrice ? `₹${lastTradePrice}` : 'Loading...'}</td>
                </tr>
                <tr>
                  <td colSpan="2" className="actions">
                    <button
                      onClick={() => setShowBuyModal(true)}
                      className="buy-btn"
                      disabled={!lastTradePrice}
                    >
                      Buy
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default StockSearch;

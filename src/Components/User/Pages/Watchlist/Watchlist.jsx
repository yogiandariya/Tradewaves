import "./Watchlist.css";
import { useState, useEffect } from "react";
import { useGlobalUser } from "../../../../hooks/useGlobalState";
import axios from "axios";
import { UPSTOX_CONFIG } from "../../../../config/api";
import { auth } from "../../../../Firebase";

function Watchlist() {
    const [globalUser, setGlobalUser] = useGlobalUser();
    const [watchlistData, setWatchlistData] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState(null);
    const [availableBalance, setAvailableBalance] = useState(globalUser.funds);

    useEffect(() => {
        const fetchPrices = async () => {
            if (!globalUser.watchlist || Object.keys(globalUser.watchlist).length === 0) {
                setWatchlistData([]);
                setLoading(false);
                return;
            }

            try {
                // Get all instrument keys as comma-separated string
                const instrumentKeys = Object.keys(globalUser.watchlist).join(',');

                const response = await axios.get(
                    `https://api.upstox.com/v2/market-quote/ltp`,
                    {
                        headers: {
                            Authorization: `Bearer ${UPSTOX_CONFIG.ACCESS_TOKEN}`,
                        },
                        params: {
                            instrument_key: instrumentKeys
                        }
                    }
                );

                const updatedData = Object.values(globalUser.watchlist).map(stock => {
                    const key = `${stock.segment}:${stock.symbol}`;
                    const price = response.data?.data?.[key]?.last_price;
                    return {
                        ...stock,
                        currentPrice: price || 0
                    };
                });

                setWatchlistData(updatedData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching prices:", error);
                setError("Failed to fetch prices");
                setLoading(false);
            }
        };

        fetchPrices();
        // Update prices every minute
        const interval = setInterval(fetchPrices, 60000);

        return () => clearInterval(interval);
    }, [globalUser.watchlist]);

    // Calculate available balance (funds - total holdings value)
    useEffect(() => {
        setAvailableBalance(globalUser.funds || 0);
    }, [globalUser.funds]);

    const openBuyModal = (stock) => {
        if (!auth.currentUser) {
            setError("Please login to trade");
            return;
        }
        setSelectedStock(stock);
        setQuantity(1);
        setShowBuyModal(true);
        setError(null);
    };

    const handleBuy = async () => {
        if (!auth.currentUser) {
            setError("Please login to trade");
            return;
        }

        const totalCost = quantity * selectedStock.currentPrice;
        if (totalCost > globalUser.funds) {
            setError("Insufficient funds");
            return;
        }

        try {
            // Calculate new holdings
            const holdings = { ...(globalUser.holdings || {}) };
            const existingHolding = holdings[selectedStock.instrumentKey] || {
                quantity: 0,
                avgPrice: 0,
                totalInvestment: 0
            };

            const newQuantity = existingHolding.quantity + quantity;
            const newTotalInvestment = existingHolding.totalInvestment + totalCost;
            const newAvgPrice = newTotalInvestment / newQuantity;

            holdings[selectedStock.instrumentKey] = {
                quantity: newQuantity,
                avgPrice: newAvgPrice,
                totalInvestment: newTotalInvestment,
                symbol: selectedStock.symbol,
                instrumentKey: selectedStock.instrumentKey,
                exchange: selectedStock.exchange,
                segment: selectedStock.segment,
                lastBuyPrice: selectedStock.currentPrice,
                lastBuyTime: new Date().getTime()
            };

            // Update global state with trade information
            await setGlobalUser({
                ...globalUser,
                funds: globalUser.funds - totalCost,
                holdings: holdings,
                lastTrade: {
                    type: "BUY",
                    symbol: selectedStock.symbol,
                    quantity: quantity,
                    price: selectedStock.currentPrice,
                    total: totalCost,
                    instrumentKey: selectedStock.instrumentKey,
                    exchange: selectedStock.exchange,
                    segment: selectedStock.segment,
                    avgPrice: newAvgPrice,
                    remainingQuantity: newQuantity
                }
            });
            setShowBuyModal(false);
            setMessage(`Successfully bought ${quantity} shares of ${selectedStock.symbol}`);
        } catch (error) {
            console.error("Error buying stocks:", error);
            setError("Failed to process transaction");
        }
    };

    const filteredData = watchlistData.filter((stock) =>
        stock.symbol.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div>Loading watchlist...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="container watchlist-container">
            {message && <p className="success">{message}</p>}
            <input
                type="text"
                placeholder="Search stocks"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input-1"
            />
            {watchlistData.length === 0 ? (
                <p>No stocks in watchlist. Add stocks from the search page.</p>
            ) : (
                <table className="watchlist-table">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Exchange</th>
                            <th>Market Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((stock) => (
                            <tr key={stock.instrumentKey}>
                                <td>{stock.symbol}</td>
                                <td>{stock.exchange}</td>
                                <td>₹{stock.currentPrice.toFixed(2)}</td>
                                <td>
                                    <button 
                                        className="buy-btn"
                                        onClick={() => openBuyModal(stock)}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        className="remove-btn"
                                        onClick={() => {
                                            const watchlist = { ...globalUser.watchlist };
                                            delete watchlist[stock.instrumentKey];
                                            setGlobalUser({
                                                ...globalUser,
                                                watchlist
                                            });
                                        }}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {showBuyModal && selectedStock && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Buy {selectedStock.symbol}</h2>
                        <p>Current Price: ₹{selectedStock.currentPrice.toFixed(2)}</p>
                        <p>Total Funds: ₹{globalUser.funds ? globalUser.funds.toFixed(2) : '0.00'}</p>
                        <p>Available Balance: ₹{availableBalance.toFixed(2)}</p>
                        <div className="input-group">
                            <label>Quantity:</label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                className="quantity-input"
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                        <p>Total Cost: ₹{(quantity * selectedStock.currentPrice).toFixed(2)}</p>
                        <div className="modal-actions">
                            <button onClick={handleBuy} className="buy-btn">Confirm Buy</button>
                            <button onClick={() => setShowBuyModal(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Watchlist;

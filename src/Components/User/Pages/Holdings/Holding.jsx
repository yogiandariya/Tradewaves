import "./Holding.css";
import { useState, useEffect } from "react";
import { auth } from "../../../../Firebase";
import axios from "axios";
import { UPSTOX_CONFIG } from "../../../../config/api";
import { useGlobalUser } from "../../../../hooks/useGlobalState";

const Holding = () => {
    const [holdings, setHoldings] = useState([]);
    const [showModal, setShowModal] = useState(null);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({
        currentValue: 0,
        investedValue: 0,
        totalReturns: 0,
        totalReturnsPercent: 0
    });
    const [globalUser, setGlobalUser] = useGlobalUser();

    useEffect(() => {
        if (globalUser.holdings) {
            loadHoldings();
            // Update prices every minute
            const interval = setInterval(loadHoldings, 60000);
            return () => clearInterval(interval);
        }
    }, [globalUser.holdings, globalUser.funds]);

    const loadHoldings = async () => {
        if (!auth.currentUser) return;

        try {
            const userHoldings = globalUser.holdings || {};
            const holdingsArray = [];
            let totalCurrentValue = 0;
            let totalInvestedValue = 0;

            // Get active holdings and fetch prices in batch
            const activeHoldings = Object.entries(userHoldings).filter(([, h]) => h.quantity > 0);
            if (activeHoldings.length === 0) {
                setHoldings([]);
                setSummary({
                    currentValue: 0,
                    investedValue: 0,
                    totalReturns: 0,
                    totalReturnsPercent: 0
                });
                setLoading(false);
                return;
            }

            // Fetch all prices in one request
            const instrumentKeys = activeHoldings.map(([key]) => key).join(',');
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

            // Process all holdings with fetched prices
            for (const [, holding] of activeHoldings) {
                const marketPrice = response.data?.data?.[`${holding.segment}:${holding.symbol}`]?.last_price || holding.avgPrice;
                const currentValue = marketPrice * holding.quantity;
                const returns = currentValue - holding.totalInvestment;
                const returnsPercent = (returns / holding.totalInvestment) * 100;

                totalCurrentValue += currentValue;
                totalInvestedValue += holding.totalInvestment;

                holdingsArray.push({
                    ...holding,
                    marketPrice,
                    returns,
                    returnsPercent
                });
            }

            setHoldings(holdingsArray);
            setSummary({
                currentValue: totalCurrentValue,
                investedValue: totalInvestedValue,
                totalReturns: totalCurrentValue - totalInvestedValue,
                totalReturnsPercent: ((totalCurrentValue - totalInvestedValue) / totalInvestedValue) * 100
            });
        } catch (error) {
            console.error("Error loading holdings:", error);
            setError("Failed to load holdings");
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async () => {
        if (!selectedStock || !quantity) {
            setError("Please enter a valid quantity");
            return;
        }

        if (quantity <= 0) {
            setError("Quantity must be greater than 0");
            return;
        }

        const totalCost = quantity * selectedStock.marketPrice;
        
        if (totalCost > globalUser.funds) {
            setError("Insufficient funds");
            return;
        }

        try {
            const holdings = { ...globalUser.holdings };
            const holding = holdings[selectedStock.instrumentKey];

            if (!holding) {
                setError("Stock not found in holdings");
                return;
            }

            const newQuantity = holding.quantity + quantity;
            const newTotalInvestment = holding.totalInvestment + totalCost;
            const newAvgPrice = newTotalInvestment / newQuantity;

            holdings[selectedStock.instrumentKey] = {
                ...holding,
                quantity: newQuantity,
                totalInvestment: newTotalInvestment,
                avgPrice: newAvgPrice
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
                    price: selectedStock.marketPrice,
                    total: totalCost,
                    instrumentKey: selectedStock.instrumentKey,
                    exchange: selectedStock.exchange,
                    segment: selectedStock.segment,
                    avgPrice: newAvgPrice,
                    remainingQuantity: newQuantity
                }
            });

            setShowModal(null);
        } catch (error) {
            console.error("Error buying stocks:", error);
            setError("Failed to process purchase");
        }
    };

    const handleSell = async () => {
        if (!selectedStock || !quantity) {
            setError("Please enter a valid quantity");
            return;
        }

        if (quantity <= 0) {
            setError("Quantity must be greater than 0");
            return;
        }

        try {
            const holdings = { ...globalUser.holdings };
            const holding = holdings[selectedStock.instrumentKey];

            if (!holding) {
                setError("Stock not found in holdings");
                return;
            }

            if (holding.quantity < quantity) {
                setError(`Cannot sell more than ${holding.quantity} shares`);
                return;
            }

            const totalValue = quantity * selectedStock.marketPrice;
            const newQuantity = holding.quantity - quantity;
            const newTotalInvestment = (holding.totalInvestment * newQuantity) / holding.quantity;

            if (newQuantity === 0) {
                delete holdings[selectedStock.instrumentKey];
            } else {
                holdings[selectedStock.instrumentKey] = {
                    ...holding,
                    quantity: newQuantity,
                    totalInvestment: newTotalInvestment
                };
            }

            // Update global state with trade information
            await setGlobalUser({
                ...globalUser,
                funds: globalUser.funds + totalValue,
                holdings: holdings,
                lastTrade: {
                    type: "SELL",
                    symbol: selectedStock.symbol,
                    quantity: quantity,
                    price: selectedStock.marketPrice,
                    total: totalValue,
                    instrumentKey: selectedStock.instrumentKey,
                    exchange: selectedStock.exchange,
                    segment: selectedStock.segment,
                    avgPrice: newTotalInvestment / newQuantity,
                    remainingQuantity: newQuantity
                }
            });

            setShowModal(null);
        } catch (error) {
            console.error("Error selling stocks:", error);
            setError("Failed to process sale");
        }
    };

    const handleModal = (type, stock) => {
        if (type === null) {
            setError(null);
        }
        setSelectedStock(stock);
        setQuantity(1);
        setShowModal(type);
    };

    if (loading) return <div>Loading holdings...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="holdings-container">
            <h1>Holdings ({holdings.length})</h1>
            <div className="holdings-summary">
                <p>₹{summary.currentValue.toFixed(2)} <span>Current Value</span></p>
                <p>₹{summary.investedValue.toFixed(2)} <span>Invested Value</span></p>
                <p className={summary.totalReturns >= 0 ? "positive" : "negative"}>
                    {summary.totalReturns >= 0 ? "+" : "-"}₹{Math.abs(summary.totalReturns).toFixed(2)} ({Math.abs(summary.totalReturnsPercent).toFixed(2)}%)
                    <span>Total Returns</span>
                </p>
            </div>
            <table className="holdings-table">
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>Market Price (1D%)</th>
                        <th>Returns (%)</th>
                        <th>Current (Invested)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {holdings.map((stock, index) => (
                        <tr key={index}>
                            <td>
                                <div className="stock-info">
                                    <strong>{stock.symbol}</strong>
                                    <small>{stock.quantity} shares • Avg. ₹{stock.avgPrice.toFixed(2)}</small>
                                </div>
                            </td>
                            <td>
                                <div className="price-info">
                                    <div>₹{stock.marketPrice.toFixed(2)}</div>
                                    <span className={stock.returns >= 0 ? "positive" : "negative"}>
                                        {stock.returns >= 0 ? "+" : "-"}₹{Math.abs(stock.returns).toFixed(2)}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div className={`returns-info ${stock.returnsPercent >= 0 ? "positive" : "negative"}`}>
                                    <div>{stock.returnsPercent >= 0 ? "+" : "-"}₹{Math.abs(stock.returns).toFixed(2)}</div>
                                    <div>{Math.abs(stock.returnsPercent).toFixed(2)}%</div>
                                </div>
                            </td>
                            <td>
                                <div className="value-info">
                                    <div>₹{(stock.quantity * stock.marketPrice).toFixed(2)}</div>
                                    <small>₹{stock.totalInvestment.toFixed(2)}</small>
                                </div>
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button
                                        onClick={() => handleModal('buy', stock)}
                                        className="buy-btn"
                                    >
                                        Buy
                                    </button>
                                    <button
                                        onClick={() => handleModal('sell', stock)}
                                        className="sell-btn"
                                        disabled={stock.quantity <= 0}
                                    >
                                        Sell
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal === 'buy' && selectedStock && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Buy {selectedStock.symbol}</h2>
                        <p>Current Price: ₹{selectedStock.marketPrice}</p>
                        <p>Available Funds: ₹{globalUser.funds.toFixed(2)}</p>
                        <p>Current Holdings: {selectedStock.quantity} shares</p>
                        <div className="input-group">
                            <label>Quantity to Buy:</label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 0;
                                    if (newQuantity < 1) {
                                        setError("Quantity must be at least 1");
                                        setQuantity(1);
                                    } else if (newQuantity * selectedStock.marketPrice > globalUser.funds) {
                                        setError("Insufficient funds for this quantity");
                                    } else {
                                        setError(null);
                                        setQuantity(newQuantity);
                                    }
                                }}
                            />
                        </div>
                        <p>Total Cost: ₹{(quantity * selectedStock.marketPrice).toFixed(2)}</p>
                        <div className="modal-actions">
                            <button onClick={handleBuy} className="buy-btn">Confirm Buy</button>
                            <button onClick={() => setShowModal(null)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal === 'sell' && selectedStock && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Sell {selectedStock.symbol}</h2>
                        <p>Current Price: ₹{selectedStock.marketPrice}</p>
                        <p>Available Quantity: {selectedStock.quantity}</p>
                        <div className="input-group">
                            <label>Quantity to Sell:</label>
                            <input
                                type="number"
                                min="1"
                                max={selectedStock.quantity}
                                value={quantity}
                                onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 0;
                                    if (newQuantity > selectedStock.quantity) {
                                        setError(`Cannot sell more than ${selectedStock.quantity} shares`);
                                        setQuantity(selectedStock.quantity);
                                    } else if (newQuantity < 1) {
                                        setError("Quantity must be at least 1");
                                        setQuantity(1);
                                    } else {
                                        setError(null);
                                        setQuantity(newQuantity);
                                    }
                                }}
                            />
                        </div>
                        <p>Total Value: ₹{(quantity * selectedStock.marketPrice).toFixed(2)}</p>
                        <div className="modal-actions">
                            <button onClick={handleSell} className="sell-btn">Confirm Sell</button>
                            <button onClick={() => setShowModal(null)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Holding;

import { useState, useEffect } from "react";
import { auth, db } from "../../../../Firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import "./Order.css";

const Order = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!auth.currentUser) return;

            try {
                const transactionsRef = collection(db, "users", auth.currentUser.uid, "transactions");
                const q = query(transactionsRef, orderBy("timestamp", "desc"));
                const querySnapshot = await getDocs(q);

                const ordersData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const date = new Date(data.timestamp);
                    return {
                        id: doc.id,
                        date: date.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        }),
                        time: date.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }),
                        symbol: data.symbol,
                        type: data.type,
                        quantity: data.quantity,
                        price: data.price,
                        total: data.total,
                        remainingQuantity: data.remainingQuantity
                    };
                });

                setOrders(ordersData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching orders:", error);
                setError("Failed to load orders");
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) return <div>Loading orders...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="all-orders-container">
            <h1>All Orders</h1>
            <table className="order-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th>Remaining</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td>{order.date}</td>
                            <td>{order.time}</td>
                            <td>{order.symbol}</td>
                            <td className={order.type.toLowerCase()}>{order.type}</td>
                            <td>{order.quantity}</td>
                            <td>₹{order.price.toFixed(2)}</td>
                            <td>₹{order.total.toFixed(2)}</td>
                            <td>{order.remainingQuantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Order;

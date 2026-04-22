import { useState, useEffect } from "react";
import { db } from "../../../../../Firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allOrders = [];

        // For each user, get their transactions
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const userName = userData.name || userData.email;
          
          // Get transactions for this user
          const transactionsRef = collection(db, "users", userDoc.id, "transactions");
          const q = query(transactionsRef, orderBy("timestamp", "desc"));
          const transactionsSnapshot = await getDocs(q);
          
          // Add each transaction to the allOrders array with user information
          transactionsSnapshot.docs.forEach(transactionDoc => {
            const transactionData = transactionDoc.data();
            const date = new Date(transactionData.timestamp);
            
            allOrders.push({
              id: transactionDoc.id,
              userId: userDoc.id,
              userName: userName,
              shareName: transactionData.symbol,
              currentPrice: transactionData.currentPrice || transactionData.price,
              orderPrice: transactionData.price,
              orderType: transactionData.type,
              quantity: transactionData.quantity,
              total: transactionData.total,
              status: transactionData.status || "Completed",
              date: date.toISOString().split('T')[0],
              formattedDate: date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              }),
              formattedTime: date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            });
          });
        }
        
        // Sort all orders by timestamp (newest first)
        allOrders.sort((a, b) => {
          // First try to sort by the timestamp if available
          if (a.timestamp && b.timestamp) {
            return b.timestamp - a.timestamp;
          }
          // Fall back to date sorting if timestamp is not directly available
          return new Date(b.date) - new Date(a.date);
        });
        setOrders(allOrders);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders. Please try again later.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filterOrders = () => {
    return orders.filter((order) => {
      const matchesName = !searchName || order.userName.toLowerCase().includes(searchName.toLowerCase());
      const matchesDate =
        (!startDate || order.date >= startDate) &&
        (!endDate || order.date <= endDate);
      return matchesName && matchesDate;
    });
  };

  const generatePDF = () => {
    const filteredOrders = filterOrders();

    if (filteredOrders.length === 0) {
      alert("No orders found for the selected filters.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Order Report", 14, 15);

      const tableColumn = ["Share ID", "User Name", "Share Name", "Quantity", "Price", "Total", "Order Type", "Order Status", "Date", "Time"];
    const tableRows = [];

    filteredOrders.forEach((order) => {
      tableRows.push([
        order.id,
        order.userName,
        order.shareName,
        order.quantity,
        `₹${order.orderPrice.toFixed(2)}`,
        `₹${order.total.toFixed(2)}`,
        order.orderType,
        order.status,
        order.formattedDate,
        order.formattedTime,
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20
    });

    doc.save("filtered_orders_report.pdf");
  };

  if (loading) return <div className="orders-container"><h2>Loading orders...</h2></div>;
  if (error) return <div className="orders-container"><h2>Error: {error}</h2></div>;

  return (
    <div className="orders-container">
      <h2>All User Transactions</h2>
      <div className="filters">
        <label>
          Search by User Name: 
          <input type="text" value={searchName} placeholder="Enter name..." onChange={(e) => setSearchName(e.target.value)} />
        </label>
        <label>
          Start Date: 
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date: 
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button onClick={generatePDF} className="download-btn">Download Pdf</button>
      </div>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Share ID</th>
            <th>User Name</th>
            <th>Share Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
            <th>Order Type</th>
            <th>Order Status</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {filterOrders().map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.userName}</td>
              <td>{order.shareName}</td>
              <td>{order.quantity}</td>
              <td>₹{order.orderPrice.toFixed(2)}</td>
              <td>₹{order.total.toFixed(2)}</td>
              <td className={order.orderType.toLowerCase()}>{order.orderType}</td>
              <td className={`status ${order.status.toLowerCase()}`}>{order.status}</td>
              <td>{order.formattedDate}</td>
              <td>{order.formattedTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Orders;

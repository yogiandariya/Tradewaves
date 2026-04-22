import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../../../Firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./customer.css";

function Customers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching users from Firestore...");
        
        // Check if db is properly initialized
        if (!db) {
          console.error("Firestore db is not initialized");
          setError("Database connection error. Please check your Firebase configuration.");
          setLoading(false);
          return;
        }
        
        // Try to fetch users from the "users" collection
        const usersCollection = collection(db, "users");
        const querySnapshot = await getDocs(usersCollection);
        
        console.log(`Found ${querySnapshot.docs.length} users`);
        
        if (querySnapshot.empty) {
          console.log("No users found in the collection");
          setUsers([]);
          setLoading(false);
          return;
        }
        
        const usersList = [];
        
        // Process each document
        querySnapshot.forEach((doc) => {
          try {
            const userData = doc.data();
            console.log(`Processing user: ${doc.id}`, userData);
            
            // Create user object with fallback values for all properties
            const user = {
              id: doc.id,
              name: userData.name || "Unknown",
              email: userData.email || "No email",
              funds: typeof userData.funds === 'number' ? userData.funds : 0,
              holdings: userData.holdings || {},
              createdAt: "N/A"
            };
            
            // Handle the createdAt timestamp if it exists
            if (userData.createdAt) {
              try {
                user.createdAt = new Date(userData.createdAt.seconds * 1000).toISOString().split("T")[0];
              } catch (dateError) {
                console.error("Error formatting date:", dateError);
              }
            }
            
            usersList.push(user);
          } catch (docError) {
            console.error(`Error processing document ${doc.id}:`, docError);
            // Continue processing other documents even if one fails
          }
        });
        
        console.log("Processed users:", usersList);
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
        // More specific error message
        if (error.code === 'permission-denied') {
          setError("Permission denied. You don't have access to view users.");
        } else if (error.code === 'unavailable') {
          setError("Database is currently unavailable. Please try again later.");
        } else {
          setError(`Error: ${error.message || "Unknown error occurred"}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const filterUsers = () => {
    return users.filter(user => {
      const matchesName = !searchName || user.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesDate = (!startDate || !endDate) || (user.createdAt >= startDate && user.createdAt <= endDate);
      return matchesName && matchesDate;
    });
  };

  const generatePDF = () => {
    const filteredUsers = filterUsers();

    if (filteredUsers.length === 0) {
      alert("No users found for the selected filters.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Users Report", 14, 15);

    const tableColumn = ["ID", "Name", "Email", "Funds", "Has Holdings", "Registered Date"];
    const tableRows = [];

    filteredUsers.forEach((user) => {
      tableRows.push([
        user.id, 
        user.name, 
        user.email, 
        user.funds ? `₹${user.funds.toLocaleString()}` : 'N/A',
        user.holdings && Object.keys(user.holdings).length > 0 ? 'Yes' : 'No',
        user.createdAt
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20
    });

    doc.save("users_report.pdf");
  };

  return (
    <div className="customers-container">
      <h2>Users List</h2>
      <div className="filters">
        <label>Search Name: <input type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} /></label>
        <label>Start Date: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
        <label>End Date: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
        <button onClick={generatePDF} className="download-btn">Download PDF</button>
      </div>
      
      {loading && <p>Loading users...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && users.length === 0 && (
        <p>No users found. Please check your database connection.</p>
      )}
      
      {!loading && !error && users.length > 0 && (
        <table className="customers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Funds</th>
              <th>Has Holdings</th>
              <th>Registered Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filterUsers().map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.funds ? `₹${user.funds.toLocaleString()}` : 'N/A'}</td>
                <td>{user.holdings && Object.keys(user.holdings).length > 0 ? 'Yes' : 'No'}</td>
                <td>{user.createdAt}</td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Customers;

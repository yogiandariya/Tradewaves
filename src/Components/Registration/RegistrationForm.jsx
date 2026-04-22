import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../Firebase";
import { setDoc, doc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { useGlobalUser } from "../../hooks/useGlobalState";
import "./Register.css";

const RegistrationForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [, setGlobalUser] = useGlobalUser();

  const handleRegister = async () => {
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const initialData = {
        name,
        email,
        funds: 100000,
        holdings: {},
        createdAt: serverTimestamp()
      };

      // Save user data to Firestore with registration timestamp
      await setDoc(doc(db, "users", user.uid), initialData);

      // Update global state
      setGlobalUser({
        user: {
          uid: user.uid,
          email: user.email,
          ...initialData
        },
        isAdmin: false,
        funds: initialData.funds,
        holdings: initialData.holdings,
        isAuthenticated: true
      });

      // Count total users and update in Firestore
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const totalUsers = usersSnapshot.size;

      await setDoc(doc(db, "stats", "userCount"), { totalUsers });

      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("Email already used. Please enter another ID.");
      } else {
        setError("Registration failed: " + error.message);
      }
    }
  };

  return (
    <div className="reg">
      <table className="Regi-container">
        <tr>
          <td className="logo2">
            <img src="logo2.png" alt="Logo" />
          </td>
        </tr>
        <tr>
          <td>
            <h1>Register</h1>
          </td>
        </tr>
        {error && (
          <tr>
            <td>
              <p className="error-message">{error}</p>
            </td>
          </tr>
        )}
        <tr>
          <td >
            <input
              className="input-name"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </td>
        </tr>
        <tr>
          <td >
            <input
              type="email"
              className="input-email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </td>
        </tr>
        <tr>
          <td >
            <input
              type="password"
              className="input-pswd"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </td>
        </tr>
        <tr>
          <td>
            <button onClick={handleRegister} className="registerbtn">Register</button>
          </td>
        </tr>
      </table>
    </div>
  );
};

export default RegistrationForm;

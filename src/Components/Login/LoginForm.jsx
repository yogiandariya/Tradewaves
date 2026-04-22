import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useGlobalUser } from "../../hooks/useGlobalState";
import "./LoginForm.css";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [, setGlobalUser] = useGlobalUser();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mark user as active in Firestore
      await setDoc(doc(db, "activeUsers", user.uid), {
        email: user.email,
        lastActive: new Date().toISOString(),
      });

      // Check and initialize user data if needed
      const userRef = doc(db, "users", user.uid);
      const userData = await getDoc(userRef);

      const userDataDoc = userData.exists() ? userData.data() : {};
      if (!userDataDoc.funds) {
        // Initialize user with 100000 balance if not exists
        const initialData = {
          email: user.email,
          name: user.displayName || email.split('@')[0],
          funds: 100000,
          holdings: {},
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, initialData, { merge: true });
        userDataDoc.funds = 100000;
        userDataDoc.holdings = {};
      }

      // Update global state with flattened structure
      setGlobalUser({
        uid: user.uid,
        email: user.email,
        name: userDataDoc.name || email.split('@')[0],
        funds: userDataDoc.funds,
        holdings: userDataDoc.holdings || {},
        isAdmin: false,
        isAuthenticated: true
      });

      // Check if admin
      const adminDoc = await getDoc(doc(db, "admin", user.uid));
      if (adminDoc.exists()) {
        navigate("/admin-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="body">
      <table className="login-container">
        <tr>
          <td className="logo">
            <img src="logo2.png" alt="Logo"/>
          </td>
        </tr>
        <tr>
          <td>
            <h1>Login</h1>
          </td>
        </tr>
        <tr>
          <td className="input-group-email">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </td>
        </tr>
        <tr>
          <td className="input-group-pswd">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </td>
        </tr>
        <tr>
          <td>
            <button onClick={handleLogin} className="login-button">Login</button>
          </td>
        </tr>
        <tr>
          <td>
            <p>Not registered? <a href="/register">Register here</a></p>
          </td>
        </tr>
      </table>
    </div>
  );
};

export default LoginForm;

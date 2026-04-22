import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import LoginForm from "./Components/login/LoginForm";
import RegistrationForm from "./Components/Registration/RegistrationForm";
import AdminDashboard from "./Components/AdminDashboard/dashboard/AdminDashbord";
import Dashboard from "./Components/AdminDashboard/dashboard/Pages/Dashboard/Dashbord";
import Customers from "./Components/AdminDashboard/dashboard/Pages/Customers/Customer";
import Orders from "./Components/AdminDashboard/dashboard/Pages/Orders/Orders";
import Queries from "./Components/AdminDashboard/dashboard/Pages/Queries/Queries";
import Home from "./Components/User/Home";
import UserDashboard from "./Components/User/Pages/UserDashboard/UserDashboard";
import Holding from "./Components/User/Pages/Holdings/Holding";
import Order from "./Components/User/Pages/Order/Order";
import Watchlist from "./Components/User/Pages/Watchlist/Watchlist";
import Profile from "./Components/User/Pages/Profile/Profile";


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegistrationForm />} />

        {/* Admin Dashboard with Nested Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="queries" element={<Queries />} />
        </Route>

        {/* User Dashboard with Nested Routes */}
        <Route path="/user-dashboard" element={<Home />}>
          <Route index element={<UserDashboard />} />
          <Route path="holdings" element={<Holding />} />
          <Route path="order" element={<Order />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../../Firebase";
import { doc, deleteDoc } from "firebase/firestore";
import "./SideBar.css";

function SideBar() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                await deleteDoc(doc(db, "activeUsers", user.uid));
                await signOut(auth);
                navigate("/login");
            }
        } catch (error) {
            console.error("Logout failed:", error);
            navigate("/login");
        }
    };

    const menuItems = [
        { 
            label: "Dashboard", 
            path: "/admin-dashboard", 
            icon: "fas fa-tachometer-alt",
            key: ""
        },
        { 
            label: "Customers", 
            path: "/admin-dashboard/customers", 
            icon: "fas fa-users",
            key: "/customers"
        },
        { 
            label: "Orders", 
            path: "/admin-dashboard/orders", 
            icon: "fas fa-shopping-cart",
            key: "/orders"
        },
        { 
            label: "Queries", 
            path: "/admin-dashboard/queries", 
            icon: "fas fa-question-circle",
            key: "/queries"
        },
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="SideBar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src="/logo2.png" alt="TradeWaves Logo" className="sidebar-logo-img" />
                    <span className="sidebar-brand">Admin Panel</span>
                </div>
                
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <div
                        key={item.key}
                        className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <div className="sidebar-item-icon">
                            <i className={item.icon}></i>
                        </div>
                        <span className="sidebar-item-label">{item.label}</span>
                        {isActive(item.path) && <div className="sidebar-item-indicator"></div>}
                    </div>
                ))}
            </nav>

            <div className="logout-container">
                <button
                    className="sidebar-logout-button"
                    onClick={handleLogout}
                    title="Logout"
                >
                    <div className="logout-icon">
                        <i className="fas fa-sign-out-alt"></i>
                    </div>
                    <span className="logout-text">Logout</span>
                </button>
            </div>
        </div>
    );
}

export default SideBar;

import Header from "./Header/Header";
import SideBar from "./SideBar/SideBar";
import PageContent from "./PageContent/PageContent";
import { Outlet } from "react-router-dom";
import "./Dash.css";

function AdminDashboard() {
    return (
        <div className="admin-dashboard">
            <Header />
            <div className="dashboard-container">
                <SideBar />
                <div className="dashboard-content">
                    <PageContent>
                        <Outlet />
                    </PageContent>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;

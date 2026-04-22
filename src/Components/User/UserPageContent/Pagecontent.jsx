import { Outlet } from "react-router-dom";
import "./PageContent.css";

function PageContent() {
  return (
    <div className="PageContent">
      <Outlet />
    </div>
  );
}

export default PageContent;

import { NavLink, Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div>
      <nav>
        <NavLink
          to={"approvals"}
          className={({ isActive }) => (isActive ? "active" : "normal")}
        >
          Approvals
        </NavLink>
        <NavLink
          to={"tickets"}
          className={({ isActive }) => (isActive ? "active" : "normal")}
        >
          Tickets
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}

export default AdminLayout;

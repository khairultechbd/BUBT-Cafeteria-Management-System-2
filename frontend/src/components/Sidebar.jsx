import { Link } from "react-router-dom"
import { getUser } from "../api/authApi"
import "./Sidebar.css"

export const Sidebar = () => {
  const user = getUser()

  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/products">Products</Link>
        </li>
        <li>
          <Link to="/orders">Orders</Link>
        </li>
        <li>
          <Link to="/profile">Profile</Link>
        </li>
        {user.role === "admin" && (
          <>
            <li>
              <Link to="/users">Users</Link>
            </li>
            <li>
              <Link to="/notifications">Notifications</Link>
            </li>
          </>
        )}
      </ul>
    </aside>
  )
}

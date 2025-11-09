"use client"

import { Link, useNavigate } from "react-router-dom"
import { getUser, logout } from "../api/authApi"
import "./Navbar.css"

export const Navbar = () => {
  const user = getUser()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          BUBT CMS
        </Link>
        <div className="navbar-menu">
          <span className="user-info">Welcome, {user.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

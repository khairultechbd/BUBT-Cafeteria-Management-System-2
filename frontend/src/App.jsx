import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Navbar } from "./components/Navbar"
import { Sidebar } from "./components/Sidebar"
import { getToken } from "./api/authApi"

// Pages
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import UserList from "./pages/UserList"
import Profile from "./pages/Profile"
import Products from "./pages/Products"
import Orders from "./pages/Orders"
import Notifications from "./pages/Notifications"

import "./App.css"

function App() {
  const token = getToken()

  return (
    <Router>
      {token ? (
        <div className="app-layout">
          <Navbar />
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute adminOnly>
                      <UserList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute adminOnly>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  )
}

export default App

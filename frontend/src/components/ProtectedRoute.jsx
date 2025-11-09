import { Navigate } from "react-router-dom"
import { getToken, getUser } from "../api/authApi"

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = getToken()
  const user = getUser()

  if (!token) {
    return <Navigate to="/login" />
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" />
  }

  return children
}

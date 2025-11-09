import axios from "axios"

const API_URL = "http://localhost:5000/api/auth"

export const register = async (name, email, password) => {
  const response = await axios.post(`${API_URL}/register`, { name, email, password })
  return response.data
}

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, { email, password })
  if (response.data.token) {
    localStorage.setItem("token", response.data.token)
    localStorage.setItem("user", JSON.stringify(response.data.user))
  }
  return response.data
}

export const logout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export const getToken = () => localStorage.getItem("token")
export const getUser = () => JSON.parse(localStorage.getItem("user") || "{}")

import axios from "axios"
import { getToken } from "./authApi"

const API_URL = "http://localhost:5000/api/users"

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
})

export const getAllUsers = async () => {
  const response = await axios.get(API_URL, getHeaders())
  return response.data
}

export const getPendingUsers = async () => {
  const response = await axios.get(`${API_URL}/pending`, getHeaders())
  return response.data
}

export const getUserProfile = async () => {
  const response = await axios.get(`${API_URL}/profile`, getHeaders())
  return response.data
}

export const updateProfile = async (name, email, password) => {
  const response = await axios.put(`${API_URL}/profile`, { name, email, password }, getHeaders())
  return response.data
}

export const approveUser = async (userId) => {
  const response = await axios.put(`${API_URL}/${userId}/approve`, {}, getHeaders())
  return response.data
}

export const rejectUser = async (userId) => {
  const response = await axios.put(`${API_URL}/${userId}/reject`, {}, getHeaders())
  return response.data
}

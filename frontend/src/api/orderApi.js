import axios from "axios"
import { getToken } from "./authApi"

const API_URL = "http://localhost:5000/api/orders"

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
})

export const createOrder = async (productId, quantity) => {
  const response = await axios.post(API_URL, { productId, quantity }, getHeaders())
  return response.data
}

export const getMyOrders = async () => {
  const response = await axios.get(`${API_URL}/my-orders`, getHeaders())
  return response.data
}

export const getAllOrders = async () => {
  const response = await axios.get(API_URL, getHeaders())
  return response.data
}

export const getPendingOrders = async () => {
  const response = await axios.get(`${API_URL}/pending`, getHeaders())
  return response.data
}

export const updateOrderStatus = async (orderId, status) => {
  const response = await axios.put(`${API_URL}/${orderId}/status`, { status }, getHeaders())
  return response.data
}

export const deleteOrder = async (orderId) => {
  const response = await axios.delete(`${API_URL}/${orderId}`, getHeaders())
  return response.data
}

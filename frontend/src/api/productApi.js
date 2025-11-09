import axios from "axios"
import { getToken } from "./authApi"

const API_URL = "http://localhost:5000/api/products"

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
})

export const getAllProducts = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

export const getProduct = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`)
  return response.data
}

export const createProduct = async (name, description, price, category, image) => {
  const response = await axios.post(API_URL, { name, description, price, category, image }, getHeaders())
  return response.data
}

export const updateProduct = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data, getHeaders())
  return response.data
}

export const deleteProduct = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getHeaders())
  return response.data
}

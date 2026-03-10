import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const productsAPI = axios.create({
  baseURL: `${API_BASE_URL}/products`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
productsAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Product {
  id: string;
  sellerId: string;
  cropName: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  minPriceExpected: number;
  maxPriceExpected: number;
  currentPrice?: number;
  discountPercent?: number;
  imageUrl?: string;
  harvestDate?: string;
  expiryDate?: string;
  location?: string;
  isSeasonal: boolean;
  isAvailable: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  cropName: string;
  description: string;
  category: string;
  quantity: number;
  unit?: string;
  minPriceExpected: number;
  maxPriceExpected: number;
  currentPrice?: number;
  discountPercent?: number;
  imageUrl?: string;
  harvestDate?: string;
  expiryDate?: string;
  location?: string;
  isSeasonal?: boolean;
}

/**
 * Get all available products with optional filtering
 */
export const getAllProducts = async (params?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await productsAPI.get("/", { params });
  return response.data;
};

/**
 * Get a single product by ID
 */
export const getProductById = async (productId: string) => {
  const response = await productsAPI.get(`/${productId}`);
  return response.data;
};

/**
 * Get all products by a specific seller
 */
export const getProductsBySeller = async (
  sellerId: string,
  params?: { page?: number; limit?: number },
) => {
  const response = await productsAPI.get(`/seller/${sellerId}`, { params });
  return response.data;
};

/**
 * Get current user's products (requires authentication)
 */
export const getMyProducts = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const response = await productsAPI.get("/my-products", { params });
  return response.data.data || response.data;
};

/**
 * Create a new product (requires authentication & seller role)
 */
export const createProduct = async (data: CreateProductData) => {
  const response = await productsAPI.post("/", data);
  return response.data;
};

/**
 * Update an existing product (requires authentication & ownership)
 */
export const updateProduct = async (
  productId: string,
  data: Partial<CreateProductData>,
) => {
  const response = await productsAPI.put(`/${productId}`, data);
  return response.data;
};

/**
 * Delete a product (requires authentication & ownership)
 */
export const deleteProduct = async (productId: string) => {
  const response = await productsAPI.delete(`/${productId}`);
  return response.data;
};

/**
 * Get available product categories
 */
export const getCategories = async () => {
  const response = await productsAPI.get("/categories");
  return response.data.data || response.data;
};

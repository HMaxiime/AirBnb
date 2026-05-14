import axios from "axios";

// Single Axios instance used by every apiService function.
// All other hooks/pages import from apiService — never from this file directly.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach the stored JWT to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, clear the stale token so the user is treated as logged out.
// We do NOT redirect here — AuthContext / ProtectedRoute handle navigation.
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("auth_token");
    }
    return Promise.reject(err);
  },
);

export default apiClient;

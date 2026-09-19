import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
});

api.interceptors.request.use((config) => {
  const isAdminReq = config.url && config.url.includes('/admin');
  const adminToken = localStorage.getItem('admin_token');
  const userToken = localStorage.getItem('token');
  const authToken = isAdminReq ? (adminToken || userToken) : (userToken || adminToken);

  if (authToken && !config.headers['Authorization'] && !config.headers['authorization']) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;

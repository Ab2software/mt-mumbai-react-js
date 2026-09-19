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

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.is_inactive) {
      const isAdminReq = response.config?.url && response.config.url.includes('/admin');
      if (!isAdminReq) {
        localStorage.removeItem('token');
        localStorage.removeItem('phone');
        localStorage.removeItem('name');
        sessionStorage.removeItem('mpin_unlocked');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?error=inactive';
        }
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAdminReq = error.config?.url && error.config.url.includes('/admin');
      if (!isAdminReq && (error.response.data?.is_inactive || error.response.data?.msg?.toLowerCase().includes('inactive'))) {
        localStorage.removeItem('token');
        localStorage.removeItem('phone');
        localStorage.removeItem('name');
        sessionStorage.removeItem('mpin_unlocked');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?error=inactive';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

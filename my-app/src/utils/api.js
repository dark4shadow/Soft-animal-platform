import axios from 'axios';

// Базовий URL для API - беремо з .env або використовуємо локальний сервер
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Створення екземпляру axios з базовим URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Інтерцептор для додавання токена аутентифікації
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Інтерцептор для обробки відповідей
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обробка помилки авторизації (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Не використовуємо window.location.href, щоб це не заважало Unit-тестам
      // і щоб React Router міг обробити навігацію
    }
    return Promise.reject(error);
  }
);

export default api;
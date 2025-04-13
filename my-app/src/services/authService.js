import api from '../utils/api';

// Логін користувача
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      // Переконайтеся, що дані користувача є об'єктом
      const userData = response.data.user || {};
      localStorage.setItem('user', JSON.stringify(userData));
      
      return response.data.user;
    }
    
    throw new Error(response.data.message || 'Помилка при вході в систему');
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.message || 'Невідома помилка при вході');
  }
};

// Реєстрація користувача
export const register = async (userData) => {
  try {
    // Визначаємо заголовки залежно від типу даних (якщо є завантаження аватара)
    const headers = userData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
    
    const response = await api.post('/auth/register', userData, { headers });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error.response?.data?.message || 'Помилка під час реєстрації');
  }
};

// Вихід користувача
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
};

// Отримати поточного користувача
export const getCurrentUser = () => {
  try {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    return JSON.parse(userString);
  } catch (error) {
    console.error('Error parsing user data:', error);
    // Очищаємо невалідні дані
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
};

// Перевірка авторизації
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Оновити профіль користувача
export const updateUserProfile = async (userData) => {
  try {
    // Визначаємо заголовки залежно від типу даних
    const headers = userData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
    
    const response = await api.put('/auth/profile', userData, { headers });
    
    // Оновлюємо дані в localStorage
    const updatedUser = response.data.data;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return updatedUser;
  } catch (error) {
    console.error('Update profile error:', error);
    throw new Error(error.response?.data?.message || 'Помилка оновлення профілю');
  }
};

// Зміна паролю
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  } catch (error) {
    console.error('Change password error:', error);
    throw new Error(error.response?.data?.message || 'Помилка зміни паролю');
  }
};

// Відправка посилання для відновлення паролю
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw new Error(error.response?.data?.message || 'Помилка відправки посилання для відновлення паролю');
  }
};

// Скидання паролю за токеном
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.put(`/auth/reset-password/${token}`, { password: newPassword });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw new Error(error.response?.data?.message || 'Помилка скидання паролю');
  }
};
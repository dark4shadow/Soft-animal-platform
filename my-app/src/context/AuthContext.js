import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';
import axios from 'axios';

const API_BASE_URL = 'http://example.com/api'; // Replace with your actual API base URL

const AuthContext = createContext();

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // При завантаженні додатку перевіряємо наявність авторизованого користувача
  useEffect(() => {
    try {
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      // Якщо виникла помилка, видаляємо дані
      authService.logout();
    } finally {
      setLoading(false);
    }
  }, []);

  // Додайте цей код для кращого відстеження стану автентифікації
  useEffect(() => {
    // Виводимо до консолі стан автентифікації для діагностики
    console.log("Auth state changed:");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("currentUser:", currentUser);
    console.log("token in localStorage:", localStorage.getItem('token'));
  }, [isAuthenticated, currentUser]);

  // Також переконайтеся, що функція checkAuth викликається при завантаженні
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Помилка при парсингу даних користувача:', error);
          // Очищаємо дані при помилці
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Функція для авторизації
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (err) {
      setError(err.message || 'Помилка авторизації');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Функція для реєстрації
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const user = await authService.register(userData);
      setCurrentUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (err) {
      setError(err.message || 'Помилка реєстрації');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Функція для виходу
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Функція для оновлення профілю
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Визначаємо, чи являється userData об'єктом FormData
      const isFormData = userData instanceof FormData;
      
      // Встановлюємо правильні заголовки
      const config = isFormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : { headers: { 'Content-Type': 'application/json' } };
      
      // Надсилаємо запит на сервер
      const response = await axios.put(
        `${API_BASE_URL}/users/${currentUser._id}`,
        userData,
        config
      );
      
      // Оновлюємо дані користувача в localStorage і у стейті
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка оновлення профілю');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Функція для зміни паролю
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      return result;
    } catch (err) {
      setError(err.message || 'Помилка зміни паролю');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Нова функція для оновлення даних користувача в контексті
  const updateCurrentUser = (userData) => {
    // Оновлюємо користувача в стейті
    setCurrentUser(userData);
    
    // Оновлюємо користувача в localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    updateCurrentUser // Додаємо нову функцію в контекст
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
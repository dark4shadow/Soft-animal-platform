import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, userType = null }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Завантаження...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Якщо вказано конкретний тип користувача, перевіряємо його
  if (userType && currentUser.userType !== userType) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
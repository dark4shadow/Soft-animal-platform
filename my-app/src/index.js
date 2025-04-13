import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Очищаємо потенційно невалідні дані
try {
  const user = localStorage.getItem('user');
  if (user && (user === 'undefined' || user === 'null')) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('Removed invalid user data from localStorage');
  }
} catch (e) {
  // Якщо виникла помилка при парсингу, видаляємо всі дані
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  console.error('Error checking localStorage data:', e);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

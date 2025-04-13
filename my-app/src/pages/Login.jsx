import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, error: authError } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email обов'язковий";
    if (!formData.password) newErrors.password = "Пароль обов'язковий";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Викликаємо функцію логіна з AuthContext
      const user = await login(formData.email, formData.password);
      
      // Якщо логін успішний, перенаправляємо на відповідну сторінку
      if (user) {
        if (user.userType === 'shelter') {
          navigate('/shelter-dashboard');
        } else if (user.userType === 'volunteer') {
          navigate('/volunteer-dashboard');
        } else if (user.userType === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'Помилка при вході. Будь ласка, перевірте свої дані.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSocialLogin = (provider) => {
    // Ця функціональність буде розроблена пізніше
    alert(`Функція авторизації через ${provider} буде додана пізніше`);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Вхід в систему</h2>
        
        {(error || authError) && (
          <div className="error-message" style={{marginBottom: '20px', textAlign: 'center'}}>
            {error || authError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              disabled={loading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              disabled={loading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-flex">
            <div>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="rememberMe" style={{ display: 'inline', marginLeft: '10px' }}>Запам'ятати мене</label>
            </div>
            <Link to="/forgot-password" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
              Забули пароль?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

        <div className="social-login">
          <p>Або увійти через</p>
          <div className="social-buttons">
            <button 
              className="social-btn" 
              onClick={() => handleSocialLogin('facebook')}
              aria-label="Login with Facebook"
              type="button"
            >
              <span style={{ fontSize: '1.5rem', color: '#3b5998' }}>f</span>
            </button>
            <button 
              className="social-btn" 
              onClick={() => handleSocialLogin('google')}
              aria-label="Login with Google"
              type="button"
            >
              <span style={{ fontSize: '1.5rem', color: '#dd4b39' }}>G</span>
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>Немає акаунту? <Link to="/register">Зареєструватись</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
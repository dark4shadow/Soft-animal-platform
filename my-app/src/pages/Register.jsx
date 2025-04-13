import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, error: authError } = useContext(AuthContext);
  
  const [userType, setUserType] = useState('volunteer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    shelterType: 'shelter',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Ім'я обов'язкове";
    if (!formData.email) newErrors.email = "Email обов'язковий";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Неправильний формат email";
    if (!formData.password) newErrors.password = "Пароль обов'язковий";
    if (formData.password.length < 6) newErrors.password = "Пароль має містити не менше 6 символів";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Паролі не співпадають";
    if (!formData.phone) newErrors.phone = "Телефон обов'язковий";
    
    if (userType === 'shelter') {
      if (!formData.address) newErrors.address = "Адреса обов'язкова";
    }
    
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
      
      // Підготовка даних для реєстрації
      const userData = {
        ...formData,
        userType,
      };
      
      // Викликаємо функцію реєстрації з AuthContext
      const user = await register(userData);
      
      // Якщо реєстрація успішна, перенаправляємо на відповідну сторінку
      if (user) {
        if (user.userType === 'shelter') {
          navigate('/shelter-dashboard');
        } else if (user.userType === 'volunteer') {
          navigate('/volunteer-dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'Помилка при реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Реєстрація</h2>
        
        {(error || authError) && (
          <div className="error-message" style={{marginBottom: '20px', textAlign: 'center'}}>
            {error || authError}
          </div>
        )}
        
        <div className="user-type-selector">
          <button 
            type="button"
            className={`user-type-btn ${userType === 'volunteer' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('volunteer')}
          >
            Волонтер
          </button>
          <button 
            type="button"
            className={`user-type-btn ${userType === 'shelter' ? 'active' : ''}`}
            onClick={() => handleUserTypeChange('shelter')}
          >
            Притулок
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{userType === 'shelter' ? 'Назва притулку' : "Ім'я та прізвище"}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              disabled={loading}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

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

          <div className="form-group">
            <label htmlFor="confirmPassword">Підтвердження пароля</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              disabled={loading}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Телефон</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              disabled={loading}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {userType === 'shelter' && (
            <>
              <div className="form-group">
                <label htmlFor="address">Адреса</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={errors.address ? 'error' : ''}
                  disabled={loading}
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="shelterType">Тип закладу</label>
                <select
                  id="shelterType"
                  name="shelterType"
                  value={formData.shelterType}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="shelter">Притулок для тварин</option>
                  <option value="clinic">Ветеринарна клініка</option>
                  <option value="breeder">Розплідник</option>
                  <option value="other">Інше</option>
                </select>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Реєстрація...' : 'Зареєструватись'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Вже є акаунт? <Link to="/login">Увійти</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
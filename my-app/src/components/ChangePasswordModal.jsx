import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/components/_change-password-modal.css';

const ChangePasswordModal = ({ onClose }) => {
  const { changePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.currentPassword) {
      newErrors.currentPassword = "Введіть поточний пароль";
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = "Введіть новий пароль";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Пароль має бути не менше 6 символів";
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Паролі не співпадають";
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
      
      await changePassword(formData.currentPassword, formData.newPassword);
      setSuccess(true);
      
      // Закриваємо модальне вікно через 2 секунди після успіху
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Помилка зміни пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Зміна пароля</h2>
        
        {success ? (
          <div className="success-message">
            Пароль успішно змінено!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="currentPassword">Поточний пароль</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={errors.currentPassword ? 'form-control error' : 'form-control'}
                disabled={loading}
              />
              {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">Новий пароль</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={errors.newPassword ? 'form-control error' : 'form-control'}
                disabled={loading}
              />
              {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Підтвердження паролю</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'form-control error' : 'form-control'}
                disabled={loading}
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Скасувати
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Збереження...' : 'Змінити пароль'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
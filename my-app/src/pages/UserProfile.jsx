import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserStats } from '../services/userService'; // Додамо новий імпорт
import '../styles/pages/UserProfile.css';
import ChangePasswordModal from '../components/ChangePasswordModal';
import Alert from '../components/ui/Alert'; // Для кращих повідомлень
import Spinner from '../components/ui/Spinner'; // Для індикаторів завантаження

const UserProfile = () => {
  const { currentUser, updateProfile, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userStats, setUserStats] = useState({
    favorites: 0,
    adoptions: 0,
    donations: 0,
    animals: 0, // для притулків
    requests: 0, // для притулків
  });

  // Заповнюємо форму даними користувача при завантаженні компонента
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
      });
      
      // Завантажуємо статистику користувача
      loadUserStats();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      console.log("Дані користувача:", currentUser);
      console.log("Статистика пожертв з контексту:", currentUser.donationStats);
    }
  }, [currentUser]);

  useEffect(() => {
    console.log("Завантажена статистика:", userStats);
  }, [userStats]);

  const loadUserStats = async () => {
    if (!currentUser || !currentUser._id) return;
    
    try {
      setStatsLoading(true);
      const stats = await getUserStats(currentUser._id);
      setUserStats(stats);
    } catch (err) {
      console.error('Error loading user stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB максимум
        setError('Розмір файлу має бути менше 5MB');
        return;
      }
      
      setAvatar(file);
      // Створюємо URL-превью для відображення
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Створюємо FormData об'єкт для завантаження файлу
      let userData;
      if (avatar) {
        userData = new FormData();
        userData.append('name', formData.name);
        userData.append('email', formData.email);
        userData.append('phone', formData.phone);
        userData.append('address', formData.address);
        userData.append('avatar', avatar);
      } else {
        userData = { ...formData };
      }

      // Оновлюємо профіль
      await updateProfile(userData);
      
      setIsEditing(false);
      setSuccess('Профіль успішно оновлено');
      setAvatar(null); // Очищаємо стан після успішного оновлення
      
      // Скриваємо повідомлення про успіх через 3 секунди
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Помилка оновлення профілю');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Помилка доступу</h2>
          <p>Будь ласка, увійдіть у систему для доступу до цієї сторінки.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Мій профіль</h2>
        
        {(error || authError) && (
          <Alert type="error" message={error || authError} />
        )}
        
        {success && (
          <Alert type="success" message={success} />
        )}
        
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Превью аватару" className="profile-avatar-img" />
            ) : currentUser.avatar ? (
              <img src={currentUser.avatar} alt={`${currentUser.name}`} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            {isEditing && (
              <div className="profile-avatar-upload">
                <label htmlFor="avatar" className="avatar-upload-btn">
                  Змінити фото
                </label>
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Ім'я</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing || loading}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing || loading}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Телефон</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing || loading}
              className="form-control"
              placeholder="+380XXXXXXXXX"
            />
          </div>
          
          {currentUser.userType === 'shelter' && (
            <div className="form-group">
              <label htmlFor="address">Адреса</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing || loading}
                className="form-control"
              />
            </div>
          )}
          
          <div className="user-type-badge">
            {currentUser.userType === 'shelter' ? 'Притулок' : 
             currentUser.userType === 'volunteer' ? 'Волонтер' : 'Адміністратор'}
          </div>
          
          <div className="form-actions">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarPreview(null);
                    setAvatar(null);
                    setFormData({
                      name: currentUser.name || '',
                      email: currentUser.email || '',
                      phone: currentUser.phone || '',
                      address: currentUser.address || '',
                    });
                  }}
                  disabled={loading}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? <><Spinner size="small" /> Збереження...</> : 'Зберегти зміни'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Редагувати профіль
              </button>
            )}
          </div>
        </form>
        
        <div className="profile-sections">
          <div className="profile-section">
            <h3>Зміна паролю</h3>
            <button 
              className="btn-secondary" 
              onClick={() => setShowPasswordModal(true)}
            >
              Змінити пароль
            </button>
          </div>
          
          {currentUser.userType === 'volunteer' && (
            <div className="profile-section">
              <h3>Моя активність</h3>
              {statsLoading ? (
                <div className="stats-loading">
                  <Spinner size="medium" />
                  <p>Завантаження статистики...</p>
                </div>
              ) : (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{userStats.adoptions || 0}</div>
                    <div className="stat-label">Прилаштовано</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.favorites || 0}</div>
                    <div className="stat-label">Улюблених</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {userStats.donations ? `${userStats.donations} грн` : 
                       currentUser.donationStats?.totalAmount ? `${currentUser.donationStats.totalAmount} грн` :
                       '0 грн'}
                    </div>
                    <div className="stat-label">Пожертвувано</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {currentUser.userType === 'shelter' && (
            <div className="profile-section">
              <h3>Статистика притулку</h3>
              {statsLoading ? (
                <div className="stats-loading">
                  <Spinner size="medium" />
                  <p>Завантаження статистики...</p>
                </div>
              ) : (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{userStats.animals || 0}</div>
                    <div className="stat-label">Тварин</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.adoptions || 0}</div>
                    <div className="stat-label">Прилаштовано</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.requests || 0}</div>
                    <div className="stat-label">Запитів</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="profile-section danger-zone">
            <h3>Небезпечна зона</h3>
            <button className="btn-danger">Видалити акаунт</button>
            <p className="warning-text">* Ця дія є незворотною і призведе до видалення всіх ваших даних</p>
          </div>
        </div>
      </div>
      
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};

export default UserProfile;
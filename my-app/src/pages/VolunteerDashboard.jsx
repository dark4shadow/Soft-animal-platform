import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import {
  getVolunteerProfile,
  getVolunteerFavorites,
  removeFromFavorites,
  getVolunteerAdoptionRequests,
  cancelAdoptionRequest,
  getVolunteerAdoptedAnimals
} from '../services/volunteerService';
import '../styles/pages/VolunteerDashboard.css';

const VolunteerDashboard = () => {
  const { currentUser } = useAuth();
  const [volunteerData, setVolunteerData] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [adoptionRequests, setAdoptionRequests] = useState([]);
  const [adoptedAnimals, setAdoptedAnimals] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');
  const [loading, setLoading] = useState({
    profile: true,
    favorites: true,
    requests: true,
    adopted: true
  });
  const [error, setError] = useState({
    profile: null,
    favorites: null,
    requests: null,
    adopted: null
  });

  // Завантаження даних про користувача
  useEffect(() => {
    const fetchVolunteerData = async () => {
      try {
        setLoading(prev => ({ ...prev, profile: true }));
        const data = await getVolunteerProfile();
        setVolunteerData(data);
      } catch (err) {
        console.error('Помилка завантаження даних волонтера:', err);
        setError(prev => ({ 
          ...prev, 
          profile: 'Не вдалося завантажити дані профілю. Спробуйте знову пізніше.' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, profile: false }));
      }
    };

    if (currentUser) {
      fetchVolunteerData();
    }
  }, [currentUser]);

  // Завантаження улюблених тварин
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(prev => ({ ...prev, favorites: true }));
        const data = await getVolunteerFavorites();
        setFavorites(data || []);
      } catch (err) {
        console.error('Помилка завантаження улюблених тварин:', err);
        setError(prev => ({ 
          ...prev, 
          favorites: 'Не вдалося завантажити улюблені тварини. Спробуйте знову пізніше.' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, favorites: false }));
      }
    };

    if (activeTab === 'favorites') {
      fetchFavorites();
    }
  }, [activeTab]);

  // Завантаження запитів на усиновлення
  useEffect(() => {
    const fetchAdoptionRequests = async () => {
      try {
        setLoading(prev => ({ ...prev, requests: true }));
        const data = await getVolunteerAdoptionRequests();
        setAdoptionRequests(data || []);
      } catch (err) {
        console.error('Помилка завантаження запитів на усиновлення:', err);
        setError(prev => ({ 
          ...prev, 
          requests: 'Не вдалося завантажити запити на усиновлення. Спробуйте знову пізніше.' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, requests: false }));
      }
    };

    if (activeTab === 'requests') {
      fetchAdoptionRequests();
    }
  }, [activeTab]);

  // Завантаження всиновлених тварин
  useEffect(() => {
    const fetchAdoptedAnimals = async () => {
      try {
        setLoading(prev => ({ ...prev, adopted: true }));
        const data = await getVolunteerAdoptedAnimals();
        setAdoptedAnimals(data || []);
      } catch (err) {
        console.error('Помилка завантаження всиновлених тварин:', err);
        setError(prev => ({ 
          ...prev, 
          adopted: 'Не вдалося завантажити всиновлені тварини. Спробуйте знову пізніше.' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, adopted: false }));
      }
    };

    if (activeTab === 'adopted') {
      fetchAdoptedAnimals();
    }
  }, [activeTab]);

  // Функція видалення тварини з улюблених
  const handleRemoveFromFavorites = async (animalId) => {
    try {
      await removeFromFavorites(animalId);
      setFavorites(prevFavorites => prevFavorites.filter(animal => animal._id !== animalId));
      
      // Оновлюємо загальний лічильник у даних користувача
      if (volunteerData) {
        setVolunteerData(prev => ({
          ...prev,
          favoriteAnimalsCount: (prev.favoriteAnimalsCount || 0) - 1
        }));
      }
    } catch (err) {
      console.error('Помилка видалення з улюблених:', err);
      // Показуємо повідомлення про помилку, але не зупиняємо взаємодію
      alert('Не вдалося видалити тварину з улюблених. Спробуйте знову.');
    }
  };

  // Функція скасування запиту на всиновлення
  const handleCancelRequest = async (requestId) => {
    try {
      await cancelAdoptionRequest(requestId);
      setAdoptionRequests(prevRequests => prevRequests.filter(request => request._id !== requestId));
      
      // Оновлюємо загальний лічильник у даних користувача
      if (volunteerData) {
        setVolunteerData(prev => ({
          ...prev,
          requestsCount: (prev.requestsCount || 0) - 1
        }));
      }
    } catch (err) {
      console.error('Помилка скасування запиту:', err);
      alert('Не вдалося скасувати запит. Спробуйте знову.');
    }
  };

  // Якщо профіль завантажується
  if (loading.profile) {
    return (
      <div className="loading-container">
        <Spinner size="large" />
        <p>Завантаження особистого кабінету...</p>
      </div>
    );
  }

  // Якщо помилка завантаження профілю
  if (error.profile) {
    return (
      <div className="dashboard-container">
        <Alert type="error" message={error.profile} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" className="btn-primary">На головну</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Особистий кабінет волонтера</h1>
          <p>Вітаємо, {volunteerData?.name || currentUser?.name}!</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/profile" className="btn-secondary">Налаштування профілю</Link>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{volunteerData?.favoriteAnimalsCount || 0}</div>
          <div className="stat-label">У вибраному</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{volunteerData?.adoptionsCount || 0}</div>
          <div className="stat-label">Прилаштовані</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{volunteerData?.requestsCount || 0}</div>
          <div className="stat-label">Активні запити</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {volunteerData?.donationStats?.totalAmount || currentUser?.donationStats?.totalAmount || 0} грн
          </div>
          <div className="stat-label">Пожертвувано</div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Улюблені тварини
        </button>
        <button 
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Мої запити
          {volunteerData?.pendingRequestsCount > 0 && (
            <span className="notification-badge">{volunteerData.pendingRequestsCount}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'adopted' ? 'active' : ''}`}
          onClick={() => setActiveTab('adopted')}
        >
          Прилаштовані тварини
        </button>
      </div>

      {/* Вкладка з улюбленими тваринами */}
      {activeTab === 'favorites' && (
        <div className="favorites-container">
          <h3>Ваші улюблені тварини</h3>
          {error.favorites && <Alert type="error" message={error.favorites} />}
          
          {loading.favorites ? (
            <div className="loading-container">
              <Spinner size="medium" />
              <p>Завантаження улюблених тварин...</p>
            </div>
          ) : favorites.length > 0 ? (
            <div className="favorites-grid">
              {favorites.map(animal => (
                <div key={animal._id} className="favorite-card">
                  <div className="favorite-image">
                    <img 
                      src={animal.photos && animal.photos.length > 0 
                        ? animal.photos[0] 
                        : 'https://via.placeholder.com/300x200?text=Немає+фото'} 
                      alt={animal.name} 
                    />
                    <button 
                      className="remove-favorite-btn"
                      onClick={() => handleRemoveFromFavorites(animal._id)}
                      aria-label="Видалити з улюблених"
                    >
                      ❌
                    </button>
                  </div>
                  <div className="favorite-details">
                    <h4>{animal.name}</h4>
                    <p className="favorite-type">
                      {animal.species === 'cat' ? 'Кіт' : 
                       animal.species === 'dog' ? 'Собака' : 'Інше'}, 
                      {animal.gender === 'male' ? ' Хлопчик' : ' Дівчинка'}, 
                      {animal.age}
                    </p>
                    <p className="favorite-shelter">
                      {animal.shelter?.name || 'Притулок'}, 
                      {animal.shelter?.location?.city || 'Місто не вказано'}
                    </p>
                    <p className="favorite-date">
                      Додано: {new Date(animal.addedToFavorites || animal.updatedAt).toLocaleDateString('uk-UA')}
                    </p>
                    <div className="favorite-actions">
                      <Link to={`/animals/${animal._id}`} className="btn-secondary">Деталі</Link>
                      <Link to={`/adoption-request/${animal._id}`} className="btn-primary">Подати запит</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>У вас немає улюблених тварин</p>
              <Link to="/animals" className="btn-primary">Переглянути доступних тварин</Link>
            </div>
          )}
        </div>
      )}

      {/* Вкладка з запитами на усиновлення */}
      {activeTab === 'requests' && (
        <div className="requests-section">
          <h3>Ваші запити на усиновлення</h3>
          {error.requests && <Alert type="error" message={error.requests} />}
          
          {loading.requests ? (
            <div className="loading-container">
              <Spinner size="medium" />
              <p>Завантаження запитів на усиновлення...</p>
            </div>
          ) : adoptionRequests.length > 0 ? (
            <div className="requests-list">
              {adoptionRequests.map(request => (
                <div key={request._id} className={`request-card ${request.status}`}>
                  <div className="request-animal-info">
                    <img 
                      src={request.animal?.photos && request.animal.photos.length > 0 
                        ? request.animal.photos[0] 
                        : 'https://via.placeholder.com/300x200?text=Немає+фото'} 
                      alt={request.animal?.name} 
                    />
                    <div>
                      <h4>{request.animal?.name || 'Тварина'}</h4>
                      <p>{request.shelter?.name || 'Притулок'}, {request.shelter?.location?.city || 'Місто не вказано'}</p>
                      <p>Дата запиту: {new Date(request.createdAt).toLocaleDateString('uk-UA')}</p>
                    </div>
                  </div>
                  <div className="request-status-info">
                    <span className={`status-badge ${request.status}`}>
                      {request.status === 'pending' ? 'В очікуванні' : 
                       request.status === 'approved' ? 'Схвалено' : 'Відхилено'}
                    </span>
                    {request.status === 'pending' && (
                      <button className="btn-danger" onClick={() => handleCancelRequest(request._id)}>
                        Скасувати запит
                      </button>
                    )}
                    {request.status === 'approved' && (
                      <div className="request-instructions">
                        <p>Зв'яжіться з притулком для завершення процесу усиновлення:</p>
                        <Link to={`/shelters/${request.shelter?._id}`} className="btn-primary">Контакти притулку</Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>У вас немає активних запитів на усиновлення</p>
              <Link to="/animals" className="btn-primary">Переглянути доступних тварин</Link>
            </div>
          )}
        </div>
      )}

      {/* Вкладка з всиновленими тваринами */}
      {activeTab === 'adopted' && (
        <div className="adopted-section">
          <h3>Ваші усиновлені тварини</h3>
          {error.adopted && <Alert type="error" message={error.adopted} />}
          
          {loading.adopted ? (
            <div className="loading-container">
              <Spinner size="medium" />
              <p>Завантаження всиновлених тварин...</p>
            </div>
          ) : adoptedAnimals.length > 0 ? (
            <div className="adopted-grid">
              {adoptedAnimals.map(animal => (
                <div key={animal._id} className="adopted-card">
                  <div className="adopted-image">
                    <img 
                      src={animal.photos && animal.photos.length > 0 
                        ? animal.photos[0] 
                        : 'https://via.placeholder.com/300x200?text=Немає+фото'} 
                      alt={animal.name} 
                    />
                  </div>
                  <div className="adopted-details">
                    <h4>{animal.name}</h4>
                    <p className="adopted-type">
                      {animal.species === 'cat' ? 'Кіт' : 
                       animal.species === 'dog' ? 'Собака' : 'Інше'}, 
                      {animal.gender === 'male' ? ' Хлопчик' : ' Дівчинка'}, 
                      {animal.age}
                    </p>
                    <p className="adopted-shelter">
                      {animal.shelter?.name || 'Притулок'}, 
                      {animal.shelter?.location?.city || 'Місто не вказано'}
                    </p>
                    <p className="adopted-date">
                      Усиновлено: {new Date(animal.adoptionDate || animal.updatedAt).toLocaleDateString('uk-UA')}
                    </p>
                    <div className="adopted-actions">
                      <Link to={`/share-adoption/${animal._id}`} className="btn-secondary">
                        Поширити історію усиновлення
                      </Link>
                      <Link to={`/donate/${animal.shelter?._id}`} className="btn-primary">
                        Подарувати підтримку притулку
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>У вас поки немає усиновлених тварин</p>
              <Link to="/animals" className="btn-primary">Переглянути доступних тварин</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
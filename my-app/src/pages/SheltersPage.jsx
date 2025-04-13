import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getShelters } from '../services/shelterService';
import '../styles/main.css';
import headerBackground from '../assets/shelters-header.jpg';
import defaultShelterImage from '../assets/default-shelter.jpg';

// Оптимізований компонент картки притулку з кращою обробкою помилок
const ShelterCard = ({ shelter }) => {
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = defaultShelterImage;
  };

  return (
    <Link to={`/shelters/${shelter._id || shelter.id}`} className="shelters-page-card">
      <div className="shelters-page-image-container">
        <img 
          src={shelter.image} 
          alt={shelter.name} 
          className="shelters-page-image" 
          onError={handleImageError}
        />
        <div className="shelters-page-type-badge">
          {shelter.type === 'cat' ? 'Котячий' :
           shelter.type === 'dog' ? 'Собачий' :
           shelter.type === 'mixed' ? 'Змішаний' : 'Клініка'}
        </div>
        {shelter.verified && (
          <div className="shelters-page-verified-badge" title="Перевірений притулок">
            ✓
          </div>
        )}
      </div>
      <div className="shelters-page-details">
        <h3>{shelter.name}</h3>
        <p className="shelters-page-location">
          <span className="icon">📍</span> {shelter.location}
        </p>
        <p className="shelters-page-description">{shelter.description}</p>
        <div className="shelters-page-stats">
          <div className="shelters-page-stat">
            <span className="shelters-page-stat-value">{shelter.animalsCount}</span>
            <span className="shelters-page-stat-label">Тварин</span>
          </div>
          <div className="shelters-page-stat">
            <span className="shelters-page-stat-value">{shelter.rating?.toFixed(1) || '-'}</span>
            <span className="shelters-page-stat-label">
              <span className="star-icon">★</span> 
              <span className="review-count">({shelter.reviewsCount || 0})</span>
            </span>
          </div>
          <div className="shelters-page-stat">
            <span className="shelters-page-stat-value">{shelter.foundedYear}</span>
            <span className="shelters-page-stat-label">Заснований</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const SheltersPage = () => {
  // Стани для керування даними та UI
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Стан для фільтрів
  const [filters, setFilters] = useState({
    type: 'all',
    location: 'all',
    verified: false,
    searchQuery: '',
  });

  // Опції для фільтрів
  const shelterTypes = [
    { value: 'all', label: 'Всі типи' },
    { value: 'dog', label: 'Собачі' },
    { value: 'cat', label: 'Котячі' },
    { value: 'mixed', label: 'Змішані' },
    { value: 'clinic', label: 'Клініки' },
  ];

  const locations = [
    { value: 'all', label: 'Будь-яке місто' },
    { value: 'kyiv', label: 'Київ' },
    { value: 'lviv', label: 'Львів' },
    { value: 'odesa', label: 'Одеса' },
    { value: 'kharkiv', label: 'Харків' },
    { value: 'dnipro', label: 'Дніпро' },
  ];

  // Завантаження даних при зміні фільтрів або сторінки
  useEffect(() => {
    const fetchShelters = async () => {
      try {
        setLoading(true);
        
        // Підготовка параметрів для запиту
        const queryParams = {
          page: currentPage,
          limit: pageSize,
          ...filters,
        };
        
        // Видаляємо параметр "all", щоб не відправляти зайвих даних
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] === 'all') delete queryParams[key];
        });
        
        // Отримання притулків з сервісу
        const response = await getShelters(queryParams);
        
        setShelters(response.data || []);
        setTotalCount(response.totalCount || response.data?.length || 0);
        
      } catch (err) {
        console.error('Error fetching shelters:', err);
        setError('Не вдалося завантажити список притулків. Будь ласка, спробуйте пізніше.');
      } finally {
        setLoading(false);
      }
    };

    fetchShelters();
  }, [currentPage, filters]);

  // Обробка зміни фільтрів
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Скидаємо на першу сторінку при зміні фільтрів
  };

  // Обробка зміни чекбоксу (для verified)
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: checked }));
    setCurrentPage(1);
  };

  // Скидання фільтрів
  const clearFilters = () => {
    setFilters({
      type: 'all',
      location: 'all',
      verified: false,
      searchQuery: '',
    });
    setCurrentPage(1);
  };

  // Зміна сторінки пагінації
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Компонент пагінації
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="shelters-page-pagination">
        <button 
          className="shelters-page-page-btn"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          &laquo; Назад
        </button>
        
        <div className="shelters-page-page-indicators">
          {currentPage > 1 && (
            <button onClick={() => handlePageChange(1)}>1</button>
          )}
          
          {currentPage > 3 && <span>...</span>}
          
          {currentPage > 2 && (
            <button onClick={() => handlePageChange(currentPage - 1)}>{currentPage - 1}</button>
          )}
          
          <button className="active">{currentPage}</button>
          
          {currentPage < totalPages - 1 && (
            <button onClick={() => handlePageChange(currentPage + 1)}>{currentPage + 1}</button>
          )}
          
          {currentPage < totalPages - 2 && <span>...</span>}
          
          {currentPage < totalPages && (
            <button onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
          )}
        </div>
        
        <button 
          className="shelters-page-page-btn"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Далі &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="shelters-page">
      <div className="shelters-page-top-section" 
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${headerBackground})` }}>
        <div className="container">
          <h1>Притулки для тварин</h1>
          <p>Знайдіть притулок, який потребує вашої допомоги або з якого ви можете взяти тваринку</p>
          <div className="shelters-page-search-box">
            <input
              type="text"
              name="searchQuery"
              value={filters.searchQuery}
              onChange={handleFilterChange}
              placeholder="Пошук за назвою, описом або місцезнаходженням..."
              className="shelters-page-search-input"
            />
            <button className="shelters-page-search-btn" aria-label="Пошук">🔍</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="shelters-page-filter-section">
          <div className="shelters-page-filter-group">
            <label htmlFor="type-filter">Тип притулку</label>
            <select
              id="type-filter"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="shelters-page-filter-select"
            >
              {shelterTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="shelters-page-filter-group">
            <label htmlFor="location-filter">Місто</label>
            <select
              id="location-filter"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="shelters-page-filter-select"
            >
              {locations.map(location => (
                <option key={location.value} value={location.value}>{location.label}</option>
              ))}
            </select>
          </div>

          <div className="shelters-page-filter-group checkbox-group">
            <label className="shelters-page-checkbox-label">
              <input
                type="checkbox"
                name="verified"
                checked={filters.verified}
                onChange={handleCheckboxChange}
                className="shelters-page-checkbox"
              />
              Тільки перевірені притулки
            </label>
          </div>

          <button className="shelters-page-clear-filters-btn" onClick={clearFilters}>
            Скинути фільтри
          </button>
        </div>

        <div className="shelters-page-results-count">
          <p>Знайдено: {totalCount} притулків</p>
        </div>

        {loading ? (
          <div className="shelters-page-loading-container">
            <div className="shelters-page-loading-spinner"></div>
            <p>Завантаження даних...</p>
          </div>
        ) : error ? (
          <div className="shelters-page-error-container">
            <h3>Помилка завантаження даних</h3>
            <p>{error}</p>
            <button className="btn-secondary" onClick={() => window.location.reload()}>
              Спробувати знову
            </button>
          </div>
        ) : (
          <>
            <div className="shelters-page-grid">
              {shelters.length > 0 ? (
                shelters.map(shelter => (
                  <ShelterCard key={shelter._id || shelter.id} shelter={shelter} />
                ))
              ) : (
                <div className="shelters-page-no-results">
                  <p>На жаль, немає притулків, що відповідають вашим критеріям пошуку.</p>
                  <button className="btn-secondary" onClick={clearFilters}>Скинути фільтри</button>
                </div>
              )}
            </div>
            
            <Pagination />
          </>
        )}
      </div>
    </div>
  );
};

export default SheltersPage;
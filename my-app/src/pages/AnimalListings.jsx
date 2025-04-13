import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAnimals } from '../services/animalService';
import '../styles/main.css';
import defaultAnimalImage from '../assets/default-animal.jpg';
import headerBackground from '../assets/animals-header.jpg';

// Оптимізований компонент картки тварини з кращою обробкою помилок
const AnimalCard = ({ animal, toggleFavorite, onCardClick }) => {
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = defaultAnimalImage;
  };

  return (
    <div className="animal-listings-card" onClick={() => onCardClick(animal)}>
      <div className="animal-listings-image-container">
        <img 
          src={animal.image} 
          alt={animal.name} 
          className="animal-listings-image" 
          onError={handleImageError}
        />
        <button 
          className={`animal-listings-favorite-btn ${animal.isFavorite ? 'favorited' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(animal._id || animal.id);
          }}
          aria-label={animal.isFavorite ? "Видалити з улюблених" : "Додати до улюблених"}
        >
          {animal.isFavorite ? '❤️' : '🤍'}
        </button>
        <span className={`animal-listings-status-badge ${animal.status}`}>
          {animal.status === 'available' ? 'Доступний' : 
           animal.status === 'reserved' ? 'Зарезервований' : 'Прилаштований'}
        </span>
      </div>
      <div className="animal-listings-details">
        <h3>{animal.name}</h3>
        <p className="animal-listings-type">
          {animal.type === 'cat' ? 'Кіт' : 
           animal.type === 'dog' ? 'Собака' : 
           animal.type === 'bird' ? 'Птах' : 'Інше'}, 
          {animal.gender === 'male' ? ' хлопчик' : ' дівчинка'}, {animal.age}
        </p>
        <p className="animal-listings-shelter">
          {animal.shelterInfo?.name || animal.shelterName || 'Невідомий притулок'}
        </p>
      </div>
    </div>
  );
};

const AnimalListings = () => {
  // Стани для керування даними та UI
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const pageSize = 12;

  // Стан для фільтрів
  const [filters, setFilters] = useState({
    type: 'all',
    gender: 'all',
    age: 'all',
    location: 'all',
    status: 'available',
    searchQuery: '',
  });

  // Опції для фільтрів
  const animalTypes = [
    { value: 'all', label: 'Всі типи' },
    { value: 'dog', label: 'Собаки' },
    { value: 'cat', label: 'Коти' },
    { value: 'bird', label: 'Птахи' },
    { value: 'other', label: 'Інші' },
  ];

  const genders = [
    { value: 'all', label: 'Будь-яка стать' },
    { value: 'male', label: 'Хлопчики' },
    { value: 'female', label: 'Дівчатка' },
  ];

  const ages = [
    { value: 'all', label: 'Будь-який вік' },
    { value: 'baby', label: 'До 6 місяців' },
    { value: 'young', label: 'До 2 років' },
    { value: 'adult', label: 'Від 2 до 8 років' },
    { value: 'senior', label: 'Старше 8 років' },
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
    const fetchAnimals = async () => {
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
        
        // Отримання тварин з сервісу
        const response = await getAnimals(queryParams);
        
        setAnimals(response.data || []);
        setTotalCount(response.totalCount || response.data?.length || 0);
        
      } catch (err) {
        console.error('Error fetching animals:', err);
        setError('Не вдалося завантажити список тварин. Будь ласка, спробуйте пізніше.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, [currentPage, filters]);

  // Обробка зміни фільтрів
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Скидаємо на першу сторінку при зміні фільтрів
  };

  // Скидання фільтрів
  const clearFilters = () => {
    setFilters({
      type: 'all',
      gender: 'all',
      age: 'all',
      location: 'all',
      status: 'available',
      searchQuery: '',
    });
    setCurrentPage(1);
  };

  // Додавання/Видалення з обраних
  const toggleFavorite = (animalId) => {
    setAnimals(animals.map(animal => {
      if ((animal._id || animal.id) === animalId) {
        return { ...animal, isFavorite: !animal.isFavorite };
      }
      return animal;
    }));
    
    if (selectedAnimal && (selectedAnimal._id || selectedAnimal.id) === animalId) {
      setSelectedAnimal({
        ...selectedAnimal,
        isFavorite: !selectedAnimal.isFavorite
      });
    }
  };

  // Відкриття модального вікна з детальною інформацією
  const openAnimalDetails = (animal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Блокуємо прокрутку body
  };

  // Закриття модального вікна
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto'; // Відновлюємо прокрутку body
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
      <div className="animal-listings-pagination">
        <button 
          className="animal-listings-page-btn"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          &laquo; Назад
        </button>
        
        <div className="animal-listings-page-indicators">
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
          className="animal-listings-page-btn"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Далі &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="animal-listings-page">
      <div className="animal-listings-top-section" 
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${headerBackground})` }}>
        <div className="container">
          <h1>Знайдіть тварину, яка чекає на вас</h1>
          <div className="animal-listings-search-box">
            <input
              type="text"
              name="searchQuery"
              value={filters.searchQuery}
              onChange={handleFilterChange}
              placeholder="Пошук за назвою, описом або притулком..."
              className="animal-listings-search-input"
            />
            <button className="animal-listings-search-btn" aria-label="Пошук">🔍</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="animal-listings-filter-section">
          <div className="animal-listings-filter-group">
            <label htmlFor="type-filter">Тип тварини</label>
            <select
              id="type-filter"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="animal-listings-filter-select"
            >
              {animalTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="animal-listings-filter-group">
            <label htmlFor="gender-filter">Стать</label>
            <select
              id="gender-filter"
              name="gender"
              value={filters.gender}
              onChange={handleFilterChange}
              className="animal-listings-filter-select"
            >
              {genders.map(gender => (
                <option key={gender.value} value={gender.value}>{gender.label}</option>
              ))}
            </select>
          </div>

          <div className="animal-listings-filter-group">
            <label htmlFor="location-filter">Місто</label>
            <select
              id="location-filter"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="animal-listings-filter-select"
            >
              {locations.map(location => (
                <option key={location.value} value={location.value}>{location.label}</option>
              ))}
            </select>
          </div>

          <div className="animal-listings-filter-group">
            <label htmlFor="age-filter">Вік</label>
            <select
              id="age-filter"
              name="age"
              value={filters.age}
              onChange={handleFilterChange}
              className="animal-listings-filter-select"
            >
              {ages.map(age => (
                <option key={age.value} value={age.value}>{age.label}</option>
              ))}
            </select>
          </div>

          <div className="animal-listings-filter-group">
            <label htmlFor="status-filter">Статус</label>
            <select
              id="status-filter"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="animal-listings-filter-select"
            >
              <option value="available">Доступні</option>
              <option value="reserved">Зарезервовані</option>
              <option value="adopted">Прилаштовані</option>
              <option value="all">Всі</option>
            </select>
          </div>

          <button className="animal-listings-clear-filters-btn" onClick={clearFilters}>
            Скинути фільтри
          </button>
        </div>

        <div className="animal-listings-results-count">
          <p>Знайдено: {totalCount} тварин</p>
        </div>

        {loading ? (
          <div className="animal-listings-loading-container">
            <div className="animal-listings-loading-spinner"></div>
            <p>Завантаження даних...</p>
          </div>
        ) : error ? (
          <div className="animal-listings-error-container">
            <h3>Помилка завантаження даних</h3>
            <p>{error}</p>
            <button className="btn-secondary" onClick={() => window.location.reload()}>
              Спробувати знову
            </button>
          </div>
        ) : (
          <>
            <div className="animal-listings-grid">
              {animals.length > 0 ? (
                animals.map(animal => (
                  <AnimalCard 
                    key={animal._id || animal.id} 
                    animal={animal} 
                    toggleFavorite={toggleFavorite}
                    onCardClick={openAnimalDetails}
                  />
                ))
              ) : (
                <div className="animal-listings-no-results">
                  <p>На жаль, немає тварин, що відповідають вашим критеріям пошуку.</p>
                  <button className="btn-secondary" onClick={clearFilters}>Скинути фільтри</button>
                </div>
              )}
            </div>
            
            <Pagination />
          </>
        )}
      </div>

      {/* Модальне вікно з детальною інформацією */}
      {isModalOpen && selectedAnimal && (
        <div className="animal-listings-modal-overlay" onClick={closeModal}>
          <div className="animal-listings-modal" onClick={e => e.stopPropagation()}>
            <button className="animal-listings-close-modal-btn" onClick={closeModal} aria-label="Закрити">✕</button>
            <div className="animal-listings-modal-content">
              <div className="animal-listings-modal-image-container">
                <img 
                  src={selectedAnimal.image} 
                  alt={selectedAnimal.name} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultAnimalImage;
                  }}
                />
                <button 
                  className={`animal-listings-favorite-btn large ${selectedAnimal.isFavorite ? 'favorited' : ''}`}
                  onClick={() => toggleFavorite(selectedAnimal._id || selectedAnimal.id)}
                  aria-label={selectedAnimal.isFavorite ? "Видалити з улюблених" : "Додати до улюблених"}
                >
                  {selectedAnimal.isFavorite ? '❤️' : '🤍'}
                </button>
                <div className={`animal-listings-modal-status ${selectedAnimal.status}`}>
                  {selectedAnimal.status === 'available' ? 'Доступний' : 
                   selectedAnimal.status === 'reserved' ? 'Зарезервований' : 'Прилаштований'}
                </div>
              </div>
              <div className="animal-listings-modal-details">
                <h2>{selectedAnimal.name}</h2>
                <div className="animal-listings-modal-tags">
                  <span className="animal-listings-tag">
                    {selectedAnimal.type === 'cat' ? 'Кіт' : 
                     selectedAnimal.type === 'dog' ? 'Собака' : 
                     selectedAnimal.type === 'bird' ? 'Птах' : 'Інше'}
                  </span>
                  <span className="animal-listings-tag">
                    {selectedAnimal.gender === 'male' ? 'Хлопчик' : 'Дівчинка'}
                  </span>
                  <span className="animal-listings-tag">{selectedAnimal.age}</span>
                </div>
                <div className="animal-listings-modal-info">
                  <div className="animal-listings-modal-info-item">
                    <span className="animal-listings-modal-info-label">Притулок:</span>
                    <span className="animal-listings-modal-info-value">
                      {selectedAnimal.shelterInfo?.name || selectedAnimal.shelterName || 'Невідомий притулок'}
                    </span>
                  </div>
                  <div className="animal-listings-modal-info-item">
                    <span className="animal-listings-modal-info-label">Порода:</span>
                    <span className="animal-listings-modal-info-value">
                      {selectedAnimal.breed || 'Невідома'}
                    </span>
                  </div>
                  <div className="animal-listings-modal-info-item">
                    <span className="animal-listings-modal-info-label">Розмір:</span>
                    <span className="animal-listings-modal-info-value">
                      {selectedAnimal.size === 'small' ? 'Малий' : 
                       selectedAnimal.size === 'medium' ? 'Середній' : 
                       selectedAnimal.size === 'large' ? 'Великий' : 'Невідомо'}
                    </span>
                  </div>
                  <div className="animal-listings-modal-info-item">
                    <span className="animal-listings-modal-info-label">Здоров'я:</span>
                    <span className="animal-listings-modal-info-value">
                      {selectedAnimal.health || 'Інформація відсутня'}
                    </span>
                  </div>
                </div>
                
                <div className="animal-listings-modal-description">
                  <h3>Опис</h3>
                  <p>{selectedAnimal.description || 'Опис відсутній'}</p>
                </div>
                
                <div className="animal-listings-modal-actions">
                  <Link 
                    to={`/shelters/${selectedAnimal.shelterId || selectedAnimal.shelterInfo?._id}`} 
                    className="animal-listings-btn-secondary"
                  >
                    Переглянути притулок
                  </Link>
                  {selectedAnimal.status === 'available' && (
                    <Link 
                      to={`/adoption-request/${selectedAnimal._id || selectedAnimal.id}`} 
                      className="animal-listings-btn-primary"
                    >
                      Подати запит на усиновлення
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalListings;
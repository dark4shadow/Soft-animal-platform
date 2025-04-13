import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getShelterIntakeRequests, updateIntakeRequestStatus, getOpenIntakeRequests } from '../services/animalIntakeService';
import { FaDog, FaCat, FaPaw, FaExclamationTriangle, FaClock, FaFilter } from 'react-icons/fa';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import '../styles/IntakeRequests.css';

const ShelterIntakeRequests = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [shelterRequests, setShelterRequests] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('shelter-requests');
  const [loading, setLoading] = useState({
    shelterRequests: true,
    openRequests: false
  });
  const [error, setError] = useState({
    shelterRequests: '',
    openRequests: ''
  });
  const [filters, setFilters] = useState({
    type: '',
    urgency: '',
    location: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check if user is authenticated and is a shelter
  useEffect(() => {
    if (!isAuthenticated || currentUser?.userType !== 'shelter') {
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, navigate]);
  
  // Fetch shelter-specific requests
  useEffect(() => {
    const fetchShelterRequests = async () => {
      if (!currentUser?.shelterId) return;
      
      try {
        setLoading(prev => ({ ...prev, shelterRequests: true }));
        setError(prev => ({ ...prev, shelterRequests: '' }));
        
        // In a real app, we would use:
        // const data = await getShelterIntakeRequests(currentUser.shelterId);
        
        // For now, using dummy data
        setTimeout(() => {
          const dummyData = [
            {
              _id: '1',
              status: 'pending',
              createdAt: new Date().toISOString(),
              volunteerId: {
                _id: 'v1',
                name: 'Волонтер 1',
                email: 'volunteer1@example.com',
                phone: '+380991234567'
              },
              animalInfo: {
                type: 'dog',
                breed: 'Метис',
                estimatedAge: '3 роки',
                gender: 'male',
                health: 'Здоровий, потребує вакцинації',
                description: 'Дружелюбний пес, знайдений на вулиці'
              },
              foundDetails: {
                location: 'Парк біля центру',
                date: new Date().toISOString(),
                circumstances: 'Знайдений без нагляду, очевидно бездомний'
              },
              urgency: 'medium',
              photos: ['/placeholder-animal.png']
            },
            {
              _id: '2',
              status: 'pending',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              volunteerId: {
                _id: 'v2',
                name: 'Волонтер 2',
                email: 'volunteer2@example.com',
                phone: '+380667654321'
              },
              animalInfo: {
                type: 'cat',
                breed: 'Сірий кіт',
                estimatedAge: '1 рік',
                gender: 'female',
                health: 'Потребує ветеринарного огляду',
                description: 'Молода кішка, дуже лагідна'
              },
              foundDetails: {
                location: 'Район залізничного вокзалу',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                circumstances: 'Сиділа під кіоском, голодна'
              },
              urgency: 'high',
              photos: ['/placeholder-animal.png']
            }
          ];
          
          setShelterRequests(dummyData);
          setLoading(prev => ({ ...prev, shelterRequests: false }));
        }, 1000);
      } catch (err) {
        console.error('Помилка завантаження запитів притулку:', err);
        setError(prev => ({ 
          ...prev, 
          shelterRequests: 'Не вдалося завантажити ваші запити. Спробуйте оновити сторінку.' 
        }));
        setLoading(prev => ({ ...prev, shelterRequests: false }));
      }
    };
    
    fetchShelterRequests();
  }, [currentUser?.shelterId]);
  
  // Fetch open requests when tab is switched
  useEffect(() => {
    const fetchOpenRequests = async () => {
      if (activeTab !== 'open-requests') return;
      
      try {
        setLoading(prev => ({ ...prev, openRequests: true }));
        setError(prev => ({ ...prev, openRequests: '' }));
        
        // In a real app:
        // const data = await getOpenIntakeRequests(filters);
        
        // For now, using dummy data
        setTimeout(() => {
          const dummyData = [
            {
              _id: '3',
              status: 'pending',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              volunteerId: {
                _id: 'v3',
                name: 'Волонтер 3',
                email: 'volunteer3@example.com',
                phone: '+380939876543'
              },
              animalInfo: {
                type: 'dog',
                breed: 'Німецька вівчарка',
                estimatedAge: '5 років',
                gender: 'male',
                health: 'Загалом здоровий, але кульгає на задню лапу',
                description: 'Дорослий пес, дружній до людей, потребує дому'
              },
              foundDetails: {
                location: 'Район Оболонь',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                circumstances: 'Знайдений прив\'язаним до дерева в парку'
              },
              urgency: 'critical',
              temporaryKeeping: {
                isKept: true,
                limitDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                conditions: 'Тримаю на балконі, не можу довго утримувати'
              },
              photos: ['/placeholder-animal.png', '/placeholder-animal.png']
            },
            {
              _id: '4',
              status: 'pending',
              createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
              volunteerId: {
                _id: 'v4',
                name: 'Волонтер 4',
                email: 'volunteer4@example.com',
                phone: '+380952223344'
              },
              animalInfo: {
                type: 'cat',
                breed: 'Сіамська',
                estimatedAge: '2 роки',
                gender: 'female',
                health: 'Здорова, стерилізована',
                description: 'Спокійна кішка, підходить для квартири'
              },
              foundDetails: {
                location: 'Район Теремки',
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                circumstances: 'Знайдена на вулиці з кошенятами, кошенят вже прилаштували'
              },
              urgency: 'medium',
              photos: ['/placeholder-animal.png']
            }
          ];
          
          setOpenRequests(dummyData);
          setLoading(prev => ({ ...prev, openRequests: false }));
        }, 1000);
      } catch (err) {
        console.error('Помилка завантаження відкритих запитів:', err);
        setError(prev => ({ 
          ...prev, 
          openRequests: 'Не вдалося завантажити відкриті запити. Спробуйте оновити сторінку.' 
        }));
        setLoading(prev => ({ ...prev, openRequests: false }));
      }
    };
    
    fetchOpenRequests();
  }, [activeTab, filters]);
  
  // Handle request action (approve or reject)
  const handleRequestAction = async (requestId, action, requestType) => {
    try {
      // In a real app:
      // await updateIntakeRequestStatus(requestId, {
      //   status: action === 'approve' ? 'approved' : 'rejected',
      //   comment: action === 'reject' ? prompt('Вкажіть причину відхилення:') : undefined
      // });
      
      // Update local state
      const updateRequestsList = (list) => 
        list.map(req => 
          req._id === requestId 
            ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' } 
            : req
        );
      
      if (requestType === 'shelter') {
        setShelterRequests(updateRequestsList(shelterRequests));
      } else {
        setOpenRequests(updateRequestsList(openRequests));
      }
      
      setSuccessMessage(
        action === 'approve' 
          ? 'Запит успішно схвалено. Зв\'яжіться з волонтером для подальших дій.' 
          : 'Запит відхилено.'
      );
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Помилка обробки запиту:', err);
      setError({
        ...error,
        [requestType === 'shelter' ? 'shelterRequests' : 'openRequests']: 
          'Помилка обробки запиту. Спробуйте знову.'
      });
    }
  };
  
  // Filter open requests
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Helper functions for UI
  const getAnimalTypeIcon = (type) => {
    switch (type) {
      case 'dog':
        return <FaDog />;
      case 'cat':
        return <FaCat />;
      default:
        return <FaPaw />;
    }
  };
  
  const getAnimalTypeText = (type) => {
    switch (type) {
      case 'dog':
        return 'Собака';
      case 'cat':
        return 'Кіт';
      default:
        return 'Інше';
    }
  };
  
  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <FaExclamationTriangle className="critical-urgency" />;
      case 'high':
        return <FaExclamationTriangle className="high-urgency" />;
      case 'medium':
      case 'low':
      default:
        return <FaClock className="medium-urgency" />;
    }
  };
  
  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'Критична';
      case 'high':
        return 'Висока';
      case 'medium':
        return 'Середня';
      case 'low':
      default:
        return 'Низька';
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  return (
    <div className="shelter-intake-requests-page">
      <div className="container">
        <h1>Запити на прийом тварин</h1>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'shelter-requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('shelter-requests')}
          >
            Запити до вашого притулку
          </button>
          <button 
            className={`tab ${activeTab === 'open-requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('open-requests')}
          >
            Відкриті запити
          </button>
        </div>
        
        {successMessage && <Alert type="success" message={successMessage} />}
        
        {activeTab === 'shelter-requests' && (
          <div className="shelter-requests-tab">
            {error.shelterRequests && <Alert type="error" message={error.shelterRequests} />}
            
            {loading.shelterRequests ? (
              <div className="loading-container">
                <Spinner size="medium" />
                <p>Завантаження запитів...</p>
              </div>
            ) : shelterRequests.length > 0 ? (
              <div className="intake-requests-list">
                {shelterRequests.map(request => (
                  <div key={request._id} className={`intake-request-card ${request.status}`}>
                    <div className="request-header">
                      <div className="request-type">
                        {getAnimalTypeIcon(request.animalInfo.type)}
                        <span>{getAnimalTypeText(request.animalInfo.type)}</span>
                      </div>
                      
                      <div className="request-status">
                        <span>{request.status === 'pending' ? 'В очікуванні' : 
                              request.status === 'approved' ? 'Схвалено' : 
                              request.status === 'rejected' ? 'Відхилено' : 'Скасовано'}</span>
                      </div>
                    </div>
                    
                    <div className="request-details">
                      <div className="request-info">
                        <h3>
                          {request.animalInfo.breed 
                            ? `${getAnimalTypeText(request.animalInfo.type)} - ${request.animalInfo.breed}` 
                            : getAnimalTypeText(request.animalInfo.type)
                          }
                          {request.animalInfo.estimatedAge && `, ~${request.animalInfo.estimatedAge}`}
                        </h3>
                        
                        <p className="request-description">{request.animalInfo.description}</p>
                        
                        <div className="request-meta">
                          <div className="meta-item">
                            <strong>Місце:</strong> {request.foundDetails.location}
                          </div>
                          
                          <div className="meta-item">
                            <strong>Знайдено:</strong> {formatDate(request.foundDetails.date)}
                          </div>
                          
                          <div className="meta-item volunteer-info">
                            <strong>Волонтер:</strong> {request.volunteerId.name}, {request.volunteerId.phone}
                          </div>
                          
                          <div className="meta-item urgency-indicator">
                            <strong>Терміновість:</strong>
                            <span className={`urgency-badge ${request.urgency}`}>
                              {getUrgencyIcon(request.urgency)} {getUrgencyText(request.urgency)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {request.photos && request.photos.length > 0 && (
                        <div className="request-photo">
                          <img 
                            src={request.photos[0]} 
                            alt="Фото тварини" 
                          />
                          {request.photos.length > 1 && (
                            <span className="photo-count">+{request.photos.length - 1}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="request-footer">
                      <div className="request-actions">
                        <Link 
                          to={`/intake-request/${request._id}`} 
                          className="btn outline-btn"
                        >
                          Деталі
                        </Link>
                        
                        {request.status === 'pending' && (
                          <>
                            <button 
                              className="btn success-btn"
                              onClick={() => handleRequestAction(request._id, 'approve', 'shelter')}
                            >
                              Прийняти тварину
                            </button>
                            <button 
                              className="btn danger-btn"
                              onClick={() => handleRequestAction(request._id, 'reject', 'shelter')}
                            >
                              Відхилити
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Наразі до вашого притулку немає запитів на прийом тварин.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'open-requests' && (
          <div className="open-requests-tab">
            <div className="filters-panel">
              <h3><FaFilter /> Фільтри</h3>
              <div className="filters-form">
                <div className="filter-group">
                  <label htmlFor="type">Тип тварини</label>
                  <select 
                    id="type" 
                    name="type" 
                    value={filters.type} 
                    onChange={handleFilterChange}
                  >
                    <option value="">Всі типи</option>
                    <option value="dog">Собаки</option>
                    <option value="cat">Коти</option>
                    <option value="other">Інші</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="urgency">Терміновість</label>
                  <select 
                    id="urgency" 
                    name="urgency" 
                    value={filters.urgency} 
                    onChange={handleFilterChange}
                  >
                    <option value="">Всі</option>
                    <option value="critical">Критична</option>
                    <option value="high">Висока</option>
                    <option value="medium">Середня</option>
                    <option value="low">Низька</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="location">Місцезнаходження</label>
                  <input 
                    type="text" 
                    id="location" 
                    name="location" 
                    value={filters.location} 
                    onChange={handleFilterChange} 
                    placeholder="Введіть район чи адресу"
                  />
                </div>
              </div>
            </div>
            
            {error.openRequests && <Alert type="error" message={error.openRequests} />}
            
            {loading.openRequests ? (
              <div className="loading-container">
                <Spinner size="medium" />
                <p>Завантаження запитів...</p>
              </div>
            ) : openRequests.length > 0 ? (
              <div className="intake-requests-list">
                {openRequests.map(request => (
                  <div key={request._id} className={`intake-request-card ${request.status}`}>
                    <div className="request-header">
                      <div className="request-type">
                        {getAnimalTypeIcon(request.animalInfo.type)}
                        <span>{getAnimalTypeText(request.animalInfo.type)}</span>
                      </div>
                      
                      <div className="request-urgency">
                        <span className={`urgency-badge ${request.urgency}`}>
                          {getUrgencyIcon(request.urgency)} {getUrgencyText(request.urgency)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="request-details">
                      <div className="request-info">
                        <h3>
                          {request.animalInfo.breed 
                            ? `${getAnimalTypeText(request.animalInfo.type)} - ${request.animalInfo.breed}` 
                            : getAnimalTypeText(request.animalInfo.type)
                          }
                          {request.animalInfo.estimatedAge && `, ~${request.animalInfo.estimatedAge}`}
                        </h3>
                        
                        <p className="request-description">{request.animalInfo.description}</p>
                        
                        <div className="request-meta">
                          <div className="meta-item">
                            <strong>Місце:</strong> {request.foundDetails.location}
                          </div>
                          
                          <div className="meta-item">
                            <strong>Знайдено:</strong> {formatDate(request.foundDetails.date)}
                          </div>
                          
                          <div className="meta-item">
                            <strong>Запит від:</strong> {formatDate(request.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      {request.photos && request.photos.length > 0 && (
                        <div className="request-photo">
                          <img 
                            src={request.photos[0]} 
                            alt="Фото тварини" 
                          />
                          {request.photos.length > 1 && (
                            <span className="photo-count">+{request.photos.length - 1}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="request-footer">
                      <div className="request-actions">
                        <Link 
                          to={`/intake-request/${request._id}`} 
                          className="btn outline-btn"
                        >
                          Деталі
                        </Link>
                        
                        <button 
                          className="btn success-btn"
                          onClick={() => handleRequestAction(request._id, 'approve', 'open')}
                        >
                          Прийняти тварину
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Наразі немає відкритих запитів на прийом тварин.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelterIntakeRequests;
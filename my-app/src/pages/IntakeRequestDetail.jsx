import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaDog, FaCat, FaPaw, FaMapMarkerAlt, FaClock, FaMedkit } from 'react-icons/fa';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';

const IntakeRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // This would be replaced with actual API call
    const fetchRequestDetails = async () => {
      try {
        setLoading(true);
        // Placeholder for actual API call
        // const data = await getIntakeRequestById(id);
        // setRequest(data);
        
        // Using dummy data for now
        setTimeout(() => {
          setRequest({
            _id: id,
            status: 'pending',
            createdAt: new Date().toISOString(),
            volunteerId: {
              _id: '123',
              name: 'Волонтер Тест',
              email: 'volunteer@example.com',
              phone: '+380991234567'
            },
            animalInfo: {
              type: 'dog',
              breed: 'Метис',
              gender: 'male',
              estimatedAge: '2 роки',
              health: 'Загалом здоровий, потребує вакцинації',
              description: 'Дружелюбний пес, знайдений на вулиці. Ласкавий та грайливий.'
            },
            foundDetails: {
              location: 'Парк біля вул. Шевченка',
              date: new Date().toISOString(),
              circumstances: 'Знайшов у парку, бігав сам без господаря два дні'
            },
            temporaryKeeping: {
              isKept: true,
              limitDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              conditions: 'Тримаю вдома, але не можу залишити надовго'
            },
            urgency: 'medium',
            comment: 'Буду дуже вдячний за допомогу з прилаштуванням',
            photos: [
              '/placeholder-animal.png',
              '/placeholder-animal.png'
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Помилка завантаження даних запиту:', err);
        setError('Не вдалося завантажити дані запиту. Спробуйте пізніше.');
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner size="large" />
        <p>Завантаження деталей запиту...</p>
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!request) {
    return <Alert type="error" message="Запит не знайдено" />;
  }

  const getAnimalTypeIcon = (type) => {
    switch (type) {
      case 'dog': return <FaDog size={24} />;
      case 'cat': return <FaCat size={24} />;
      default: return <FaPaw size={24} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="intake-request-detail-page">
      <div className="container">
        <div className="page-header">
          <h1>Деталі запиту на прийом тварини</h1>
          <Link to="/volunteer/intake-requests" className="btn secondary-btn">
            Назад до списку запитів
          </Link>
        </div>

        <div className="request-status-bar">
          <div className={`status-badge ${request.status}`}>
            {request.status === 'pending' ? 'В очікуванні' :
             request.status === 'approved' ? 'Схвалено' :
             request.status === 'rejected' ? 'Відхилено' : 'Скасовано'}
          </div>
          <div className="request-date">
            Створено: {formatDate(request.createdAt)}
          </div>
        </div>

        <div className="request-details-container">
          <div className="request-main-info">
            <div className="animal-info-section">
              <h2>
                {getAnimalTypeIcon(request.animalInfo.type)} 
                {request.animalInfo.type === 'dog' ? 'Собака' : 
                 request.animalInfo.type === 'cat' ? 'Кіт' : 'Інша тварина'}
                {request.animalInfo.breed && ` - ${request.animalInfo.breed}`}
              </h2>
              
              <p className="animal-description">{request.animalInfo.description}</p>
              
              <div className="info-grid">
                <div className="info-item">
                  <strong>Стать:</strong> 
                  {request.animalInfo.gender === 'male' ? 'Самець' : 
                   request.animalInfo.gender === 'female' ? 'Самка' : 'Невідомо'}
                </div>
                
                <div className="info-item">
                  <strong>Приблизний вік:</strong> {request.animalInfo.estimatedAge || 'Невідомо'}
                </div>
                
                <div className="info-item health-info">
                  <FaMedkit /> <strong>Стан здоров'я:</strong>
                  <p>{request.animalInfo.health}</p>
                </div>
                
                <div className="info-item location-info">
                  <FaMapMarkerAlt /> <strong>Місце знаходження:</strong> {request.foundDetails.location}
                  <p><strong>Дата знаходження:</strong> {formatDate(request.foundDetails.date)}</p>
                  {request.foundDetails.circumstances && (
                    <p><strong>Обставини:</strong> {request.foundDetails.circumstances}</p>
                  )}
                </div>
                
                <div className="info-item">
                  <FaClock /> <strong>Терміновість:</strong> 
                  <span className={`urgency-badge ${request.urgency}`}>
                    {request.urgency === 'low' ? 'Низька' :
                     request.urgency === 'medium' ? 'Середня' :
                     request.urgency === 'high' ? 'Висока' : 'Критична'}
                  </span>
                </div>
                
                {request.temporaryKeeping.isKept && (
                  <div className="info-item keeping-info">
                    <strong>Тимчасове утримання:</strong>
                    <p>Тварину тримає волонтер до: {formatDate(request.temporaryKeeping.limitDate)}</p>
                    {request.temporaryKeeping.conditions && (
                      <p><strong>Умови утримання:</strong> {request.temporaryKeeping.conditions}</p>
                    )}
                  </div>
                )}
                
                {request.comment && (
                  <div className="info-item comment-section">
                    <strong>Додатковий коментар:</strong>
                    <p>{request.comment}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Volunteer info section for shelter view */}
            {currentUser && currentUser.userType === 'shelter' && (
              <div className="volunteer-info-section">
                <h3>Інформація про волонтера</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Ім'я:</strong> {request.volunteerId.name}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {request.volunteerId.email}
                  </div>
                  <div className="info-item">
                    <strong>Телефон:</strong> {request.volunteerId.phone || 'Не вказано'}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Photos gallery */}
          {request.photos && request.photos.length > 0 && (
            <div className="request-photos">
              <h3>Фотографії</h3>
              <div className="photo-gallery">
                <div className="main-photo">
                  <img src={request.photos[activeImageIndex]} alt="Фото тварини" />
                </div>
                
                {request.photos.length > 1 && (
                  <div className="thumbnails">
                    {request.photos.map((photo, index) => (
                      <div 
                        key={index} 
                        className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <img src={photo} alt={`Фото тварини ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Action buttons section */}
        <div className="request-actions">
          {currentUser && currentUser.userType === 'volunteer' && request.status === 'pending' && (
            <button 
              className="btn danger-btn" 
              onClick={() => {
                if (window.confirm('Ви впевнені, що хочете скасувати цей запит?')) {
                  // cancelIntakeRequest(request._id)
                  //   .then(() => navigate('/volunteer/intake-requests'))
                  //   .catch(err => setError('Помилка скасування запиту: ' + err.message));
                  alert('Функція скасування запиту буде реалізована пізніше');
                }
              }}
            >
              Скасувати запит
            </button>
          )}
          
          {currentUser && currentUser.userType === 'shelter' && request.status === 'pending' && (
            <div className="shelter-actions">
              <button 
                className="btn success-btn"
                onClick={() => {
                  // updateIntakeRequestStatus(request._id, { status: 'approved' })
                  //   .then(() => navigate('/shelter/intake-requests'))
                  //   .catch(err => setError('Помилка оновлення статусу: ' + err.message));
                  alert('Функція схвалення запиту буде реалізована пізніше');
                }}
              >
                Прийняти тварину
              </button>
              <button 
                className="btn danger-btn"
                onClick={() => {
                  // updateIntakeRequestStatus(request._id, { 
                  //   status: 'rejected',
                  //   comment: prompt('Вкажіть причину відхилення:') 
                  // })
                  //   .then(() => navigate('/shelter/intake-requests'))
                  //   .catch(err => setError('Помилка оновлення статусу: ' + err.message));
                  alert('Функція відхилення запиту буде реалізована пізніше');
                }}
              >
                Відхилити запит
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntakeRequestDetail;
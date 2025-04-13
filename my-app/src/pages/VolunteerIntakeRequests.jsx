import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVolunteerIntakeRequests, cancelIntakeRequest } from '../services/animalIntakeService';
import { FaDog, FaCat, FaPaw, FaExclamationTriangle, FaClock, FaCheckCircle, FaTimesCircle, FaQuestionCircle } from 'react-icons/fa';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import '../styles/IntakeRequests.css';

const VolunteerIntakeRequests = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Завантажуємо запити волонтера
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getVolunteerIntakeRequests();
        setRequests(data || []);
      } catch (err) {
        console.error('Помилка завантаження запитів:', err);
        setError('Не вдалося завантажити ваші запити. Спробуйте оновити сторінку.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);
  
  // Обробник скасування запиту
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Ви впевнені, що хочете скасувати цей запит?')) {
      return;
    }
    
    try {
      await cancelIntakeRequest(requestId);
      
      // Оновлюємо список запитів
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === requestId 
            ? { ...request, status: 'cancelled' } 
            : request
        )
      );
      
      setSuccessMessage('Запит успішно скасовано.');
      
      // Приховуємо повідомлення через 3 секунди
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Помилка скасування запиту:', err);
      setError('Не вдалося скасувати запит. Спробуйте знову.');
      
      // Приховуємо повідомлення про помилку через 3 секунди
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };
  
  // Отримуємо іконку типу тварини
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
  
  // Отримуємо іконку терміновості
  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <FaExclamationTriangle className="critical-urgency" />;
      case 'high':
        return <FaExclamationTriangle className="high-urgency" />;
      case 'medium':
        return <FaClock className="medium-urgency" />;
      default:
        return <FaClock className="low-urgency" />;
    }
  };
  
  // Отримуємо іконку статусу
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FaCheckCircle className="approved-status" />;
      case 'rejected':
        return <FaTimesCircle className="rejected-status" />;
      case 'cancelled':
        return <FaTimesCircle className="cancelled-status" />;
      default:
        return <FaQuestionCircle className="pending-status" />;
    }
  };
  
  // Форматуємо текст статусу
  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Схвалено';
      case 'rejected':
        return 'Відхилено';
      case 'cancelled':
        return 'Скасовано';
      default:
        return 'В обробці';
    }
  };
  
  // Форматуємо текст типу тварини
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
  
  // Форматуємо текст терміновості
  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'Критична';
      case 'high':
        return 'Висока';
      case 'medium':
        return 'Середня';
      default:
        return 'Низька';
    }
  };
  
  // Форматуємо дату
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <Spinner size="large" />
        <p>Завантаження ваших запитів...</p>
      </div>
    );
  }
  
  return (
    <div className="intake-requests-page">
      <div className="container">
        <div className="page-header">
          <h1>Мої запити на прийом тварин</h1>
          <Link to="/create-intake-request" className="btn primary-btn">
            Створити новий запит
          </Link>
        </div>
        
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}
        
        {requests.length === 0 ? (
          <div className="empty-state">
            <p>У вас поки немає запитів на прийом тварин</p>
            <Link to="/create-intake-request" className="btn secondary-btn">
              Створити перший запит
            </Link>
          </div>
        ) : (
          <div className="intake-requests-list">
            {requests.map(request => (
              <div key={request._id} className={`intake-request-card ${request.status}`}>
                <div className="request-header">
                  <div className="request-type">
                    {getAnimalTypeIcon(request.animalInfo.type)}
                    <span>{getAnimalTypeText(request.animalInfo.type)}</span>
                  </div>
                  
                  <div className="request-status">
                    {getStatusIcon(request.status)}
                    <span>{getStatusText(request.status)}</span>
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
                        src={`${process.env.REACT_APP_API_URL || ''}${request.photos[0]}`} 
                        alt="Фото тварини" 
                      />
                      {request.photos.length > 1 && (
                        <span className="photo-count">+{request.photos.length - 1}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="request-footer">
                  {request.shelterId ? (
                    <div className="shelter-info">
                      <strong>Притулок:</strong> {request.shelterId.name || 'Невідомо'}
                    </div>
                  ) : (
                    <div className="shelter-info">
                      <span>Відкритий запит (без конкретного притулку)</span>
                    </div>
                  )}
                  
                  <div className="request-actions">
                    <Link 
                      to={`/intake-request/${request._id}`} 
                      className="btn outline-btn"
                    >
                      Деталі
                    </Link>
                    
                    {request.status === 'pending' && (
                      <button 
                        className="btn danger-btn"
                        onClick={() => handleCancelRequest(request._id)}
                      >
                        Скасувати запит
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerIntakeRequests;
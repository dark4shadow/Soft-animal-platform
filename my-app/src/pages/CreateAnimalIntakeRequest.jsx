import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createIntakeRequest, uploadIntakePhotos } from '../services/animalIntakeService';
import { getShelters } from '../services/shelterService';
import { FaInfoCircle, FaCamera, FaHospital, FaMapMarkerAlt } from 'react-icons/fa';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import '../styles/FormPage.css';

const CreateAnimalIntakeRequest = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    animalInfo: {
      type: 'dog',
      breed: '',
      estimatedAge: '',
      gender: 'unknown',
      health: '',
      description: ''
    },
    foundDetails: {
      location: '',
      date: new Date().toISOString().split('T')[0],
      circumstances: ''
    },
    temporaryKeeping: {
      isKept: false,
      limitDate: '',
      conditions: ''
    },
    urgency: 'medium',
    shelterId: '',
    comment: ''
  });
  
  const [photos, setPhotos] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState(null);
  
  // Перевіряємо авторизацію
  useEffect(() => {
    // Додаємо console.log для діагностики
    console.log("Auth check in CreateAnimalIntakeRequest:");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("currentUser:", currentUser);
    
    // Додайте затримку для переконання, що контекст авторизації встиг оновитися
    const checkAuth = setTimeout(() => {
      if (!isAuthenticated) {
        console.log("Redirecting to login because user is not authenticated");
        navigate('/login', { state: { from: '/create-intake-request' } });
      } else if (currentUser && currentUser.userType !== 'volunteer') {
        console.log("User is not a volunteer:", currentUser.userType);
        setError('Ця функція доступна тільки для волонтерів');
      } else {
        console.log("User is authenticated and is a volunteer");
      }
    }, 100);
    
    return () => clearTimeout(checkAuth);
  }, [isAuthenticated, currentUser, navigate]);
  
  // Завантажуємо список притулків
  useEffect(() => {
    const loadShelters = async () => {
      try {
        const response = await getShelters();
        setShelters(response.data || []);
      } catch (err) {
        console.error('Помилка завантаження притулків:', err);
      }
    };
    
    loadShelters();
  }, []);
  
  // Обробник зміни полів форми
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Розділяємо name на секції (напр. "animalInfo.type")
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Обробник зміни чекбокса
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: checked
      });
    }
  };
  
  // Обробник зміни фото
  const handlePhotoChange = (e) => {
    if (e.target.files) {
      const newPhotos = [...photos];
      
      for (let i = 0; i < e.target.files.length; i++) {
        if (newPhotos.length < 5) {  // Максимум 5 фото
          newPhotos.push(e.target.files[i]);
        }
      }
      
      setPhotos(newPhotos);
    }
  };
  
  // Видалення фото зі списку
  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
  // Відправка форми
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Валідація
      if (!formData.animalInfo.description) {
        throw new Error('Опис тварини є обов\'язковим');
      }
      
      if (!formData.animalInfo.health) {
        throw new Error('Інформація про здоров\'я тварини є обов\'язковою');
      }
      
      if (!formData.foundDetails.location) {
        throw new Error('Місце знаходження тварини є обов\'язковим');
      }
      
      // Створення запиту
      const result = await createIntakeRequest(formData);
      
      // Зберігаємо ID створеного запиту
      setCreatedRequestId(result._id);
      
      // Завантажуємо фото, якщо вони є
      if (photos.length > 0) {
        const photosFormData = new FormData();
        photos.forEach(photo => {
          photosFormData.append('photos', photo);
        });
        
        await uploadIntakePhotos(result._id, photosFormData);
      }
      
      setSubmitSuccess(true);
      
      // Перенаправляємо на сторінку списку запитів
      setTimeout(() => {
        navigate('/volunteer/intake-requests');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Не вдалося створити запит. Спробуйте знову.');
      console.error('Error creating intake request:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="form-page">
      <div className="container">
        <h1>Повідомити про бездомну тварину</h1>
        
        <div className="form-container">
          {error && <Alert type="error" message={error} />}
          {submitSuccess && (
            <Alert 
              type="success" 
              message="Запит успішно створено! Ви будете перенаправлені на сторінку ваших запитів."
            />
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2><FaInfoCircle /> Інформація про тварину</h2>
              
              <div className="form-group">
                <label htmlFor="animalType">Тип тварини</label>
                <select
                  id="animalType"
                  name="animalInfo.type"
                  value={formData.animalInfo.type}
                  onChange={handleChange}
                  required
                >
                  <option value="dog">Собака</option>
                  <option value="cat">Кіт</option>
                  <option value="other">Інше</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="breed">Порода (якщо відома)</label>
                  <input
                    type="text"
                    id="breed"
                    name="animalInfo.breed"
                    value={formData.animalInfo.breed}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="estimatedAge">Приблизний вік</label>
                  <input
                    type="text"
                    id="estimatedAge"
                    name="animalInfo.estimatedAge"
                    placeholder="Наприклад: ~2 роки"
                    value={formData.animalInfo.estimatedAge}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="gender">Стать тварини</label>
                <select
                  id="gender"
                  name="animalInfo.gender"
                  value={formData.animalInfo.gender}
                  onChange={handleChange}
                >
                  <option value="male">Самець</option>
                  <option value="female">Самка</option>
                  <option value="unknown">Невідомо</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="health">Стан здоров'я</label>
                <textarea
                  id="health"
                  name="animalInfo.health"
                  placeholder="Опишіть видимий стан здоров'я тварини"
                  value={formData.animalInfo.health}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Опис тварини</label>
                <textarea
                  id="description"
                  name="animalInfo.description"
                  placeholder="Детально опишіть тварину, її зовнішній вигляд, поведінку і т.д."
                  value={formData.animalInfo.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
            </div>
            
            <div className="form-section">
              <h2><FaMapMarkerAlt /> Деталі знаходження</h2>
              
              <div className="form-group">
                <label htmlFor="location">Місце знаходження</label>
                <input
                  type="text"
                  id="location"
                  name="foundDetails.location"
                  placeholder="Адреса або опис місця"
                  value={formData.foundDetails.location}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="foundDate">Дата знаходження</label>
                <input
                  type="date"
                  id="foundDate"
                  name="foundDetails.date"
                  value={formData.foundDetails.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="circumstances">Обставини знаходження</label>
                <textarea
                  id="circumstances"
                  name="foundDetails.circumstances"
                  placeholder="Як ви знайшли цю тварину? За яких обставин?"
                  value={formData.foundDetails.circumstances}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            
            <div className="form-section">
              <h2><FaCamera /> Фотографії</h2>
              
              <div className="photo-upload-container">
                <div className="photo-upload">
                  <label htmlFor="photos" className="photo-upload-label">
                    <span>Додати фото</span>
                    <input
                      type="file"
                      id="photos"
                      name="photos"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                
                {photos.length > 0 && (
                  <div className="photo-preview-list">
                    {photos.map((photo, index) => (
                      <div key={index} className="photo-preview">
                        <img src={URL.createObjectURL(photo)} alt={`Фото тварини ${index + 1}`} />
                        <button 
                          type="button" 
                          className="remove-photo" 
                          onClick={() => handleRemovePhoto(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <small>Максимум 5 фото. Поточно завантажено: {photos.length}/5</small>
              </div>
            </div>
            
            <div className="form-section">
              <h2><FaHospital /> Тимчасовий догляд і притулок</h2>
              
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="isKept"
                  name="temporaryKeeping.isKept"
                  checked={formData.temporaryKeeping.isKept}
                  onChange={handleCheckboxChange}
                />
                <label htmlFor="isKept">Зараз тварина знаходиться у мене на тимчасовому утриманні</label>
              </div>
              
              {formData.temporaryKeeping.isKept && (
                <>
                  <div className="form-group">
                    <label htmlFor="limitDate">Як довго ви можете тримати тварину?</label>
                    <input
                      type="date"
                      id="limitDate"
                      name="temporaryKeeping.limitDate"
                      value={formData.temporaryKeeping.limitDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="conditions">Умови утримання</label>
                    <textarea
                      id="conditions"
                      name="temporaryKeeping.conditions"
                      placeholder="Опишіть умови, в яких зараз перебуває тварина"
                      value={formData.temporaryKeeping.conditions}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label htmlFor="urgency">Терміновість запиту</label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                >
                  <option value="low">Низька (можу тримати тварину тривалий час)</option>
                  <option value="medium">Середня (потрібно знайти притулок протягом 2-4 тижнів)</option>
                  <option value="high">Висока (потрібно знайти притулок протягом тижня)</option>
                  <option value="critical">Критична (потрібна негайна допомога)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="shelterId">Обрати притулок (опціонально)</label>
                <select
                  id="shelterId"
                  name="shelterId"
                  value={formData.shelterId}
                  onChange={handleChange}
                >
                  <option value="">Відкритий запит (без конкретного притулку)</option>
                  {shelters.map(shelter => (
                    <option key={shelter._id || shelter.id} value={shelter._id || shelter.id}>
                      {shelter.name} ({shelter.location})
                    </option>
                  ))}
                </select>
                <small>Якщо ви не обираєте конкретний притулок, ваш запит буде видимий всім притулкам</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="comment">Додатковий коментар</label>
                <textarea
                  id="comment"
                  name="comment"
                  placeholder="Будь-яка додаткова інформація, яка може бути корисною"
                  value={formData.comment}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn primary-btn"
              disabled={loading || submitSuccess}
            >
              {loading ? (
                <>
                  <Spinner size="small" />
                  <span>Надсилання...</span>
                </>
              ) : submitSuccess ? 'Запит створено' : 'Створити запит'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAnimalIntakeRequest;
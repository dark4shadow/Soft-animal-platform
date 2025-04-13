import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getShelterById, updateShelter } from '../services/shelterService';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import '../styles/pages/EntityFormPages.css';
import { FaHome, FaPhone, FaShareAlt, FaChartBar, FaHandHoldingHeart, FaImage } from 'react-icons/fa';

const EditShelterPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Якщо використовуєте маршрут з параметром
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'mixed',
    address: '',
    location: '',
    phone: '',
    email: '',
    description: '',
    fullDescription: '',
    workingHours: '',
    capacity: 0,
    foundedYear: new Date().getFullYear(),
    teamSize: 0,
    needsHelp: '',
    donationGoal: 0,
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Перевірка авторизації користувача як притулку
  useEffect(() => {
    if (!currentUser || currentUser.userType !== 'shelter' || !currentUser.shelterId) {
      navigate('/login');
      return;
    }

    // Завантаження даних притулку
    const fetchShelterData = async () => {
      try {
        setLoading(true);
        const shelter = await getShelterById(currentUser.shelterId);
        
        // Перетворення даних для форми
        setFormData({
          name: shelter.name || '',
          type: shelter.type || 'mixed',
          address: shelter.address || '',
          location: shelter.location || '',
          phone: shelter.phone || '',
          email: shelter.email || '',
          description: shelter.description || '',
          fullDescription: shelter.fullDescription || '',
          workingHours: shelter.workingHours || '',
          capacity: shelter.capacity || 0,
          foundedYear: shelter.foundedYear || new Date().getFullYear(),
          teamSize: shelter.teamSize || 0,
          needsHelp: Array.isArray(shelter.needsHelp) ? shelter.needsHelp.join(', ') : '',
          donationGoal: shelter.donationGoal || 0,
          socialMedia: {
            facebook: shelter.socialMedia?.facebook || '',
            instagram: shelter.socialMedia?.instagram || '',
            twitter: shelter.socialMedia?.twitter || ''
          }
        });
        
        // Встановлення превью існуючого зображення
        if (shelter.image) {
          setImagePreview(shelter.image);
        }
        
      } catch (err) {
        setError('Помилка завантаження даних притулку. Спробуйте знову пізніше.');
        console.error('Error fetching shelter data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShelterData();
  }, [currentUser, navigate]);

  // Обробник зміни полів форми
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Обробка вкладених полів (socialMedia)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Обробник завантаження зображення
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Створення превью для зображення
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      
      // Збереження файлу для відправки
      setImageFile(file);
    }
  };

  // Відправка форми
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Створюємо FormData для відправки файлів
      const shelterData = new FormData();
      
      // Перетворення needsHelp з рядка в масив
      const needsHelpArray = formData.needsHelp.split(',').map(item => item.trim()).filter(Boolean);
      
      // Підготовка оновлених даних
      const updatedData = {
        ...formData,
        needsHelp: needsHelpArray
      };
      
      // Додавання даних до FormData
      for (const [key, value] of Object.entries(updatedData)) {
        if (key === 'socialMedia') {
          for (const [smKey, smValue] of Object.entries(value)) {
            shelterData.append(`socialMedia[${smKey}]`, smValue);
          }
        } else {
          shelterData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
        }
      }
      
      // Додавання зображення, якщо воно було змінено
      if (imageFile) {
        shelterData.append('image', imageFile);
      }
      
      // Відправка даних на сервер
      await updateShelter(currentUser.shelterId, shelterData);
      
      // Показуємо повідомлення про успішне оновлення
      setSuccess('Дані притулку успішно оновлено!');
      window.scrollTo(0, 0);
    } catch (err) {
      setError('Помилка оновлення даних притулку: ' + (err.message || 'Невідома помилка'));
      console.error('Error updating shelter:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <Spinner size="large" />
        <p>Завантаження даних притулку...</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="container">
        <div className="form-container">
          <h1>Редагування інформації про притулок</h1>
          
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}
          
          <form onSubmit={handleSubmit}>
            {/* Основна інформація */}
            <div className="form-section">
              <h2><FaHome /> Основна інформація</h2>
              <div className="form-group">
                <label htmlFor="name">
                  Назва притулку
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="type">Тип притулку *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="cat">Котячий</option>
                  <option value="dog">Собачий</option>
                  <option value="mixed">Змішаний</option>
                  <option value="clinic">Ветеринарна клініка</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Адреса *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Місто *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            {/* Контактна інформація */}
            <div className="form-section">
              <h2><FaPhone /> Контактна інформація</h2>
              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
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
                />
              </div>
            </div>
            
            {/* Соціальні мережі */}
            <div className="form-section">
              <h2><FaShareAlt /> Соціальні мережі</h2>
              <div className="form-group">
                <label htmlFor="facebook">Facebook URL</label>
                <input
                  type="url"
                  id="facebook"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="instagram">Instagram URL</label>
                <input
                  type="url"
                  id="instagram"
                  name="socialMedia.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="twitter">Twitter URL</label>
                <input
                  type="url"
                  id="twitter"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {/* Опис та деталі */}
            <div className="form-section">
              <h2><FaChartBar /> Опис та деталі</h2>
              <div className="form-group">
                <label htmlFor="description">Короткий опис *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="fullDescription">Детальний опис</label>
                <textarea
                  id="fullDescription"
                  name="fullDescription"
                  value={formData.fullDescription}
                  onChange={handleChange}
                  rows={6}
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="workingHours">Години роботи</label>
                <input
                  type="text"
                  id="workingHours"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleChange}
                  placeholder="Напр.: Пн-Пт: 9:00-18:00, Сб-Нд: 10:00-16:00"
                />
              </div>
            </div>
            
            {/* Статистична інформація */}
            <div className="form-section">
              <h2><FaChartBar /> Статистична інформація</h2>
              <div className="form-group">
                <label htmlFor="capacity">Максимальна кількість тварин</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min={0}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="foundedYear">Рік заснування</label>
                <input
                  type="number"
                  id="foundedYear"
                  name="foundedYear"
                  value={formData.foundedYear}
                  onChange={handleChange}
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="teamSize">Кількість працівників</label>
                <input
                  type="number"
                  id="teamSize"
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleChange}
                  min={0}
                />
              </div>
            </div>
            
            {/* Потреби та збори */}
            <div className="form-section">
              <h2><FaHandHoldingHeart /> Потреби та збори</h2>
              <div className="form-group">
                <label htmlFor="needsHelp">Потреби (через кому)</label>
                <textarea
                  id="needsHelp"
                  name="needsHelp"
                  value={formData.needsHelp}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Корм, ліки, іграшки..."
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="donationGoal">Мета збору (грн)</label>
                <input
                  type="number"
                  id="donationGoal"
                  name="donationGoal"
                  value={formData.donationGoal}
                  onChange={handleChange}
                  min={0}
                />
              </div>
            </div>
            
            {/* Зображення притулку */}
            <div className="form-section">
              <h2><FaImage /> Зображення притулку</h2>
              <div className="form-group">
                <div className="image-upload-container">
                  <label htmlFor="image" className="image-upload-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>Натисніть для вибору головного зображення</span>
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                </div>
              </div>
              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Превью зображення притулку" className="image-preview" />
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => navigate('/shelter-dashboard')} 
                className="btn-secondary"
                disabled={submitting}
              >
                Скасувати
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={submitting}
              >
                {submitting ? 'Зберігається...' : 'Зберегти зміни'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditShelterPage;
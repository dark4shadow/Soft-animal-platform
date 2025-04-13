import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAnimal } from '../services/animalService';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import '../styles/pages/EntityFormPages.css';
// Іконки для секцій
import { FaPaw, FaInfoCircle, FaImage, FaNotesMedical, FaTag } from 'react-icons/fa';

const AddAnimalPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'cat',        // Changed from 'species' to 'type'
    breed: '',
    age: '',
    gender: 'Хлопчик',  // Changed from 'male' to 'Хлопчик'
    description: '',
    healthStatus: '',
    status: 'available',
    size: 'medium',
    shelterId: currentUser?.shelterId || '',
    photos: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState([]);

  // Перевірка авторизації користувача як притулку
  useEffect(() => {
    if (!currentUser || currentUser.userType !== 'shelter' || !currentUser.shelterId) {
      navigate('/login');
    } else {
      setFormData(prev => ({
        ...prev,
        shelterId: currentUser.shelterId
      }));
    }
  }, [currentUser, navigate]);

  // Обробник зміни полів форми
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Обробник завантаження зображень
  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 5); // максимум 5 фото
      
      // Створення превью для зображень
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreview(prev => [...prev, ...newPreviews]);
      
      // Додавання файлів до formData
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...filesArray]
      }));
    }
  };

  // Видалення зображення з превью
  const removeImage = (index) => {
    // Видалення з превью
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    
    // Видалення з formData
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // Відправка форми
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Debug: Check form data before submission
      console.log("Form data before submission:", formData);
      
      // Create FormData for file upload
      const animalData = new FormData();
      
      // IMPORTANT: First, add the type field explicitly
      animalData.append('type', formData.type);
      console.log("Type appended:", formData.type);
      
      // Add all other fields
      animalData.append('name', formData.name);
      animalData.append('gender', formData.gender);
      animalData.append('age', formData.age);
      animalData.append('description', formData.description);
      animalData.append('shelterId', formData.shelterId);
      animalData.append('status', formData.status);
      animalData.append('size', formData.size);
      
      if (formData.breed) animalData.append('breed', formData.breed);
      if (formData.healthStatus) animalData.append('health', formData.healthStatus);
      
      // Add photo if selected
      if (formData.photos && formData.photos.length > 0) {
        animalData.append('image', formData.photos[0]);  // Changed field name to 'image'
      }
      
      // Debug: Check what's being sent
      for (let [key, value] of animalData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      
      // Send the request
      const result = await createAnimal(animalData);
      console.log("Animal created successfully:", result);
      
      // Redirect to shelter dashboard
      navigate('/shelter-dashboard');
      
    } catch (err) {
      setError(err.message || 'Помилка при створенні профілю тварини. Спробуйте знову.');
      console.error('Error adding animal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="container">
        <h1>Додати нову тварину</h1>
        
        <div className="form-container">
          {error && <Alert type="error" message={error} />}
          
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2><FaInfoCircle /> Основна інформація</h2>
              <div className="form-group">
                <label htmlFor="name">
                  Ім'я тварини 
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Введіть ім'я тварини"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">
                    Вид тварини
                    <span className="required">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"  // Using type, not species
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="cat">Кіт</option>
                    <option value="dog">Собака</option>
                    <option value="other">Інше</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="breed">Порода</label>
                  <input
                    type="text"
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    placeholder="Наприклад: Бенгальська, Шотландська..."
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="age">
                    Вік
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    placeholder="Наприклад: 2 роки, 5 місяців..."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="gender">Стать</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="Хлопчик">Хлопчик</option>  // Changed value to 'Хлопчик'
                    <option value="Дівчинка">Дівчинка</option>  // Changed value to 'Дівчинка'
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h2><FaNotesMedical /> Здоров'я та опис</h2>
              <div className="form-group">
                <label htmlFor="healthStatus">Стан здоров'я</label>
                <input
                  type="text"
                  id="healthStatus"
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleChange}
                  placeholder="Вакцинований, стерилізований/кастрований, будь-які особливості здоров'я..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">
                  Опис
                  <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Розкажіть про характер тварини, її історію та особливості..."
                ></textarea>
              </div>
            </div>
            
            <div className="form-section">
              <h2><FaTag /> Статус та класифікація</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Поточний статус</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="available">Доступний для усиновлення</option>
                    <option value="reserved">Зарезервований</option>
                    <option value="adopted">Прилаштований</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="size">Розмір</label>
                  <select
                    id="size"
                    name="size"
                    value={formData.size || 'medium'}
                    onChange={handleChange}
                  >
                    <option value="small">Малий</option>
                    <option value="medium">Середній</option>
                    <option value="large">Великий</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h2><FaImage /> Фотографії</h2>
              <div className="form-group">
                <div className="image-upload-container">
                  <label htmlFor="photos" className="image-upload-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>Натисніть для вибору фотографій або перетягніть їх сюди</span>
                    <span className="helper">(до 5 фотографій)</span>
                  </label>
                  <input
                    type="file"
                    id="photos"
                    name="photos"
                    onChange={handleImageChange}
                    multiple
                    accept="image/*"
                  />
                </div>
              </div>
              
              {imagePreview.length > 0 && (
                <div className="image-preview-container">
                  {imagePreview.map((src, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={src} alt={`Превью ${index}`} />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                        aria-label="Видалити зображення"
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/shelter-dashboard')}
                disabled={loading}
              >
                Скасувати
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? <><Spinner size="small" /> Додавання...</> : 'Додати тварину'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAnimalPage;
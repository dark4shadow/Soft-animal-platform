import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAnimalById, updateAnimal } from '../services/animalService';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';

const EditAnimalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cat',
    breed: '',
    age: '',
    gender: 'Хлопчик',
    description: '',
    healthStatus: '',
    status: 'available',
    size: 'medium',
    shelterId: '',
    photos: []
  });
  const [previewImage, setPreviewImage] = useState(null);

  // Перевіряємо авторизацію
  useEffect(() => {
    if (!isAuthenticated || (currentUser?.userType !== 'shelter' && currentUser?.userType !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Завантажуємо дані про тварину
  useEffect(() => {
    const fetchAnimalData = async () => {
      try {
        setLoading(true);
        const animal = await getAnimalById(id);

        setFormData({
          name: animal.name || '',
          type: animal.type || 'cat',
          breed: animal.breed || '',
          age: animal.age || '',
          gender: animal.gender || 'Хлопчик',
          description: animal.description || '',
          healthStatus: animal.healthStatus || animal.health || '',
          status: animal.status || 'available',
          size: animal.size || 'medium',
          shelterId: animal.shelterId || currentUser?.shelterId || '',
          photos: []
        });

        if (animal.image) {
          setPreviewImage(animal.image);
        }
      } catch (err) {
        console.error('Error loading animal:', err);
        setError('Не вдалося завантажити дані про тварину');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnimalData();
    }
  }, [id, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, photos: [file] }));
      
      // Показати прев'ю зображення
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const animalData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key !== 'photos') {
          animalData.append(key, formData[key]);
        }
      });
      
      if (formData.photos && formData.photos.length > 0) {
        animalData.append('image', formData.photos[0]);
      }
      
      await updateAnimal(id, animalData);
      setSuccess('Інформацію про тварину успішно оновлено!');
      
      // Перенаправляємо користувача на сторінку притулку через 2 секунди
      setTimeout(() => {
        navigate('/shelter-dashboard');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Помилка при оновленні даних тварини. Спробуйте знову.');
      console.error('Error updating animal:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <Spinner size="large" />
        <p>Завантаження даних...</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="container">
        <h1>Редагувати картку тварини</h1>
        
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
        
        <form onSubmit={handleSubmit} className="animal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Ім'я тварини *</label>
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
              <label htmlFor="type">Тип тварини *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="cat">Кіт</option>
                <option value="dog">Собака</option>
                <option value="other">Інше</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="breed">Порода</label>
              <input
                type="text"
                id="breed"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="age">Вік *</label>
              <input
                type="text"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Стать</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="Хлопчик">Хлопчик</option>
                <option value="Дівчинка">Дівчинка</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Статус</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="available">Доступний</option>
                <option value="reserved">Зарезервований</option>
                <option value="adopted">Прилаштований</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="size">Розмір</label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
              >
                <option value="small">Маленький</option>
                <option value="medium">Середній</option>
                <option value="large">Великий</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="healthStatus">Стан здоров'я</label>
              <input
                type="text"
                id="healthStatus"
                name="healthStatus"
                value={formData.healthStatus}
                onChange={handleChange}
                placeholder="Опис стану здоров'я тварини"
              />
            </div>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="description">Опис тварини *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            ></textarea>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="photos">Фото тварини</label>
            <input
              type="file"
              id="photos"
              name="photos"
              accept="image/*"
              onChange={handleFileChange}
            />
            {previewImage && (
              <div className="image-preview">
                <img src={previewImage} alt="Прев'ю фото" />
              </div>
            )}
          </div>
          
          <div className="form-buttons">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/shelter-dashboard')}
            >
              Скасувати
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? <><Spinner size="small" /> Оновлення...</> : 'Зберегти зміни'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAnimalPage;
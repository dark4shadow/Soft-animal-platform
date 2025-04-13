import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAnimalById } from '../services/animalService';
import { createAdoptionRequest } from '../services/adoptionService';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import { FaDog, FaCat, FaPaw } from 'react-icons/fa';

const AdoptionRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    experience: '',
    reason: '',
    otherPets: '',
    housingType: 'apartment',
    hasChildren: false,
    agreeToHomeCheck: false,
    agreeToTerms: false
  });

  // Перевіряємо авторизацію
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/adoption-request/${id}` } });
    }
  }, [isAuthenticated, id, navigate]);

  // Завантажуємо дані про тварину
  useEffect(() => {
    const fetchAnimalData = async () => {
      try {
        setLoading(true);
        const data = await getAnimalById(id);
        setAnimal(data);
        
        // Перевіряємо, чи тварина доступна для усиновлення
        if (data.status !== 'available') {
          setError(`На жаль, ця тварина зараз ${data.status === 'adopted' ? 'вже усиновлена' : 'зарезервована'}`);
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
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      setError('Будь ласка, прийміть умови усиновлення');
      return;
    }
    
    setSubmitting(true);
    setError(null);

    try {
      const requestData = {
        animalId: id,
        volunteerId: currentUser?._id,
        ...formData
      };
      
      await createAdoptionRequest(requestData);
      setSuccess('Ваш запит на усиновлення успішно відправлено! Притулок зв\'яжеться з вами найближчим часом.');
      
      // Store timeout ID to clean it up properly
      const redirectTimeout = setTimeout(() => {
        navigate('/volunteer-dashboard');
        // Explicitly reset body overflow in case it was changed
        document.body.style.overflow = '';
      }, 3000);
      
      // Clean up timeout if component unmounts
      return () => clearTimeout(redirectTimeout);
      
    } catch (err) {
      setError(err.message || 'Помилка при відправці запиту на усиновлення. Спробуйте знову.');
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

  const getAnimalIcon = () => {
    if (!animal) return <FaPaw />;
    switch (animal.type) {
      case 'dog': return <FaDog />;
      case 'cat': return <FaCat />;
      default: return <FaPaw />;
    }
  };

  return (
    <div className="form-page">
      <div className="container">
        <h1>Запит на усиновлення тварини</h1>
        
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
        
        {animal && (
          <div className="adoption-animal-info">
            <div className="animal-image">
              <img 
                src={animal.image} 
                alt={animal.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default-animal.jpg';
                }} 
              />
            </div>
            <div className="animal-details">
              <h2>{animal.name}</h2>
              <div className="animal-type">
                {getAnimalIcon()}
                <span>{animal.type === 'dog' ? 'Собака' : animal.type === 'cat' ? 'Кіт' : 'Інша тварина'} • {animal.breed || 'Невідомо'}</span>
              </div>
              <div className="animal-meta">
                <span>{animal.gender}</span> • <span>{animal.age}</span> • <span>{animal.size === 'small' ? 'Маленький' : animal.size === 'medium' ? 'Середній' : 'Великий'}</span>
              </div>
              <p>{animal.description}</p>
              <Link to={`/animals/${animal._id}`} className="btn-secondary">Переглянути профіль тварини</Link>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="adoption-form">
          <h3>Заповніть форму запиту на усиновлення</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Ваше ім'я *</label>
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
              <label htmlFor="phone">Номер телефону *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
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
            
            <div className="form-group">
              <label htmlFor="address">Адреса проживання *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="housingType">Тип житла *</label>
              <select
                id="housingType"
                name="housingType"
                value={formData.housingType}
                onChange={handleChange}
                required
              >
                <option value="apartment">Квартира</option>
                <option value="house">Будинок</option>
                <option value="other">Інше</option>
              </select>
            </div>
            
            <div className="form-group checkbox-group">
              <label htmlFor="hasChildren" className="checkbox-label">
                <input
                  type="checkbox"
                  id="hasChildren"
                  name="hasChildren"
                  checked={formData.hasChildren}
                  onChange={handleChange}
                />
                У мене є діти
              </label>
            </div>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="experience">Ваш досвід з тваринами *</label>
            <textarea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="Розкажіть про свій досвід догляду за тваринами"
              required
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="otherPets">Інші домашні тварини</label>
            <textarea
              id="otherPets"
              name="otherPets"
              value={formData.otherPets}
              onChange={handleChange}
              placeholder="Розкажіть про інших тварин, які проживають з вами (якщо такі є)"
              rows="2"
            ></textarea>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="reason">Чому ви хочете усиновити саме цю тварину? *</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Поясніть, чому ви хочете усиновити цю тварину"
              required
              rows="4"
            ></textarea>
          </div>
          
          <div className="form-group full-width checkbox-group">
            <label htmlFor="agreeToHomeCheck" className="checkbox-label">
              <input
                type="checkbox"
                id="agreeToHomeCheck"
                name="agreeToHomeCheck"
                checked={formData.agreeToHomeCheck}
                onChange={handleChange}
                required
              />
              Я погоджуюсь на можливу перевірку умов утримання тварини
            </label>
          </div>
          
          <div className="form-group full-width checkbox-group">
            <label htmlFor="agreeToTerms" className="checkbox-label">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
              />
              Я приймаю умови усиновлення та зобов'язуюсь забезпечити належний догляд за твариною
            </label>
          </div>
          
          <div className="form-buttons">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate(-1)}
            >
              Скасувати
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting || animal?.status !== 'available'}
            >
              {submitting ? <><Spinner size="small" /> Відправка...</> : 'Відправити запит'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdoptionRequestPage;
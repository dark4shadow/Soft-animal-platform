import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getShelterById, addShelterReview, getShelterReviews } from '../services/shelterService';
import { getAnimalsByShelter } from '../services/animalService';
import { useAuth } from '../context/AuthContext'; // Add this import at the top
import '../styles/main.css';

// Імпортуємо запасне зображення для випадків помилки завантаження
//import defaultShelterImage from '../assets/default-shelter.jpg';

// Покращений підхід завантаження зображення
const ShelterHeroImage = ({ url, name }) => {
  const [error, setError] = useState(false);
  
  if (error || !url) {
    return (
      <div className="shelter-hero default-background">
        <div className="container">
          <h1>{name}</h1>
          {/* Інший вміст hero секції */}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="shelter-hero" 
      style={{ backgroundImage: `url(${url})` }}
      onError={() => setError(true)}
    >
      <div className="container">
        <h1>{name}</h1>
        {/* Інший вміст hero секції */}
      </div>
    </div>
  );
};

const ShelterDetail = () => {
  const { id } = useParams();
  const [shelter, setShelter] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [activeGalleryImage, setActiveGalleryImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    text: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { currentUser, isAuthenticated } = useAuth(); // Add this line

  // Реалізація функцій для взаємодії з базою даних
  const handleSendReview = async (reviewData) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      setSubmitting(true);
      
      // Validate form
      if (reviewData.rating < 1) {
        setErrorMessage('Будь ласка, виберіть рейтинг від 1 до 5');
        return;
      }
      
      if (!reviewData.text.trim()) {
        setErrorMessage('Будь ласка, додайте текст відгуку');
        return;
      }

      console.log('Submitting review:', reviewData);
      
      // Submit the review
      const newReview = await addShelterReview(shelter._id || shelter.id, reviewData);
      
      console.log('Review added successfully:', newReview);
      
      // Update local state with the new review
      const currentReviews = Array.isArray(shelter.reviews) ? shelter.reviews : [];
      setShelter(prevShelter => ({
        ...prevShelter,
        reviews: [...currentReviews, newReview]
      }));
      
      // Reset form
      setReviewForm({
        rating: 0,
        text: ''
      });
      
      setSuccessMessage('Ваш відгук успішно додано!');
    } catch (error) {
      console.error('Error submitting review:', error);
      
      if (error.message.includes('вже залишили відгук')) {
        setErrorMessage('Ви вже залишили відгук для цього притулку.');
      } else {
        setErrorMessage(error.message || 'Помилка при додаванні відгуку.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Оптимізуємо підхід до отримання даних з вдосконаленою обробкою помилок
  useEffect(() => {
    let isMounted = true; // Попереджаємо витоки пам'яті
    const fetchShelterData = async () => {
      try {
        setLoading(true);
        
        // Паралельне завантаження даних для кращої продуктивності
        const [shelterData, animalsData, reviewsData] = await Promise.all([
          getShelterById(id),
          getAnimalsByShelter(id),
          getShelterReviews(id) // Add this line to fetch reviews separately
        ]);
        
        // Перевіряємо, чи компонент все ще змонтований
        if (isMounted) {
          // Додаємо значення за замовчуванням для відсутніх властивостей
          const shelterWithDefaults = {
            ...shelterData,
            reviews: reviewsData || [], // Use the fetched reviews instead of empty array
            team: shelterData.team || [],
            gallery: shelterData.gallery || [],
            needsHelp: shelterData.needsHelp || [],
            socialMedia: shelterData.socialMedia || {}
          };
          
          setShelter(shelterWithDefaults);
          setAnimals(animalsData || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching shelter data:', err);
          // Більш детальні повідомлення про помилки
          if (err.response?.status === 404) {
            setError('Притулок не знайдено');
          } else if (err.response?.status === 403) {
            setError('У вас немає доступу до цього притулку');
          } else {
            setError('Не вдалося завантажити інформацію про притулок');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchShelterData();
    window.scrollTo(0, 0);
    
    // Функція очищення для уникнення витоків пам'яті
    return () => {
      isMounted = false;
    };
  }, [id]);

  const checkReviews = async () => {
    try {
      const reviews = await getShelterReviews(id);
      console.log('Reviews from API:', reviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  checkReviews();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Завантаження інформації про притулок...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Помилка</h2>
        <p>{error}</p>
        <button className="btn-secondary" onClick={() => window.location.reload()}>
          Спробувати знову
        </button>
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="error-container">
        <h2>Притулок не знайдено</h2>
        <p>На жаль, притулок з ID {id} не існує або був видалений.</p>
        <Link to="/shelters" className="btn primary-btn">Повернутися до списку притулків</Link>
      </div>
    );
  }

  return (
    <div className="shelter-detail-page">
      <ShelterHeroImage url={shelter.image} name={shelter.name} />

      <div className="container">
        <div className="shelter-actions">
          <Link to={`/donate?shelterId=${shelter.id || shelter._id}`} className="btn primary-btn">Підтримати притулок</Link>
          <Link to={`/volunteer?shelterId=${shelter.id || shelter._id}`} className="btn secondary-btn">Стати волонтером</Link>
          <button className="btn outline-btn">Зв'язатися</button>
          
          {/* Перевірка на наявність socialMedia перед відображенням */}
          {shelter.socialMedia && (
            <div className="social-links">
              {shelter.socialMedia.facebook && (
                <a href={shelter.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="social-link facebook">
                  <span className="icon">📘</span>
                </a>
              )}
              {shelter.socialMedia.instagram && (
                <a href={shelter.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                  <span className="icon">📷</span>
                </a>
              )}
              {shelter.socialMedia.twitter && (
                <a href={shelter.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="social-link twitter">
                  <span className="icon">🐦</span>
                </a>
              )}
            </div>
          )}
        </div>

        <div className="shelter-quick-info">
          <div className="info-item">
            <div className="info-value">{animals.length}</div>
            <div className="info-label">Тварин</div>
          </div>
          <div className="info-item">
            <div className="info-value">{shelter.foundedYear}</div>
            <div className="info-label">Рік заснування</div>
          </div>
          <div className="info-item">
            <div className="info-value">{shelter.teamSize}</div>
            <div className="info-label">Працівників</div>
          </div>
          <div className="info-item">
            <div className="info-value">★ {shelter.rating}</div>
            <div className="info-label">{shelter.reviewsCount} відгуків</div>
          </div>
        </div>

        <div className="donation-progress">
          <div className="progress-info">
            <h3>Збір коштів на потреби притулку</h3>
            <span>{shelter.donationCurrent} грн з {shelter.donationGoal} грн</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(shelter.donationCurrent / shelter.donationGoal) * 100}%` }}
            ></div>
          </div>
          <Link to={`/donate?shelterId=${shelter.id}`} className="btn secondary-btn sm-btn">Підтримати</Link>
        </div>

        <div className="shelter-tabs">
          <button 
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            Про притулок
          </button>
          <button 
            className={`tab-btn ${activeTab === 'animals' ? 'active' : ''}`}
            onClick={() => setActiveTab('animals')}
          >
            Наші тварини ({animals.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Команда
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Відгуки ({shelter.reviews?.length || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            Галерея
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'about' && (
            <div className="about-tab">
              <div className="shelter-description">
                <h2>Про нас</h2>
                <div dangerouslySetInnerHTML={{ __html: shelter.fullDescription }}></div>
              </div>

              <div className="shelter-info-blocks">
                <div className="info-block">
                  <h3>Контакти</h3>
                  <div className="contact-item">
                    <span className="icon">📱</span>
                    <span>{shelter.phone}</span>
                  </div>
                  <div className="contact-item">
                    <span className="icon">✉️</span>
                    <span>{shelter.email}</span>
                  </div>
                  <div className="contact-item">
                    <span className="icon">🕒</span>
                    <span>{shelter.workingHours}</span>
                  </div>
                </div>

                <div className="info-block">
                  <h3>Чим можна допомогти</h3>
                  <ul className="needs-list">
                    {shelter.needsHelp.map((need, index) => (
                      <li key={index}>{need}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'animals' && (
            <div className="animals-tab">
              <h2>Наші тварини</h2>
              <div className="filter-options">
                <button className="filter-btn active">Всі</button>
                <button className="filter-btn">Доступні</button>
                <button className="filter-btn">Зарезервовані</button>
                <button className="filter-btn">Прилаштовані</button>
              </div>

              <div className="animals-grid">
                {animals.map(animal => (
                  <div key={animal.id} className={`animal-card ${animal.status}`}>
                    <div className="animal-image">
                      <img src={animal.image} alt={animal.name} />
                      <span className={`status-badge ${animal.status}`}>
                        {animal.status === 'available' ? 'Доступний' : 
                         animal.status === 'reserved' ? 'Зарезервований' : 'Прилаштований'}
                      </span>
                    </div>
                    <div className="animal-info">
                      <h3>{animal.name}</h3>
                      <p className="animal-meta">
                        {animal.type === 'cat' ? 'Кіт' : animal.type === 'dog' ? 'Собака' : 'Інше'}, 
                        {animal.gender === 'Хлопчик' ? ' хлопчик' : ' дівчинка'}, {animal.age}
                      </p>
                      <p className="animal-description">{animal.description}</p>
                      <div className="animal-actions">
                        <Link to={`/animals/${animal.id}`} className="btn secondary-btn sm-btn">Деталі</Link>
                        {animal.status === 'available' && (
                          <Link to={`/adoption-request/${animal.id}`} className="btn primary-btn sm-btn">Усиновити</Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="team-tab">
              <h2>Наша команда</h2>
              <div className="team-grid">
                {shelter.team && shelter.team.length > 0 ? (
                  shelter.team.map((member, index) => (
                    <div key={index} className="team-member">
                      <div className="member-photo">
                        <img src={member.image} alt={member.name} />
                      </div>
                      <h3>{member.name}</h3>
                      <p className="member-position">{member.position}</p>
                    </div>
                  ))
                ) : (
                  <p>Інформація про команду притулку скоро з'явиться!</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <h2>Відгуки</h2>
              <div className="reviews-list">
                {shelter.reviews && Array.isArray(shelter.reviews) && shelter.reviews.length > 0 ? (
                  shelter.reviews.map((review, index) => (
                    review && (
                      <div key={review?.id || index} className="review-card">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <h3>{review?.author || 'Анонім'}</h3>
                            <span className="review-date">
                              {review?.createdAt 
                                ? new Date(review.createdAt).toLocaleDateString('uk-UA', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) 
                                : new Date().toLocaleDateString('uk-UA')}
                            </span>
                          </div>
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`star ${i < (review?.rating || 0) ? 'filled' : ''}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="review-text">{review?.text || 'Без коментаря'}</p>
                      </div>
                    )
                  ))
                ) : (
                  <p>Поки що відгуків немає. Будьте першим, хто залишить відгук!</p>
                )}
              </div>
              <div className="write-review">
                <h3>Залишити відгук</h3>
                {isAuthenticated ? (
                  <>
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <form 
                      className="review-form" 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendReview(reviewForm);
                      }}
                    >
                      <div className="form-group">
                        <label htmlFor="rating">Оцінка</label>
                        <div className="star-rating">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`star ${i < reviewForm.rating ? 'filled' : ''}`}
                              onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="review">Відгук</label>
                        <textarea
                          id="review"
                          name="text"
                          value={reviewForm.text}
                          onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                        ></textarea>
                      </div>
                      <button type="submit" className="btn primary-btn" disabled={submitting}>
                        {submitting ? 'Відправка...' : 'Відправити відгук'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="login-prompt">
                    <p>Щоб залишити відгук, необхідно <Link to="/login" className="login-link">увійти в систему</Link>.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="gallery-tab">
              <h2>Галерея</h2>
              {shelter.gallery && shelter.gallery.length > 0 ? (
                <div className="gallery-viewer">
                  <div className="active-image">
                    <img src={shelter.gallery[activeGalleryImage]} alt="Gallery" />
                  </div>
                  <div className="gallery-thumbnails">
                    {shelter.gallery.map((img, index) => (
                      <div 
                        key={index} 
                        className={`thumbnail ${index === activeGalleryImage ? 'active' : ''}`}
                        onClick={() => setActiveGalleryImage(index)}
                      >
                        <img src={img} alt={`Thumbnail ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p>Галерея зображень наразі порожня.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShelterDetail;
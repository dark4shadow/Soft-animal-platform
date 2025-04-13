import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/main.css';

// Імпортуємо зображення для використання в компоненті
import heroImage from '../assets/hero-image.jpg';
import patternOverlay from '../assets/pattern-overlay.png';
import { getRecentAnimals } from '../services/animalService';

const HomePage = () => {
  const [recentAnimals, setRecentAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentAnimals = async () => {
      try {
        setLoading(true);
        const data = await getRecentAnimals(6); // Отримуємо 6 останніх тварин
        setRecentAnimals(data);
      } catch (err) {
        console.error('Error fetching recent animals:', err);
        setError('Не вдалося завантажити останніх тварин');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAnimals();
  }, []);

  return (
    <div className="homepage">
      <section 
        className="homepage-hero" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.7)), url(${heroImage})` 
        }}
      >
        <div className="container">
          <h1>Знайди свого улюбленця</h1>
          <p>Наша платформа допомагає тваринам знайти теплу домівку, а людям - вірного друга. 
             Приєднуйся до спільноти свідомих власників домашніх тварин.</p>
          <div className="homepage-hero-buttons">
            <Link to="/animals" className="homepage-hero-btn primary">Знайти тварину</Link>
            <Link to="/shelters" className="homepage-hero-btn secondary">Знайти притулок</Link>
          </div>
        </div>
      </section>

      <section className="homepage-features">
        <div className="container">
          <h2>Чому обрати нас</h2>
          <div className="homepage-feature-grid">
            <div className="homepage-feature-card">
              <div className="homepage-feature-icon">🏠</div>
              <h3>Перевірені притулки</h3>
              <p>Ми співпрацюємо лише з перевіреними притулками, які забезпечують належний догляд за тваринами.</p>
            </div>
            <div className="homepage-feature-card">
              <div className="homepage-feature-icon">❤️</div>
              <h3>З турботою про тварин</h3>
              <p>У нас ви знайдете тварин, яким потрібен дім і щирі люблячі власники.</p>
            </div>
            <div className="homepage-feature-card">
              <div className="homepage-feature-icon">📋</div>
              <h3>Прозорий процес</h3>
              <p>Зрозумілий процес усиновлення та підтримка на кожному етапі.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="homepage-recent">
        <div className="container">
          <h2>Нещодавно додані тварини</h2>
          
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Завантаження тварин...</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button className="btn-secondary" onClick={() => window.location.reload()}>
                Спробувати знову
              </button>
            </div>
          )}
          
          {!loading && !error && (
            <div className="homepage-animal-grid">
              {recentAnimals.map(animal => (
                <div key={animal.id} className="homepage-animal-card">
                  <div className="homepage-animal-image">
                    <img 
                      src={animal.image} 
                      alt={animal.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default-animal.jpg';
                      }}
                    />
                    <span className={`homepage-status-badge ${animal.status}`}>
                      {animal.status === 'available' ? 'Доступний' : 
                       animal.status === 'reserved' ? 'Зарезервований' : 'Прилаштований'}
                    </span>
                  </div>
                  <div className="homepage-animal-info">
                    <h3>{animal.name}</h3>
                    <p className="homepage-animal-meta">
                      {animal.breed}, {animal.gender}, {animal.age}
                    </p>
                    <Link to={`/animals/${animal.id}`} className="homepage-animal-link">
                      Дізнатися більше
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="homepage-animals-view-all">
            <Link to="/animals">Переглянути всіх тварин</Link>
          </div>
        </div>
      </section>

      <section className="homepage-auth">
        <div className="container">
          <h2>Приєднуйтесь до нашої платформи</h2>
          <div className="auth-cards">
            <div className="auth-card">
              <div className="auth-card-icon">👤</div>
              <h3>Стати волонтером</h3>
              <p>Допомагайте тваринам, слідкуйте за новинами, підтримуйте притулки</p>
              <Link to="/register?type=volunteer" className="btn-primary">Зареєструватися</Link>
            </div>
            
            <div className="auth-card">
              <div className="auth-card-icon">🏠</div>
              <h3>Зареєструвати притулок</h3>
              <p>Створіть сторінку для вашого притулку, знайдіть нових господарів для ваших тварин</p>
              <Link to="/register?type=shelter" className="btn-primary">Зареєструвати притулок</Link>
            </div>
            
            <div className="auth-card">
              <div className="auth-card-icon">🔑</div>
              <h3>Вже маєте акаунт?</h3>
              <p>Увійдіть, щоб продовжити користуватися всіма функціями платформи</p>
              <Link to="/login" className="btn-secondary">Увійти</Link>
            </div>
          </div>
        </div>
      </section>

      <section 
        className="homepage-cta" 
        style={{ 
          backgroundImage: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%), url(${patternOverlay})` 
        }}
      >
        <div className="container">
          <h2>Станьте волонтером або спонсором</h2>
          <p>Допоможіть нам ще більше покращити життя тварин. Ви можете стати волонтером, пожертвувати кошти або допомогти іншими способами.</p>
          <Link to="/donate" className="homepage-cta-btn">Допомогти зараз</Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
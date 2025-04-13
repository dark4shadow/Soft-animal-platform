import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import '../styles/pages/DonatePage.css';
import { useAuth } from '../context/AuthContext';

const DonatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { currentUser, updateCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Параметри пожертви
  const [donationAmount, setDonationAmount] = useState('100');
  const [customAmount, setCustomAmount] = useState('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [donationTarget, setDonationTarget] = useState('general');
  const [selectedShelter, setSelectedShelter] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Дані для відображення
  const [shelters, setShelters] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [donationStats, setDonationStats] = useState({
    totalAmount: 0,
    countDonations: 0,
    uniqueDonorsCount: 0,
    sheltersDonatedCount: 0,
    animalsDonatedCount: 0
  });

  // Контактні дані
  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    message: '',
  });

  // Отримуємо параметр shelterId або animalId з URL, якщо він є
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shelterId = params.get('shelterId');
    const animalId = params.get('animalId');

    if (shelterId) {
      setDonationTarget('shelter');
      setSelectedShelter(shelterId);
    } else if (animalId) {
      setDonationTarget('animal');
      setSelectedAnimal(animalId);
    }
  }, [location.search]);

  // Завантажуємо дані притулків, тварин та статистику
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        // Завантажуємо притулки
        const sheltersResponse = await axios.get('/api/shelters');
        setShelters(sheltersResponse.data.data || []);

        // Завантажуємо тварин, які потребують допомоги
        const animalsResponse = await axios.get('/api/animals', { 
          params: { needsHelp: true, status: 'active' } 
        });
        setAnimals(animalsResponse.data.data || []);

        // Завантажуємо статистику пожертв
        try {
          console.log("Запит на отримання статистики пожертв...");
          const statsResponse = await axios.get('/api/donations/stats');
          console.log("Отримано статистику:", statsResponse.data);
          
          if (statsResponse.data && statsResponse.data.success) {
            setDonationStats({
              totalAmount: statsResponse.data.totalAmount || 0,
              countDonations: statsResponse.data.countDonations || 0,
              uniqueDonorsCount: statsResponse.data.uniqueDonorsCount || 0,
              sheltersDonatedCount: statsResponse.data.sheltersDonatedCount || 0,
              animalsDonatedCount: statsResponse.data.animalsDonatedCount || 0
            });
          } else {
            console.warn("API повернув успішну відповідь, але даних немає:", statsResponse.data);
          }
        } catch (statsError) {
          console.error("Помилка завантаження статистики:", statsError);
          // Не блокуємо всю сторінку через помилку статистики
        }
      } catch (err) {
        console.error("Помилка завантаження даних:", err);
        setError("Не вдалося завантажити необхідні дані. Будь ласка, спробуйте пізніше.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Обробка зміни форми
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Обробка зміни суми пожертви
  const handleAmountChange = (amount) => {
    setIsCustomAmount(false);
    setDonationAmount(amount);
  };

  // Обробка зміни власної суми
  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    setDonationAmount(value);
  };

  // Обробка зміни цілі пожертви
  const handleTargetChange = (e) => {
    setDonationTarget(e.target.value);
    // Скидаємо вибрані значення при зміні типу цілі
    if (e.target.value !== 'shelter') setSelectedShelter('');
    if (e.target.value !== 'animal') setSelectedAnimal('');
  };

  // Обробка відправки форми
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log("Форма відправлена");

    // Перевірка суми пожертви
    const amount = isCustomAmount ? customAmount : donationAmount;
    if (!amount || parseInt(amount) < 20) {
      setError("Мінімальна сума пожертви - 20 грн");
      setIsLoading(false);
      return;
    }

    try {
      // Формування даних для відправки з правильним ID
      const donationData = {
        amount: parseInt(amount),
        paymentMethod,
        donorName: formData.name,
        donorEmail: formData.email,
        message: formData.message,
        target: donationTarget,
        // Використовуємо правильне поле для ID користувача
        user: currentUser ? currentUser._id || currentUser.id : null, 
        targetId: 
          donationTarget === 'shelter' ? selectedShelter : 
          donationTarget === 'animal' ? selectedAnimal : null
      };

      console.log("Дані пожертви:", donationData);
      
      // Відправка даних на сервер
      const response = await axios.post('/api/donations', donationData);
      console.log("Отримано відповідь:", response.data);

      if (response.data.data && response.data.data.paymentUrl) {
        // Для реального платіжного шлюзу - перенаправлення
        if (response.data.data.formData) {
          // Створюємо приховану форму для відправки POST запиту на платіжний шлюз
          setProcessingPayment(true);
          const { data, signature } = response.data.data.formData;
          
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = response.data.data.paymentUrl;
          form.target = '_blank';
          
          const dataInput = document.createElement('input');
          dataInput.type = 'hidden';
          dataInput.name = 'data';
          dataInput.value = data;
          form.appendChild(dataInput);
          
          const signInput = document.createElement('input');
          signInput.type = 'hidden';
          signInput.name = 'signature';
          signInput.value = signature;
          form.appendChild(signInput);
          
          document.body.appendChild(form);
          form.submit();
          document.body.removeChild(form);
          
          // Перевіряємо статус оплати через 3 секунди
          setTimeout(() => {
            checkDonationStatus(response.data.data.donationId);
          }, 3000);
        } else {
          // Простий редирект на платіжний шлюз
          window.location.href = response.data.data.paymentUrl;
        }
      } else if (response.data.isTest) {
        // Для тестового режиму - імітуємо обробку
        console.log("Тестовий платіж, імітуємо обробку");
        setProcessingPayment(true);
        
        // Імітуємо процес оплати протягом 3 секунд
        setTimeout(() => {
          setProcessingPayment(false);
          setSuccessMessage("Дякуємо за вашу пожертву! Ваша підтримка дуже важлива для нас та наших хвостатих друзів.");
          
          // Очищаємо форму
          setFormData({
            name: user ? user.name : '',
            email: user ? user.email : '',
            message: '',
          });
          setDonationAmount('100');
          setCustomAmount('');
          setIsCustomAmount(false);
          
          // Оновлюємо статистику
          fetchDonationStats();
        }, 3000);
      } else {
        console.log("Інший тип відповіді:", response.data);
        setSuccessMessage("Дякуємо за вашу пожертву! Ваша підтримка дуже важлива для нас та наших хвостатих друзів.");
        
        // Очищаємо форму
        setFormData({
          name: user ? user.name : '',
          email: user ? user.email : '',
          message: '',
        });
        setDonationAmount('100');
        setCustomAmount('');
        setIsCustomAmount(false);
      }

      // Після успішної обробки платежу
      if (response.data.success && currentUser) {
        // Одразу оновити статистику користувача в контексті
        try {
          const updatedUser = {
            ...currentUser,
            donationStats: {
              ...currentUser.donationStats || {},
              totalAmount: (currentUser.donationStats?.totalAmount || 0) + parseInt(amount),
              donationsCount: (currentUser.donationStats?.donationsCount || 0) + 1,
              lastDonationDate: new Date()
            }
          };
          
          // Оновіть користувача в контексті - реалізуйте цю функцію у AuthContext
          updateCurrentUser(updatedUser);
        } catch (err) {
          console.error("Помилка оновлення статистики користувача:", err);
        }
      }
    } catch (err) {
      console.error("Помилка при створенні пожертви:", err);
      console.error("Деталі помилки:", err.response?.data);
      setError(err.response?.data?.message || "Помилка при обробці пожертви. Будь ласка, спробуйте пізніше.");
    } finally {
      setIsLoading(false);
    }
  };

  // Перевірка статусу пожертви
  const checkDonationStatus = async (donationId) => {
    try {
      const response = await axios.get(`/api/donations/${donationId}`);
      
      if (response.data.data && response.data.data.status === 'completed') {
        setProcessingPayment(false);
        setSuccessMessage("Дякуємо за вашу пожертву! Ваша підтримка дуже важлива для нас та наших хвостатих друзів.");
        
        // Очищаємо форму
        setFormData({
          name: user ? user.name : '',
          email: user ? user.email : '',
          message: '',
        });
        setDonationAmount('100');
        setCustomAmount('');
        setIsCustomAmount(false);
        
        // Оновлюємо статистику
        fetchDonationStats();
      } else if (response.data.data && response.data.data.status === 'failed') {
        setProcessingPayment(false);
        setError("Оплата не пройшла. Будь ласка, спробуйте ще раз або виберіть інший спосіб оплати.");
      } else {
        // Якщо статус ще в обробці, перевіряємо ще раз через 3 секунди
        setTimeout(() => {
          checkDonationStatus(donationId);
        }, 3000);
      }
    } catch (err) {
      console.error("Помилка перевірки статусу пожертви:", err);
      setProcessingPayment(false);
      setError("Проблема з перевіркою статусу оплати. Будь ласка, перевірте свою електронну пошту для підтвердження.");
    }
  };

  // Оновлення статистики пожертв
  const fetchDonationStats = async () => {
    try {
      const statsResponse = await axios.get('/api/donations/stats');
      if (statsResponse.data && statsResponse.data.success) {
        setDonationStats({
          totalAmount: statsResponse.data.totalAmount || 0,
          countDonations: statsResponse.data.countDonations || 0,
          uniqueDonorsCount: statsResponse.data.uniqueDonorsCount || 0,
          sheltersDonatedCount: statsResponse.data.sheltersDonatedCount || 0,
          animalsDonatedCount: statsResponse.data.animalsDonatedCount || 0
        });
      }
    } catch (statsError) {
      console.error("Помилка оновлення статистики:", statsError);
    }
  };

  if (loadingData) {
    return (
      <div className="donate-page loading-state">
        <Spinner size="large" />
        <p>Завантаження даних...</p>
      </div>
    );
  }

  if (processingPayment) {
    return (
      <div className="donate-page loading-state">
        <div className="processing-payment">
          <Spinner size="large" />
          <h2>Обробка платежу...</h2>
          <p>Будь ласка, не закривайте цю сторінку до завершення операції</p>
        </div>
      </div>
    );
  }

  return (
    <div className="donate-page">
      <div className="donate-hero">
        <div className="donate-hero-content">
          <h1>Допоможіть нашим хвостатим друзям</h1>
          <p>Ваша пожертва може врятувати життя та створити нові можливості для тварин, які цього потребують</p>
        </div>
      </div>

      <div className="donate-container">
        <div className="donate-stats">
          <div className="stats-card">
            <h3>Загальна сума пожертв</h3>
            <div className="stat-value">{donationStats.totalAmount.toLocaleString()} грн</div>
          </div>
          <div className="stats-card">
            <h3>Кількість пожертв</h3>
            <div className="stat-value">{donationStats.countDonations}</div>
          </div>
          <div className="stats-card">
            <h3>Притулків отримали допомогу</h3>
            <div className="stat-value">{donationStats.sheltersDonatedCount}</div>
          </div>
          <div className="stats-card">
            <h3>Тварин отримали допомогу</h3>
            <div className="stat-value">{donationStats.animalsDonatedCount}</div>
          </div>
        </div>

        <div className="donate-form-container">
          {successMessage && (
            <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} duration={10000} />
          )}

          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          <form className="donate-form" onSubmit={handleSubmit}>
            <h2>Зробити пожертву</h2>
            
            <div className="form-section">
              <h3>Виберіть суму пожертви</h3>
              <div className="amount-buttons">
                <button 
                  type="button" 
                  className={`amount-btn ${!isCustomAmount && donationAmount === '50' ? 'selected' : ''}`}
                  onClick={() => handleAmountChange('50')}
                >
                  50 грн
                </button>
                <button 
                  type="button"
                  className={`amount-btn ${!isCustomAmount && donationAmount === '100' ? 'selected' : ''}`}
                  onClick={() => handleAmountChange('100')}
                >
                  100 грн
                </button>
                <button 
                  type="button"
                  className={`amount-btn ${!isCustomAmount && donationAmount === '200' ? 'selected' : ''}`}
                  onClick={() => handleAmountChange('200')}
                >
                  200 грн
                </button>
                <button 
                  type="button"
                  className={`amount-btn ${!isCustomAmount && donationAmount === '500' ? 'selected' : ''}`}
                  onClick={() => handleAmountChange('500')}
                >
                  500 грн
                </button>
              </div>
              
              <div className="custom-amount">
                <label>
                  <input 
                    type="checkbox" 
                    checked={isCustomAmount}
                    onChange={() => setIsCustomAmount(!isCustomAmount)}
                  />
                  Інша сума
                </label>
                {isCustomAmount && (
                  <div className="custom-amount-input">
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="Введіть суму (мін. 20 грн)"
                    />
                    <span className="currency">грн</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Виберіть куди направити пожертву</h3>
              <div className="donation-target">
                <div className="target-radio">
                  <input 
                    type="radio" 
                    id="target-general" 
                    name="donationTarget" 
                    value="general"
                    checked={donationTarget === 'general'} 
                    onChange={handleTargetChange}
                  />
                  <label htmlFor="target-general">Загальний фонд платформи</label>
                </div>
                <div className="target-radio">
                  <input 
                    type="radio" 
                    id="target-shelter" 
                    name="donationTarget" 
                    value="shelter"
                    checked={donationTarget === 'shelter'} 
                    onChange={handleTargetChange}
                  />
                  <label htmlFor="target-shelter">Конкретний притулок</label>
                </div>
                <div className="target-radio">
                  <input 
                    type="radio" 
                    id="target-animal" 
                    name="donationTarget" 
                    value="animal"
                    checked={donationTarget === 'animal'} 
                    onChange={handleTargetChange}
                  />
                  <label htmlFor="target-animal">Конкретна тварина</label>
                </div>
              </div>

              {donationTarget === 'shelter' && (
                <div className="form-group">
                  <label htmlFor="selectedShelter">Виберіть притулок</label>
                  <select
                    id="selectedShelter"
                    value={selectedShelter}
                    onChange={(e) => setSelectedShelter(e.target.value)}
                    required={donationTarget === 'shelter'}
                  >
                    <option value="">Виберіть притулок</option>
                    {shelters.map((shelter) => (
                      <option key={shelter._id} value={shelter._id}>
                        {shelter.name} ({shelter.location || 'Адреса не вказана'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {donationTarget === 'animal' && (
                <div className="form-group">
                  <label htmlFor="selectedAnimal">Виберіть тварину</label>
                  <select
                    id="selectedAnimal"
                    value={selectedAnimal}
                    onChange={(e) => setSelectedAnimal(e.target.value)}
                    required={donationTarget === 'animal'}
                  >
                    <option value="">Виберіть тварину</option>
                    {animals.map((animal) => (
                      <option key={animal._id} value={animal._id}>
                        {animal.name} ({animal.type}, {animal.shelter?.name || 'Притулок не вказано'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Спосіб оплати</h3>
              <div className="payment-methods">
                <div className="payment-method">
                  <input 
                    type="radio" 
                    id="payment-card" 
                    name="paymentMethod" 
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label htmlFor="payment-card">
                    <div className="payment-icon">💳</div>
                    <div>
                      <strong>Банківська картка</strong>
                      <p>Visa, MasterCard</p>
                    </div>
                  </label>
                </div>
                <div className="payment-method">
                  <input 
                    type="radio" 
                    id="payment-liqpay" 
                    name="paymentMethod" 
                    value="liqpay"
                    checked={paymentMethod === 'liqpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label htmlFor="payment-liqpay">
                    <div className="payment-icon">📱</div>
                    <div>
                      <strong>LiqPay</strong>
                      <p>Швидка оплата</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Ваші контактні дані</h3>
              <div className="form-group">
                <label htmlFor="name">Ім'я</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Введіть ваше ім'я"
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
                  required
                  placeholder="Введіть ваш email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="message">Повідомлення (не обов'язково)</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Залиште повідомлення або побажання"
                  rows={4}
                ></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-donate"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="small" color="white" /> Обробка...
                  </>
                ) : (
                  <>
                    Пожертвувати {isCustomAmount ? customAmount : donationAmount} грн
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="donation-info">
          <h2>Як розподіляються кошти?</h2>
          <div className="info-block">
            <h3>Загальний фонд платформи</h3>
            <p>Пожертви в загальний фонд розподіляються між притулками, які найбільше потребують допомоги у даний момент.</p>
            <ul>
              <li>70% - на допомогу тваринам (лікування, харчування, обладнання)</li>
              <li>20% - на розвиток притулків</li>
              <li>10% - на адміністрування платформи та інформаційну підтримку</li>
            </ul>
          </div>
          
          <div className="info-block">
            <h3>Пожертва конкретному притулку</h3>
            <p>Вся сума пожертви передається обраному притулку на його потреби.</p>
          </div>
          
          <div className="info-block">
            <h3>Пожертва конкретній тварині</h3>
            <p>Вся сума спрямовується на допомогу обраній тварині (лікування, реабілітація, харчування).</p>
          </div>
          
          <div className="info-block transparency">
            <h3>Прозорість</h3>
            <p>Кожен місяць ми публікуємо звіт про використання коштів на нашому сайті та надсилаємо його на email донорів.</p>
            <button className="btn-secondary" onClick={() => navigate('/reports')}>
              Переглянути звіти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonatePage;
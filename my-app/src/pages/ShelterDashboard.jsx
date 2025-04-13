import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getShelterById, updateShelter } from '../services/shelterService';
import { getAnimalsByShelter } from '../services/animalService';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import '../styles/pages/Dashboard.css';

const ShelterDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [shelterData, setShelterData] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('animals');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState({
    shelter: true,
    animals: true,
    requests: false
  });
  const [error, setError] = useState({
    shelter: null,
    animals: null,
    requests: null
  });

  // Завантаження даних притулку та тварин
  useEffect(() => {
    if (!currentUser || currentUser.userType !== 'shelter' || !currentUser.shelterId) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, shelter: true }));
        const shelter = await getShelterById(currentUser.shelterId);
        setShelterData(shelter);
      } catch (err) {
        console.error('Помилка завантаження даних притулку:', err);
        setError(prev => ({ 
          ...prev, 
          shelter: 'Не вдалося завантажити дані притулку. Спробуйте знову пізніше.' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, shelter: false }));
      }

      try {
        setLoading(prev => ({ ...prev, animals: true }));
        const animalsData = await getAnimalsByShelter(currentUser.shelterId);
        setAnimals(animalsData || []);
      } catch (err) {
        console.error('Помилка завантаження тварин:', err);
        setError(prev => ({ 
          ...prev, 
          animals: 'Не вдалося завантажити список тварин. Спробуйте знову пізніше.' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, animals: false }));
      }

      // Тут буде код для завантаження запитів на усиновлення, коли відповідний API буде готовий
    };

    fetchData();
  }, [currentUser, navigate]);

  // Обробник зміни статусу тварини
  const handleStatusChange = async (animalId, newStatus) => {
    try {
      // Оптимістичне оновлення UI
      setAnimals(prevAnimals => 
        prevAnimals.map(animal => 
          animal._id === animalId ? { ...animal, status: newStatus } : animal
        )
      );
      
      // Тут буде реальний запит до API для оновлення статусу
      // await updateAnimalStatus(animalId, newStatus);
      
    } catch (err) {
      console.error('Помилка зміни статусу тварини:', err);
      // Повернення до попереднього стану, якщо виникла помилка
      alert('Не вдалося оновити статус тварини. Спробуйте знову.');
    }
  };

  // Обробник дій із запитами на всиновлення
  const handleRequestAction = async (requestId, action) => {
    try {
      // Оптимістичне оновлення UI
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === requestId ? 
          { ...request, status: action === 'approve' ? 'approved' : 'rejected' } : 
          request
        )
      );

      // Якщо запит схвалено, оновлюємо статус тварини
      if (action === 'approve') {
        const request = requests.find(r => r._id === requestId);
        if (request) {
          handleStatusChange(request.animalId, 'reserved');
        }
      }
      
      // Тут буде реальний запит до API для оновлення запиту
      // await updateAdoptionRequest(requestId, action);
      
    } catch (err) {
      console.error('Помилка обробки запиту на всиновлення:', err);
      alert('Не вдалося обробити запит на всиновлення. Спробуйте знову.');
    }
  };

  const filteredAnimals = animals && filterStatus === 'all' 
    ? animals 
    : animals.filter(animal => animal.status === filterStatus);

  // Відображення спіннера під час завантаження
  if (loading.shelter) {
    return (
      <div className="loading-container">
        <Spinner size="large" />
        <p>Завантаження даних притулку...</p>
      </div>
    );
  }

  // Відображення помилки, якщо не вдалося завантажити дані притулку
  if (error.shelter) {
    return (
      <div className="dashboard-container">
        <Alert type="error" message={error.shelter} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" className="btn-primary">На головну</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="shelter-info">
          <h1>{shelterData?.name || 'Мій притулок'}</h1>
          <div className="shelter-meta">
            <span>Тварин: {shelterData?.animalsCount || 0}/{shelterData?.capacity || 0}</span>
            <span>Рейтинг: {shelterData?.rating || 0} ({shelterData?.reviewsCount || 0} відгуків)</span>
          </div>
        </div>
        <div className="dashboard-actions">
          <Link to="/add-animal" className="btn btn-primary">+ Додати тварину</Link>
          <Link to="/edit-shelter" className="btn btn-secondary">Редагувати профіль</Link>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{animals.filter(a => a.status === 'available').length}</div>
          <div className="stat-label">Доступні тварини</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{animals.filter(a => a.status === 'reserved').length}</div>
          <div className="stat-label">Зарезервовані</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{animals.filter(a => a.status === 'adopted').length}</div>
          <div className="stat-label">Прилаштовані</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{requests.filter(r => r?.status === 'pending').length || 0}</div>
          <div className="stat-label">Очікують розгляду</div>
        </div>
      </div>

      {/* Прогрес збору пожертв */}
      {shelterData?.donationGoal > 0 && (
        <div className="donation-progress">
          <div className="progress-info">
            <h3>Збір коштів на потреби притулку</h3>
            <span>{shelterData.donationCurrent || 0} грн з {shelterData.donationGoal} грн</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((shelterData.donationCurrent || 0) / shelterData.donationGoal) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'animals' ? 'active' : ''}`}
          onClick={() => setActiveTab('animals')}
        >
          Ваші тварини
        </button>
        <button 
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Запити на всиновлення {requests.filter(r => r?.status === 'pending').length > 0 && 
            <span className="notification-badge">{requests.filter(r => r?.status === 'pending').length}</span>
          }
        </button>
      </div>

      {activeTab === 'animals' ? (
        <>
          <div className="filter-options">
            <label>Фільтрувати за статусом:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Всі тварини</option>
              <option value="available">Доступні</option>
              <option value="reserved">Зарезервовані</option>
              <option value="adopted">Прилаштовані</option>
            </select>
          </div>

          {loading.animals ? (
            <div className="loading-container" style={{height: '200px'}}>
              <Spinner size="medium" />
              <p>Завантаження тварин...</p>
            </div>
          ) : error.animals ? (
            <Alert type="error" message={error.animals} />
          ) : animals.length > 0 ? (
            <div className="animals-table">
              <table>
                <thead>
                  <tr>
                    <th>Фото</th>
                    <th>Ім'я</th>
                    <th>Тип</th>
                    <th>Вік</th>
                    <th>Стать</th>
                    <th>Статус</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnimals.map(animal => (
                    <tr key={animal._id}>
                      <td>
                        <div className="animal-thumbnail">
                          <img src={animal.photos?.[0] || '/placeholder-animal.png'} alt={animal.name} />
                        </div>
                      </td>
                      <td>{animal.name}</td>
                      <td>{animal.species === 'cat' ? 'Кіт' : animal.species === 'dog' ? 'Собака' : 'Інше'}</td>
                      <td>{animal.age}</td>
                      <td>{animal.gender === 'male' ? 'Хлопчик' : 'Дівчинка'}</td>
                      <td>
                        <span className={`status-badge ${animal.status}`}>
                          {animal.status === 'available' ? 'Доступний' : 
                          animal.status === 'reserved' ? 'Зарезервований' : 'Прилаштований'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/edit-animal/${animal._id}`} className="action-btn edit" title="Редагувати">✏️</Link>
                          <select 
                            className="status-select"
                            value={animal.status}
                            onChange={(e) => handleStatusChange(animal._id, e.target.value)}
                          >
                            <option value="available">Доступний</option>
                            <option value="reserved">Зарезервований</option>
                            <option value="adopted">Прилаштований</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>У вашому притулку поки немає жодної тварини</p>
              <Link to="/add-animal" className="btn-primary">Додати тварину</Link>
            </div>
          )}
        </>
      ) : (
        <>
          {loading.requests ? (
            <div className="loading-container" style={{height: '200px'}}>
              <Spinner size="medium" />
              <p>Завантаження запитів на всиновлення...</p>
            </div>
          ) : error.requests ? (
            <Alert type="error" message={error.requests} />
          ) : requests.length > 0 ? (
            <div className="requests-container">
              {requests.map(request => (
                <div key={request._id} className={`request-card ${request.status}`}>
                  <div className="request-animal-info">
                    <img src={request.animal?.photos?.[0] || '/placeholder-animal.png'} alt={request.animal?.name} />
                    <div>
                      <h4>Тварина: {request.animal?.name}</h4>
                      <p>Дата запиту: {new Date(request.createdAt).toLocaleDateString('uk-UA')}</p>
                    </div>
                  </div>
                  <div className="request-user-info">
                    <h4>Від: {request.requesterName}</h4>
                    <p>Email: {request.requesterEmail}</p>
                    <p>Телефон: {request.requesterPhone}</p>
                  </div>
                  <div className="request-message">
                    <h4>Повідомлення:</h4>
                    <p>{request.message}</p>
                  </div>
                  <div className="request-status">
                    <span className={`status-badge ${request.status}`}>
                      {request.status === 'pending' ? 'В очікуванні' : 
                      request.status === 'approved' ? 'Схвалено' : 'Відхилено'}
                    </span>
                    {request.status === 'pending' && (
                      <div className="request-actions">
                        <button 
                          className="btn btn-success"
                          onClick={() => handleRequestAction(request._id, 'approve')}
                        >
                          Схвалити
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleRequestAction(request._id, 'reject')}
                        >
                          Відхилити
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Немає активних запитів на всиновлення</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShelterDashboard;
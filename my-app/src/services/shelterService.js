import api from '../utils/api';

// Визначаємо, чи використовувати мок-дані
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true' || !process.env.REACT_APP_API_URL;

// Мокові дані для розробки
const mockShelters = [
  {
    id: 101,
    name: 'Котячий дім',
    type: 'cat',
    address: 'вул. Пухнаста, 15, Київ',
    location: 'Київ',
    phone: '+380991234567',
    email: 'cat.home@example.com',
    description: 'Притулок для котів та кошенят, що потребують домівки',
    image: 'https://images.unsplash.com/photo-1570824104453-508955ab713e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    animalsCount: 32,
    capacity: 50,
    foundedYear: 2018,
    rating: 4.8,
    reviewsCount: 124,
    verified: true,
  },
  {
    id: 102,
    name: 'Пухнастий друг',
    type: 'dog',
    address: 'вул. Франка, 12, Львів',
    location: 'Львів',
    phone: '+380671234567',
    email: 'fluffy.friend@example.com',
    description: 'Притулок для собак усіх порід та віку. Тут ваш майбутній найкращий друг',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    animalsCount: 45,
    capacity: 60,
    foundedYear: 2015,
    rating: 4.9,
    reviewsCount: 210,
    verified: true,
  },
  {
    id: 103,
    name: 'Ковчег',
    type: 'mixed',
    address: 'вул. Садова, 7, Харків',
    location: 'Харків',
    phone: '+380631234567',
    email: 'ark@example.com',
    description: 'Притулок для різних видів тварин: від собак і котів до кроликів та птахів',
    image: 'https://images.unsplash.com/photo-1593938702970-906c4e5abde6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    animalsCount: 78,
    capacity: 90,
    foundedYear: 2010,
    rating: 4.6,
    reviewsCount: 356,
    verified: true,
  },
  {
    id: 104,
    name: 'Щасливі хвостики',
    type: 'cat',
    address: 'вул. Морська, 22, Одеса',
    location: 'Одеса',
    phone: '+380501234567',
    email: 'happy.tails@example.com',
    description: 'Затишний притулок для котів та кошенят. З любов\'ю піклуємося про кожного пухнастика',
    image: 'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    animalsCount: 28,
    capacity: 35,
    foundedYear: 2019,
    rating: 4.7,
    reviewsCount: 89,
    verified: true,
  },
  {
    id: 105,
    name: 'Дім для друга',
    type: 'dog',
    address: 'вул. Центральна, 55, Дніпро',
    location: 'Дніпро',
    phone: '+380971234567',
    email: 'dog.home@example.com',
    description: 'Притулок для собак, де кожен пес отримує необхідну турботу та шанс знайти нову родину',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    animalsCount: 52,
    capacity: 65,
    foundedYear: 2016,
    rating: 4.5,
    reviewsCount: 178,
    verified: false,
  },
  {
    id: 106,
    name: 'Ветеринарний центр "Айболить"',
    type: 'clinic',
    address: 'вул. Медична, 8, Київ',
    location: 'Київ',
    phone: '+380981234567',
    email: 'vet.center@example.com',
    description: 'Ветеринарна клініка з притулком для тварин, що проходять лікування та реабілітацію',
    image: 'https://images.unsplash.com/photo-1616579772099-0e27d73c6f38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    animalsCount: 15,
    capacity: 25,
    foundedYear: 2020,
    rating: 4.2,
    reviewsCount: 45,
    verified: true,
  },
];

// Отримати всі притулки з можливістю фільтрації
export const getShelters = async (params = {}) => {
  try {
    // Формуємо параметри для запиту
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value && value !== 'all') {
        if (key === 'verified' && value === true) {
          queryParams.append('verified', 'true');
        } else {
          queryParams.append(key, value);
        }
      }
    }
    
    const response = await api.get(`/shelters?${queryParams.toString()}`);
    return {
      data: response.data.data || [],
      totalCount: response.data.total || 0,
      currentPage: response.data.page || 1,
      totalPages: response.data.pages || 1,
    };
  } catch (error) {
    console.error('Error fetching shelters:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати список притулків');
  }
};

// Отримати притулок за ID
export const getShelterById = async (id) => {
  try {
    const response = await api.get(`/shelters/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати дані про притулок');
  }
};

// Створити новий притулок з підтримкою файлів
export const createShelter = async (shelterData) => {
  try {
    // Визначаємо заголовки залежно від типу даних
    const headers = shelterData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
    
    const response = await api.post('/shelters', shelterData, { headers });
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося створити притулок');
  }
};

// Оновити дані притулку з підтримкою файлів
export const updateShelter = async (id, shelterData) => {
  try {
    // Визначаємо заголовки залежно від типу даних
    const headers = shelterData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
    
    const response = await api.put(`/shelters/${id}`, shelterData, { headers });
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося оновити дані про притулок');
  }
};

// Оновіть функцію addShelterReview

export const addShelterReview = async (shelterId, reviewData) => {
  try {
    // Basic validation
    if (!reviewData.text || !reviewData.text.trim()) {
      throw new Error("Текст відгуку є обов'язковим");
    }

    if (!reviewData.rating || reviewData.rating < 1) {
      throw new Error("Будь ласка, виберіть рейтинг");
    }

    // Use the browser's native fetch API instead of axios
    // This gives us more direct control over the headers
    const token = localStorage.getItem('token');
    
    // Prepare request options
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        rating: reviewData.rating,
        text: reviewData.text
        // No need to send author - it will be determined from the token
      })
    };

    // Make the request
    const response = await fetch(`http://localhost:5000/api/shelters/${shelterId}/reviews`, requestOptions);
    const responseData = await response.json();

    // Handle non-success responses
    if (!response.ok) {
      throw new Error(responseData.message || 'Виникла помилка при додаванні відгуку');
    }

    // Return formatted review for UI
    return {
      id: responseData.data._id || Date.now().toString(),
      author: responseData.data.author || JSON.parse(localStorage.getItem('user')).name,
      rating: reviewData.rating,
      text: reviewData.text,
      createdAt: responseData.data.createdAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Review submission error:', error);
    throw error;
  }
};

// Отримати відгуки притулку
export const getShelterReviews = async (shelterId) => {
  try {
    const response = await api.get(`/shelters/${shelterId}/reviews`);
    return response.data.data || [];
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати відгуки');
  }
};

// Завантажити зображення в галерею притулку
export const uploadShelterGalleryImages = async (shelterId, imagesFormData) => {
  try {
    const response = await api.post(`/shelters/${shelterId}/gallery`, imagesFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося завантажити зображення галереї');
  }
};

// Видалити зображення з галереї притулку
export const deleteShelterGalleryImage = async (shelterId, imageIndex) => {
  try {
    const response = await api.delete(`/shelters/${shelterId}/gallery/${imageIndex}`);
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося видалити зображення з галереї');
  }
};

// Оновити потреби притулку
export const updateShelterNeeds = async (shelterId, needsData) => {
  try {
    const response = await api.put(`/shelters/${shelterId}/needs`, { needs: needsData });
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося оновити потреби притулку');
  }
};

// Перевірка авторизації
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
console.log('Токен:', token ? 'Присутній' : 'Відсутній');
console.log('Користувач:', user);

// Open browser console and run this to check if you're truly authenticated:
console.log(localStorage.getItem('token'));
console.log(JSON.parse(localStorage.getItem('user')));
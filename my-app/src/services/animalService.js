import api from '../utils/api';

// Отримати всіх тварин з можливістю фільтрації
export const getAnimals = async (params = {}) => {
  try {
    // Формуємо параметри для запиту
    const queryParams = new URLSearchParams();
    
    // Обробляємо всі параметри
    for (const [key, value] of Object.entries(params)) {
      if (value && value !== 'all') {
        queryParams.append(key, value);
      }
    }
    
    const response = await api.get(`/animals?${queryParams.toString()}`);
    return {
      data: response.data.data,
      totalCount: response.data.total || 0,
      currentPage: response.data.page || 1,
      totalPages: response.data.pages || 1,
    };
  } catch (error) {
    console.error('Error fetching animals:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати список тварин');
  }
};

// Отримати тварину за ID
export const getAnimalById = async (id) => {
  try {
    const response = await api.get(`/animals/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати дані про тварину');
  }
};

// Отримати тварин притулку
export const getAnimalsByShelter = async (shelterId) => {
  try {
    const response = await api.get(`/shelters/${shelterId}/animals`);
    return response.data.data || [];
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати дані про тварин притулку');
  }
};

// Створити нову тварину з підтримкою файлів (FormData)
export const createAnimal = async (animalData) => {
  try {
    console.log('Sending animal data to API');
    
    // Don't manually set Content-Type for FormData, let browser handle it
    const response = await api.post('/animals', animalData);
    
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося створити картку тварини');
  }
};

// Оновити дані про тварину з підтримкою файлів
export const updateAnimal = async (id, animalData) => {
  try {
    const response = await api.put(`/animals/${id}`, animalData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося оновити інформацію про тварину');
  }
};

// Видалити тварину
export const deleteAnimal = async (id) => {
  try {
    const response = await api.delete(`/animals/${id}`);
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося видалити тварину');
  }
};

// Отримати останні додані тварини
export const getRecentAnimals = async (limit = 6) => {
  try {
    const response = await api.get('/animals', {
      params: {
        limit,
        sort: '-createdAt'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати останніх тварин');
  }
};

// Додати тварину до улюблених
export const addToFavorites = async (animalId) => {
  try {
    const response = await api.post(`/animals/${animalId}/favorite`);
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося додати тварину до улюблених');
  }
};

// Видалити тварину з улюблених
export const removeFromFavorites = async (animalId) => {
  try {
    const response = await api.delete(`/animals/${animalId}/favorite`);
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося видалити тварину з улюблених');
  }
};
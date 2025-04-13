import api from '../utils/api';

// Створити новий запит на прийом тварини
export const createIntakeRequest = async (requestData) => {
  try {
    const response = await api.post('/intake-requests', requestData);
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося створити запит на прийом тварини');
  }
};

// Отримати запити волонтера
export const getVolunteerIntakeRequests = async () => {
  try {
    const response = await api.get('/volunteer/intake-requests');
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати ваші запити на прийом тварин');
  }
};

// Скасувати запит на прийом тварини
export const cancelIntakeRequest = async (requestId) => {
  try {
    const response = await api.put(`/intake-requests/${requestId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося скасувати запит');
  }
};

// Завантажити фото для запиту
export const uploadIntakePhotos = async (requestId, photosFormData) => {
  try {
    const response = await api.post(`/intake-requests/${requestId}/photos`, photosFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося завантажити фото');
  }
};

// Отримати запити для конкретного притулку
export const getShelterIntakeRequests = async (shelterId) => {
  try {
    const response = await api.get(`/shelters/${shelterId}/intake-requests`);
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати запити на прийом тварин');
  }
};

// Оновити статус запиту притулком
export const updateIntakeRequestStatus = async (requestId, statusData) => {
  try {
    const response = await api.put(`/intake-requests/${requestId}/status`, statusData);
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося оновити статус запиту');
  }
};

// Отримати відкриті запити на прийом тварин
export const getOpenIntakeRequests = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filters)) {
      if (value) queryParams.append(key, value);
    }
    
    const response = await api.get(`/open-intake-requests?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати відкриті запити на прийом тварин');
  }
};
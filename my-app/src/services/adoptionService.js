import api from '../utils/api';

export const createAdoptionRequest = async (requestData) => {
  try {
    console.log('Sending adoption request data:', requestData);
    const response = await api.post('/adoptions', requestData);
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося створити запит на усиновлення');
  }
};

export const getAdoptionRequests = async (params = {}) => {
  try {
    const response = await api.get('/volunteers/me/adoption-requests', { params });
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати запити на усиновлення');
  }
};

export const getShelterAdoptionRequests = async (shelterId, params = {}) => {
  try {
    const response = await api.get(`/shelters/${shelterId}/adoption-requests`, { params });
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося отримати запити на усиновлення');
  }
};

export const updateAdoptionRequestStatus = async (requestId, status) => {
  try {
    const response = await api.put(`/adoptions/${requestId}/status`, { status });
    return response.data.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося оновити статус запиту');
  }
};

export const cancelAdoptionRequest = async (requestId) => {
  try {
    const response = await api.delete(`/adoption-requests/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error(error.response?.data?.message || 'Не вдалося скасувати запит на усиновлення');
  }
};
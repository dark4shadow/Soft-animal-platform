import api from '../utils/api';

/**
 * Отримати дані профілю волонтера
 * @returns {Promise<Object>} - Дані профілю волонтера
 */
export const getVolunteerProfile = async () => {
  try {
    // Змінено з '/users/me' на '/auth/me'
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Помилка отримання профілю волонтера:', error);
    throw error;
  }
};

/**
 * Отримати улюблені тварини волонтера
 * @returns {Promise<Array>} - Список улюблених тварин
 */
export const getVolunteerFavorites = async () => {
  try {
    const response = await api.get('/users/me/favorites');
    return response.data;
  } catch (error) {
    console.error('Помилка отримання улюблених тварин:', error);
    throw error;
  }
};

/**
 * Видалити тварину з улюблених
 * @param {string} animalId - ID тварини
 * @returns {Promise<Object>} - Результат операції
 */
export const removeFromFavorites = async (animalId) => {
  try {
    const response = await api.delete(`/users/me/favorites/${animalId}`);
    return response.data;
  } catch (error) {
    console.error('Помилка видалення з улюблених:', error);
    throw error;
  }
};

/**
 * Отримати запити на всиновлення волонтера
 * @returns {Promise<Array>} - Список запитів на всиновлення
 */
export const getVolunteerAdoptionRequests = async () => {
  try {
    const response = await api.get('/users/me/adoption-requests');
    return response.data;
  } catch (error) {
    console.error('Помилка отримання запитів на всиновлення:', error);
    throw error;
  }
};

/**
 * Скасувати запит на всиновлення
 * @param {string} requestId - ID запиту
 * @returns {Promise<Object>} - Результат операції
 */
export const cancelAdoptionRequest = async (requestId) => {
  try {
    const response = await api.delete(`/adoption-requests/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Помилка скасування запиту:', error);
    throw error;
  }
};

/**
 * Отримати всиновлених тварин волонтера
 * @returns {Promise<Array>} - Список всиновлених тварин
 */
export const getVolunteerAdoptedAnimals = async () => {
  try {
    const response = await api.get('/users/me/adopted-animals');
    return response.data;
  } catch (error) {
    console.error('Помилка отримання всиновлених тварин:', error);
    throw error;
  }
};
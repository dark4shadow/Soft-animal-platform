import api from '../utils/api';

/**
 * Отримати статистику користувача
 * @param {string} userId - ID користувача
 * @returns {Promise<Object>} - Об'єкт із статистикою користувача
 */
export const getUserStats = async (userId) => {
  try {
    console.log("Запитуємо статистику для користувача:", userId);
    const response = await api.get(`/users/${userId}/stats`);
    console.log("Отримана статистика:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      favorites: 0,
      adoptions: 0,
      donations: 0
    };
  }
};

/**
 * Оновити профіль користувача
 * @param {string} userId - ID користувача
 * @param {Object} userData - Дані для оновлення
 * @returns {Promise<Object>} - Оновлені дані користувача
 */
export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Помилка оновлення профілю');
  }
};

/**
 * Змінити пароль користувача
 * @param {string} userId - ID користувача
 * @param {Object} passwordData - Об'єкт з поточним і новим паролями
 * @returns {Promise<Object>} - Результат зміни пароля
 */
export const changePassword = async (userId, passwordData) => {
  try {
    const response = await api.put(`/users/${userId}/password`, passwordData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Помилка зміни пароля');
  }
};

/**
 * Видалити акаунт користувача
 * @param {string} userId - ID користувача
 * @param {string} password - Пароль для підтвердження видалення
 * @returns {Promise<Object>} - Результат видалення акаунту
 */
export const deleteAccount = async (userId, password) => {
  try {
    const response = await api.delete(`/users/${userId}`, { data: { password } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Помилка видалення акаунту');
  }
};
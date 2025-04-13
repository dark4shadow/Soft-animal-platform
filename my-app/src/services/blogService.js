import api from '../utils/api';

/**
 * Отримати список категорій блогу
 */
export const getBlogCategories = async () => {
  try {
    const response = await api.get('/blog/categories');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Не вдалося отримати категорії блогу');
  }
};

/**
 * Отримати список всіх постів
 */
export const getBlogPosts = async (filters = {}) => {
  try {
    const { category, searchQuery, page = 1, limit = 10 } = filters;
    let url = `/blog/posts?page=${page}&limit=${limit}`;
    
    if (category) url += `&category=${category}`;
    if (searchQuery) url += `&search=${searchQuery}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Не вдалося отримати пости блогу');
  }
};

/**
 * Отримати останні (найновіші) пости
 */
export const getRecentPosts = async (limit = 5) => {
  try {
    const response = await api.get(`/blog/posts/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Не вдалося отримати останні пости');
  }
};

/**
 * Отримати пост за ідентифікатором
 */
export const getBlogPostById = async (id) => {
  try {
    const response = await api.get(`/blog/posts/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Не вдалося отримати пост');
  }
};

/**
 * Отримати пов'язані пости
 */
export const getRelatedPosts = async (postId, limit = 3) => {
  try {
    const response = await api.get(`/blog/posts/${postId}/related?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Не вдалося отримати пов\'язані пости');
  }
};

/**
 * Додати коментар до посту
 */
export const addComment = async (postId, commentData) => {
  try {
    const response = await api.post(`/blog/posts/${postId}/comments`, commentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Не вдалося додати коментар');
  }
};

/**
 * Підписатися на розсилку блогу
 */
export const subscribeToNewsletter = async (email) => {
  try {
    const response = await api.post('/blog/subscribe', { email });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Не вдалося підписатися на розсилку');
  }
};
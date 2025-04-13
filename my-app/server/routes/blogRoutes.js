const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const blogController = require('../controllers/blogController');
const { uploadBlogImage } = require('../middlewares/uploadMiddleware');

// Публічні маршрути для постів
router.get('/posts', blogController.getPosts);
router.get('/posts/recent', blogController.getRecentPosts);
router.get('/posts/popular', blogController.getPopularPosts);
router.get('/posts/:id', blogController.getPostById);
router.get('/posts/slug/:slug', blogController.getPostBySlug);
router.get('/posts/:id/related', blogController.getRelatedPosts);
router.get('/posts/:id/comments', blogController.getPostComments);
router.post('/posts/:id/comments', blogController.addComment);

// Маршрути для категорій
router.get('/categories', blogController.getCategories);
router.get('/categories/:id', blogController.getCategoryById);
router.post('/categories', protect, authorize('admin'), blogController.createCategory);
router.put('/categories/:id', protect, authorize('admin'), blogController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), blogController.deleteCategory);

// Маршрути для тегів
router.get('/tags', blogController.getTags);

// Маршрути для лайків
router.post('/posts/:id/like', protect, blogController.likePost);
router.delete('/posts/:id/like', protect, blogController.unlikePost);

// Маршрути для створення/редагування/видалення постів
router.post('/posts', protect, authorize('admin', 'shelter'), uploadBlogImage, blogController.createPost);
router.put('/posts/:id', protect, authorize('admin', 'shelter'), uploadBlogImage, blogController.updatePost);
router.delete('/posts/:id', protect, authorize('admin', 'shelter'), blogController.deletePost);

// Маршрути для модерації коментарів
router.put('/comments/:id/approve', protect, authorize('admin', 'shelter'), blogController.approveComment);
router.delete('/comments/:id', protect, authorize('admin', 'shelter'), blogController.deleteComment);

// Маршрути для підписки на розсилку
router.post('/subscribe', blogController.subscribeToNewsletter);
router.delete('/unsubscribe', blogController.unsubscribeFromNewsletter);

// Маршрути для статистики
router.get('/stats', protect, authorize('admin'), blogController.getBlogStats);

module.exports = router;
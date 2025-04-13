import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBlogCategories, getBlogPosts, getRecentPosts, subscribeToNewsletter } from '../services/blogService';
import '../styles/main.css';

// Імпортуємо зображення
import blogHeaderImage from '../assets/blog-header.jpg';

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState({ message: '', isError: false });

  useEffect(() => {
    // Перевіряємо, чи є фільтри в URL
    const categoryParam = searchParams.get('category');
    const queryParam = searchParams.get('q');
    const pageParam = searchParams.get('page');
    
    if (categoryParam) setActiveCategory(Number(categoryParam));
    if (queryParam) setSearchQuery(queryParam);
    if (pageParam) setCurrentPage(Number(pageParam));
    
    // Завантажуємо категорії та пости
    fetchData();
  }, [searchParams]);

  // Спостерігаємо за змінами фільтрів і оновлюємо пости
  useEffect(() => {
    if (categories.length > 0) {
      fetchPosts();
    }
  }, [activeCategory, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Завантажуємо категорії
      const categoriesData = await getBlogCategories();
      setCategories(categoriesData.data);
      
      // Завантажуємо спочатку останній пост для верхньої секції
      const recentPostsData = await getRecentPosts(1);
      if (recentPostsData.data.length > 0) {
        setFeaturedPost(recentPostsData.data[0]);
      }
      
      // Завантажуємо звичайні пости з пагінацією
      await fetchPosts();
    } catch (err) {
      setError(err.message || 'Помилка при завантаженні даних');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const filters = {
        page: currentPage,
        limit: 9 // Кількість постів на сторінці
      };
      
      if (activeCategory !== 0) {
        filters.category = categories.find(c => c._id === activeCategory)?._id;
      }
      
      if (searchQuery) {
        filters.searchQuery = searchQuery;
      }
      
      const postsData = await getBlogPosts(filters);
      setPosts(postsData.data);
      setTotalPages(postsData.pages);
      
      // Оновлюємо параметри URL
      const newSearchParams = new URLSearchParams();
      if (activeCategory !== 0) newSearchParams.set('category', activeCategory);
      if (searchQuery) newSearchParams.set('q', searchQuery);
      if (currentPage > 1) newSearchParams.set('page', currentPage);
      
      setSearchParams(newSearchParams, { replace: true });
    } catch (err) {
      setError(err.message || 'Помилка при завантаженні постів');
    } finally {
      setLoading(false);
    }
  };

  // Обробка пошуку
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  // Зміна категорії
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
  };

  // Скидання фільтрів
  const clearFilters = () => {
    setActiveCategory(0);
    setSearchQuery('');
    setCurrentPage(1);
    setSearchParams({});
    fetchPosts();
  };

  // Обробка підписки на розсилку
  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!subscribeEmail || !subscribeEmail.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      setSubscribeStatus({ message: 'Будь ласка, введіть дійсний email', isError: true });
      return;
    }
    
    try {
      const response = await subscribeToNewsletter(subscribeEmail);
      setSubscribeEmail('');
      setSubscribeStatus({ message: response.message, isError: false });
      
      // Приховуємо повідомлення через 5 секунд
      setTimeout(() => {
        setSubscribeStatus({ message: '', isError: false });
      }, 5000);
    } catch (err) {
      setSubscribeStatus({ message: err.message, isError: true });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Категорія';
  };

  // Компонент пагінації
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    // Визначаємо, які сторінки відображати
    let pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Якщо сторінок менше або рівно maxVisible, показуємо всі
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Показуємо поточну сторінку та кілька сусідніх
      const halfVisible = Math.floor(maxVisible / 2);
      
      if (currentPage <= halfVisible) {
        // Початок списку
        pages = Array.from({ length: maxVisible - 1 }, (_, i) => i + 1);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - halfVisible) {
        // Кінець списку
        pages = [1, '...'];
        pages = pages.concat(Array.from(
          { length: maxVisible - 2 },
          (_, i) => totalPages - (maxVisible - 3) + i
        ));
      } else {
        // Середина списку
        pages = [1, '...'];
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return (
      <div className="blog-pagination">
        <button 
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          &laquo; Попередня
        </button>
        
        <div className="pagination-pages">
          {pages.map((page, index) => (
            typeof page === 'number' ? (
              <button 
                key={index} 
                className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="pagination-ellipsis">{page}</span>
            )
          ))}
        </div>
        
        <button 
          className="pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Наступна &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="blog-page">
      <section 
        className="blog-page-header" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${blogHeaderImage})` 
        }}
      >
        <div className="container">
          <h1>Блог про тварин</h1>
          <p>Корисні поради, цікаві історії та новини про догляд за тваринами, їх виховання та здоров'я</p>
          <form onSubmit={handleSearch} className="search-container">
            <input
              type="text"
              className="blog-search"
              placeholder="Пошук у блозі..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">🔍</button>
          </form>
        </div>
      </section>

      {featuredPost && !loading && (
        <section className="featured-post">
          <div className="container">
            <div className="featured-post-card">
              <div className="featured-post-image">
                <img src={featuredPost.image} alt={featuredPost.title} />
              </div>
              <div className="featured-post-content">
                <span className="post-category">
                  {getCategoryName(featuredPost.category)}
                </span>
                <h2>{featuredPost.title}</h2>
                <div className="post-meta">
                  <div>
                    <span className="post-author">{featuredPost.author}</span>
                    <span className="post-date">{formatDate(featuredPost.createdAt)}</span>
                  </div>
                </div>
                <p>{featuredPost.excerpt}</p>
                <Link to={`/blog/${featuredPost._id}`} className="btn btn-primary">
                  Читати далі
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="blog-content">
        <div className="container">
          <div className="category-filter">
            <button 
              className={`category-btn ${activeCategory === 0 ? 'active' : ''}`}
              onClick={() => handleCategoryChange(0)}
            >
              Усі категорії
            </button>
            {categories.map(category => (
              <button 
                key={category._id}
                className={`category-btn ${activeCategory === category._id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category._id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Завантаження статей...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <p>{error}</p>
              <button className="btn btn-secondary" onClick={fetchData}>
                Спробувати ще раз
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="blog-posts-grid">
                {posts.length > 0 ? (
                  posts.map(post => (
                    <div key={post._id} className="blog-post-card">
                      <div className="post-image">
                        <img src={post.image} alt={post.title} />
                        <span className="post-category">
                          {getCategoryName(post.category)}
                        </span>
                      </div>
                      <div className="post-content">
                        <h3>{post.title}</h3>
                        <p>{post.excerpt}</p>
                        <div className="post-meta">
                          <div>
                            <span className="post-author">{post.author}</span>
                            <span className="post-date">{formatDate(post.createdAt)}</span>
                          </div>
                          <div>
                            <span className="post-views">{post.views} переглядів</span>
                            <span className="post-comments">{post.comments?.length || 0} коментарів</span>
                          </div>
                        </div>
                        <Link to={`/blog/${post._id}`} className="read-more">Читати далі →</Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-posts">
                    <p>На жаль, статті не знайдені</p>
                    <button 
                      className="btn btn-secondary"
                      onClick={clearFilters}
                    >
                      Скинути фільтри
                    </button>
                  </div>
                )}
              </div>
              
              {totalPages > 1 && <Pagination />}
            </>
          )}
        </div>
      </section>

      <section className="subscribe-section">
        <div className="container">
          <div className="subscribe-box">
            <h3>Підпишіться на нашу розсилку</h3>
            <p>Отримуйте свіжі новини та поради з догляду за тваринами</p>
            
            {subscribeStatus.message && (
              <div className={`subscribe-message ${subscribeStatus.isError ? 'error' : 'success'}`}>
                {subscribeStatus.message}
              </div>
            )}
            
            <form className="subscribe-form" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Ваш email" 
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Підписатися</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
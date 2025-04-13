import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBlogPostById, getRelatedPosts, addComment } from '../services/blogService';
import { useAuth } from '../context/AuthContext';
import '../styles/main.css';

const BlogPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentForm, setCommentForm] = useState({
    author: currentUser?.name || '',
    email: currentUser?.email || '',
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [commentStatus, setCommentStatus] = useState({ message: '', isError: false });

  useEffect(() => {
    fetchPostData();
    // Прокрутка сторінки вгору при завантаженні нового поста
    window.scrollTo(0, 0);
  }, [id]);

  // Якщо є авторизований користувач, заповнюємо поля форми коментаря
  useEffect(() => {
    if (currentUser) {
      setCommentForm(prev => ({
        ...prev,
        author: currentUser.name || prev.author,
        email: currentUser.email || prev.email
      }));
    }
  }, [currentUser]);

  const fetchPostData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Завантажуємо дані посту
      const postData = await getBlogPostById(id);
      setPost(postData.data);
      
      // Завантажуємо пов'язані пости
      const relatedData = await getRelatedPosts(id);
      setRelatedPosts(relatedData.data);
    } catch (err) {
      setError(err.message || 'Помилка при завантаженні статті');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    setCommentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    // Валідація форми
    if (!commentForm.author || !commentForm.email || !commentForm.content) {
      setCommentStatus({
        message: 'Будь ласка, заповніть всі обов\'язкові поля',
        isError: true
      });
      return;
    }
    
    setSubmitting(true);
    setCommentStatus({ message: '', isError: false });
    
    try {
      const response = await addComment(id, commentForm);
      
      // Очищаємо форму коментаря (але зберігаємо ім'я та email)
      setCommentForm(prev => ({
        ...prev,
        content: ''
      }));
      
      setCommentStatus({
        message: 'Коментар успішно додано',
        isError: false
      });
      
      // Оновлюємо дані посту, щоб показати новий коментар
      fetchPostData();
      
      // Приховуємо повідомлення через 5 секунд
      setTimeout(() => {
        setCommentStatus({ message: '', isError: false });
      }, 5000);
    } catch (err) {
      setCommentStatus({
        message: err.message || 'Помилка при додаванні коментаря',
        isError: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };
  
  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title || 'Цікава стаття';
    
    let shareUrl = '';
    
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Завантаження статті...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="error-container">
        <h2>Статтю не знайдено</h2>
        <p>{error || 'На жаль, стаття, яку ви шукаєте, не існує або була видалена.'}</p>
        <Link to="/blog" className="btn btn-primary">Повернутися до блогу</Link>
      </div>
    );
  }

  return (
    <div className="blog-post-detail">
      <div className="blog-post-hero" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${post.image})` }}>
        <div className="container">
          <div className="post-category-badge">
            {post.category.name}
          </div>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span className="post-author">{post.author}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="blog-post-content-wrapper">
          <article className="blog-post-content">
            <div dangerouslySetInnerHTML={{ __html: post.content }}></div>
            
            <div className="post-stats">
              <span><i className="icon">👁️</i> {post.views} переглядів</span>
              <span><i className="icon">💬</i> {post.comments?.length || 0} коментарів</span>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="post-tags">
                {post.tags.map((tag, index) => (
                  <span key={index} className="tag">#{tag}</span>
                ))}
              </div>
            )}
            
            <div className="social-share">
              <p>Поділитися:</p>
              <div className="share-buttons">
                <button className="share-btn facebook" onClick={() => handleShare('facebook')}>Facebook</button>
                <button className="share-btn twitter" onClick={() => handleShare('twitter')}>Twitter</button>
                <button className="share-btn telegram" onClick={() => handleShare('telegram')}>Telegram</button>
              </div>
            </div>
          </article>
          
          <aside className="blog-sidebar">
            <div className="author-card">
              <div className="author-info">
                <h3>Про автора</h3>
                <p className="author-name">{post.author}</p>
                <p className="author-bio">{post.authorInfo}</p>
              </div>
            </div>
            
            {relatedPosts.length > 0 && (
              <div className="related-posts">
                <h3>Схожі статті</h3>
                {relatedPosts.map(relatedPost => (
                  <Link key={relatedPost._id} to={`/blog/${relatedPost._id}`} className="related-post-card">
                    <div className="related-post-image">
                      <img src={relatedPost.image} alt={relatedPost.title} />
                    </div>
                    <div className="related-post-info">
                      <h4>{relatedPost.title}</h4>
                      <span className="related-post-date">{formatDate(relatedPost.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            <div className="blog-categories">
              <h3>Категорії</h3>
              <ul>
                <li>
                  <Link to={`/blog`}>Усі категорії</Link>
                </li>
                <li>
                  <Link to={`/blog?category=${post.category._id}`}>{post.category.name}</Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
        
        <div className="comments-section">
          <h3>Коментарі ({post.comments?.length || 0})</h3>
          
          {post.comments && post.comments.length > 0 && (
            <div className="comments-list">
              {post.comments.map((comment, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-author">{comment.author}</div>
                    <div className="comment-date">{formatDate(comment.createdAt)}</div>
                  </div>
                  <div className="comment-content">{comment.content}</div>
                </div>
              ))}
            </div>
          )}
          
          <div className="comment-form">
            <h4>Залишити коментар</h4>
            
            {commentStatus.message && (
              <div className={`comment-status ${commentStatus.isError ? 'error' : 'success'}`}>
                {commentStatus.message}
              </div>
            )}
            
            <form onSubmit={handleCommentSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="author">Ім'я *</label>
                  <input 
                    type="text" 
                    id="author" 
                    name="author" 
                    value={commentForm.author}
                    onChange={handleCommentChange}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={commentForm.email}
                    onChange={handleCommentChange}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="content">Коментар *</label>
                <textarea 
                  id="content" 
                  name="content" 
                  rows="4" 
                  value={commentForm.content}
                  onChange={handleCommentChange}
                  disabled={submitting}
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Надсилання...' : 'Надіслати коментар'}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <section className="next-reading">
        <div className="container">
          <h3>Читайте також</h3>
          <div className="next-posts-grid">
            {relatedPosts.slice(0, 3).map(post => (
              <Link key={post._id} to={`/blog/${post._id}`} className="next-post-card">
                <div className="next-post-image">
                  <img src={post.image} alt={post.title} />
                  <span className="post-category">
                    {post.category ? post.category.name : 'Категорія'}
                  </span>
                </div>
                <div className="next-post-content">
                  <h4>{post.title}</h4>
                  <div className="next-post-meta">
                    <span className="next-post-date">{formatDate(post.createdAt)}</span>
                    <span className="next-post-views">{post.views} переглядів</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="all-posts-link">
            <Link to="/blog" className="btn btn-secondary">Усі статті</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPostDetail;
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/main.css'; 

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section about">
            <h3>Про нас</h3>
            <p>Soft Animal Platform - сервіс, що допомагає тваринам знайти новий дім.</p>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fa fa-facebook"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fa fa-instagram"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fa fa-twitter"></i>
              </a>
            </div>
          </div>
          
          <div className="footer-section links">
            <h3>Навігація</h3>
            <ul>
              <li><Link to="/">Головна</Link></li>
              <li><Link to="/animals">Тварини</Link></li>
              <li><Link to="/shelters">Притулки</Link></li>
              <li><Link to="/blog">Блог</Link></li>
              <li><Link to="/donate">Пожертвувати</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Контакти</h3>
            <p><i className="fa fa-envelope"></i> Email: contact@softanimal.org</p>
            <p><i className="fa fa-phone"></i> Телефон: +380 50 123 4567</p>
            <p><i className="fa fa-map-marker"></i> Адреса: м. Київ, вул. Хрещатик, 1</p>
          </div>
          
          <div className="footer-section newsletter">
            <h3>Підписатися на новини</h3>
            <form>
              <input type="email" placeholder="Ваш email" required />
              <button type="submit" className="btn btn-primary">Підписатися</button>
            </form>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Soft Animal Platform. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
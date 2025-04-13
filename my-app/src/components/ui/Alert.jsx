import React, { useEffect, useState } from 'react';
import './Alert.css';

const Alert = ({ type = 'info', message, duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-icon">{icons[type]}</div>
      <div className="alert-content">{message}</div>
      <button className="alert-close" onClick={() => {
        setVisible(false);
        if (onClose) onClose();
      }}>×</button>
    </div>
  );
};

export default Alert;
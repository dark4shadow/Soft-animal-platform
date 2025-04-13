import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'medium', color = 'primary' }) => {
  return (
    <div className={`spinner spinner-${size} spinner-${color}`}></div>
  );
};

export default Spinner;
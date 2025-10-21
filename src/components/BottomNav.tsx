import React from 'react';
import { Link } from 'react-router-dom';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  return (
    <div className="bottom-nav">
      <div className="bottom-nav__inner">
        <div className="bottom-nav__left">
          <Link to="/orders" className="bottom-nav__link">Order List</Link>
          <Link to="/totals" className="bottom-nav__link">Daily totals</Link>
        </div>
        <div className="bottom-nav__right">
          <Link to="/setup" className="bottom-nav__link">Setup</Link>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;

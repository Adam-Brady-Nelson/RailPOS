import React from 'react';
import { Link } from 'react-router-dom';
import './BottomNav.css';

type Props = {
  // Reserve space on the right (px), e.g., for a fixed sidebar/aside so the Setup button isn't obscured
  rightOffset?: number;
};

const BottomNav: React.FC<Props> = ({ rightOffset = 0 }) => {
  return (
    <div className="bottom-nav" style={rightOffset ? { paddingRight: 16 + rightOffset } : undefined}>
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

import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import './BackButton.css';

type Props = {
  to?: LinkProps['to'];
  children?: React.ReactNode;
  className?: string;
};

// Reusable Back button. Defaults to navigating to '/'
const BackButton: React.FC<Props> = ({ to = '/', children = '← Back', className }) => {
  return (
    <Link to={to} className={`back-link-btn ${className ?? ''}`.trim()}>
      {children}
    </Link>
  );
};

export default BackButton;

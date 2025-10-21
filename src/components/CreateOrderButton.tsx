import React from 'react';

import './CreateOrderButton.css';

type Props = {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
};

const CreateOrderButton: React.FC<Props> = ({
  type = 'submit',
  disabled,
  className,
  children = 'Create Order',
  onClick,
}) => {
  const classes = [
    'create-order-btn',
    // Tailwind utilities for interactivity and base look
    'px-8 py-4 text-2xl font-semibold bg-blue-600 text-white rounded-xl',
    'hover:bg-blue-700 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300',
    'transition-transform active:scale-[0.98]',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} disabled={disabled} className={classes} onClick={onClick}>
      {children}
    </button>
  );
};

export default CreateOrderButton;

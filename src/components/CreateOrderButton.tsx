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

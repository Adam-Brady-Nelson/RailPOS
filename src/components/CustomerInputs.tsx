import React from 'react';
import './CustomerInputs.css';

interface CustomerInputsProps {
  name: string;
  phone: string;
  address: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
}

const CustomerInputs: React.FC<CustomerInputsProps> = ({
  name,
  phone,
  address,
  onNameChange,
  onPhoneChange,
  onAddressChange,
}) => {
  return (
    <>
      <div className="customer-inputs__field">
        <label htmlFor="name" className="customer-inputs__label">Customer Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="customer-inputs__input"
        />
      </div>
      <div className="customer-inputs__field">
        <label htmlFor="phone" className="customer-inputs__label">Phone Number</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="customer-inputs__input"
          required
        />
      </div>
      <div className="customer-inputs__field">
        <label htmlFor="address" className="customer-inputs__label">Address</label>
        <textarea
          id="address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className="customer-inputs__textarea"
        />
      </div>
    </>
  );
};

export default CustomerInputs;

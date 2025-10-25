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
      <div>
        <label htmlFor="name" className="block">Customer Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full border rounded px-3 py-3 text-lg input-56"
        />
      </div>
      <div className="relative">
        <label htmlFor="phone" className="block">Phone Number</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="w-full border rounded px-3 py-3 text-lg input-56"
          required
        />
      </div>
      <div>
        <label htmlFor="address" className="block">Address</label>
        <textarea
          id="address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className="w-full border rounded px-3 py-3 text-lg textarea-min-56"
        />
      </div>
    </>
  );
};

export default CustomerInputs;

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const CustomerForm: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const navigate = useNavigate();
  const { phoneId } = useParams<{ phoneId: string }>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the customer details
    console.log({ phoneId, name, phone, address });
    navigate('/order');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Information (Phone {phoneId})</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block">Customer Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="block">Phone Number</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="address" className="block">Address</label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Order
        </button>
      </form>
    </div>
  );
};

export default CustomerForm;

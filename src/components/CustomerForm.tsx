import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

const CustomerForm: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const navigate = useNavigate();
  const { phoneId } = useParams<{ phoneId: string }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { orderId } = await window.db.createCustomerAndOrder({
        customer: { name, phone, address },
        phoneId: parseInt(phoneId!, 10)
      });
      navigate(`/order/${orderId}`);
    } catch (error) {
      console.error('Failed to create customer and order:', error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="p-4">
      <div style={{ marginBottom: 12 }}>
        <Link
          to="/"
          style={{
            padding: '8px 12px',
            background: '#111827',
            color: '#ffffff',
            borderRadius: 8,
            border: '1px solid #111827',
            cursor: 'pointer',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          ← Back
        </Link>
      </div>
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
          Create Order
        </button>
      </form>
    </div>
  );
};

export default CustomerForm;

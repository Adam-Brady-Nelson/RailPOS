import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomerInputs from '../components/CustomerInputs';
import './CustomerForm.css';
import BackButton from '../components/BackButton';
import CreateOrderButton from '../components/CreateOrderButton';
import SuggestionsTable from '../components/SuggestionsTable';

const CustomerForm: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id:number; name:string; phone:string; address:string }>>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { phoneId } = useParams<{ phoneId: string }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { customerId } = await window.db.createOrUpdateCustomer({ name, phone, address });
      // Navigate to order screen without creating an order yet; attach details in state
      navigate(`/order/new`, { state: { customerId, phoneId: parseInt(phoneId!, 10), customer: { name, phone, address } } });
    } catch (error) {
      console.error('Failed to create customer and order:', error);
      // Optionally, show an error message to the user
    }
  };

  // Debounced lookup on phone input (fetch only)
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!phone || phone.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const rows = await window.db.searchCustomersByPhone?.(phone.trim(), 20);
        setSuggestions(rows ?? []);
        setOpen((rows?.length ?? 0) > 0);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 200);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [phone]);

  // Removed exact match auto-fill: the form should only fill when a suggestion is clicked.

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const choose = (s: { id:number; name:string; phone:string; address:string }) => {
    setName(s.name);
    setPhone(s.phone);
    setAddress(s.address);
    // Keep suggestions visible after selecting an entry
  };

  return (
    <div className="customer-form__container" ref={containerRef}>
      <div className="back-link-wrap">
        <BackButton to="/">← Back</BackButton>
      </div>
      <h1 className="customer-form__title">Customer Information (Phone {phoneId})</h1>
      <form onSubmit={handleSubmit} className="customer-form__form">
        <CustomerInputs
          name={name}
          phone={phone}
          address={address}
          onNameChange={setName}
          onPhoneChange={setPhone}
          onAddressChange={setAddress}
        />
        <div className="customer-form__submit-wrap">
          <CreateOrderButton />
        </div>
      </form>
      {/* Suggestions Table */}
      <SuggestionsTable
        loading={loading}
        open={open}
        suggestions={suggestions}
        onChoose={choose}
      />
    </div>
  );
};

export default CustomerForm;

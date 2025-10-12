import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

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

  // Debounced lookup on phone input
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
        const exact = (rows ?? []).find(r => r.phone === phone.trim());
        if (exact) {
          if (!name) setName(exact.name);
          if (!address) setAddress(exact.address);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 200);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [phone]);

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
    setOpen(false);
  };

  return (
    <div className="p-4" ref={containerRef}>
      <div style={{ marginBottom: 12 }}>
        <Link
          to="/"
          style={{
            padding: '8px 12px',
            background: '#111827',
            color: '#ffffff',
            borderRadius: 8,
            border: '1px solid #111827',
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
            className="w-full border rounded px-3 py-3 text-lg"
            style={{ height: 56 }}
          />
        </div>
        <div className="relative">
          <label htmlFor="phone" className="block">Phone Number</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded px-3 py-3 text-lg"
            style={{ height: 56 }}
            required
          />
        </div>
        <div>
          <label htmlFor="address" className="block">Address</label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded px-3 py-3 text-lg"
            style={{ minHeight: 56 }}
          />
        </div>
        <div className="flex justify-center mt-6 mb-2">
          <button
            type="submit"
            className="px-8 py-4 text-2xl font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 transition-transform active:scale-[0.98]"
            style={{
              minWidth: 420,
              height: 72,
              fontSize: 28,
              borderRadius: 12,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#2563eb',
              color: '#ffffff',
              border: '1px solid #1d4ed8',
              boxShadow: '0 8px 20px rgba(37,99,235,0.3)'
            }}
          >
            Create Order
          </button>
        </div>
      </form>
      {/* Suggestions Table */}
      <div className="mt-6">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-3 py-2 text-left">Name</th>
              <th className="border px-3 py-2 text-left">Phone</th>
              <th className="border px-3 py-2 text-left">Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="border px-3 py-3 text-gray-600" colSpan={3}>Searching…</td>
              </tr>
            ) : (open && suggestions.length > 0 ? (
              suggestions.map(s => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50 cursor-pointer select-none"
                  style={{ height: 56 }}
                  onClick={() => choose(s)}
                >
                  <td className="border px-3 py-3 text-base">{s.name}</td>
                  <td className="border px-3 py-3 text-base">{s.phone}</td>
                  <td className="border px-3 py-3 text-base">{s.address}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border px-3 py-3 text-gray-500" colSpan={3}>No matches</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerForm;

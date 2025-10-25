import React from 'react';

export interface OrderRow {
  id: number;
  created_at: string;
  status: string;
  phone_id: number;
  customer_name?: string;
  customer_phone?: string;
  total: number;
}

interface OrdersTableProps {
  orders: OrderRow[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, selectedId, onSelect }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">#</th>
            <th className="border p-2 text-left">Time</th>
            <th className="border p-2 text-left">Customer</th>
            <th className="border p-2 text-left">Phone</th>
            <th className="border p-2 text-left">Phone ID</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className={"cursor-pointer hover:bg-gray-50 " + (selectedId === o.id ? 'bg-blue-50' : '')}
              onClick={() => onSelect(o.id)}
            >
              <td className="border p-2">{o.id}</td>
              <td className="border p-2">{new Date(o.created_at).toLocaleTimeString()}</td>
              <td className="border p-2">{o.customer_name ?? '—'}</td>
              <td className="border p-2">{o.customer_phone ?? '—'}</td>
              <td className="border p-2">{o.phone_id}</td>
              <td className="border p-2">{o.status}</td>
              <td className="border p-2 text-right">${o.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;

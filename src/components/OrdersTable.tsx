import React from 'react';
import './OrdersTable.css';

export interface OrderRow {
  id: number;
  created_at: string;
  status: string;
  phone_id: number;
  fulfillment: 'delivery' | 'collection' | 'bar';
  customer_name?: string;
  customer_phone?: string;
  total: number;
  // Optional display-only fields computed client-side
  display_no?: number;
}

interface OrdersTableProps {
  orders: OrderRow[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, selectedId, onSelect }) => {
  return (
    <div className="orders-table__container">
      <table className="orders-table">
        <thead>
          <tr>
            <th className="orders-table__th orders-table__th--left">No.</th>
            <th className="orders-table__th orders-table__th--left">Time (newest first)</th>
            <th className="orders-table__th orders-table__th--left">Customer</th>
            <th className="orders-table__th orders-table__th--left">Phone</th>
            <th className="orders-table__th orders-table__th--left">Fulfillment</th>
            <th className="orders-table__th orders-table__th--left">Status</th>
            <th className="orders-table__th orders-table__th--right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className={"orders-table__row" + (selectedId === o.id ? ' orders-table__row--selected' : '')}
              onClick={() => onSelect(o.id)}
            >
              <td className="orders-table__td">{o.display_no != null ? o.display_no : o.id}</td>
              <td className="orders-table__td">{new Date(o.created_at).toLocaleTimeString()}</td>
              <td className="orders-table__td">{o.customer_name ?? '—'}</td>
              <td className="orders-table__td">{o.customer_phone ?? '—'}</td>
              <td className="orders-table__td">{o.fulfillment === 'delivery' ? 'Delivery' : o.fulfillment === 'bar' ? 'Bar' : 'Collection'}</td>
              <td className="orders-table__td">{o.status}</td>
              <td className="orders-table__td orders-table__td--right">${o.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;

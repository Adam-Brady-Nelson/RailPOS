import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './components/MainScreen';
import CustomerForm from './components/CustomerForm';
import OrderScreen from './components/OrderScreen';
import OrderList from './components/OrderList';
import DailyTotals from './components/DailyTotals';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/customer-form/:phoneId" element={<CustomerForm />} />
  <Route path="/order/:orderId" element={<OrderScreen />} />
  <Route path="/order/new" element={<OrderScreen />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/totals" element={<DailyTotals />} />
      </Routes>
    </Router>
  );
};

export default App;


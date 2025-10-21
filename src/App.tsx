import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './pages/MainScreen';
import CustomerForm from './pages/CustomerForm';
import OrderScreen from './components/OrderScreen';
import OrderList from './pages/OrderList';
import DailyTotals from './pages/DailyTotals';
import Setup from './components/Setup';
import MenuManager from './components/MenuManager';

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
        <Route path="/setup" element={<Setup />} />
        <Route path="/menu" element={<MenuManager />} />
      </Routes>
    </Router>
  );
};

export default App;


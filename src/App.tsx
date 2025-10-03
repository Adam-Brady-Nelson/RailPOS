import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './components/MainScreen';
import CustomerForm from './components/CustomerForm';
import OrderScreen from './components/OrderScreen';
import OrderList from './components/OrderList';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/customer-form/:phoneId" element={<CustomerForm />} />
        <Route path="/order/:orderId" element={<OrderScreen />} />
        <Route path="/orders" element={<OrderList />} />
      </Routes>
    </Router>
  );
};

export default App;


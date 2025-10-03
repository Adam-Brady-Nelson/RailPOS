import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './components/MainScreen';
import CustomerForm from './components/CustomerForm';
import OrderScreen from './components/OrderScreen';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/customer-form/:phoneId" element={<CustomerForm />} />
        <Route path="/order/:orderId" element={<OrderScreen />} />
      </Routes>
    </Router>
  );
};

export default App;


import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import MainScreen from './pages/MainScreen';
import CustomerForm from './pages/CustomerForm';
import OrderScreen from './pages/OrderScreen';
import OrderList from './pages/OrderList';
import DailyTotals from './pages/DailyTotals';
import Setup from './pages/Setup';
import MenuManager from './pages/MenuManager';

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // On first render, check if primary DB exists. If not, route to setup.
    (async () => {
      try {
        const present = await window.db.isDbPresent();
        if (!present && location.pathname !== '/setup') {
          navigate('/setup', { replace: true });
        }
      } catch (e) {
        // If check fails for any reason, be safe and show setup.
        if (location.pathname !== '/setup') navigate('/setup', { replace: true });
      }
    })();
  }, [location.pathname, navigate]);

  return (
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
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;


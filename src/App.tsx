import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import MainScreen from './pages/MainScreen';
import CustomerForm from './pages/CustomerForm';
import OrderScreen from './pages/OrderScreen';
import OrderList from './pages/OrderList';
import DailyTotals from './pages/DailyTotals';
import Setup from './pages/Setup';
import MenuManager from './pages/MenuManager';
import BarOrderScreen from './pages/bar/BarOrderScreen';

type AppStyle = 'TAKEAWAY' | 'BAR';

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [style, setStyle] = useState<AppStyle | null>(null);

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

  useEffect(() => {
    let off = () => {};
    (async () => {
      try {
        // @ts-ignore optional for browser-only Vite
        const s = await window.settings?.get?.();
        const st = ((s?.activeStyle ?? s?.style) ?? 'TAKEAWAY') as AppStyle;
        setStyle(st);
        // @ts-ignore
        off = window.settings?.onChanged?.((ns: { activeStyle: AppStyle; style?: AppStyle }) => setStyle((ns.activeStyle ?? ns.style ?? 'TAKEAWAY') as AppStyle)) ?? (() => {});
      } catch {
        setStyle('TAKEAWAY');
      }
    })();
    return () => off();
  }, []);

  if (!style) return null;

  const isBar = style === 'BAR';

  return (
    <Routes>
      {isBar ? (
        <>
          <Route path="/" element={<BarOrderScreen />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<MainScreen />} />
          <Route path="/customer-form/:phoneId" element={<CustomerForm />} />
          <Route path="/order/:orderId" element={<OrderScreen />} />
          <Route path="/order/new" element={<OrderScreen />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/totals" element={<DailyTotals />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/menu" element={<MenuManager />} />
        </>
      )}
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


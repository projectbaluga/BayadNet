import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import PaymentReminder from './pages/PaymentReminder';
import Dashboard from './pages/Dashboard';

function App() {
  const location = useLocation();

  useEffect(() => {
    switch (location.pathname) {
      case '/team':
        document.title = 'Bojex-Team';
        break;
      case '/payment-reminder':
        document.title = 'Payment Reminder';
        break;
      default:
        document.title = 'Siguradong Connected!';
    }
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/payment-reminder" element={<PaymentReminder />} />
      <Route path="/team" element={<Dashboard />} />
    </Routes>
  );
}

export default App;

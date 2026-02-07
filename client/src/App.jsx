import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PaymentReminder from './pages/PaymentReminder';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/payment-reminder" element={<PaymentReminder />} />
      <Route path="/team" element={<Dashboard />} />
    </Routes>
  );
}

export default App;

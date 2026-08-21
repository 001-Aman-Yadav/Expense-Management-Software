import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/income" element={<Layout><Income /></Layout>} />
          <Route path="/expenses" element={<Layout><Expenses /></Layout>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

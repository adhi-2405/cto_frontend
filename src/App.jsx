import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Challenge from './pages/Challenge';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

const ProtectedRoute = ({ children, requireRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    return <Navigate to="/" />;
  }

  if (requireRole && user.role !== requireRole) {
    if (user.role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to="/challenge" />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        
        <Route 
          path="/challenge" 
          element={
            <ProtectedRoute requireRole="team">
              <Challenge />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

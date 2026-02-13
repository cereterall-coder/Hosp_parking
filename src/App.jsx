import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PorterDashboard from './pages/PorterDashboard';
import Setup from './pages/Setup';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/main.css';

const RootRedirect = () => {
  const { currentUser, userRole, loading } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  // Si tenemos usuario pero el rol no carga por el firewall del hospital,
  // redirigimos a admin como fallback seguro (el panel admin maneja sus propias restricciones)
  if (userRole === 'admin' || userRole === 'supervisor') return <Navigate to="/admin" replace />;
  if (userRole === 'agent') return <Navigate to="/agent" replace />;

  // Por defecto si no hay rol por lentitud, vamos a admin (es más resiliente)
  return <Navigate to="/admin" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />

          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/agent/*" element={
            <ProtectedRoute requiredRole="agent">
              <PorterDashboard />
            </ProtectedRoute>
          } />

          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

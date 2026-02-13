import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (requiredRole === 'admin' && (userRole === 'admin' || userRole === 'supervisor')) return children;

    // Si no hay rol pero hay usuario (internet lento), 
    // permitimos que el panel se cargue y maneje su estado
    if (currentUser && !userRole && requiredRole === 'admin') return children;

    if (requiredRole && userRole && userRole !== requiredRole) {
        if (userRole === 'admin' || userRole === 'supervisor') return <Navigate to="/admin" />;
        if (userRole === 'agent') return <Navigate to="/agent" />;
    }

    // Por defecto, si no hay certeza del rol por lentitud, 
    // mostramos los children (el panel) para que este cargue sus propios datos
    return children;

    return children;
}

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PromoterDashboard from './components/PromoterDashboard';
import TicketTypesManagement from './components/TicketTypesManagement';
import TicketAndBraceletManagement from './components/TicketAndBraceletManagement';
import UserManagement from './components/UserManagement';
import AdminFestivalManagement from './components/AdminFestivalManagement';
import AdminClientAndReportManagement from './components/AdminClientAndReportManagement';
import PublicNomination from './components/PublicNomination';
import FestivalForm from './components/FestivalForm';
import FestivalDetails from './components/FestivalDetails';
import ChangePasswordForce from './components/ChangePasswordForce';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const AppRoutes = () => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (isAuthenticated && user?.cambioPasswordRequerido && location.pathname !== '/cambiar-password-obligatorio') {
        return <Navigate to="/cambiar-password-obligatorio" replace />;
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route
                path="/cambiar-password-obligatorio"
                element={
                    <ProtectedRoute>
                        <ChangePasswordForce />
                    </ProtectedRoute>
                }
            />

            <Route path="/public/nominar-entrada/:codigoQr" element={<PublicNomination />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        {user?.role === 'PROMOTOR' ? <Navigate to="/promotor/dashboard" replace /> : <Navigate to="/admin/dashboard" replace />}
                    </ProtectedRoute>
                }
            />

            {/* Rutas PROMOTOR */}
            <Route path="/promotor/dashboard" element={<ProtectedRoute requiredRole="PROMOTOR"><PromoterDashboard /></ProtectedRoute>} />
            <Route path="/promotor/festivales/crear" element={<ProtectedRoute requiredRole="PROMOTOR"><FestivalForm /></ProtectedRoute>} />
            <Route path="/promotor/festivales/:idFestival/editar" element={<ProtectedRoute requiredRole="PROMOTOR"><FestivalForm /></ProtectedRoute>} />
            <Route path="/promotor/festivales/:idFestival" element={<ProtectedRoute requiredRole="PROMOTOR"><FestivalDetails /></ProtectedRoute>} />
            <Route path="/promotor/festivales/:idFestival/tipos-entrada" element={<ProtectedRoute requiredRole="PROMOTOR"><TicketTypesManagement /></ProtectedRoute>} />
            <Route path="/promotor/festivales/:idFestival/reporte-entradas" element={<ProtectedRoute requiredRole="PROMOTOR"><TicketAndBraceletManagement /></ProtectedRoute>} />

            {/* Rutas ADMIN */}
            <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute requiredRole="ADMIN"><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/festivales" element={<ProtectedRoute requiredRole="ADMIN"><AdminFestivalManagement /></ProtectedRoute>} />
            <Route path="/admin/clientes" element={<ProtectedRoute requiredRole="ADMIN"><AdminClientAndReportManagement initialTab="clientes" /></ProtectedRoute>} />
            <Route path="/admin/reportes" element={<ProtectedRoute requiredRole="ADMIN"><AdminClientAndReportManagement /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
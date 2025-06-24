import React from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Maneja el cierre de sesión y la navegación.
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-corporate-gradient p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Panel de Administración
                </h1>
                <div className="flex items-center space-x-4">
                    {user && (
                        <span className="text-gray-700">
                            Bienvenido, <span className="font-semibold">{user.userName || user.userId}</span> ({user.role})
                        </span>
                    )}
                    <button
                        onClick={handleLogout}
                        className="btn-corporate-secondary"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main className="card-corporate p-6">
                <h2 className="title-corporate text-xl text-gray-800 mb-4">Gestión General</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Tarjeta de Gestión de Usuarios */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Gestión de Usuarios</h3>
                        <p className="text-gray-700 mb-4">Administra los usuarios del sistema (Administradores, Promotores, Cajeros).</p>
                        <button
                            onClick={() => navigate('/admin/usuarios')}
                            className="btn-corporate-primary"
                        >
                            Ir a Gestión de Usuarios
                        </button>
                    </div>

                    {/* Tarjeta de Gestión de Festivales */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Gestión de Festivales</h3>
                        <p className="text-gray-700 mb-4">Visualiza y gestiona todos los festivales del sistema.</p>
                        <button
                            onClick={() => navigate('/admin/festivales')}
                            className="btn-corporate-primary"
                        >
                            Ir a Gestión de Festivales
                        </button>
                    </div>

                    {/* Tarjeta de Gestión de Clientes/Asistentes */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Gestión de Clientes</h3>
                        <p className="text-gray-700 mb-4">Consulta y administra la información de compradores y asistentes.</p>
                        <button
                            onClick={() => navigate('/admin/clientes')}
                            className="btn-corporate-primary"
                        >
                            Ir a Gestión de Clientes
                        </button>
                    </div>

                    {/* Tarjeta de Reportes */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Reportes y Estadísticas</h3>
                        <p className="text-gray-700 mb-4">Accede a informes de ventas, asistencias y pulseras.</p>
                        <button
                            onClick={() => navigate('/admin/reportes?reportType=compras')}
                            className="btn-corporate-primary"
                        >
                            Ver Reportes
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const PromoterDashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [festivals, setFestivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Función auxiliar para mostrar y limpiar mensajes.
    const showMessage = (setter, msg, duration = 5000) => {
        setter(msg);
        setTimeout(() => setter(null), duration);
    };

    // Efecto para cargar los festivales del promotor.
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchFestivals = async () => {
            try {
                setLoading(true);
                setError(null);
                setSuccessMessage(null);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al cargar los festivales.');
                }

                const data = await response.json();
                setFestivals(data);
            } catch (err) {
                console.error("Error fetching festivals:", err);
                showMessage(setError, err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFestivals();
    }, [token, navigate]);

    // Maneja el cierre de sesión y la navegación.
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Navega a la gestión de tipos de entrada de un festival.
    const handleManageTicketTypes = (idFestival) => {
        navigate(`/promotor/festivales/${idFestival}/tipos-entrada`);
    };

    // Navega a la gestión de entradas y pulseras de un festival.
    const handleManageTicketsAndBracelets = (idFestival) => {
        navigate(`/promotor/festivales/${idFestival}/gestion-entradas`);
    };

    // Navega al formulario para crear un nuevo festival.
    const handleCreateFestival = () => {
        navigate('/promotor/festivales/crear');
    };

    // Navega a la vista de detalles de un festival.
    const handleViewFestivalDetails = (idFestival) => {
        navigate(`/promotor/festivales/${idFestival}`);
    };

    // Formatear fecha a formato local.
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Obtener clase de estilo para el estado del festival.
    const getFestivalStatusBadgeClass = (status) => {
        switch (status) {
            case 'PUBLICADO': return 'bg-green-100 text-green-800';
            case 'BORRADOR': return 'bg-yellow-100 text-yellow-800';
            case 'CANCELADO': return 'bg-red-100 text-red-800';
            case 'FINALIZADO': return 'bg-gray-200 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-corporate-gradient p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Panel de Promotor
                </h1>
                <div className="flex items-center space-x-4">
                    {user && (
                        <span className="text-gray-700">
                            Bienvenido, <span className="font-semibold">{user.userName || user.userId}</span> ({user.role})
                        </span>
                    )}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleLogout}
                            className="btn-corporate-secondary"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            <main className="card-corporate p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="title-corporate text-xl text-gray-800">Mis Festivales</h2>
                    <button
                        onClick={handleCreateFestival}
                        className="btn-corporate-primary"
                    >
                        Crear Nuevo Festival
                    </button>
                </div>

                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Éxito:</strong>
                        <span className="block sm:inline"> {successMessage}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-8 text-gray-600">Cargando festivales...</div>
                )}

                {!loading && festivals.length === 0 && !error && (
                    <div className="text-center py-8 text-gray-600">No tienes festivales registrados.</div>
                )}

                {!loading && festivals.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="table-corporate">
                            <thead>
                                <tr>
                                    <th scope="col">Nombre</th>
                                    <th scope="col">Fechas</th>
                                    <th scope="col">Ubicación</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {festivals.map((festival) => (
                                    <tr key={festival.idFestival} className="hover:bg-gray-50">
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <button
                                                onClick={() => handleViewFestivalDetails(festival.idFestival)}
                                                className="text-indigo-600 hover:underline font-semibold focus:outline-none"
                                            >
                                                {festival.nombre}
                                            </button>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">
                                                {formatDate(festival.fechaInicio)} - {formatDate(festival.fechaFin)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{festival.ubicacion || 'N/A'}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFestivalStatusBadgeClass(festival.estado)}`}>
                                                {festival.estado}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm space-x-3">
                                            <button
                                                onClick={() => handleViewFestivalDetails(festival.idFestival)}
                                                className="btn-corporate-primary px-3 py-1 text-sm"
                                            >
                                                Ver Detalles
                                            </button>
                                            <button
                                                onClick={() => handleManageTicketTypes(festival.idFestival)}
                                                className="btn-corporate-secondary px-3 py-1 text-sm"
                                            >
                                                Entradas
                                            </button>
                                            <button
                                                onClick={() => handleManageTicketsAndBracelets(festival.idFestival)}
                                                className="btn-corporate-secondary px-3 py-1 text-sm"
                                            >
                                                Pulseras
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PromoterDashboard;

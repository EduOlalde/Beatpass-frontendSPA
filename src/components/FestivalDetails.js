import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const FestivalDetails = () => {
    const { idFestival } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const [festivalDetails, setFestivalDetails] = useState(null);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función auxiliar para mostrar y limpiar mensajes.
    const showMessage = (setter, msg, duration = 5000) => {
        setter(msg);
        setTimeout(() => setter(null), duration);
    };

    // Efecto para cargar los detalles del festival y los tipos de entrada.
    useEffect(() => {
        if (!token || !idFestival) {
            navigate('/login');
            return;
        }

        const fetchAllFestivalData = async () => {
            try {
                setLoading(true);
                setError(null);

                const festivalResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!festivalResponse.ok) {
                    const errorData = await festivalResponse.json();
                    throw new Error(errorData.error || 'Festival no encontrado o sin permisos.');
                }
                const festData = await festivalResponse.json();
                setFestivalDetails(festData);

                const ticketTypesResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}/tipos-entrada`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!ticketTypesResponse.ok) {
                    const errorData = await ticketTypesResponse.json();
                    throw new Error(errorData.error || 'Error al cargar los tipos de entrada.');
                }
                const typesData = await ticketTypesResponse.json();
                setTicketTypes(typesData);

            } catch (err) {
                console.error("Error fetching festival details and ticket types:", err);
                showMessage(setError, err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllFestivalData();
    }, [idFestival, token, navigate]);

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <p className="text-gray-600">Cargando detalles del festival...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-corporate-gradient p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
                <div className="error-message text-center mb-4">
                    <strong>Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
                <button
                    onClick={() => navigate(user.role === 'PROMOTOR' ? '/promotor/dashboard' : '/admin/festivales')}
                    className="btn-corporate-secondary mt-4"
                >
                    Volver
                </button>
            </div>
        );
    }

    if (!festivalDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-corporate-gradient p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
                <p className="text-gray-100 text-lg">No se encontraron detalles para este festival.</p>
                <button
                    onClick={() => navigate(user.role === 'PROMOTOR' ? '/promotor/dashboard' : '/admin/festivales')}
                    className="btn-corporate-secondary mt-4"
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-corporate-gradient p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Detalles del Festival: {festivalDetails.nombre}
                </h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(user.role === 'PROMOTOR' ? '/promotor/dashboard' : '/admin/festivales')}
                        className="btn-corporate-secondary"
                    >
                        Volver al Dashboard {user.role === 'PROMOTOR' ? 'Promotor' : 'Admin'}
                    </button>
                </div>
            </header>

            <main className="card-corporate p-6">
                <h2 className="title-corporate text-xl text-gray-800 mb-4">Información General</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div>
                        <p className="text-gray-700 font-semibold">Nombre:</p>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200">{festivalDetails.nombre}</p>
                    </div>
                    <div>
                        <p className="text-gray-700 font-semibold">Promotor:</p>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200">{festivalDetails.nombrePromotor} (ID: {festivalDetails.idPromotor})</p>
                    </div>
                    <div>
                        <p className="text-gray-700 font-semibold">Fechas:</p>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200">{formatDate(festivalDetails.fechaInicio)} - {formatDate(festivalDetails.fechaFin)}</p>
                    </div>
                    <div>
                        <p className="text-gray-700 font-semibold">Ubicación:</p>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200">{festivalDetails.ubicacion || 'No especificada'}</p>
                    </div>
                    <div>
                        <p className="text-gray-700 font-semibold">Aforo:</p>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200">{festivalDetails.aforo || 'No especificado'}</p>
                    </div>
                    <div>
                        <p className="text-gray-700 font-semibold">Estado:</p>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFestivalStatusBadgeClass(festivalDetails.estado)} mt-1`}>
                            {festivalDetails.estado}
                        </span>
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-gray-700 font-semibold">Descripción:</p>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded-md border border-gray-200 whitespace-pre-wrap">{festivalDetails.descripcion || 'No hay descripción.'}</p>
                    </div>
                    {festivalDetails.imagenUrl && (
                        <div className="md:col-span-2">
                            <p className="text-gray-700 font-semibold mb-2">Imagen del Festival:</p>
                            <img src={festivalDetails.imagenUrl} alt={festivalDetails.nombre} className="max-w-xs h-auto rounded-lg shadow-md" />
                        </div>
                    )}
                </div>

                <h2 className="title-corporate text-xl text-gray-800 mb-4">Tipos de Entrada Disponibles</h2>
                {ticketTypes.length === 0 ? (
                    <p className="text-gray-600 mb-8">No hay tipos de entrada definidos para este festival.</p>
                ) : (
                    <div className="overflow-x-auto mb-8">
                        <table className="table-corporate">
                            <thead>
                                <tr>
                                    <th>
                                        Tipo
                                    </th>
                                    <th>
                                        Precio
                                    </th>
                                    <th>
                                        Stock
                                    </th>
                                    <th>
                                        Requiere Nominación
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ticketTypes.map((type) => (
                                    <tr key={type.idTipoEntrada}>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">{type.tipo}</p>
                                            <p className="text-gray-600 text-xs">{type.descripcion}</p>
                                        </td>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">{parseFloat(type.precio).toFixed(2)} €</p>
                                        </td>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">{type.stock}</p>
                                        </td>
                                        <td>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${type.requiereNominacion ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {type.requiereNominacion ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <h2 className="title-corporate text-xl text-gray-800 mb-4">Acciones de Gestión y Reportes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.role === 'PROMOTOR' && (
                        <>
                            <button
                                onClick={() => navigate(`/promotor/festivales/${idFestival}/editar`)}
                                className="btn-corporate-primary"
                            >
                                Editar Festival
                            </button>
                            <button
                                onClick={() => navigate(`/promotor/festivales/${idFestival}/tipos-entrada`)}
                                className="btn-corporate-primary"
                            >
                                Gestionar Tipos de Entrada
                            </button>
                            <button
                                onClick={() => navigate(`/promotor/festivales/${idFestival}/reporte-entradas`)}
                                className="btn-corporate-primary"
                            >
                                Reporte de Entradas y Gestión
                            </button>

                            <button
                                onClick={() => navigate(`/admin/reportes?festivalId=${idFestival}&reportType=asistentes`)}
                                className="btn-corporate-primary"
                            >
                                Ver Reporte de Asistentes
                            </button>
                            <button
                                onClick={() => navigate(`/admin/reportes?festivalId=${idFestival}&reportType=compras`)}
                                className="btn-corporate-primary"
                            >
                                Ver Reporte de Compras
                            </button>
                            <button
                                onClick={() => navigate(`/admin/reportes?festivalId=${idFestival}&reportType=pulseras`)}
                                className="btn-corporate-primary"
                            >
                                Ver Reporte de Pulseras
                            </button>
                        </>
                    )}
                    {user.role === 'ADMIN' && (
                        <>
                            <button
                                onClick={() => navigate(`/promotor/festivales/${idFestival}/editar`)}
                                className="btn-corporate-primary"
                            >
                                Editar Festival (Admin)
                            </button>
                            <button
                                onClick={() => navigate(`/admin/festivales`)}
                                className="btn-corporate-primary"
                            >
                                Gestionar Estado Festival (Admin)
                            </button>
                            <button
                                onClick={() => navigate(`/admin/reportes?festivalId=${idFestival}&reportType=compras`)}
                                className="btn-corporate-primary"
                            >
                                Ver Reporte de Compras (Admin)
                            </button>
                            <button
                                onClick={() => navigate(`/admin/reportes?festivalId=${idFestival}&reportType=asistentes`)}
                                className="btn-corporate-primary"
                            >
                                Ver Reporte de Asistentes (Admin)
                            </button>
                            <button
                                onClick={() => navigate(`/admin/reportes?festivalId=${idFestival}&reportType=pulseras`)}
                                className="btn-corporate-primary"
                            >
                                Ver Reporte de Pulseras (Admin)
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FestivalDetails;

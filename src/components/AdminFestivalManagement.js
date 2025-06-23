import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';

const AdminFestivalManagement = () => {
    const { token, user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [festivals, setFestivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('TODOS');
    const [successMessage, setSuccessMessage] = useState(null);

    // Estados para el modal de confirmación.
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [confirmModalAction, setConfirmModalAction] = useState(() => () => { });
    const [confirmModalConfirmText, setConfirmModalConfirmText] = useState('Confirmar');

    // Función auxiliar para mostrar y limpiar mensajes.
    const showMessage = (setter, msg, duration = 5000) => {
        setter(msg);
        setTimeout(() => setter(null), duration);
    };

    // Efecto para cargar festivales al inicio y cuando cambie el filtro de estado.
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchFestivals(filterStatus);
    }, [token, navigate, filterStatus]);

    // Función para obtener los festivales desde la API.
    const fetchFestivals = async (statusFilter) => {
        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            let url = `${process.env.REACT_APP_API_BASE_URL}/admin/festivales`;
            if (statusFilter && statusFilter !== 'TODOS') {
                url += `?estado=${statusFilter}`;
            }

            const response = await fetch(url, {
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

    // Manejador para confirmar (publicar) un festival.
    const handleConfirmFestival = (idFestival, festivalName) => {
        setShowConfirmModal(true);
        setConfirmModalMessage(`¿Estás seguro de que quieres PUBLICAR el festival "${festivalName}"?`);
        setConfirmModalConfirmText('Publicar');
        setConfirmModalAction(() => async () => {
            setShowConfirmModal(false);
            try {
                setError(null);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/festivales/${idFestival}/confirmar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al confirmar el festival.');
                }

                showMessage(setSuccessMessage, `Festival "${festivalName}" publicado con éxito!`);
                fetchFestivals(filterStatus);
            } catch (err) {
                console.error("Error confirming festival:", err);
                showMessage(setError, err.message);
            }
        });
    };

    // Manejador para cambiar el estado de un festival.
    const handleChangeFestivalStatus = (idFestival, newStatus, festivalName) => {
        setShowConfirmModal(true);
        setConfirmModalMessage(`¿Estás seguro de que quieres cambiar el estado de "${festivalName}" a ${newStatus}?`);
        setConfirmModalConfirmText(`Cambiar a ${newStatus}`);
        setConfirmModalAction(() => async () => {
            setShowConfirmModal(false);
            try {
                setError(null);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/festivales/${idFestival}/estado`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ nuevoEstado: newStatus }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error al cambiar el estado del festival a ${newStatus}.`);
                }

                showMessage(setSuccessMessage, `Estado de "${festivalName}" cambiado a ${newStatus} con éxito!`);
                fetchFestivals(filterStatus);
            } catch (err) {
                console.error("Error changing festival status:", err);
                showMessage(setError, err.message);
            }
        });
    };

    // Manejador para eliminar un festival.
    const handleDeleteFestival = (idFestival, festivalName) => {
        setShowConfirmModal(true);
        setConfirmModalMessage(`¡ATENCIÓN! ¿Estás seguro de que quieres eliminar el festival "${festivalName}"? Esta acción eliminará todos los tipos de entrada, ventas y datos asociados. Esta acción es irreversible.`);
        setConfirmModalConfirmText('Eliminar Definitivamente');
        setConfirmModalAction(() => async () => {
            setShowConfirmModal(false);
            try {
                setError(null);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/festivales/${idFestival}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al eliminar el festival.');
                }

                showMessage(setSuccessMessage, `Festival "${festivalName}" eliminado con éxito.`);
                fetchFestivals(filterStatus);
            } catch (err) {
                console.error("Error deleting festival:", err);
                showMessage(setError, err.message);
            }
        });
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
                    Gestión de Festivales
                </h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-corporate-secondary"
                    >
                        Volver al Dashboard Admin
                    </button>
                </div>
            </header>

            <main className="card-corporate p-6">
                <h2 className="title-corporate text-xl text-gray-800 mb-4">Listado General de Festivales</h2>

                {successMessage && (
                    <div className="success-message mb-4">
                        <strong>Éxito:</strong>
                        <span className="block sm:inline"> {successMessage}</span>
                    </div>
                )}
                {error && (
                    <div className="error-message mb-4">
                        <strong>Error:</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Estado:</label>
                        <select
                            id="filterStatus"
                            name="filterStatus"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="input-corporate w-auto"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="BORRADOR">Borrador</option>
                            <option value="PUBLICADO">Publicado</option>
                            <option value="CANCELADO">Cancelado</option>
                            <option value="FINALIZADO">Finalizado</option>
                        </select>
                    </div>
                </div>

                {loading && (
                    <div className="text-center py-8 text-gray-600">Cargando festivales...</div>
                )}

                {!loading && festivals.length === 0 && !error && (
                    <div className="text-center py-8 text-gray-600">No hay festivales para mostrar con el filtro actual.</div>
                )}

                {!loading && festivals.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="table-corporate">
                            <thead>
                                <tr>
                                    <th>
                                        Nombre
                                    </th>
                                    <th>
                                        Promotor
                                    </th>
                                    <th>
                                        Fechas
                                    </th>
                                    <th>
                                        Ubicación
                                    </th>
                                    <th>
                                        Estado
                                    </th>
                                    <th>
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {festivals.map((festival) => (
                                    <tr key={festival.idFestival}>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">{festival.nombre}</p>
                                        </td>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">{festival.nombrePromotor}</p>
                                            <p className="text-gray-600 text-xs">ID: {festival.idPromotor}</p>
                                        </td>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">
                                                {formatDate(festival.fechaInicio)} - {formatDate(festival.fechaFin)}
                                            </p>
                                        </td>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">{festival.ubicacion || 'N/A'}</p>
                                        </td>
                                        <td>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFestivalStatusBadgeClass(festival.estado)}`}>
                                                {festival.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col space-y-1">
                                                {festival.estado === 'BORRADOR' && (
                                                    <button
                                                        onClick={() => handleConfirmFestival(festival.idFestival, festival.nombre)}
                                                        className="btn-corporate-primary px-3 py-1 text-sm"
                                                    >
                                                        Publicar Festival
                                                    </button>
                                                )}
                                                {(festival.estado === 'BORRADOR' || festival.estado === 'PUBLICADO') && (
                                                    <button
                                                        onClick={() => handleChangeFestivalStatus(festival.idFestival, 'CANCELADO', festival.nombre)}
                                                        className="btn-corporate-secondary px-3 py-1 text-sm bg-red-600 hover:bg-red-700"
                                                    >
                                                        Cancelar Festival
                                                    </button>
                                                )}
                                                {festival.estado === 'PUBLICADO' && (
                                                    <button
                                                        onClick={() => handleChangeFestivalStatus(festival.idFestival, 'FINALIZADO', festival.nombre)}
                                                        className="btn-corporate-primary px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700"
                                                    >
                                                        Finalizar Festival
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteFestival(festival.idFestival, festival.nombre)}
                                                    className="btn-corporate-secondary px-3 py-1 text-sm bg-red-800 hover:bg-red-900"
                                                >
                                                    Eliminar Festival
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Modal de Confirmación */}
            {showConfirmModal && (
                <ConfirmationModal
                    message={confirmModalMessage}
                    onConfirm={confirmModalAction}
                    onCancel={() => setShowConfirmModal(false)}
                    confirmText={confirmModalConfirmText}
                />
            )}
        </div>
    );
};

export default AdminFestivalManagement;

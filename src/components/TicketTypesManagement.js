import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ConfirmationModal from './ConfirmationModal';

const TicketTypesManagement = () => {
    const { idFestival } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [festivalName, setFestivalName] = useState('');
    const [ticketTypes, setTicketTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para el formulario de añadir/editar.
    const [isEditing, setIsEditing] = useState(false);
    const [currentTicketType, setCurrentTicketType] = useState({
        idTipoEntrada: null,
        tipo: '',
        descripcion: '',
        precio: '',
        stock: '',
        requiereNominacion: true,
    });
    const [formError, setFormError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Estado para mensajes de éxito.
    const [successMessage, setSuccessMessage] = useState(null);

    // Estados para el modal de confirmación.
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [confirmModalAction, setConfirmModalAction] = useState(() => () => { });

    // Función auxiliar para mostrar y limpiar mensajes.
    const showMessage = (setter, msg, duration = 5000) => {
        setter(msg);
        setTimeout(() => setter(null), duration);
    };

    // Efecto para cargar el nombre del festival y los tipos de entrada.
    useEffect(() => {
        if (!token || !idFestival) {
            navigate('/login');
            return;
        }

        const fetchFestivalData = async () => {
            try {
                setLoading(true);
                setError(null);
                setSuccessMessage(null);

                const festivalResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!festivalResponse.ok) {
                    const errorData = await festivalResponse.json();
                    throw new Error(errorData.error || 'Festival no encontrado.');
                }
                const festivalData = await festivalResponse.json();
                setFestivalName(festivalData.nombre);

                const ticketTypesResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}/tipos-entrada`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!ticketTypesResponse.ok) {
                    const errorData = await ticketTypesResponse.json();
                    throw new Error(errorData.error || 'Error al cargar los tipos de entrada.');
                }
                const ticketTypesData = await ticketTypesResponse.json();
                setTicketTypes(ticketTypesData);

            } catch (err) {
                console.error("Error fetching festival or ticket types:", err);
                setError(err.message);
                showMessage(setError, err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFestivalData();
    }, [idFestival, token, navigate]);

    // Manejador para cambios en el formulario.
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentTicketType(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Manejador para enviar el formulario de añadir/editar.
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        setSuccessMessage(null);

        if (!currentTicketType.tipo || !currentTicketType.precio || !currentTicketType.stock) {
            showMessage(setFormError, 'Todos los campos obligatorios deben ser rellenados.');
            setFormLoading(false);
            return;
        }
        if (isNaN(parseFloat(currentTicketType.precio)) || parseFloat(currentTicketType.precio) < 0) {
            showMessage(setFormError, 'El precio debe ser un número positivo o cero.');
            setFormLoading(false);
            return;
        }
        if (isNaN(parseInt(currentTicketType.stock)) || parseInt(currentTicketType.stock) < 0) {
            showMessage(setFormError, 'El stock debe ser un número entero positivo o cero.');
            setFormLoading(false);
            return;
        }

        const payload = {
            tipo: currentTicketType.tipo,
            descripcion: currentTicketType.descripcion,
            precio: parseFloat(currentTicketType.precio).toFixed(2),
            stock: parseInt(currentTicketType.stock),
            requiereNominacion: currentTicketType.requiereNominacion,
            idFestival: isEditing ? undefined : parseInt(idFestival)
        };

        try {
            let response;
            let url;
            let method;

            if (isEditing) {
                url = `${process.env.REACT_APP_API_BASE_URL}/promotor/tipos-entrada/${currentTicketType.idTipoEntrada}`;
                method = 'PUT';
            } else {
                url = `${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}/tipos-entrada`;
                method = 'POST';
            }

            response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en la operación.');
            }

            const ticketTypesResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}/tipos-entrada`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const updatedTicketTypes = await ticketTypesResponse.json();
            setTicketTypes(updatedTicketTypes);

            setCurrentTicketType({
                idTipoEntrada: null,
                tipo: '',
                descripcion: '',
                precio: '',
                stock: '',
                requiereNominacion: true,
            });
            setIsEditing(false);
            showMessage(setSuccessMessage, `Tipo de entrada ${isEditing ? 'actualizado' : 'añadido'} con éxito!`);
            setFormError(null);
        } catch (err) {
            console.error("Error submitting form:", err);
            showMessage(setFormError, err.message);
        } finally {
            setFormLoading(false);
        }
    };

    // Manejador para iniciar la edición de un tipo de entrada.
    const handleEditClick = (ticketType) => {
        setIsEditing(true);
        setCurrentTicketType({
            idTipoEntrada: ticketType.idTipoEntrada,
            tipo: ticketType.tipo,
            descripcion: ticketType.descripcion || '',
            precio: ticketType.precio,
            stock: ticketType.stock,
            requiereNominacion: ticketType.requiereNominacion,
        });
        setFormError(null);
        setSuccessMessage(null);
    };

    // Manejador para cancelar la edición.
    const handleCancelEdit = () => {
        setIsEditing(false);
        setCurrentTicketType({
            idTipoEntrada: null,
            tipo: '',
            descripcion: '',
            precio: '',
            stock: '',
            requiereNominacion: true,
        });
        setFormError(null);
        setSuccessMessage(null);
    };

    // Manejador para eliminar un tipo de entrada.
    const handleDeleteClick = (idTipoEntrada, tipoNombre) => {
        setShowConfirmModal(true);
        setConfirmModalMessage(`¿Estás seguro de que quieres eliminar el tipo de entrada "${tipoNombre}"?`);
        setConfirmModalAction(() => async () => {
            setShowConfirmModal(false);
            try {
                setLoading(true);
                setError(null);
                setSuccessMessage(null);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/tipos-entrada/${idTipoEntrada}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al eliminar el tipo de entrada.');
                }

                setTicketTypes(prev => prev.filter(tt => tt.idTipoEntrada !== idTipoEntrada));
                showMessage(setSuccessMessage, `Tipo de entrada "${tipoNombre}" eliminado con éxito.`);

            } catch (err) {
                console.error("Error deleting ticket type:", err);
                showMessage(setError, err.message);
            } finally {
                setLoading(false);
            }
        });
    };

    // Obtener clase de estilo para el badge de nominación.
    const getNominationBadgeClass = (requiereNominacion) => {
        return requiereNominacion ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    return (
        <div className="min-h-screen bg-corporate-gradient p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Gestión de Tipos de Entrada
                </h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(`/promotor/festivales/${idFestival}`)}
                        className="btn-corporate-secondary"
                    >
                        Volver a Detalles del Festival
                    </button>
                    <button
                        onClick={() => navigate('/promotor/dashboard')}
                        className="btn-corporate-secondary"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </header>

            <main className="card-corporate p-6">
                <h2 className="title-corporate text-xl text-gray-800 mb-4">Festival: {festivalName}</h2>

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

                <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{isEditing ? 'Editar Tipo de Entrada' : 'Añadir Nuevo Tipo de Entrada'}</h3>
                    {formError && (
                        <div className="error-message mb-4">
                            <strong>Error:</strong>
                            <span className="block sm:inline"> {formError}</span>
                        </div>
                    )}
                    <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="tipo"
                                name="tipo"
                                value={currentTicketType.tipo}
                                onChange={handleFormChange}
                                required
                                className="input-corporate"
                            />
                        </div>
                        <div>
                            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <input
                                type="text"
                                id="descripcion"
                                name="descripcion"
                                value={currentTicketType.descripcion}
                                onChange={handleFormChange}
                                className="input-corporate"
                            />
                        </div>
                        <div>
                            <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">Precio <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                id="precio"
                                name="precio"
                                value={currentTicketType.precio}
                                onChange={handleFormChange}
                                step="0.01"
                                min="0"
                                required
                                className="input-corporate"
                            />
                        </div>
                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                value={currentTicketType.stock}
                                onChange={handleFormChange}
                                min="0"
                                required
                                className="input-corporate"
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center">
                            <input
                                id="requiereNominacion"
                                name="requiereNominacion"
                                type="checkbox"
                                checked={currentTicketType.requiereNominacion}
                                onChange={handleFormChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="requiereNominacion" className="ml-2 block text-sm font-medium text-gray-700">Requiere Nominación</label>
                        </div>
                        <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="btn-corporate-secondary"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="btn-corporate-primary"
                            >
                                {formLoading ? (isEditing ? 'Guardando...' : 'Añadiendo...') : (isEditing ? 'Guardar Cambios' : 'Añadir Tipo de Entrada')}
                            </button>
                        </div>
                    </form>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">Tipos de Entrada Existentes</h3>
                {loading && (
                    <div className="text-center py-8 text-gray-600">Cargando tipos de entrada...</div>
                )}
                {!loading && ticketTypes.length === 0 && !error && (
                    <div className="text-center py-8 text-gray-600">No hay tipos de entrada para este festival.</div>
                )}
                {!loading && ticketTypes.length > 0 && (
                    <div className="overflow-x-auto">
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
                                        Nominación
                                    </th>
                                    <th>
                                        Acciones
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
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getNominationBadgeClass(type.requiereNominacion)}`}>
                                                {type.requiereNominacion ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(type)}
                                                    className="btn-corporate-primary px-3 py-1 text-sm"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(type.idTipoEntrada, type.tipo)}
                                                    className="btn-corporate-secondary px-3 py-1 text-sm bg-red-600 hover:bg-red-700"
                                                >
                                                    Eliminar
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

            {showConfirmModal && (
                <ConfirmationModal
                    message={confirmModalMessage}
                    onConfirm={confirmModalAction}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
};

export default TicketTypesManagement;

import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';

const UserManagement = () => {
    const { token, user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [activeTab, setActiveTab] = useState('PROMOTOR');

    // Estados para el formulario de añadir/editar usuario.
    const [showUserForm, setShowUserForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUserForm, setCurrentUserForm] = useState({
        idUsuario: null,
        nombre: '',
        email: '',
        password: '',
        rol: 'PROMOTOR',
        estado: true,
    });
    const [formError, setFormError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Estados para el modal de confirmación.
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [confirmModalAction, setConfirmModalAction] = useState(() => () => { });

    // Función auxiliar para mostrar y limpiar mensajes.
    const showMessage = (setter, msg, duration = 5000) => {
        setter(msg);
        setTimeout(() => setter(null), duration);
    };

    // Efecto para cargar los usuarios según el rol seleccionado.
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchUsers(activeTab);
    }, [token, navigate, activeTab]);

    // Función para obtener usuarios de la API por rol.
    const fetchUsers = async (role) => {
        try {
            setLoading(true);
            setError(null);

            // --- INICIO DE LA CORRECCIÓN ---
            // Construir la URL correcta según el rol
            let fetchUrl;
            switch (role.toUpperCase()) {
                case 'PROMOTOR':
                    fetchUrl = `${process.env.REACT_APP_API_BASE_URL}/admin/promotores`;
                    break;
                case 'ADMIN':
                    fetchUrl = `${process.env.REACT_APP_API_BASE_URL}/admin/admins`;
                    break;
                case 'CAJERO':
                    fetchUrl = `${process.env.REACT_APP_API_BASE_URL}/admin/cajeros`;
                    break;
                default:
                    throw new Error(`Rol desconocido: ${role}`);
            }
            // --- FIN DE LA CORRECCIÓN ---

            const response = await fetch(fetchUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // Capturar el texto del error para un mejor diagnóstico
                const errorText = await response.text();
                console.error("Error response from server:", errorText);
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || `Error HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error(`Error fetching ${role.toLowerCase()}s:`, err);
            showMessage(setError, err.message);
        } finally {
            setLoading(false);
        }
    };


    // Manejador para cambios en el formulario de usuario.
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentUserForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Manejador para abrir el formulario de añadir usuario.
    const handleAddUserClick = () => {
        setIsEditing(false);
        setCurrentUserForm({
            idUsuario: null,
            nombre: '',
            email: '',
            password: '',
            rol: 'PROMOTOR',
            estado: true,
        });
        setFormError(null);
        setSuccessMessage(null);
        setShowUserForm(true);
    };

    // Manejador para abrir el formulario de editar usuario.
    const handleEditUserClick = (userToEdit) => {
        setIsEditing(true);
        setCurrentUserForm({
            idUsuario: userToEdit.idUsuario,
            nombre: userToEdit.nombre,
            email: userToEdit.email,
            password: '',
            rol: userToEdit.rol,
            estado: userToEdit.estado,
        });
        setFormError(null);
        setSuccessMessage(null);
        setShowUserForm(true);
    };

    // Manejador para enviar el formulario de usuario (crear/editar).
    const handleUserFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        setSuccessMessage(null);

        if (!currentUserForm.nombre || !currentUserForm.email || (!isEditing && !currentUserForm.password) || !currentUserForm.rol) {
            showMessage(setFormError, 'Nombre, email, rol y contraseña (al crear) son obligatorios.');
            setFormLoading(false);
            return;
        }
        if (!isEditing && currentUserForm.password.length < 8) {
            showMessage(setFormError, 'La contraseña debe tener al menos 8 caracteres.');
            setFormLoading(false);
            return;
        }
        if (!/\S+@\S+\.\S+/.test(currentUserForm.email)) {
            showMessage(setFormError, 'Formato de email inválido.');
            setFormLoading(false);
            return;
        }

        try {
            let response;
            let url;
            let method;
            let body;

            if (isEditing) {
                url = `${process.env.REACT_APP_API_BASE_URL}/admin/usuarios/${currentUserForm.idUsuario}`;
                method = 'PUT';
                body = JSON.stringify({ nombre: currentUserForm.nombre });
            } else {
                url = `${process.env.REACT_APP_API_BASE_URL}/admin/usuarios`;
                method = 'POST';
                body = JSON.stringify({
                    nombre: currentUserForm.nombre,
                    email: currentUserForm.email,
                    password: currentUserForm.password,
                    rol: currentUserForm.rol,
                });
            }

            response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    throw new Error(errorData.error || 'El email ya está en uso.');
                }
                throw new Error(errorData.error || 'Error en la operación.');
            }

            setShowUserForm(false);
            showMessage(setSuccessMessage, `Usuario ${isEditing ? 'actualizado' : 'creado'} con éxito!`);
            fetchUsers(activeTab);
        } catch (err) {
            console.error("Error submitting user form:", err);
            showMessage(setFormError, err.message);
        } finally {
            setFormLoading(false);
        }
    };


    // Manejador para cambiar el estado de un usuario (activar/desactivar).
    const handleChangeUserStatus = (userId, currentStatus, userName) => {
        setShowConfirmModal(true);
        setConfirmModalMessage(`¿Estás seguro de que quieres ${currentStatus ? 'desactivar' : 'activar'} a "${userName}"?`);
        setConfirmModalAction(() => async () => {
            setShowConfirmModal(false);
            if (userId === currentUser.userId) {
                showMessage(setError, 'No puedes cambiar tu propio estado de administrador.');
                return;
            }

            try {
                setError(null);
                setSuccessMessage(null);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/usuarios/${userId}/estado`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ nuevoEstado: (!currentStatus).toString() }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al cambiar el estado del usuario.');
                }

                showMessage(setSuccessMessage, `Estado de "${userName}" cambiado con éxito!`);
                fetchUsers(activeTab);
            } catch (err) {
                console.error("Error changing user status:", err);
                showMessage(setError, err.message);
            }
        });
    };

    // Manejador para eliminar un usuario.
    const handleDeleteUser = (userId, userName) => {
        setShowConfirmModal(true);
        setConfirmModalMessage(`¿Estás seguro de que quieres eliminar a "${userName}"? Esta acción es irreversible.`);
        setConfirmModalAction(() => async () => {
            setShowConfirmModal(false);
            if (userId === currentUser.userId) {
                showMessage(setError, 'No puedes eliminar tu propia cuenta de administrador.');
                return;
            }

            try {
                setError(null);
                setSuccessMessage(null);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/usuarios/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al eliminar el usuario.');
                }

                showMessage(setSuccessMessage, `Usuario "${userName}" eliminado con éxito.`);
                fetchUsers(activeTab);
            } catch (err) {
                console.error("Error deleting user:", err);
                showMessage(setError, err.message);
            }
        });
    };

    // Obtener clase de estilo para el badge de estado.
    const getStatusBadgeClass = (status) => {
        return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    return (
        <div className="min-h-screen bg-corporate-gradient p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Gestión de Usuarios
                </h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-corporate-secondary"
                >
                    Volver al Dashboard
                </button>
            </header>

            <main className="card-corporate p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="title-corporate text-xl text-gray-800">Listado de Usuarios</h2>
                    <button
                        onClick={handleAddUserClick}
                        className="btn-corporate-primary"
                    >
                        Añadir Nuevo Usuario
                    </button>
                </div>


                {successMessage && (
                    <div className="success-message mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                        <strong>Éxito:</strong>
                        <span className="block sm:inline"> {successMessage}</span>
                    </div>
                )}
                {error && (
                    <div className="error-message mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        <strong>Error:</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                <div className="flex border-b border-gray-200 mb-6">
                    {['PROMOTOR', 'ADMIN', 'CAJERO'].map(role => (
                        <button
                            key={role}
                            className={`py-2 px-4 text-sm font-medium ${activeTab === role ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab(role)}
                        >
                            {role === 'ADMIN' ? 'Administradores' : role === 'PROMOTOR' ? 'Promotores' : 'Cajeros'}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="text-center py-8 text-gray-600">Cargando usuarios...</div>
                )}

                {!loading && users.length === 0 && !error && (
                    <div className="text-center py-8 text-gray-600">No hay usuarios registrados para este rol.</div>
                )}

                {!loading && users.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="table-corporate">
                            <thead>
                                <tr>
                                    <th>
                                        Nombre
                                    </th>
                                    <th>
                                        Email
                                    </th>
                                    <th>
                                        Rol
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
                                {users.map((user) => (
                                    <tr key={user.idUsuario}>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">{user.nombre}</p>
                                        </td>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">{user.email}</p>
                                        </td>
                                        <td>
                                            <p className="text-gray-900 whitespace-no-wrap">{user.rol}</p>
                                        </td>
                                        <td>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.estado)}`}>
                                                {user.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col space-y-1">
                                                <button
                                                    onClick={() => handleEditUserClick(user)}
                                                    className="btn-corporate-primary px-3 py-1 text-sm"
                                                >
                                                    Editar Nombre
                                                </button>
                                                {user.idUsuario !== currentUser.userId && (
                                                    <>
                                                        <button
                                                            onClick={() => handleChangeUserStatus(user.idUsuario, user.estado, user.nombre)}
                                                            className={`btn-corporate-secondary px-3 py-1 text-sm ${user.estado ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                                                        >
                                                            {user.estado ? 'Desactivar' : 'Activar'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.idUsuario, user.nombre)}
                                                            className="btn-corporate-secondary px-3 py-1 text-sm bg-red-600 hover:bg-red-700"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {showUserForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="card-corporate w-full max-w-lg text-gray-900">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>

                        {formError && (
                            <div className="error-message p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleUserFormSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="nombre"
                                    name="nombre"
                                    value={currentUserForm.nombre}
                                    onChange={handleFormChange}
                                    required
                                    className="input-corporate"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={currentUserForm.email}
                                    onChange={handleFormChange}
                                    required
                                    disabled={isEditing}
                                    className={`input-corporate ${isEditing ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                                />
                            </div>
                            {!isEditing && (
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña <span className="text-red-500">*</span></label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={currentUserForm.password}
                                        onChange={handleFormChange}
                                        required={!isEditing}
                                        className="input-corporate"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres.</p>
                                </div>
                            )}
                            <div>
                                <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">Rol <span className="text-red-500">*</span></label>
                                <select
                                    id="rol"
                                    name="rol"
                                    value={currentUserForm.rol}
                                    onChange={handleFormChange}
                                    required
                                    disabled={isEditing}
                                    className={`input-corporate ${isEditing ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                                >
                                    <option value="PROMOTOR">Promotor</option>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="CAJERO">Cajero</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowUserForm(false)}
                                    className="btn-corporate-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="btn-corporate-primary"
                                >
                                    {formLoading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


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

export default UserManagement;
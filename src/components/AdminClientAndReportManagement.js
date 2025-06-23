import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';

const AdminClientAndReportManagement = ({ initialTab = 'clientes' }) => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Parsear los parámetros de la URL para la carga inicial de reportes.
    const queryParams = new URLSearchParams(location.search);
    const initialFestivalIdFromUrl = queryParams.get('festivalId') || '';
    const initialReportTypeFromUrl = queryParams.get('reportType') || 'compras';

    // Determinar la pestaña activa inicial.
    const [activeTab, setActiveTab] = useState(() => {
        if (initialFestivalIdFromUrl && initialReportTypeFromUrl) {
            return 'reportes';
        }
        if (user.role === 'PROMOTOR' && initialTab === 'clientes') {
            return 'reportes';
        }
        return initialTab;
    });

    // Estados para la gestión de clientes.
    const [clients, setClients] = useState([]);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [clientTypeTab, setClientTypeTab] = useState('compradores');
    const [clientLoading, setClientLoading] = useState(true);
    const [clientError, setClientError] = useState(null);

    // Estados para la gestión de reportes.
    const [festivalsForReports, setFestivalsForReports] = useState([]);
    const [selectedFestivalId, setSelectedFestivalId] = useState(initialFestivalIdFromUrl);
    const [reportData, setReportData] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState(null);
    const [reportTypeTab, setReportTypeTab] = useState(initialReportTypeFromUrl);

    // Estados para mensajes generales de éxito y error.
    const [successMessage, setSuccessMessage] = useState(null);
    const [mainError, setMainError] = useState(null);
    const [clientToEdit, setClientToEdit] = useState(null);

    // Estados para el modal de confirmación.
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [confirmModalInputName, setConfirmModalInputName] = useState('');
    const [isConfirmModalInput, setIsConfirmModalInput] = useState(false);

    // Función auxiliar para mostrar y limpiar mensajes.
    const showMessage = useCallback((setter, msg, duration = 5000) => {
        setter(msg);
        const timer = setTimeout(() => setter(null), duration);
        return () => clearTimeout(timer);
    }, []);

    // Fetch de clientes (solo para ADMIN).
    const fetchClients = useCallback(async (type, searchTerm) => {
        if (user.role !== 'ADMIN') {
            setClients([]);
            setClientLoading(false);
            setClientError('Acceso denegado. Solo administradores pueden ver la gestión de clientes.');
            return;
        }

        setClientLoading(true);
        setClientError(null);
        try {
            const url = `/api/admin/clientes?tab=${type}&buscar=${searchTerm}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error al cargar los ${type}.`);
            }
            const data = await response.json();
            setClients(data[type] || []);
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
            showMessage(setClientError, err.message);
        } finally {
            setClientLoading(false);
        }
    }, [user.role, token, showMessage]);

    // Fetch de festivales para el selector de reportes.
    const fetchFestivalsForReportSelector = useCallback(async () => {
        try {
            const endpoint = user.role === 'PROMOTOR' ? `/api/promotor/festivales` : `/api/admin/festivales`;
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cargar la lista de festivales para reportes.');
            }
            const data = await response.json();
            setFestivalsForReports(data);

            // Establecer el festival seleccionado inicialmente.
            if (initialFestivalIdFromUrl && data.some(f => String(f.idFestival) === initialFestivalIdFromUrl)) {
                setSelectedFestivalId(initialFestivalIdFromUrl);
            } else if (user.role === 'PROMOTOR' && data.length > 0 && !selectedFestivalId) {
                setSelectedFestivalId(data[0].idFestival.toString());
            } else if (user.role === 'ADMIN' && !initialFestivalIdFromUrl && !selectedFestivalId) {
                setSelectedFestivalId('');
            }

        } catch (err) {
            console.error("Error fetching festivals for report selector:", err);
            showMessage(setReportError, err.message);
        }
    }, [user.role, token, initialFestivalIdFromUrl, selectedFestivalId, showMessage]);

    // Fetch de datos de reportes.
    const fetchReport = useCallback(async (reportType, festivalId) => {
        if (!festivalId) {
            setReportData([]);
            setReportError(null);
            return;
        }

        setReportLoading(true);
        setReportError(null);
        setReportData([]);

        try {
            let url;
            if (user.role === 'PROMOTOR') {
                url = `/api/promotor/festivales/${festivalId}/${reportType}`;
            } else {
                if (reportType === 'compras' || reportType === 'asistentes') {
                    url = `/api/promotor/festivales/${festivalId}/${reportType}`;
                } else if (reportType === 'pulseras') {
                    url = `/api/admin/festivales/${festivalId}/pulseras-nfc`;
                } else {
                    throw new Error("Tipo de reporte inválido.");
                }
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error al cargar el reporte de ${reportType}.`);
            }
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            console.error(`Error fetching ${reportType} report:`, err);
            showMessage(setReportError, err.message);
        } finally {
            setReportLoading(false);
        }
    }, [user.role, token, showMessage]);

    // Obtener clase de estilo para el estado de las pulseras.
    const getStatusBadgeClass = useCallback((status) => {
        switch (status) {
            case 'ACTIVA': return 'bg-green-100 text-green-800';
            case 'USADA': return 'bg-yellow-100 text-yellow-800';
            case 'CANCELADA': return 'bg-red-100 text-red-800';
            case 'INACTIVA': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }, []);

    // Efecto para la carga inicial y cambios de pestaña.
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        setMainError(null);
        setSuccessMessage(null);

        fetchFestivalsForReportSelector();

        if (activeTab === 'clientes') {
            fetchClients(clientTypeTab, clientSearchTerm);
        } else if (activeTab === 'reportes') {
            if (selectedFestivalId && reportTypeTab) {
                fetchReport(reportTypeTab, selectedFestivalId);
            }
        }
    }, [token, navigate, activeTab, fetchClients, fetchFestivalsForReportSelector, fetchReport, clientTypeTab, reportTypeTab, selectedFestivalId]);

    // Efecto para cambios en los filtros de clientes (solo si la pestaña de clientes está activa y el usuario es ADMIN).
    useEffect(() => {
        if (activeTab === 'clientes' && user.role === 'ADMIN') {
        }
    }, [clientTypeTab, clientSearchTerm, activeTab, user.role]);

    // Efecto para cambios en los filtros de reportes (solo si la pestaña de reportes está activa).
    useEffect(() => {
        if (activeTab === 'reportes' && selectedFestivalId && reportTypeTab) {
            fetchReport(reportTypeTab, selectedFestivalId);
        } else if (activeTab === 'reportes' && !selectedFestivalId) {
            setReportData([]);
            setReportError(null);
        }
    }, [selectedFestivalId, reportTypeTab, activeTab, fetchReport]);

    // Manejador para cambiar la sub-pestaña de clientes.
    const handleClientTypeTabChange = useCallback((type) => {
        if (user.role !== 'ADMIN') return;
        setClientTypeTab(type);
        setClientSearchTerm('');
    }, [user.role]);

    // Manejador para la búsqueda de clientes.
    const handleClientSearch = useCallback((e) => {
        e.preventDefault();
        if (user.role !== 'ADMIN') return;
        fetchClients(clientTypeTab, clientSearchTerm);
    }, [user.role, fetchClients, clientTypeTab, clientSearchTerm]);

    // Manejador para actualizar el nombre de un asistente.
    const handleConfirmUpdate = useCallback(async () => {
        if (!clientToEdit) return;

        const newName = confirmModalInputName.trim();
        const originalName = clientToEdit.name;
        const asistenteId = clientToEdit.id;

        // Oculta el modal y limpia el estado de edición
        setShowConfirmModal(false);
        setIsConfirmModalInput(false);
        setClientToEdit(null);

        // Validación: Compara los datos frescos obtenidos del estado
        if (newName === '' || newName === originalName) {
            showMessage(setMainError, 'El nombre no puede estar vacío ni ser igual al anterior.');
            return;
        }

        try {
            setClientLoading(true);
            setClientError(null);
            setSuccessMessage(null);
            const response = await fetch(`/api/admin/asistentes/${asistenteId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre: newName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar el asistente.');
            }
            showMessage(setSuccessMessage, `Asistente "${originalName}" actualizado a "${newName}" con éxito!`);
            fetchClients(clientTypeTab, clientSearchTerm);
        } catch (err) {
            console.error("Error updating asistente:", err);
            showMessage(setClientError, err.message);
        } finally {
            setClientLoading(false);
        }
    }, [clientToEdit, confirmModalInputName, token, showMessage, fetchClients, clientTypeTab, clientSearchTerm]);

    const handleUpdateAsistente = (asistenteId, currentName) => {
        if (user.role !== 'ADMIN') {
            showMessage(setMainError, 'Acceso denegado. Solo administradores pueden editar asistentes.');
            return;
        }

        // Guarda los datos del cliente a editar en el estado
        setClientToEdit({ id: asistenteId, name: currentName });

        // Prepara el modal
        setConfirmModalMessage(`Introduce el nuevo nombre para "${currentName}":`);
        setConfirmModalInputName(currentName);
        setIsConfirmModalInput(true);
        setShowConfirmModal(true); // Simplemente muestra el modal
    };

    // Formatear fecha a formato local.
    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn("Fecha no parseable por formatDate:", dateString);
            return 'Fecha Inválida';
        }
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, []);

    // Formatear fecha y hora a formato local.
    const formatDateTime = useCallback((dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            console.warn("Fecha no parseable por formatDateTime:", dateTimeString);
            return 'Fecha Inválida';
        }
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return date.toLocaleDateString('es-ES', options);
    }, []);

    return (
        <div className="min-h-screen bg-corporate-gradient p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Gestión de Clientes y Reportes
                </h1>
                <div className="flex items-center space-x-4">
                    {selectedFestivalId && (
                        <button
                            onClick={() => navigate(`/promotor/festivales/${selectedFestivalId}`)}
                            className="btn-corporate-secondary"
                        >
                            Volver a Detalles del Festival
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-corporate-secondary"
                    >
                        Volver al Dashboard {user.role === 'ADMIN' ? 'Admin' : 'Promotor'}
                    </button>
                </div>
            </header>

            <main className="card-corporate p-6">
                {successMessage && (
                    <div className="success-message mb-4">
                        <strong>Éxito:</strong>
                        <span className="block sm:inline"> {successMessage}</span>
                    </div>
                )}
                {mainError && (
                    <div className="error-message mb-4">
                        <strong>Error:</strong>
                        <span className="block sm:inline"> {mainError}</span>
                    </div>
                )}

                <div className="flex border-b border-gray-200 mb-6">
                    {user.role === 'ADMIN' && (
                        <button
                            className={`py-2 px-4 text-sm font-medium ${activeTab === 'clientes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} ${user.role !== 'ADMIN' ? 'cursor-not-allowed opacity-50' : ''}`}
                            onClick={() => setActiveTab('clientes')}
                            disabled={user.role !== 'ADMIN'}
                        >
                            Gestión de Clientes
                        </button>
                    )}
                    <button
                        className={`ml-4 py-2 px-4 text-sm font-medium ${activeTab === 'reportes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('reportes')}
                    >
                        Reportes
                    </button>
                </div>

                {activeTab === 'clientes' && user.role === 'ADMIN' && (
                    <section>
                        <h2 className="title-corporate text-xl text-gray-800 mb-4">Clientes del Sistema</h2>

                        {clientError && (
                            <div className="error-message mb-4">
                                <strong>Error:</strong>
                                <span className="block sm:inline"> {clientError}</span>
                            </div>
                        )}

                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                className={`py-2 px-4 text-sm font-medium ${clientTypeTab === 'compradores' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => handleClientTypeTabChange('compradores')}
                            >
                                Compradores
                            </button>
                            <button
                                className={`ml-4 py-2 px-4 text-sm font-medium ${clientTypeTab === 'asistentes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => handleClientTypeTabChange('asistentes')}
                            >
                                Asistentes
                            </button>
                            <form onSubmit={handleClientSearch} className="ml-auto flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o email..."
                                    value={clientSearchTerm}
                                    onChange={(e) => setClientSearchTerm(e.target.value)}
                                    className="input-corporate w-auto"
                                />
                                <button type="submit" className="btn-corporate-primary py-2 px-3 text-sm">Buscar</button>
                            </form>
                        </div>

                        {clientLoading && (
                            <div className="text-center py-8 text-gray-600">Cargando clientes...</div>
                        )}

                        {!clientLoading && clients.length === 0 && !clientError && (
                            <div className="text-center py-8 text-gray-600">No hay clientes para mostrar.</div>
                        )}

                        {!clientLoading && clients.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="table-corporate">
                                    <thead>
                                        <tr>
                                            <th>
                                                ID
                                            </th>
                                            <th>
                                                Nombre
                                            </th>
                                            <th>
                                                Email
                                            </th>
                                            <th>
                                                Teléfono
                                            </th>
                                            {clientTypeTab === 'asistentes' && (
                                                <th>
                                                    Pulsera UID Asoc.
                                                </th>
                                            )}
                                            <th>
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map((client) => (
                                            <tr key={client.idComprador || client.idAsistente}>
                                                <td>
                                                    {client.idComprador || client.idAsistente}
                                                </td>
                                                <td>
                                                    {client.nombre}
                                                </td>
                                                <td>
                                                    {client.email}
                                                </td>
                                                <td>
                                                    {client.telefono || 'N/A'}
                                                </td>
                                                {clientTypeTab === 'asistentes' && (
                                                    <td>
                                                        {Object.entries(client.festivalPulseraInfo || {}).length > 0 ? (
                                                            Object.entries(client.festivalPulseraInfo).map(([festivalName, pulseraUid]) => (
                                                                <p key={festivalName} className="text-gray-800 text-xs">
                                                                    <strong>{festivalName}:</strong> <span className="font-mono">{pulseraUid || 'N/A'}</span>
                                                                </p>
                                                            ))
                                                        ) : (
                                                            <p className="text-gray-500 italic">No asociada</p>
                                                        )}
                                                    </td>
                                                )}
                                                <td>
                                                    {clientTypeTab === 'asistentes' && user.role === 'ADMIN' && (
                                                        <button
                                                            onClick={() => handleUpdateAsistente(client.idAsistente, client.nombre)}
                                                            className="btn-corporate-primary px-3 py-1 text-sm"
                                                        >
                                                            Editar Nombre
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
                {activeTab === 'clientes' && user.role === 'PROMOTOR' && (
                    <div className="error-message text-center py-8">
                        <strong>Acceso Denegado:</strong> La gestión de clientes es una funcionalidad exclusiva para administradores.
                    </div>
                )}

                {activeTab === 'reportes' && (
                    <section>
                        <h2 className="title-corporate text-xl text-gray-800 mb-4">Reportes de Festivales</h2>

                        {reportError && (
                            <div className="error-message mb-4">
                                <strong>Error:</strong>
                                <span className="block sm:inline"> {reportError}</span>
                            </div>
                        )}

                        <div className="flex items-center space-x-4 mb-6">
                            <div>
                                <label htmlFor="selectFestival" className="block text-sm font-medium text-gray-700">Seleccionar Festival:</label>
                                <select
                                    id="selectFestival"
                                    value={selectedFestivalId}
                                    onChange={(e) => setSelectedFestivalId(e.target.value)}
                                    className="input-corporate"
                                >
                                    <option value="">Selecciona un festival</option>
                                    {festivalsForReports.map(fest => (
                                        <option key={fest.idFestival} value={fest.idFestival}>
                                            {fest.nombre} ({formatDate(fest.fechaInicio)} - {formatDate(fest.fechaFin)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="ml-4">
                                <label htmlFor="selectReportType" className="block text-sm font-medium text-gray-700">Tipo de Reporte:</label>
                                <select
                                    id="selectReportType"
                                    value={reportTypeTab}
                                    onChange={(e) => setReportTypeTab(e.target.value)}
                                    className="input-corporate"
                                >
                                    <option value="compras">Compras</option>
                                    <option value="asistentes">Asistentes</option>
                                    <option value="pulseras">Pulseras</option>
                                </select>
                            </div>
                            <button
                                onClick={() => fetchReport(reportTypeTab, selectedFestivalId)}
                                disabled={!selectedFestivalId || reportLoading}
                                className="btn-corporate-primary ml-auto"
                            >
                                {reportLoading ? 'Cargando Reporte...' : 'Generar Reporte'}
                            </button>
                        </div>

                        {reportLoading && (
                            <div className="text-center py-8 text-gray-600">Cargando datos del reporte...</div>
                        )}

                        {!reportLoading && !selectedFestivalId && (
                            <div className="text-center py-8 text-gray-600">Selecciona un festival para generar un reporte.</div>
                        )}

                        {!reportLoading && selectedFestivalId && reportData.length === 0 && !reportError && (
                            <div className="text-center py-8 text-gray-600">No hay datos para este reporte y festival.</div>
                        )}

                        {!reportLoading && reportData.length > 0 && selectedFestivalId && (
                            <>
                                {reportTypeTab === 'compras' && (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Reporte de Compras</h3>
                                        <div className="overflow-x-auto">
                                            <table className="table-corporate">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            ID Compra
                                                        </th>
                                                        <th>
                                                            Comprador
                                                        </th>
                                                        <th>
                                                            Total
                                                        </th>
                                                        <th>
                                                            Entradas Compradas
                                                        </th>
                                                        <th>
                                                            Fecha Compra
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.map((compra) => (
                                                        <tr key={compra.idCompra}>
                                                            <td>
                                                                {compra.idCompra}
                                                            </td>
                                                            <td>
                                                                <p className="text-gray-900">{compra.nombreComprador}</p>
                                                                <p className="text-gray-600 text-xs">{compra.emailComprador}</p>
                                                            </td>
                                                            <td>
                                                                <p className="text-gray-900">{parseFloat(compra.total).toFixed(2)} €</p>
                                                            </td>
                                                            <td>
                                                                {compra.resumenEntradas && compra.resumenEntradas.map((resumen, index) => (
                                                                    <p key={index} className="text-gray-800 text-xs">{resumen}</p>
                                                                ))}
                                                            </td>
                                                            <td>
                                                                {formatDateTime(compra.fechaCompra)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {reportTypeTab === 'asistentes' && (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Reporte de Asistentes</h3>
                                        <div className="overflow-x-auto">
                                            <table className="table-corporate">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            ID Asistente
                                                        </th>
                                                        <th>
                                                            Nombre
                                                        </th>
                                                        <th>
                                                            Email
                                                        </th>
                                                        <th>
                                                            Teléfono
                                                        </th>
                                                        <th>
                                                            Pulsera UID
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.map((asistente) => (
                                                        <tr key={asistente.idAsistente}>
                                                            <td>
                                                                {asistente.idAsistente}
                                                            </td>
                                                            <td>
                                                                {asistente.nombre}
                                                            </td>
                                                            <td>
                                                                {asistente.email}
                                                            </td>
                                                            <td>
                                                                {asistente.telefono || 'N/A'}
                                                            </td>
                                                            <td>
                                                                {(() => {
                                                                    const currentFestival = festivalsForReports.find(
                                                                        (fest) => String(fest.idFestival) === String(selectedFestivalId)
                                                                    );
                                                                    const festivalNameForLookup = currentFestival ? currentFestival.nombre : null;

                                                                    if (festivalNameForLookup && asistente.festivalPulseraInfo?.[festivalNameForLookup]) {
                                                                        return asistente.festivalPulseraInfo[festivalNameForLookup];
                                                                    } else {
                                                                        return 'No asociada';
                                                                    }
                                                                })()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {reportTypeTab === 'pulseras' && (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Reporte de Pulseras NFC</h3>
                                        <div className="overflow-x-auto">
                                            <table className="table-corporate">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            Código UID
                                                        </th>
                                                        <th>
                                                            Saldo (€)
                                                        </th>
                                                        <th>
                                                            Asociada a Entrada
                                                        </th>
                                                        <th>
                                                            Asistente Asociado
                                                        </th>
                                                        <th>
                                                            Estado
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.map((bracelet) => (
                                                        <tr key={bracelet.idPulsera}>
                                                            <td>
                                                                <span className="text-gray-800">{bracelet.codigoUid}</span>
                                                            </td>
                                                            <td>
                                                                <p className="text-gray-900 whitespace-no-wrap">{parseFloat(bracelet.saldo).toFixed(2)} €</p>
                                                            </td>
                                                            <td>
                                                                {bracelet.qrEntrada ? (
                                                                    <p className="text-gray-800">{bracelet.qrEntrada}</p>
                                                                ) : (
                                                                    <p className="text-gray-500 italic">No asociada</p>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {bracelet.nombreAsistente ? (
                                                                    <>
                                                                        <p className="text-gray-900 whitespace-no-wrap">{bracelet.nombreAsistente}</p>
                                                                        <p className="text-gray-600 text-xs">{bracelet.emailAsistente}</p>
                                                                    </>
                                                                ) : (
                                                                    <p className="text-gray-500 italic">N/A</p>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(bracelet.activa ? 'ACTIVA' : 'INACTIVA')}`}>
                                                                    {bracelet.activa ? 'Activa' : 'Inactiva'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </section>
                )}
            </main>

            {/* Modal de Confirmación */}
            {showConfirmModal && (
                <ConfirmationModal
                    message={confirmModalMessage}
                    onConfirm={handleConfirmUpdate}
                    onCancel={() => {
                        setShowConfirmModal(false);
                        setIsConfirmModalInput(false);
                        setClientToEdit(null);
                    }}
                    confirmText={isConfirmModalInput ? 'Guardar' : 'Confirmar'}
                >
                    {isConfirmModalInput && (
                        <input
                            type="text"
                            value={confirmModalInputName}
                            onChange={(e) => setConfirmModalInputName(e.target.value)}
                            className="input-corporate mt-2"
                            placeholder="Nuevo nombre"
                            autoFocus
                        />
                    )}
                </ConfirmationModal>
            )}
        </div>
    );
};

export default AdminClientAndReportManagement;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import ConfirmationModal from './ConfirmationModal';

const TicketAndBraceletManagement = () => {
    const { idFestival } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [festivalName, setFestivalName] = useState('');
    const [activeTab, setActiveTab] = useState('entradas');

    const [tickets, setTickets] = useState([]);
    const [bracelets, setBracelets] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Estados para el formulario de nominación.
    const [showNominateForm, setShowNominateForm] = useState(false);
    const [selectedTicketToNominate, setSelectedTicketToNominate] = useState(null);
    const [nominationForm, setNominationForm] = useState({
        emailAsistente: '',
        confirmEmailNominado: '',
        nombreAsistente: '',
        telefonoAsistente: '',
    });
    const [nominationFormError, setNominationFormError] = useState(null);
    const [nominationFormLoading, setNominationFormLoading] = useState(false);

    // Estados para el formulario de asociar pulsera.
    const [showAssociateBraceletForm, setShowAssociateBraceletForm] = useState(false);
    const [selectedTicketToAssociate, setSelectedTicketToAssociate] = useState(null);
    const [associateBraceletForm, setAssociateBraceletForm] = useState({
        codigoUid: '',
    });
    const [associateBraceletFormError, setAssociateBraceletFormError] = useState(null);
    const [associateBraceletFormLoading, setAssociateBraceletFormLoading] = useState(false);

    // Estados para el modal de confirmación.
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [confirmModalAction, setConfirmModalAction] = useState(() => () => { });

    // Función auxiliar para mostrar y limpiar mensajes.
    const showMessage = (setter, msg, duration = 5000) => {
        setter(msg);
        setTimeout(() => setter(null), duration);
    };

    // Efecto para cargar los detalles del festival y los datos de la pestaña activa.
    useEffect(() => {
        if (!token || !idFestival) {
            navigate('/login');
            return;
        }

        const fetchFestivalDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                setSuccessMessage(null);
                const festivalResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!festivalResponse.ok) {
                    const errorData = await festivalResponse.json();
                    throw new Error(errorData.error || 'Festival no encontrado.');
                }
                const festivalData = await festivalResponse.json();
                setFestivalName(festivalData.nombre);
            } catch (err) {
                console.error("Error fetching festival details:", err);
                setError(err.message);
                showMessage(setError, err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFestivalDetails();
        if (activeTab === 'entradas') {
            fetchTickets();
        } else if (activeTab === 'pulseras') {
            fetchBracelets();
        }
    }, [idFestival, token, navigate, activeTab]);

    // Función para cargar entradas.
    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}/entradas`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cargar las entradas.');
            }
            const data = await response.json();
            setTickets(data);
        } catch (err) {
            console.error("Error fetching tickets:", err);
            setError(err.message);
            showMessage(setError, err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para cargar pulseras.
    const fetchBracelets = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}/pulseras`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cargar las pulseras.');
            }
            const data = await response.json();
            setBracelets(data);
        } catch (err) {
            console.error("Error fetching bracelets:", err);
            setError(err.message);
            showMessage(setError, err.message);
        } finally {
            setLoading(false);
        }
    };

    // Manejador para iniciar el formulario de nominación.
    const handleNominateClick = (ticket) => {
        setSelectedTicketToNominate(ticket);
        setNominationForm({
            emailAsistente: ticket.emailAsistente || '',
            confirmEmailNominado: ticket.emailAsistente || '',
            nombreAsistente: ticket.nombreAsistente || '',
            telefonoAsistente: '',
        });
        setNominationFormError(null);
        setSuccessMessage(null);
        setShowNominateForm(true);
    };

    // Manejador de cambios en el formulario de nominación.
    const handleNominationFormChange = (e) => {
        const { name, value } = e.target;
        setNominationForm(prev => ({ ...prev, [name]: value }));
    };

    // Manejador para enviar el formulario de nominación.
    const handleNominationSubmit = async (e) => {
        e.preventDefault();
        setNominationFormLoading(true);
        setNominationFormError(null);
        setSuccessMessage(null);

        if (nominationForm.emailAsistente !== nominationForm.confirmEmailNominado) {
            showMessage(setNominationFormError, 'Los emails no coinciden.');
            setNominationFormLoading(false);
            return;
        }
        if (!nominationForm.emailAsistente || !nominationForm.nombreAsistente) {
            showMessage(setNominationFormError, 'Email y nombre del asistente son obligatorios.');
            setNominationFormLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/entradas/${selectedTicketToNominate.idEntrada}/nominar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nominationForm),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al nominar la entrada.');
            }

            setShowNominateForm(false);
            showMessage(setSuccessMessage, `Entrada nominada con éxito! (QR: ${selectedTicketToNominate.codigoQr})`);
            fetchTickets();
        } catch (err) {
            console.error("Error nominating ticket:", err);
            showMessage(setNominationFormError, err.message);
        } finally {
            setNominationFormLoading(false);
        }
    };

    // Manejador para cancelar una entrada.
    const handleCancelTicket = (ticketId, ticketCode) => {
        setShowConfirmModal(true);
        setConfirmModalMessage(`¿Estás seguro de que quieres cancelar la entrada con código "${ticketCode}"? Esta acción revertirá el stock.`);
        setConfirmModalAction(() => async () => {
            setShowConfirmModal(false);
            try {
                setLoading(true);
                setError(null);
                setSuccessMessage(null);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/entradas/${ticketId}/cancelar`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al cancelar la entrada.');
                }

                showMessage(setSuccessMessage, `Entrada "${ticketCode}" cancelada con éxito!`);
                fetchTickets();
            } catch (err) {
                console.error("Error cancelling ticket:", err);
                showMessage(setError, err.message);
            } finally {
                setLoading(false);
            }
        });
    };

    // Manejador para iniciar el formulario de asociar pulsera.
    const handleAssociateBraceletClick = (ticket) => {
        setSelectedTicketToAssociate(ticket);
        setAssociateBraceletForm({ codigoUid: ticket.codigoUidPulsera || '' });
        setAssociateBraceletFormError(null);
        setSuccessMessage(null);
        setShowAssociateBraceletForm(true);
    };

    // Manejador de cambios en el formulario de asociar pulsera.
    const handleAssociateBraceletFormChange = (e) => {
        const { name, value } = e.target;
        setAssociateBraceletForm(prev => ({ ...prev, [name]: value }));
    };

    // Manejador para enviar el formulario de asociar pulsera.
    const handleAssociateBraceletSubmit = async (e) => {
        e.preventDefault();
        setAssociateBraceletFormLoading(true);
        setAssociateBraceletFormError(null);
        setSuccessMessage(null);

        if (!associateBraceletForm.codigoUid) {
            showMessage(setAssociateBraceletFormError, 'El código UID de la pulsera es obligatorio.');
            setAssociateBraceletFormLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/promotor/entradas/${selectedTicketToAssociate.idEntrada}/asociar-pulsera`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(associateBraceletForm),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al asociar la pulsera.');
            }

            setShowAssociateBraceletForm(false);
            showMessage(setSuccessMessage, `Pulsera asociada con éxito a entrada ${selectedTicketToAssociate.codigoQr}!`);
            fetchTickets();
            fetchBracelets();
        } catch (err) {
            console.error("Error associating bracelet:", err);
            showMessage(setAssociateBraceletFormError, err.message);
        } finally {
            setAssociateBraceletFormLoading(false);
        }
    };

    // Función para renderizar el estado de la entrada.
    const renderTicketStatus = (status) => {
        let badgeClass;
        switch (status) {
            case 'ACTIVA':
                badgeClass = 'bg-green-100 text-green-800';
                break;
            case 'USADA':
                badgeClass = 'bg-yellow-100 text-yellow-800';
                break;
            case 'CANCELADA':
                badgeClass = 'bg-red-100 text-red-800';
                break;
            default:
                badgeClass = 'bg-gray-100 text-gray-800';
        }
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
                {status}
            </span>
        );
    };

    // Función para renderizar el código QR.
    const renderQrCode = (qrDataUrl, qrContent) => {
        if (qrContent && qrContent.startsWith('BEATPASS-TICKET-')) {
            return (
                <QRCodeCanvas
                    value={qrContent}
                    size={80}
                    level="H"
                    includeMargin={false}
                    className="rounded-md shadow-sm"
                />
            );
        }
        return <span className="text-gray-500 text-xs italic">QR no disponible</span>;
    };

    return (
        <div className="min-h-screen bg-corporate-gradient p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Gestión de Entradas y Pulseras
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

                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`py-2 px-4 text-sm font-medium ${activeTab === 'entradas' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('entradas')}
                    >
                        Entradas Individuales
                    </button>
                    <button
                        className={`ml-4 py-2 px-4 text-sm font-medium ${activeTab === 'pulseras' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('pulseras')}
                    >
                        Pulseras NFC
                    </button>
                </div>

                {activeTab === 'entradas' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Listado de Entradas Generadas</h3>
                        {loading && (
                            <div className="text-center py-8 text-gray-600">Cargando entradas...</div>
                        )}
                        {!loading && tickets.length === 0 && !error && (
                            <div className="text-center py-8 text-gray-600">No hay entradas generadas para este festival.</div>
                        )}
                        {!loading && tickets.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="table-corporate">
                                    <thead>
                                        <tr>
                                            <th>
                                                Tipo Entrada
                                            </th>
                                            <th>
                                                Código QR
                                            </th>
                                            <th>
                                                Asistente
                                            </th>
                                            <th>
                                                Pulsera NFC
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
                                        {tickets.map((ticket) => (
                                            <tr key={ticket.idEntrada}>
                                                <td>
                                                    <p className="text-gray-900 whitespace-no-wrap">{ticket.tipoEntradaOriginal}</p>
                                                    <p className="text-gray-600 text-xs">ID Compra: {ticket.idCompraEntrada}</p>
                                                </td>
                                                <td>
                                                    <div className="flex items-center space-x-2">
                                                        {renderQrCode(ticket.qrCodeImageDataUrl, ticket.codigoQr)}
                                                        <span className="text-gray-800 font-mono text-sm">{ticket.codigoQr}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {ticket.nombreAsistente ? (
                                                        <>
                                                            <p className="text-gray-900 whitespace-no-wrap">{ticket.nombreAsistente}</p>
                                                            <p className="text-gray-600 text-xs">{ticket.emailAsistente}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-gray-500 italic">No nominado</p>
                                                    )}
                                                </td>
                                                <td>
                                                    {ticket.codigoUidPulsera ? (
                                                        <p className="text-gray-800 font-mono text-sm">{ticket.codigoUidPulsera}</p>
                                                    ) : (
                                                        <p className="text-gray-500 italic">No asociada</p>
                                                    )}
                                                </td>
                                                <td>
                                                    {renderTicketStatus(ticket.estado)}
                                                </td>
                                                <td>
                                                    <div className="flex flex-col space-y-1">
                                                        {ticket.estado === 'ACTIVA' && !ticket.nombreAsistente && (
                                                            <button
                                                                onClick={() => handleNominateClick(ticket)}
                                                                className="btn-corporate-primary px-3 py-1 text-sm"
                                                            >
                                                                Nominar
                                                            </button>
                                                        )}
                                                        {ticket.estado === 'ACTIVA' && !ticket.codigoUidPulsera && (
                                                            <button
                                                                onClick={() => handleAssociateBraceletClick(ticket)}
                                                                className="btn-corporate-primary px-3 py-1 text-sm"
                                                            >
                                                                Asociar Pulsera
                                                            </button>
                                                        )}
                                                        {ticket.estado === 'ACTIVA' && (
                                                            <button
                                                                onClick={() => handleCancelTicket(ticket.idEntrada, ticket.codigoQr)}
                                                                className="btn-corporate-secondary px-3 py-1 text-sm bg-red-600 hover:bg-red-700"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'pulseras' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Listado de Pulseras NFC</h3>
                        {loading && (
                            <div className="text-center py-8 text-gray-600">Cargando pulseras...</div>
                        )}
                        {!loading && bracelets.length === 0 && !error && (
                            <div className="text-center py-8 text-gray-600">No hay pulseras asociadas a este festival.</div>
                        )}
                        {!loading && bracelets.length > 0 && (
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
                                        {bracelets.map((bracelet) => (
                                            <tr key={bracelet.idPulsera}>
                                                <td>
                                                    <span className="text-gray-800 font-mono text-sm">{bracelet.codigoUid}</span>
                                                </td>
                                                <td>
                                                    <p className="text-gray-900 whitespace-no-wrap">{parseFloat(bracelet.saldo).toFixed(2)} €</p>
                                                </td>
                                                <td>
                                                    {bracelet.qrEntrada ? (
                                                        <p className="text-gray-800 font-mono text-sm">{bracelet.qrEntrada}</p>
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
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bracelet.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {bracelet.activa ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
            </main>

            {showNominateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="card-corporate w-full max-w-md text-gray-900">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Nominar Entrada</h3>
                        <p className="text-gray-700 mb-4 text-center">Entrada: <span className="font-semibold">{selectedTicketToNominate?.codigoQr}</span></p>
                        {nominationFormError && (
                            <div className="error-message text-sm mb-4">
                                <strong>Error:</strong>
                                <span className="block sm:inline"> {nominationFormError}</span>
                            </div>
                        )}
                        <form onSubmit={handleNominationSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="nombreAsistente" className="block text-sm font-medium text-gray-700 mb-1">Nombre Asistente <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="nombreAsistente"
                                    name="nombreAsistente"
                                    value={nominationForm.nombreAsistente}
                                    onChange={handleNominationFormChange}
                                    required
                                    className="input-corporate"
                                />
                            </div>
                            <div>
                                <label htmlFor="emailAsistente" className="block text-sm font-medium text-gray-700 mb-1">Email Asistente <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    id="emailAsistente"
                                    name="emailAsistente"
                                    value={nominationForm.emailAsistente}
                                    onChange={handleNominationFormChange}
                                    required
                                    className="input-corporate"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmEmailNominado" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    id="confirmEmailNominado"
                                    name="confirmEmailNominado"
                                    value={nominationForm.confirmEmailNominado}
                                    onChange={handleNominationFormChange}
                                    required
                                    className="input-corporate"
                                />
                            </div>
                            <div>
                                <label htmlFor="telefonoAsistente" className="block text-sm font-medium text-gray-700 mb-1">Teléfono Asistente (Opcional)</label>
                                <input
                                    type="tel"
                                    id="telefonoAsistente"
                                    name="telefonoAsistente"
                                    value={nominationForm.telefonoAsistente}
                                    onChange={handleNominationFormChange}
                                    className="input-corporate"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowNominateForm(false)}
                                    className="btn-corporate-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={nominationFormLoading}
                                    className="btn-corporate-primary"
                                >
                                    {nominationFormLoading ? 'Nominando...' : 'Confirmar Nominación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssociateBraceletForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="card-corporate w-full max-w-md text-gray-900">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Asociar Pulsera NFC</h3>
                        <p className="text-gray-700 mb-4 text-center">Entrada: <span className="font-semibold">{selectedTicketToAssociate?.codigoQr}</span></p>
                        {associateBraceletFormError && (
                            <div className="error-message text-sm mb-4">
                                <strong>Error:</strong>
                                <span className="block sm:inline"> {associateBraceletFormError}</span>
                            </div>
                        )}
                        <form onSubmit={handleAssociateBraceletSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="codigoUid" className="block text-sm font-medium text-gray-700 mb-1">Código UID Pulsera <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="codigoUid"
                                    name="codigoUid"
                                    value={associateBraceletForm.codigoUid}
                                    onChange={handleAssociateBraceletFormChange}
                                    required
                                    className="input-corporate"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAssociateBraceletForm(false)}
                                    className="btn-corporate-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={associateBraceletFormLoading}
                                    className="btn-corporate-primary"
                                >
                                    {associateBraceletFormLoading ? 'Asociando...' : 'Asociar Pulsera'}
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

export default TicketAndBraceletManagement;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PublicNomination = () => {
    const { codigoQr } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [entradaData, setEntradaData] = useState(null);

    // Estados para el formulario de nominación.
    const [nominationForm, setNominationForm] = useState({
        emailAsistente: '',
        confirmEmailNominado: '',
        nombreAsistente: '',
        telefonoAsistente: '',
    });
    const [formError, setFormError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Función auxiliar para mostrar y limpiar mensajes.
    const showMessage = (setter, msg, duration = 5000) => {
        setter(msg);
        setTimeout(() => setter(null), duration);
    };

    // Efecto para cargar la información de la entrada.
    useEffect(() => {
        if (!codigoQr) {
            showMessage(setError, "Código QR de entrada no proporcionado en la URL.");
            setLoading(false);
            return;
        }

        const fetchEntradaDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                setSuccessMessage(null);

                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/public/venta/entrada-qr/${codigoQr}`, {
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al cargar los detalles de la entrada.');
                }

                const data = await response.json();
                setEntradaData(data);
                if (data.estado !== 'ACTIVA') {
                    showMessage(setError, `Esta entrada no está activa. Estado actual: ${data.estado}.`);
                }
                if (data.nombreAsistente) {
                    showMessage(setError, `Esta entrada ya está nominada a ${data.nombreAsistente}.`);
                    setNominationForm(prev => ({
                        ...prev,
                        emailAsistente: data.emailAsistente || '',
                        confirmEmailNominado: data.emailAsistente || '',
                        nombreAsistente: data.nombreAsistente || '',
                    }));
                }

            } catch (err) {
                console.error("Error fetching entrada details for public nomination:", err);
                showMessage(setError, err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEntradaDetails();
    }, [codigoQr]);

    // Manejador para cambios en el formulario.
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setNominationForm(prev => ({ ...prev, [name]: value }));
    };

    // Manejador para el envío del formulario de nominación.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        setSuccessMessage(null);

        if (!nominationForm.emailAsistente || !nominationForm.nombreAsistente) {
            showMessage(setFormError, 'Email y nombre del asistente son obligatorios.');
            setFormLoading(false);
            return;
        }
        if (nominationForm.emailAsistente !== nominationForm.confirmEmailNominado) {
            showMessage(setFormError, 'Los emails no coinciden.');
            setFormLoading(false);
            return;
        }
        if (entradaData.estado !== 'ACTIVA') {
            showMessage(setFormError, `No se puede nominar una entrada en estado ${entradaData.estado}.`);
            setFormLoading(false);
            return;
        }
        if (entradaData.nombreAsistente) {
            showMessage(setFormError, `Esta entrada ya está nominada a ${entradaData.nombreAsistente}.`);
            setFormLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/public/venta/nominar/${codigoQr}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nominationForm),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al procesar la nominación.');
            }

            const data = await response.json();
            setEntradaData(data);
            showMessage(setSuccessMessage, `¡Entrada nominada con éxito a ${data.nombreAsistente}! Recibirás un email con tu entrada.`);
        } catch (err) {
            console.error("Error submitting public nomination:", err);
            showMessage(setFormError, err.message);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-start pt-16 pb-10 px-4">
            <div className="bg-orange-50 p-8 rounded-xl shadow-2xl w-full max-w-lg text-gray-900">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-center mb-6">
                        <img src="https://placehold.co/100x100?text=Logo" alt="Beatpass Logo" className="rounded-lg shadow-md" />
                    </div>
                    <h1 className="title-public text-center mb-4">Nomina tu Entrada</h1>
                    {loading ? (
                        <p className="text-center text-gray-700">Cargando detalles de la entrada...</p>
                    ) : error ? (
                        <div className="error-message text-center mb-4">
                            <strong>Error:</strong> {error}
                        </div>
                    ) : entradaData && (
                        <>
                            <p className="text-center text-gray-700 mb-4">para el festival <strong>{entradaData.nombreFestival}</strong></p>

                            {successMessage && (
                                <div className="success-message text-center mb-4">
                                    <strong>¡Éxito!</strong> {successMessage}
                                </div>
                            )}

                            {formError && (
                                <div className="error-message text-center mb-4">
                                    <strong>Error:</strong> {formError}
                                </div>
                            )}

                            <div className="bg-gray-100 p-4 rounded-lg text-center mb-6 shadow-inner">
                                <div className="text-sm font-medium text-gray-600 mb-1">Código de tu entrada:</div>
                                <div className="text-2xl font-bold text-orange-600 tracking-wide">{entradaData.codigoQr}</div>
                            </div>

                            {entradaData.nombreAsistente ? (
                                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                                    Esta entrada ya está nominada a <strong>{entradaData.nombreAsistente} ({entradaData.emailAsistente})</strong>.
                                </div>
                            ) : entradaData.estado !== 'ACTIVA' ? (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                    Esta entrada no se puede nominar porque está en estado: <strong>{entradaData.estado}</strong>.
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="nombreAsistente" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Asistente <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            id="nombreAsistente"
                                            name="nombreAsistente"
                                            value={nominationForm.nombreAsistente}
                                            onChange={handleFormChange}
                                            required
                                            className="input-corporate"
                                            placeholder="Nombre completo"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="emailAsistente" className="block text-sm font-medium text-gray-700 mb-1">Email del Asistente <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            id="emailAsistente"
                                            name="emailAsistente"
                                            value={nominationForm.emailAsistente}
                                            onChange={handleFormChange}
                                            required
                                            className="input-corporate"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="confirmEmailNominado" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Email <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            id="confirmEmailNominado"
                                            name="confirmEmailNominado"
                                            value={nominationForm.confirmEmailNominado}
                                            onChange={handleFormChange}
                                            required
                                            className="input-corporate"
                                            placeholder="Confirma el email"
                                        />
                                        {nominationForm.emailAsistente && nominationForm.confirmEmailNominado &&
                                            nominationForm.emailAsistente !== nominationForm.confirmEmailNominado && (
                                                <p className="error-message">Los emails no coinciden.</p>
                                            )}
                                    </div>
                                    <div>
                                        <label htmlFor="telefonoAsistente" className="block text-sm font-medium text-gray-700 mb-1">Teléfono del Asistente (Opcional)</label>
                                        <input
                                            type="tel"
                                            id="telefonoAsistente"
                                            name="telefonoAsistente"
                                            value={nominationForm.telefonoAsistente}
                                            onChange={handleFormChange}
                                            className="input-corporate"
                                            placeholder="Ej: +34 600 123 456"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={formLoading || (nominationForm.emailAsistente && nominationForm.emailAsistente !== nominationForm.confirmEmailNominado)}
                                        className="btn-public-accent w-full"
                                    >
                                        {formLoading ? 'Nominando...' : 'Confirmar Nominación'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                    <a onClick={() => navigate('/')} className="block text-center mt-6 text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">Volver al inicio</a>
                </div>
            </div>
        </div>
    );
};

export default PublicNomination;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const FestivalForm = () => {
    const { idFestival } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        ubicacion: '',
        aforo: '',
        imagenUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Función auxiliar para mostrar y limpiar mensajes.
    const showMessage = (setter, msg, duration = 5000) => {
        setter(msg);
        setTimeout(() => setter(null), duration);
    };

    // Efecto para cargar los datos del festival si está en modo edición.
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (idFestival) {
            setIsEditing(true);
            const fetchFestival = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    setSuccessMessage(null);
                    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Festival no encontrado.');
                    }

                    const data = await response.json();
                    setFormData({
                        nombre: data.nombre,
                        descripcion: data.descripcion || '',
                        fechaInicio: data.fechaInicio,
                        fechaFin: data.fechaFin,
                        ubicacion: data.ubicacion || '',
                        aforo: data.aforo || '',
                        imagenUrl: data.imagenUrl || '',
                    });
                } catch (err) {
                    console.error("Error fetching festival for edit:", err);
                    showMessage(setError, err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchFestival();
        } else {
            setIsEditing(false);
            setLoading(false);
        }
    }, [idFestival, token, navigate]);

    // Manejador para cambios en los campos del formulario.
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Manejador para el envío del formulario.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        setSuccessMessage(null);

        if (!formData.nombre || !formData.fechaInicio || !formData.fechaFin) {
            showMessage(setFormError, 'Nombre, fecha de inicio y fecha de fin son obligatorios.');
            setFormLoading(false);
            return;
        }
        if (new Date(formData.fechaFin) < new Date(formData.fechaInicio)) {
            showMessage(setFormError, 'La fecha de fin no puede ser anterior a la fecha de inicio.');
            setFormLoading(false);
            return;
        }
        if (formData.aforo && (isNaN(parseInt(formData.aforo)) || parseInt(formData.aforo) <= 0)) {
            showMessage(setFormError, 'El aforo debe ser un número positivo.');
            setFormLoading(false);
            return;
        }

        const payload = {
            ...formData,
            aforo: formData.aforo ? parseInt(formData.aforo) : null,
        };

        try {
            let response;
            let url;
            let method;

            if (isEditing) {
                url = `${process.env.REACT_APP_API_BASE_URL}/promotor/festivales/${idFestival}`;
                method = 'PUT';
            } else {
                url = `${process.env.REACT_APP_API_BASE_URL}/promotor/festivales`;
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
                throw new Error(errorData.error || 'Error al guardar el festival.');
            }

            showMessage(setSuccessMessage, `Festival ${isEditing ? 'actualizado' : 'creado'} con éxito!`);
            if (!isEditing) {
                setTimeout(() => navigate('/promotor/dashboard'), 2000);
            }

        } catch (err) {
            console.error("Error submitting festival form:", err);
            showMessage(setFormError, err.message);
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <p className="text-gray-600">Cargando festival...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-corporate-gradient p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center bg-white shadow-md rounded-lg p-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditing ? 'Editar Festival' : 'Crear Nuevo Festival'}
                </h1>
                <div className="flex items-center space-x-4">
                    {isEditing && user?.role === 'PROMOTOR' && (
                        <button
                            onClick={() => navigate(`/promotor/festivales/${idFestival}`)}
                            className="btn-corporate-secondary"
                        >
                            Volver a Detalles del Festival
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/promotor/dashboard')}
                        className="btn-corporate-secondary"
                    >
                        Volver a Mis Festivales
                    </button>
                </div>
            </header>

            <main className="card-corporate p-6">
                <h2 className="title-corporate text-xl text-gray-800 mb-4">
                    {isEditing ? `Detalles de ${formData.nombre}` : 'Introduce los datos del nuevo festival'}
                </h2>

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
                {formError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline"> {formError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Festival <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleFormChange}
                            required
                            className="input-corporate"
                        />
                    </div>
                    <div>
                        <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700">Ubicación</label>
                        <input
                            type="text"
                            id="ubicacion"
                            name="ubicacion"
                            value={formData.ubicacion}
                            onChange={handleFormChange}
                            className="input-corporate"
                        />
                    </div>
                    <div>
                        <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700">Fecha de Inicio <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="fechaInicio"
                            name="fechaInicio"
                            value={formData.fechaInicio}
                            onChange={handleFormChange}
                            required
                            className="input-corporate"
                        />
                    </div>
                    <div>
                        <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700">Fecha de Fin <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="fechaFin"
                            name="fechaFin"
                            value={formData.fechaFin}
                            onChange={handleFormChange}
                            required
                            className="input-corporate"
                        />
                    </div>
                    <div>
                        <label htmlFor="aforo" className="block text-sm font-medium text-gray-700">Aforo (Opcional)</label>
                        <input
                            type="number"
                            id="aforo"
                            name="aforo"
                            value={formData.aforo}
                            onChange={handleFormChange}
                            min="1"
                            className="input-corporate"
                        />
                    </div>
                    <div>
                        <label htmlFor="imagenUrl" className="block text-sm font-medium text-gray-700">URL de Imagen (Opcional)</label>
                        <input
                            type="url"
                            id="imagenUrl"
                            name="imagenUrl"
                            value={formData.imagenUrl}
                            onChange={handleFormChange}
                            className="input-corporate"
                            placeholder="https://ejemplo.com/imagen.jpg"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleFormChange}
                            rows="4"
                            className="input-corporate h-24"
                        ></textarea>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="btn-corporate-primary"
                        >
                            {formLoading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar Cambios' : 'Crear Festival')}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default FestivalForm;
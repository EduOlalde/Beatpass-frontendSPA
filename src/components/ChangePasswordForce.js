import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const ChangePasswordForce = () => {
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/promotor/cambiar-password-obligatorio', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword: password, confirmPassword: confirmPassword }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cambiar la contraseña.');
            }

            setSuccessMessage('Contraseña actualizada con éxito. Por favor, inicie sesión de nuevo.');
            setTimeout(() => {
                logout(); 
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-corporate-gradient p-4">
            <div className="card-corporate w-full max-w-md text-gray-900">
                <h2 className="title-corporate text-center mb-4">
                    Cambio de Contraseña Obligatorio
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    Hola {user?.userName}, por seguridad, debes establecer una nueva contraseña para tu cuenta.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Nueva Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-corporate"
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Nueva Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-corporate"
                            placeholder="Repite la contraseña"
                        />
                    </div>

                    {error && <p className="error-message text-center">{error}</p>}
                    {successMessage && <p className="success-message text-center">{successMessage}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || successMessage}
                            className="btn-corporate-primary w-full"
                        >
                            {loading ? 'Actualizando...' : 'Establecer Nueva Contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordForce;
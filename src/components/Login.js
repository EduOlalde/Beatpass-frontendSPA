import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Email o contraseña incorrectos. Por favor, inténtalo de nuevo.');
                }
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error de autenticación');
            }

            const data = await response.json();
            login(data.token);

            if (data.cambioPasswordRequerido) {
                navigate('/cambiar-password-obligatorio');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            console.error('Error durante el login:', err);
            setError(err.message || 'Hubo un problema al intentar iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-corporate-gradient p-4">
            <div className="card-corporate w-full max-w-md text-gray-900">
                <h2 className="title-corporate text-center mb-8">
                    Iniciar Sesión en Beatpass
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-corporate"
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-corporate"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && (
                        <p className="error-message text-center">
                            {error}
                        </p>
                    )}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-corporate-primary w-full"
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default Login;
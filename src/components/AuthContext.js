import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
// Crea un contexto de autenticación.
const AuthContext = createContext(null);

// Componente proveedor de autenticación.
export const AuthProvider = ({ children }) => {
    // Estado para el token JWT, inicializado desde localStorage.
    const [token, setToken] = useState(() => localStorage.getItem('jwtToken'));
    // Estado para la información del usuario decodificada del token.
    const [user, setUser] = useState(null);

    // Efecto para manejar cambios en el token.
    useEffect(() => {
        if (token) {
            localStorage.setItem('jwtToken', token);
            try {
                // Decodifica el token y establece la información del usuario.
                const decodedToken = jwtDecode(token);
                setUser({
                    userId: decodedToken.sub,
                    role: decodedToken.role,
                    userName: decodedToken.userName || decodedToken.name || decodedToken.sub,
                    cambioPasswordRequerido: decodedToken.pwdChangeRequired || false
                });
            } catch (error) {
                // Maneja errores de decodificación del token.
                console.error("Error decodificando token JWT:", error);
                setToken(null);
            }
        } else {
            // Limpia el token y la información del usuario si no hay token.
            localStorage.removeItem('jwtToken');
            setUser(null);
        }
    }, [token]);

    // Función para iniciar sesión (establecer el token).
    const login = (newToken) => {
        setToken(newToken);
    };

    // Función para cerrar sesión (limpiar el token).
    const logout = () => {
        setToken(null);
    };

    // Valor del contexto de autenticación.
    const authContextValue = {
        token,
        user,
        isAuthenticated: !!token, // Verdadero si hay un token.
        login,
        logout,
        apiBaseUrl: API_BASE_URL
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto de autenticación.
export const useAuth = () => {
    return useContext(AuthContext);
};

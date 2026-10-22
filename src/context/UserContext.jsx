import { useCallback, useState } from 'react';
import { UserContext } from './useUser';
import { apiRequest } from '../services/api';

export function UserProvider({ children }) {
 
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const logout = useCallback(() => {
    setToken(null);
    setEmail('');
    setNotice('');
  }, []);

  const authenticate = async (action, credentials) => {
    const data = await apiRequest(`/auth/${action}`, { method: 'POST', body: credentials });
    if (!data?.token || !data?.email) throw new Error('El servidor no devolvió token y email.');
    setToken(data.token);
    setEmail(data.email);
    setNotice(action === 'login' ? '¡Inicio de sesión exitoso!' : '¡Registro exitoso!');
  };
  const login = (credentials) => authenticate('login', credentials);
  const register = (credentials) => authenticate('register', credentials);
  const getProfile = useCallback(async (signal) => {
    try {
      const data = await apiRequest('/auth/me', { token, signal });
      if (!data?.email) throw new Error('El servidor no devolvió el email del perfil.');
      setEmail(data.email);
      return data;
    } catch (error) {
      if (error.status === 401) logout();
      throw error;
    }
  }, [token, logout]);

  return <UserContext.Provider value={{ token, email, login, register, logout, getProfile, notice, setNotice }}>
    {children}
  </UserContext.Provider>;
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/useUser';
import '../utils/authForms.css';
import pizzaLogo from '../assets/mamma-mia-logo.png';

export default function AuthForm({ registerMode = false }) {
  const { login, register } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;
    setError('');
    if (!email.trim() || !password.trim() || (registerMode && !confirmPassword.trim())) {
      setError('Todos los campos son obligatorios.'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un email válido.'); return;
    }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (registerMode && password !== confirmPassword) { setError('Las contraseñas deben ser iguales.'); return; }
    setPending(true);
    try {
      await (registerMode ? register : login)({ email: email.trim(), password });
    } catch (error) { setError(error.message); }
    finally { setPending(false); }
  };
  return <div className="auth-container" style={{ maxWidth: 600 }}><div className="auth-card">
    <div className="auth-header">
      <img src={pizzaLogo} alt="Mamma Mía" className="auth-logo" />
      <h1 className="h2">{registerMode ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
    </div>
    {error && <p role="alert" className="auth-message error">{error}</p>}
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="form-group"><label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="form-group"><label htmlFor="password">Contraseña</label>
        <input id="password" type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
      {registerMode && <div className="form-group"><label htmlFor="confirmPassword">Confirmar contraseña</label>
        <input id="confirmPassword" type="password" autoComplete="new-password" required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>}
      <button className="auth-button" disabled={pending} type="submit">{pending ? 'Enviando…' : registerMode ? 'Crear cuenta' : 'Iniciar sesión'}</button>
    </form>
    <div className="auth-options"><Link to={registerMode ? '/login' : '/register'}>
      {registerMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
    </Link></div>
  </div></div>;
}

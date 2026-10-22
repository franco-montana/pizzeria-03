import { useEffect, useState } from 'react';
import { useUser } from '../context/useUser';
export default function Profile() {
  const { email, logout, getProfile } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    getProfile(controller.signal)
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [getProfile]);
  return <section className="container my-5">
    <h1>Mi perfil</h1>
    {loading && <p role="status">Cargando perfil…</p>}
    {error && <p role="alert" className="alert alert-danger">{error}</p>}
    {!loading && !error && <p>Email: {email}</p>}
    <button className="btn btn-outline-danger" onClick={logout}>Cerrar sesión</button>
  </section>;
}

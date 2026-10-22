import { useEffect, useState } from 'react';
import Header from '../components/Header';
import CardPizza from '../components/CardPizza';
import { apiRequest } from '../services/api';
import { useUser } from '../context/useUser';

export default function Home() {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { notice, setNotice } = useUser();
  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/pizzas', { signal: controller.signal })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('La respuesta de pizzas no es válida.');
        setPizzas(data);
      })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <>
    <Header />
    <div className="container mt-5">
      {notice && <div role="status" className="alert alert-success d-flex justify-content-between">
        {notice}<button aria-label="Cerrar mensaje" className="btn-close" onClick={() => setNotice('')} />
      </div>}
      <h2 className="mb-4 text-center">ESPECIALIDADES DE LA CASA</h2>
      {loading && <p role="status">Cargando pizzas…</p>}
      {error && <p role="alert" className="alert alert-danger">{error}</p>}
      {!loading && !error && !pizzas.length && <p>No hay pizzas disponibles.</p>}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {pizzas.map(pizza => <div key={pizza.id} className="col"><CardPizza pizza={pizza} /></div>)}
      </div>
    </div>
  </>;
}

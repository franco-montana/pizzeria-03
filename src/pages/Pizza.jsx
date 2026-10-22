import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useCart } from '../context/useCart';
import { formatPrice } from '../utils/formatPrice';

export default function Pizza() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [pizza, setPizza] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setPizza(null);
    apiRequest(`/pizzas/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(data => {
        if (!data?.id) throw new Error('Pizza no encontrada.');
        setPizza(data);
      })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  return <section className="container my-5">
    <Link to="/">← Volver al inicio</Link>
    {loading && <p role="status">Cargando pizza…</p>}
    {error && <p role="alert" className="alert alert-danger mt-3">{error}</p>}
    {pizza && <article className="card mt-3"><div className="row g-0">
      <div className="col-md-6"><img className="img-fluid rounded" src={pizza.img} alt={pizza.name} /></div>
      <div className="col-md-6 card-body">
        <h1 className="text-capitalize">Pizza {pizza.name}</h1>
        <p>{pizza.desc}</p><h2 className="h5">Ingredientes</h2>
        <ul>{pizza.ingredients.map((item, index) => <li key={index}>{item}</li>)}</ul>
        <p className="h4">Precio: ${formatPrice(pizza.price)}</p>
        <button className="btn btn-success mt-3" onClick={() => addToCart(pizza)}>Añadir al carrito 🛒</button>
      </div>
    </div></article>}
  </section>;
}

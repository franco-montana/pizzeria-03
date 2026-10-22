import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { useUser } from '../context/useUser';
import { apiRequest } from '../services/api';
import { formatPrice } from '../utils/formatPrice';

export default function Cart() {
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const { token, logout } = useUser();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const checkout = async () => {
    if (!token || !cartItems.length || pending) return;
    setPending(true); setError(''); setSuccess('');
    try {
      // Enviamos la cantidad como count; el backend de apoyo devuelve el carrito sin transformarlo.
      const cart = cartItems.map(({ quantity, ...pizza }) => ({ ...pizza, count: quantity }));
      await apiRequest('/checkouts', { method: 'POST', token, body: { cart } });
      clearCart();
      setSuccess('¡Compra realizada con éxito! Gracias por tu pedido.');
    } catch (error) {
      setError(error.status === 401 ? 'Tu sesión expiró. Inicia sesión nuevamente.' : error.message);
      if (error.status === 401) logout();
    } finally { setPending(false); }
  };
  return <section className="container my-5">
    <h1>Carrito de compras</h1>
    {success && <p role="status" className="alert alert-success">{success}</p>}
    {error && <p role="alert" className="alert alert-danger">{error}</p>}
    {!cartItems.length && <p>No hay productos en el carrito. <Link to="/">Ver pizzas</Link></p>}
    {cartItems.map(pizza => <article key={pizza.id} className="card my-3 p-3">
      <div className="d-flex flex-wrap gap-3 align-items-center">
        <img src={pizza.img} alt={pizza.name} width="100" height="100" style={{ objectFit: 'cover' }} />
        <div className="me-auto"><h2 className="h5">{pizza.name}</h2><p>Precio: ${formatPrice(pizza.price)}</p></div>
        <button disabled={pending} className="btn btn-outline-danger" aria-label={`Disminuir ${pizza.name}`} onClick={() => decreaseQuantity(pizza.id)}>−</button>
        <span aria-label={`Cantidad de ${pizza.name}`}>{pizza.quantity}</span>
        <button disabled={pending} className="btn btn-outline-success" aria-label={`Aumentar ${pizza.name}`} onClick={() => increaseQuantity(pizza.id)}>+</button>
        <strong>${formatPrice(pizza.price * pizza.quantity)}</strong>
        <button disabled={pending} className="btn btn-outline-secondary" onClick={() => removeFromCart(pizza.id)}>Eliminar {pizza.name}</button>
      </div>
    </article>)}
    <h2 className="h4 my-4">Total: ${formatPrice(getTotal())}</h2>
    {!token && <p><Link to="/login">Inicia sesión</Link> para pagar.</p>}
    <button className="btn btn-success" disabled={!token || !cartItems.length || pending} onClick={checkout}>
      {pending ? 'Procesando…' : 'Pagar'}
    </button>
  </section>;
}

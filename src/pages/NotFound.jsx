import { Link } from 'react-router-dom';
export default function NotFound() {
  return <section className="container text-center my-5">
    <h1>404 · Esta pizza no está en el menú</h1>
    <p>La página que buscas no existe.</p>
    <Link className="btn btn-success" to="/">Volver al inicio</Link>
  </section>;
}

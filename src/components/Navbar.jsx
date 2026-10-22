import { useUser } from '../context/useUser'
import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { formatPrice } from '../utils/formatPrice'

const Navbar = () => {
  const { getTotal, getCartCount } = useCart()
  const { token, logout } = useUser()

  return (
    <>
      <div style={{ height: '56px' }}></div>
      
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div className="container">
          <Link className="navbar-brand" to="/">🍕  L'ANTICA</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
            </ul>
            <div className="d-flex flex-wrap gap-2">
              {token ? (
                <>
                  <Link to="/profile" className="btn btn-outline-light me-2"> Profile</Link>
                  <button onClick={logout} className="btn btn-outline-light me-2"> Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline-light me-2"> INGRESA</Link>
                  <Link to="/register" className="btn btn-outline-light me-2"> REGISTRATE!</Link>
                </>
              )}
              <Link to="/cart" className="btn btn-success">
                🛒 Total: ${formatPrice(getTotal())} ({getCartCount()})
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar

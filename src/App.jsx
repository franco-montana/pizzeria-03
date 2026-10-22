import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RouteGuard from './components/RouteGuard';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Cart from './pages/Cart';
import Pizza from './pages/Pizza';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';


const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;
export default function App() {
  return <UserProvider><CartProvider><Router>
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<RouteGuard guestOnly><LoginPage /></RouteGuard>} />
          <Route path="/register" element={<RouteGuard guestOnly><RegisterPage /></RouteGuard>} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/pizza/:id" element={<Pizza />} />
          <Route path="/profile" element={<RouteGuard><Profile /></RouteGuard>} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  </Router></CartProvider></UserProvider>;
}

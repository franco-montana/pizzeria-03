import { Navigate } from 'react-router-dom';
import { useUser } from '../context/useUser';
export default function RouteGuard({ children, guestOnly = false }) {
  const { token } = useUser();
  if (guestOnly && token) return <Navigate to="/" replace />;
  if (!guestOnly && !token) return <Navigate to="/login" replace />;
  return children;
}

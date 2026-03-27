import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute = ({ children }) => {
  const { user, role } = useAuth();

  if (!user || role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

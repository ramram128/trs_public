import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <Loader className="h-8 w-8 animate-spin text-[#1a3c2e]" />
      </div>
    );
  }

  if (!user) {
    // Not logged in
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    // Logged in but not admin
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;

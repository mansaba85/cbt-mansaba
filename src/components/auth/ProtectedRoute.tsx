import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  requiredLevel?: number; // Level min: 1 (Siswa), 7 (Proktor), 10 (Admin)
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredLevel = 1, 
  redirectTo = '/login' 
}) => {
  const userJson = localStorage.getItem('cbt_user');
  
  if (!userJson || userJson === 'undefined') {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    
    // Periksa apakah level user mencukupi
    if (!user || user.levelInt === undefined || user.levelInt < requiredLevel) {
        // Jika siswa mencoba masuk ke admin, lempar ke dashboard siswa
        if (requiredLevel >= 7 && (user?.levelInt || 0) < 7) {
            console.warn("Akses ditolak: Level tidak mencukupi untuk area Admin");
            return <Navigate to="/student" replace />;
        }
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
  } catch (e) {
    console.error("ProtectedRoute Error: Data user tidak valid", e);
    localStorage.removeItem('cbt_user'); // Bersihkan data korup
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;

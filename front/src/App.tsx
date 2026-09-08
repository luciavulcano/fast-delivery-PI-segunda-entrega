import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import type { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  const { user, logout } = useAuth();

  return (
    <>
      <div className="topbar">
        <Link to="/">
          <strong>FastDelivery</strong>
        </Link>
        <div className="row">
          {user ? (
            <>
              <Link to="/orders" className="muted">
                Meus pedidos
              </Link>
              <span className="muted">{user.name}</span>
              <button className="ghost" onClick={logout}>
                Sair
              </button>
            </>
          ) : (
            <Link to="/login">Entrar</Link>
          )}
        </div>
      </div>

      <Routes>
        <Route path="/" element={<RestaurantsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

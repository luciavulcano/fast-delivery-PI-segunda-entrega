import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Restaurant } from '../api/types';

export function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Restaurant[]>('/restaurants')
      .then(setRestaurants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Carregando restaurantes...</div>;
  if (error) return <div className="container error">{error}</div>;

  return (
    <div className="container">
      <h2>Restaurantes</h2>
      {restaurants.length === 0 && (
        <p className="muted">Nenhum restaurante cadastrado. Rode o seed do backend.</p>
      )}
      {restaurants.map((r) => (
        <Link key={r.id} to={`/restaurants/${r.id}`}>
          <div className="card">
            <div className="row">
              <div>
                <strong>{r.name}</strong>
                <div className="muted">{r.description}</div>
              </div>
              <span className="tag">{r.category}</span>
            </div>
            <div className="muted" style={{ marginTop: 8 }}>
              Entrega R$ {Number(r.deliveryFee).toFixed(2)} · {r.etaMinMinutes}–{r.etaMaxMinutes}{' '}
              min · {r.isOpen ? 'Aberto' : 'Fechado'}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Order } from '../api/types';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  READY: 'Pronto',
  DISPATCHED: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api<Order[]>('/orders')
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) return <div className="container">Carregando pedidos...</div>;
  if (error) return <div className="container error">{error}</div>;

  return (
    <div className="container">
      <h2>Meus pedidos</h2>
      {orders.length === 0 && <p className="muted">Você ainda não fez pedidos.</p>}
      {orders.map((order) => (
        <div className="card" key={order.id}>
          <div className="row">
            <strong>{order.restaurant.name}</strong>
            <span className="tag">{STATUS_LABEL[order.status] ?? order.status}</span>
          </div>
          <div className="muted" style={{ margin: '8px 0' }}>
            {new Date(order.createdAt).toLocaleString('pt-BR')}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity}× {item.nameSnapshot} — R${' '}
                {(Number(item.unitPrice) * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>
          <div className="row" style={{ marginTop: 8 }}>
            <span className="muted">
              Entrega R$ {Number(order.deliveryFee).toFixed(2)}
            </span>
            <strong>Total R$ {Number(order.total).toFixed(2)}</strong>
          </div>
          {order.tracking.length > 0 && (
            <div className="muted" style={{ marginTop: 8 }}>
              Última atualização:{' '}
              {order.tracking[order.tracking.length - 1].message ??
                STATUS_LABEL[order.tracking[order.tracking.length - 1].status]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

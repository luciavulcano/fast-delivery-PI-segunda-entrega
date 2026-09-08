import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Address, Restaurant } from '../api/types';

export function RestaurantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Restaurant>(`/restaurants/${id}`)
      .then(setRestaurant)
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    api<Address[]>('/users/me/addresses')
      .then((list) => {
        setAddresses(list);
        setAddressId(list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? '');
      })
      .catch(() => undefined);
  }, [user]);

  const items = restaurant?.menuItems ?? [];

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + Number(item.price) * (cart[item.id] ?? 0), 0),
    [items, cart],
  );

  function setQty(itemId: string, qty: number) {
    setCart((c) => ({ ...c, [itemId]: Math.max(0, qty) }));
  }

  async function checkout() {
    setError(null);
    if (!user) {
      navigate('/login');
      return;
    }
    if (!addressId) {
      setError('Cadastre um endereço para continuar (via API /users/me/addresses).');
      return;
    }
    const orderItems = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (orderItems.length === 0) {
      setError('Selecione ao menos um item.');
      return;
    }
    setBusy(true);
    try {
      await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId: id,
          addressId,
          paymentMethod,
          items: orderItems,
        }),
      });
      navigate('/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar pedido');
    } finally {
      setBusy(false);
    }
  }

  if (error && !restaurant) return <div className="container error">{error}</div>;
  if (!restaurant) return <div className="container">Carregando...</div>;

  return (
    <div className="container">
      <h2>{restaurant.name}</h2>
      <p className="muted">
        {restaurant.category} · entrega R$ {Number(restaurant.deliveryFee).toFixed(2)} · pedido
        mínimo R$ {Number(restaurant.minOrder).toFixed(2)}
      </p>

      {items.map((item) => (
        <div className="card" key={item.id}>
          <div className="row">
            <div>
              <strong>{item.name}</strong>
              <div className="muted">{item.description}</div>
              <div>R$ {Number(item.price).toFixed(2)}</div>
            </div>
            <div className="row">
              <button className="ghost" onClick={() => setQty(item.id, (cart[item.id] ?? 0) - 1)}>
                −
              </button>
              <span>{cart[item.id] ?? 0}</span>
              <button className="ghost" onClick={() => setQty(item.id, (cart[item.id] ?? 0) + 1)}>
                +
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="card">
        <div className="row">
          <strong>Subtotal</strong>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        {user && (
          <>
            <label>
              Endereço de entrega
              <select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                <option value="">Selecione...</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label ? `${a.label} — ` : ''}
                    {a.street}, {a.number}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pagamento
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="PIX">Pix</option>
                <option value="CREDIT_CARD">Cartão de crédito</option>
                <option value="DEBIT_CARD">Cartão de débito</option>
                <option value="CASH">Dinheiro</option>
              </select>
            </label>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button onClick={checkout} disabled={busy} style={{ width: '100%', marginTop: 8 }}>
          {busy ? 'Enviando...' : user ? 'Fazer pedido' : 'Entrar para pedir'}
        </button>
      </div>
    </div>
  );
}

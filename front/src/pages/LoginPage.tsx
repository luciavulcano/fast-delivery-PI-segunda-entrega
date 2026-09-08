import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('mariana@fastdelivery.dev');
  const [password, setPassword] = useState('senha123');
  const [role, setRole] = useState('CLIENT');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <div className="row" style={{ marginBottom: 16 }}>
          <button className={mode === 'login' ? '' : 'ghost'} onClick={() => setMode('login')}>
            Entrar
          </button>
          <button
            className={mode === 'register' ? '' : 'ghost'}
            onClick={() => setMode('register')}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Nome
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {mode === 'register' && (
            <label>
              Perfil
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="CLIENT">Cliente</option>
                <option value="MERCHANT">Estabelecimento</option>
                <option value="COURIER">Entregador</option>
              </select>
            </label>
          )}
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
            {busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 12 }}>
          Conta de teste: mariana@fastdelivery.dev / senha123
        </p>
      </div>
    </div>
  );
}

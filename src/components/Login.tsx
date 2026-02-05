import { useState } from 'react';
import './Components.css';
import { Lock, User, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (status: boolean) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for better UX feel
    setTimeout(() => {
        if (username === 'financeiro' && password === 'Provida@2025') {
            onLogin(true);
        } else {
            setError('Credenciais inválidas. Tente novamente.');
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
            <div className="logo-area" style={{marginBottom: '24px'}}>
                <img 
                    src="https://grupoprovida.com.br/wp-content/uploads/2025/04/logo1-1.webp" 
                    alt="Grupo PróVida" 
                    className="login-logo"
                    style={{height: '80px'}}
                />
            </div>
            <h2 style={{margin: '0 0 8px 0', fontSize: '1.5rem'}}>Acesso Restrito</h2>
            <p style={{color: '#94a3b8', fontSize: '0.9rem', margin: 0}}>Dashboard Financeiro & Estratégico</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input 
              type="text" 
              placeholder="Usuário" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              autoFocus
            />
          </div>
          
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input 
              type="password" 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Autenticando...' : (
                <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                    Entrar <ArrowRight size={16} />
                </span>
            )}
          </button>
        </form>
        
        <div className="login-footer">
            <p>© 2026 Grupo PróVida - Tecnologia & Inovação</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

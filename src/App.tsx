import { useState } from 'react';
import { LayoutDashboard, Building2, TrendingDown, LineChart as ChartIcon, Calendar, LogOut } from 'lucide-react';
import './App.css';
import MasterView from './components/MasterView';
import UnitView from './components/UnitView';
import ExpenseView from './components/ExpenseView';
import AnalyticsView from './components/AnalyticsView';
import Login from './components/Login';
import financeData from './data/financeData.json';

// Types
export interface FinancialData {
  meta?: {
    period: string;
    generatedAt: string;
  };
  consolidated: UnitData;
  units: UnitData[];
}

export interface UnitData {
  id: string;
  name: string;
  revenue: number;
  ebitda: number;
  netProfit: number;
  expenses: ExpenseItem[];
}

export interface ExpenseItem {
  category: string;
  value: number;
  percentOfRevenue: number;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('provida_auth') === 'true';
  });
  
  const [activeTab, setActiveTab] = useState<'master' | 'unit' | 'expenses' | 'analytics'>('master');
  const [data] = useState<FinancialData>(financeData);

  const handleLogin = (status: boolean) => {
    if (status) {
        setIsAuthenticated(true);
        localStorage.setItem('provida_auth', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('provida_auth');
    setActiveTab('master'); // Reset tab
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <nav className="sidebar glass-panel">
        <div className="logo" style={{justifyContent: 'center', padding: '16px 0'}}>
          <img 
            src="https://grupoprovida.com.br/wp-content/uploads/2025/04/logo1-1.webp" 
            alt="Grupo PróVida" 
            style={{height: '45px', objectFit: 'contain'}}
          />
        </div>
        
        <ul className="nav-links">
          <li 
            className={activeTab === 'master' ? 'active' : ''} 
            onClick={() => setActiveTab('master')}
          >
            <LayoutDashboard size={20} />
            <span>Consolidado</span>
          </li>
          <li 
            className={activeTab === 'unit' ? 'active' : ''} 
            onClick={() => setActiveTab('unit')}
          >
            <Building2 size={20} />
            <span>Unidades</span>
          </li>
          <li 
            className={activeTab === 'expenses' ? 'active' : ''} 
            onClick={() => setActiveTab('expenses')}
          >
            <TrendingDown size={20} />
            <span>Despesas</span>
          </li>
          <li 
            className={activeTab === 'analytics' ? 'active' : ''} 
            onClick={() => setActiveTab('analytics')}
          >
            <ChartIcon size={20} />
            <span>Análise Avançada</span>
          </li>
        </ul>

        <div style={{marginTop: 'auto', padding: '16px'}}>
            <button 
                onClick={handleLogout}
                className="btn-toggle" 
                style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)'}}
            >
                <LogOut size={18} />
                <span>Sair</span>
            </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="top-bar">
          <h1 className="page-title">
            {activeTab === 'master' && 'Visão Consolidada'}
            {activeTab === 'unit' && 'Detalhamento por Unidade'}
            {activeTab === 'expenses' && 'Análise Cruzada de Despesas'}
            {activeTab === 'analytics' && 'Inteligência e Eficiência'}
          </h1>
          
          <div style={{display: 'flex', gap: '16px'}}>
            <div className="glass-panel" style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '50px'}}>
              <Calendar size={16} color="var(--color-secondary)" />
              <span style={{fontSize: '0.85rem', color: '#cbd5e1'}}>Competência: <strong style={{color: 'var(--color-primary)'}}>{data.meta?.period || 'Junho/2025'}</strong></span>
            </div>

            <div className="user-profile glass-panel">
              <div className="avatar" style={{background: 'var(--color-secondary)'}}>JS</div>
              <span>Jonas Spezia</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'master' && <MasterView data={data} />}
          {activeTab === 'unit' && <UnitView data={data} />}
          {activeTab === 'expenses' && <ExpenseView data={data} />}
          {activeTab === 'analytics' && <AnalyticsView data={data} />}
        </div>
      </main>
    </div>
  );
}

export default App;

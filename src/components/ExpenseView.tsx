import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { FinancialData } from '../App';
import { ChevronDown } from 'lucide-react';
import './Components.css';
import './UnitView.css'; // Reusing selector styles

interface ExpenseViewProps {
  data: FinancialData;
}

const ExpenseView = ({ data }: ExpenseViewProps) => {
  // Get all unique expense categories
  const categories = useMemo(() => {
    const all = new Set<string>();
    data.units.forEach(u => u.expenses.forEach(e => all.add(e.category)));
    return Array.from(all).sort();
  }, [data]);

  const [selectedCategory, setSelectedCategory] = useState<string>(categories.find(c => c.includes('PESSOAL')) || categories[0]);

  // Transform data for chart
  const chartData = useMemo(() => {
    return data.units.map(u => ({
      name: u.name,
      value: u.expenses.find(e => e.category === selectedCategory)?.value || 0
    })).sort((a, b) => b.value - a.value);
  }, [data, selectedCategory]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="view-container">
      <div className="unit-selector glass-panel">
          <label>Selecione a Conta de Despesa:</label>
          <div className="select-wrapper">
            <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="unit-select"
            >
                {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
            <ChevronDown size={16} className="select-icon" />
          </div>
       </div>

       <div className="glass-panel chart-container" style={{ height: '600px' }}>
          <h3 className="chart-title">Comparativo: {selectedCategory}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{fill: '#94a3b8', fontSize: 11}} 
                interval={0} 
                angle={-45} 
                textAnchor="end" 
              />
              <YAxis 
                tick={{fill: '#94a3b8', fontSize: 11}} 
                tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                formatter={((value: any) => formatCurrency(value)) as any}
              />
              <Legend />
              <Bar dataKey="value" name={selectedCategory} fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
};

export default ExpenseView;

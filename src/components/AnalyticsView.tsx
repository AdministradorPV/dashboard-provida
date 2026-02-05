import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, BarChart, Bar, Legend, ComposedChart, Line } from 'recharts';
import type { FinancialData } from '../App';
import { AlertCircle, TrendingUp, PieChart as PieIcon, Layers, Users, Activity, AlertTriangle } from 'lucide-react';
import './Components.css';

interface AnalyticsViewProps {
  data: FinancialData;
}

const AnalyticsView = ({ data }: AnalyticsViewProps) => {
  const [metric, setMetric] = useState<'value' | 'percent'>('percent');

  // --- 1. HEATMAP PREPARATION ---
  const categories = useMemo(() => {
    const set = new Set<string>();
    data.units.forEach(u => u.expenses.forEach(e => set.add(e.category)));
    return Array.from(set).sort();
  }, [data]);

  const heatmapData = useMemo(() => {
    return data.units.map(u => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any = { name: u.name, id: u.id };
      categories.forEach(cat => {
        const exp = u.expenses.find(e => e.category === cat);
        row[cat] = exp ? (metric === 'percent' ? exp.percentOfRevenue : exp.value) : 0;
      });
      return row;
    });
  }, [data, categories, metric]);

  const averages = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avgs: any = {};
    categories.forEach(cat => {
      const sum = heatmapData.reduce((acc, row) => acc + (row[cat] || 0), 0);
      avgs[cat] = sum / heatmapData.length;
    });
    return avgs;
  }, [categories, heatmapData]);

  // --- 2. SCATTER PLOT PREPARATION ---
  const scatterData = useMemo(() => {
    return data.units.map(u => ({
      x: u.revenue,
      y: (u.ebitda / u.revenue) * 100,
      z: u.ebitda,
      name: u.name
    }));
  }, [data]);

  // --- 3. COST STRUCTURE (STACKED BAR) PREPARATION ---
  const costStructureData = useMemo(() => {
    return data.units.map(u => {
      let repasse = 0;
      let pessoal = 0;
      let impostos = 0;
      let adm = 0;

      u.expenses.forEach(e => {
        const cat = e.category.toUpperCase();
        if (cat.includes('REPASSE')) repasse += e.value;
        else if (cat.includes('PESSOAL')) pessoal += e.value;
        else if (cat.includes('IMPOSTOS')) impostos += e.value;
        else adm += e.value;
      });

      // Normalize to 100% of Expenses (Profile of Spending)
      const totalExpenses = repasse + pessoal + impostos + adm;
      
      return {
        name: u.name,
        repasse: (repasse / totalExpenses) * 100,
        pessoal: (pessoal / totalExpenses) * 100,
        impostos: (impostos / totalExpenses) * 100,
        adm: (adm / totalExpenses) * 100
      };
    }).sort((a, b) => b.repasse - a.repasse); // Sort by Repasse dependency
  }, [data]);

  // --- 4. PARETO (CONCENTRATION) PREPARATION ---
  const paretoData = useMemo(() => {
    const sorted = [...data.units].sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = sorted.reduce((acc, u) => acc + u.revenue, 0);
    
    const result = [];
    let currentTotal = 0;
    for (const u of sorted) {
      currentTotal += u.revenue;
      result.push({
        name: u.name,
        revenue: u.revenue,
        accumulatedPct: (currentTotal / totalRevenue) * 100
      });
    }
    return result;
  }, [data]);


  // Helpers
  const formatValue = (val: number) => {
    if (metric === 'percent') return val.toFixed(1) + '%';
    if (val > 1000) return (val/1000).toFixed(1) + 'k';
    return val.toFixed(0);
  };

  const getCellColor = (val: number, avg: number) => {
    if (val === 0) return 'rgba(255,255,255,0.02)';
    const ratio = val / avg;
    if (ratio > 1.2) return 'rgba(239, 68, 68, 0.4)';
    if (ratio > 1.0) return 'rgba(239, 68, 68, 0.2)';
    if (ratio < 0.8) return 'rgba(16, 185, 129, 0.2)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  return (
    <div className="view-container">
        
        {/* ROW 1: Scatter & Pareto */}
        <div className="grid-2">
            {/* Quadrant Analysis */}
            <div className="glass-panel chart-container" style={{height: '450px'}}>
                <div className="flex-header">
                    <h3 className="chart-title"><TrendingUp size={18} style={{marginRight:8}}/> Matriz de Eficiência</h3>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" dataKey="x" name="Receita" unit="R$" tickFormatter={(v) => (v/1000).toFixed(0)+'k'} stroke="#94a3b8" fontSize={12} />
                        <YAxis type="number" dataKey="y" name="Margem EBITDA" unit="%" stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="custom-tooltip">
                                            <p className="tooltip-title">{d.name}</p>
                                            <p className="tooltip-item revenue">Rec: R$ {d.x.toLocaleString('pt-BR')}</p>
                                            <p className="tooltip-item profit">Margem: {d.y.toFixed(1)}%</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Alerta < 20%', position: 'insideBottomRight', fill: '#ef4444', fontSize: 10 }} />
                        <Scatter name="Unidades" data={scatterData} fill="#8884d8">
                            {scatterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.y < 20 ? '#ef4444' : (entry.x > 200000 ? '#3b82f6' : '#a855f7')} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Pareto Analysis */}
            <div className="glass-panel chart-container" style={{height: '450px'}}>
                <div className="flex-header">
                     <h3 className="chart-title"><PieIcon size={18} style={{marginRight:8}}/> Concentração de Risco (Pareto)</h3>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={paretoData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} stroke="#94a3b8" fontSize={10} />
                        <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => (v/1000).toFixed(0)+'k'} />
                        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} unit="%" />
                        <Tooltip 
                             contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                             formatter={((value: any, name: any) => {
                                 if (name === 'accumulatedPct') return [Number(value).toFixed(1) + '%', 'Acumulado'];
                                 return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)), 'Receita'];
                             }) as any}
                        />
                        <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="accumulatedPct" stroke="#f59e0b" strokeWidth={2} dot={{r:3}} />
                        <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '80%', position: 'right', fill: '#ef4444', fontSize: 10 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* ROW 2: Cost Structure */}
        <div className="glass-panel chart-container" style={{height: '400px', marginBottom: '32px'}}>
             <div className="flex-header">
                <h3 className="chart-title"><Layers size={18} style={{marginRight:8}}/> Perfil de Despesas (Quem tem o modelo mais pesado?)</h3>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costStructureData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }} stackOffset="expand">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-45} textAnchor="end" height={60}/>
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => (v*100).toFixed(0) + '%'}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={((value: any) => Number(value).toFixed(1) + '%') as any}
                    />
                    <Legend iconSize={10} wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                    <Bar dataKey="repasse" name="Repasse Médico" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="pessoal" name="Pessoal (Folha)" stackId="a" fill="#ec4899" />
                    <Bar dataKey="impostos" name="Impostos" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="adm" name="Adm & Fixos" stackId="a" fill="#64748b" />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* ROW 3: Operational Diagnosis (New) */}
        <OperationalDiagnosis data={data} />

        {/* ROW 4: Heatmap */}
        <div className="glass-panel table-container">
            <div className="flex-header" style={{ marginBottom: '20px'}}>
                <h3 className="chart-title" style={{margin:0}}>Heatmap de Anomalias de Custo</h3>
                <div style={{display: 'flex', gap: '8px'}}>
                    <button 
                        onClick={() => setMetric('percent')}
                        className={`btn-toggle ${metric === 'percent' ? 'active' : ''}`}
                    >
                        % da Receita
                    </button>
                    <button 
                        onClick={() => setMetric('value')}
                        className={`btn-toggle ${metric === 'value' ? 'active' : ''}`}
                    >
                        Valor (R$)
                    </button>
                </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#94a3b8'}}>
                <AlertCircle size={14} />
                <span>Células vermelhas indicam unidades gastando ACIMA da média.</span>
            </div>
            
            <div className="heatmap-scroll">
                <table className="data-table heatmap-table">
                    <thead>
                        <tr>
                            <th className="sticky-col">Unidade</th>
                            {categories.map(cat => (
                                <th key={cat} style={{fontSize: '0.75rem', whiteSpace: 'nowrap'}}>{cat.replace('DESPESAS ', '').replace('COM ', '')}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {heatmapData.map((row) => (
                            <tr key={row.id}>
                                <td className="sticky-col name-col">{row.name}</td>
                                {categories.map(cat => (
                                    <td 
                                        key={cat} 
                                        style={{
                                            background: getCellColor(row[cat], averages[cat]),
                                            textAlign: 'center',
                                            fontSize: '0.8rem'
                                        }}
                                        title={`Média do Grupo: ${formatValue(averages[cat])}`}
                                    >
                                        {formatValue(row[cat])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

const OperationalDiagnosis = ({ data }: { data: FinancialData }) => {
    // Calculate Personnel ROI and Grouping
    const diagnosisData = useMemo(() => {
        const units = data.units.map(u => {
            const personnelExp = u.expenses.find(e => e.category.includes('PESSOAL'))?.value || 0;
            const roi = personnelExp > 0 ? u.revenue / personnelExp : 0;
            const margin = u.revenue > 0 ? (u.ebitda / u.revenue) * 100 : 0;
            return { ...u, personnelRoi: roi, margin };
        });

        // Filter out zero-revenue units for meaningful averages, or include them as drag
        const activeUnits = units.filter(u => u.revenue > 0);
        
        const avgRev = activeUnits.length ? activeUnits.reduce((acc, u) => acc + u.revenue, 0) / activeUnits.length : 0;
        const avgMargin = activeUnits.length ? activeUnits.reduce((acc, u) => acc + u.margin, 0) / activeUnits.length : 0;

        // Sort by Efficiency
        const efficiencyRanking = [...units].sort((a, b) => b.personnelRoi - a.personnelRoi);

        // Buckets (Safe comparison)
        const buckets = {
            leaders: units.filter(u => u.revenue >= avgRev && u.margin >= avgMargin),
            potentials: units.filter(u => u.revenue < avgRev && u.margin >= avgMargin),
            scaleup: units.filter(u => u.revenue >= avgRev && u.margin < avgMargin),
            critical: units.filter(u => u.revenue < avgRev && u.margin < avgMargin)
        };

        return { efficiencyRanking, buckets };
    }, [data]);

    return (
        <div style={{ marginBottom: '32px' }}>
            <h3 className="chart-title" style={{marginBottom: '16px'}}>Diagnóstico Operacional & Clusters</h3>
            <div className="grid-2-1" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                
                {/* Personnel Efficiency Chart */}
                <div className="glass-panel chart-container" style={{height: '350px'}}>
                    <div className="flex-header">
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <Users size={18} className="text-blue-400"/>
                            <h4 style={{fontSize: '0.95rem', margin:0}}>Eficiência de Pessoal</h4>
                        </div>
                        <span style={{fontSize:'0.75rem', color: '#94a3b8'}}>Faturamento por R$ 1 de Folha</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={diagnosisData.efficiencyRanking} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" stroke="#94a3b8" fontSize={10} hide />
                            <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" fontSize={10} />
                            <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                formatter={((value: any) => [Number(value).toFixed(2) + 'x', 'Multiplicador']) as any}
                            />
                            <Bar dataKey="personnelRoi" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12}>
                                {diagnosisData.efficiencyRanking.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.personnelRoi > 10 ? '#10b981' : (entry.personnelRoi < 4 ? '#ef4444' : '#3b82f6')} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Strategic Buckets Grid */}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', minHeight: '350px'}}>
                    
                    {/* Quadrant 1: Leaders */}
                    <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', borderLeft: '3px solid #10b981', padding: '16px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', color:'#10b981'}}>
                            <Activity size={18} />
                            <h4 style={{fontSize: '0.9rem', margin:0, fontWeight:600}}>Líderes</h4>
                        </div>
                        <p style={{fontSize:'0.75rem', color:'#94a3b8', marginBottom:'12px', lineHeight: '1.4'}}>Alta Receita & Alta Margem. <br/>As "estrelas" da rede.</p>
                        <div className="bucket-list">
                            {diagnosisData.buckets.leaders.map(u => (
                                <span key={u.id} className="bucket-tag">{u.name}</span>
                            ))}
                        </div>
                    </div>

                    {/* Quadrant 2: High Potential (Efficiency) */}
                    <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', borderLeft: '3px solid #3b82f6', padding: '16px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', color:'#3b82f6'}}>
                            <TrendingUp size={18} />
                            <h4 style={{fontSize: '0.9rem', margin:0, fontWeight:600}}>Alta Eficiência</h4>
                        </div>
                         <p style={{fontSize:'0.75rem', color:'#94a3b8', marginBottom:'12px', lineHeight: '1.4'}}>Baixa Receita, mas Alta Margem. <br/>Modelos enxutos para replicar.</p>
                        <div className="bucket-list">
                             {diagnosisData.buckets.potentials.map(u => (
                                <span key={u.id} className="bucket-tag">{u.name}</span>
                            ))}
                        </div>
                    </div>

                     {/* Quadrant 3: Scale Up (Warning) */}
                     <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', borderLeft: '3px solid #f59e0b', padding: '16px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', color:'#f59e0b'}}>
                            <AlertCircle size={18} />
                            <h4 style={{fontSize: '0.9rem', margin:0, fontWeight:600}}>Alerta de Margem</h4>
                        </div>
                         <p style={{fontSize:'0.75rem', color:'#94a3b8', marginBottom:'12px', lineHeight: '1.4'}}>Alta Receita, mas Baixa Margem. <br/>Risco de operação inchada.</p>
                        <div className="bucket-list">
                             {diagnosisData.buckets.scaleup.map(u => (
                                <span key={u.id} className="bucket-tag">{u.name}</span>
                            ))}
                        </div>
                    </div>

                     {/* Quadrant 4: Critical */}
                     <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', borderLeft: '3px solid #ef4444', padding: '16px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', color:'#ef4444'}}>
                            <AlertTriangle size={18} />
                            <h4 style={{fontSize: '0.9rem', margin:0, fontWeight:600}}>Em Observação</h4>
                        </div>
                         <p style={{fontSize:'0.75rem', color:'#94a3b8', marginBottom:'12px', lineHeight: '1.4'}}>Baixo Faturamento & Baixa Margem. <br/>Necessitam revisão urgente.</p>
                        <div className="bucket-list">
                             {diagnosisData.buckets.critical.map(u => (
                                <span key={u.id} className="bucket-tag">{u.name}</span>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import type { FinancialData } from "../App";
import KPICard from "./KPICard";
import { Briefcase, TrendingUp, DollarSign } from "lucide-react";
import "./Components.css";

interface MasterViewProps {
  data: FinancialData;
}

const MasterView = ({ data }: MasterViewProps) => {
  const { consolidated, units } = data;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const calculateMargin = (ebitda: number, revenue: number) => {
    if (revenue === 0) return "0%";
    return ((ebitda / revenue) * 100).toFixed(2) + "%";
  };

  // Prepare chart data
  const revenueByUnit = units
    .map((u) => ({
      name: u.name,
      value: u.revenue,
    }))
    .sort((a, b) => b.value - a.value);

  const ebitdaByUnit = units
    .map((u) => ({
      name: u.name,
      value: u.ebitda,
    }))
    .sort((a, b) => b.value - a.value);

  // Expenses for Table
  // We need to group expenses for the consolidated view properly
  // The data provided in JSON already has aggregated expenses in `consolidated.expenses`

  // Sort expenses by value desc
  const sortedExpenses = [...consolidated.expenses].sort(
    (a, b) => b.value - a.value,
  );

  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#06b6d4",
    "#6366f1",
  ];

  return (
    <div className="view-container">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          label="Receita Total"
          value={formatCurrency(consolidated.revenue)}
          icon={DollarSign}
          color="#3b82f6"
        />
        <KPICard
          label="EBITDA"
          value={formatCurrency(consolidated.ebitda)}
          subtext={`Margem: ${calculateMargin(consolidated.ebitda, consolidated.revenue)}`}
          icon={TrendingUp}
          color="#10b981"
        />
        <KPICard
          label="Lucro Líquido"
          value={formatCurrency(consolidated.netProfit)}
          icon={Briefcase}
          color="#f59e0b"
        />
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="glass-panel chart-container">
          <h3 className="chart-title">Participação na Receita</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revenueByUnit}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {revenueByUnit.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#f8fafc",
                }}
                itemStyle={{ color: "#f8fafc" }}
                labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
                formatter={
                  ((value: any) => formatCurrency(Number(value))) as any
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          className="glass-panel chart-container"
          style={{ height: "800px" }}
        >
          <h3 className="chart-title">Comparativo de EBITDA</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ebitdaByUnit}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barSize={20}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
                horizontal={false}
              />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#f8fafc",
                }}
                itemStyle={{ color: "#f8fafc" }}
                labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
                formatter={
                  ((value: any) => formatCurrency(Number(value))) as any
                }
              />
              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                {ebitdaByUnit.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.value < 0 ? "#ef4444" : "#10b981"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consolidated Table (DRE Macro) */}
      <div className="glass-panel table-container">
        <h3 className="chart-title">DRE Consolidado (Grupo)</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Conta</th>
              <th style={{ textAlign: "right" }}>Valor (R$)</th>
              <th style={{ textAlign: "right" }}>AV (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="row-highlight">
              <td>Receita Bruta</td>
              <td style={{ textAlign: "right" }}>
                {formatCurrency(consolidated.revenue)}
              </td>
              <td style={{ textAlign: "right" }}>100,00%</td>
            </tr>
            {sortedExpenses.map((exp, i) => (
              <tr key={i}>
                <td>{exp.category}</td>
                <td style={{ textAlign: "right" }}>
                  {formatCurrency(exp.value)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {exp.percentOfRevenue.toFixed(2)}%
                </td>
              </tr>
            ))}
            <tr
              className="row-highlight"
              style={{
                borderTop: "2px solid rgba(245,158,11,0.5)",
                fontSize: "1rem",
                color: "#f59e0b",
              }}
            >
              <td style={{ fontWeight: 700 }}>RESULTADO LÍQUIDO</td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>
                {formatCurrency(consolidated.netProfit)}
              </td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>
                {(
                  (consolidated.netProfit / consolidated.revenue) *
                  100
                ).toFixed(2)}
                %
              </td>
            </tr>
            <tr
              className="row-highlight positive"
              style={{
                borderTop: "2px solid rgba(16,185,129,0.5)",
                fontSize: "1rem",
              }}
            >
              <td style={{ fontWeight: 700 }}>EBITDA</td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>
                {formatCurrency(consolidated.ebitda)}
              </td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>
                {calculateMargin(consolidated.ebitda, consolidated.revenue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterView;

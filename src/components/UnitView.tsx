import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FinancialData } from "../App";
import KPICard from "./KPICard";
import { ChevronDown, DollarSign, Target, Activity } from "lucide-react";
import "./Components.css";
import "./UnitView.css";

interface UnitViewProps {
  data: FinancialData;
}

const UnitView = ({ data }: UnitViewProps) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    data.units[0]?.id || "",
  );

  const selectedUnit = useMemo(
    () => data.units.find((u) => u.id === selectedUnitId) || data.units[0],
    [selectedUnitId, data],
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const calculateContribution = (unitEbitda: number, totalEbitda: number) => {
    if (totalEbitda === 0) return "0%";
    return ((unitEbitda / totalEbitda) * 100).toFixed(1) + "%";
  };

  // Top 5 expenses for chart
  const topExpenses = [...selectedUnit.expenses]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((e) => ({
      name: e.category.replace("DESPESAS ", "").replace("COM ", ""),
      value: e.value,
    }));

  return (
    <div className="view-container">
      <div className="unit-selector glass-panel">
        <label>Selecione a Unidade:</label>
        <div className="select-wrapper">
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="unit-select"
          >
            {data.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="select-icon" />
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard
          label="Receita Unidade"
          value={formatCurrency(selectedUnit.revenue)}
          icon={DollarSign}
          color="#3b82f6"
        />
        <KPICard
          label="Contribuição Grupo"
          value={calculateContribution(
            selectedUnit.ebitda,
            data.consolidated.ebitda,
          )}
          subtext="do EBITDA Total"
          icon={Target}
          color="#8b5cf6"
        />
        <KPICard
          label="Margem EBITDA"
          value={
            ((selectedUnit.ebitda / selectedUnit.revenue) * 100).toFixed(1) +
            "%"
          }
          icon={Activity}
          color="#10b981"
        />
      </div>

      <div className="grid-2">
        {/* DRE Detail */}
        <div className="glass-panel table-container full-width-mobile">
          <h3 className="chart-title">DRE - {selectedUnit.name}</h3>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th style={{ textAlign: "right" }}>Valor (R$)</th>
                  <th style={{ textAlign: "right" }}>% Rec</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-highlight">
                  <td>Receita Bruta</td>
                  <td style={{ textAlign: "right" }}>
                    {formatCurrency(selectedUnit.revenue)}
                  </td>
                  <td style={{ textAlign: "right" }}>100,00%</td>
                </tr>
                {selectedUnit.expenses.map((exp, i) => (
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
                  className="row-highlight positive"
                  style={{
                    borderTop: "2px solid rgba(16,185,129,0.5)",
                    fontSize: "1rem",
                  }}
                >
                  <td style={{ fontWeight: 700 }}>EBITDA</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {formatCurrency(selectedUnit.ebitda)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {(
                      (selectedUnit.ebitda / selectedUnit.revenue) *
                      100
                    ).toFixed(2)}
                    %
                  </td>
                </tr>
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
                    {formatCurrency(selectedUnit.netProfit)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {(
                      (selectedUnit.netProfit / selectedUnit.revenue) *
                      100
                    ).toFixed(2)}
                    %
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Chart */}
        <div className="glass-panel chart-container full-width-mobile">
          <h3 className="chart-title">Principais Despesas</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topExpenses}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
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
                width={120}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                interval={0}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#f8fafc",
                }}
                formatter={((value: any) => formatCurrency(value)) as any}
              />
              <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UnitView;

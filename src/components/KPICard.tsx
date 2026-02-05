import type { LucideIcon } from 'lucide-react';
import './Components.css';
import type { CSSProperties } from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  color?: string;
}

const KPICard = ({ label, value, subtext, icon: Icon, color = '#94a3b8' }: KPICardProps) => {
  return (
    <div className="glass-panel kpi-card" style={{ '--kpi-color': color } as CSSProperties}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="kpi-label">{label}</span>
        {Icon && <Icon size={20} color={color} />}
      </div>
      <div className="kpi-value">{value}</div>
      {subtext && <div className="kpi-subtext">{subtext}</div>}
    </div>
  );
};

export default KPICard;

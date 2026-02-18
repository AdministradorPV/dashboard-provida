# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server (Vite, porta 5173)
npm run build      # TypeScript check + Vite build (gera dist/)
npm run lint       # ESLint
npm run preview    # Preview do build de produção

node generate_data.js   # Processa planilha Excel → src/data/financeData.json
```

Não há testes automatizados configurados neste projeto.

## Architecture

SPA React 19 + TypeScript, bundled com Vite. **Sem backend** — todos os dados são um JSON estático importado diretamente no bundle.

### Fluxo de dados

```
Planilha Excel (.xlsx)
    ↓ node generate_data.js
src/data/financeData.json   ← importado como módulo estático
    ↓
App.tsx (estado global com useState)
    ↓ props
Componentes de view
```

O arquivo `generate_data.js` lê uma planilha local (caminho hardcoded no script), extrai receita, EBITDA, lucro líquido e despesas por aba (cada aba = uma unidade), e escreve o JSON. Para atualizar o período financeiro, edite o caminho do arquivo no script, execute-o, e faça commit do novo `financeData.json`.

### Tipos principais (`App.tsx`)

```typescript
FinancialData = { meta: { period, generatedAt }, consolidated: UnitData, units: UnitData[] }
UnitData      = { id, name, revenue, ebitda, netProfit, expenses: ExpenseItem[] }
ExpenseItem   = { category, value, percentOfRevenue }
```

Todas as views recebem `data: FinancialData` via props. Não há Context, Redux ou outro gerenciamento de estado global — o estado vive inteiramente em `App.tsx`.

### Componentes (`src/components/`)

| Componente | Responsabilidade |
|---|---|
| `Login.tsx` | Tela de autenticação frontend-only (credenciais hardcoded) |
| `MasterView.tsx` | Visão consolidada: KPIs, gráfico de pizza, comparativo EBITDA por unidade, DRE macro |
| `UnitView.tsx` | DRE detalhado por unidade (seletor dropdown) + top 5 despesas |
| `ExpenseView.tsx` | Análise cruzada: comparativo de uma categoria de despesa entre todas as unidades |
| `AnalyticsView.tsx` | Inteligência avançada: scatter Receita×Margem, Pareto, perfil de despesas empilhado, heatmap de anomalias, clusters estratégicos |
| `KPICard.tsx` | Card de métrica reutilizável (label, valor, ícone, cor) |

### Estilo

CSS global em `src/index.css` e `src/App.css`. Estilos de componentes em `src/components/Components.css` e `src/components/UnitView.css`. Usa variáveis CSS (`--color-primary`, `--color-secondary`) e classes utilitárias como `.glass-panel`, `.grid-2`, `.kpi-grid`, `.chart-container`.

### Autenticação

Frontend-only com `localStorage`. Credenciais hardcoded em `Login.tsx`. Não é segura para produção real — é uma barreira de acesso superficial.

### Deploy

Push para `master` → GitHub Actions (`/.github/workflows/deploy.yml`) → build Docker multi-stage → push da imagem para GHCR (`ghcr.io/administradorpv/dashboard-provida:master`).

Produção: Docker Swarm via `dashboard-stack.yml`, servindo Nginx na porta 80, com Traefik como reverse proxy/SSL em `dashboard.grupoprovida.online`.

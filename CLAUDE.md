# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server (Vite, porta 5173)
npm run build      # TypeScript check + Vite build (gera dist/)
npm run lint       # ESLint
npm run preview    # Preview do build de produção

node generate_data.js      # Processa planilha Junho/2025 → src/data/financeData.json
node update_jan2026.js     # Processa "resultado janeiro 2026.xls" → atualiza Janeiro/2026 no JSON
```

Não há testes automatizados configurados neste projeto.

## Architecture

SPA React 19 + TypeScript, bundled com Vite. **Sem backend** — todos os dados são um JSON estático importado diretamente no bundle.

### Fluxo de dados

```
Planilha Excel (.xlsx/.xls)
    ↓ node generate_data.js  (Junho/2025)
    ↓ node update_jan2026.js (Janeiro/2026)
src/data/financeData.json   ← array de períodos, importado como módulo estático
    ↓
App.tsx (estado global com useState)
    ↓ props
Componentes de view
```

`financeData.json` é um **array de períodos** (multi-período). Cada entrada tem `meta.period` (ex: `"Janeiro/2026"`), `consolidated` e `units`.

### Scripts de importação de dados

| Script | Planilha | Formato |
|---|---|---|
| `generate_data.js` | Planilha Junho/2025 | Valores na coluna 3, categorias sem prefixo numérico, nome de aba = nome da unidade |
| `update_jan2026.js` | `resultado janeiro 2026.xls` | Valores na coluna 1, categorias prefixadas (`"01 - Despesas com Pessoal"`), abas com sufixo ` JANEIRO 26`, EBITDA em linha `ebitda` (minúsculo), receita pode ser `RECEITA` ou `RECEITAS` |

Para adicionar um novo período: crie um novo script baseado no formato da planilha, escreva no array de períodos e faça commit do `financeData.json` atualizado.

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

**Atenção:** o repositório pertence à conta `AdministradorPV` no GitHub. Antes de fazer push, verificar conta ativa do gh CLI:

```bash
gh auth switch --user AdministradorPV
git push origin master
```

Após o push, o GitHub Actions faz o build automaticamente. Para atualizar o serviço em produção, acesse o Portainer em `infra.grupoprovida.online` → Services → `dashboard-provida_dashboard` → Update.

### Armadilhas conhecidas

- **Receita zero em algumas unidades**: Algumas abas da planilha usam `RECEITAS` (plural) em vez de `RECEITA`. O `update_jan2026.js` já trata os dois casos — se criar novos scripts, manter essa verificação.
- **EBITDA igual ao netProfit**: Ocorre quando o script não encontra a linha de EBITDA. No formato Janeiro/2026, a linha está no final da planilha com valor `ebitda` em minúsculo — usar `rawCat.toLowerCase() === 'ebitda'`.
- **Coluna de valores**: Junho/2025 usa coluna índice 3; Janeiro/2026 usa coluna índice 1. Verificar o formato antes de criar novos scripts.

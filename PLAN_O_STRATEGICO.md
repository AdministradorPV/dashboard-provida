# 🏛️ Ata de Deliberação do Conselho de Tecnologia (CTO Council)

**Data:** 04 de Fevereiro de 2026  
**Assunto:** Expansão Estratégica do Dashboard Financeiro (ProvidaFin)  
**Participantes:** Jonas Spezia (User), Antigravity (AI Tech Lead)

---

## 1. Avaliação do Cenário Atual (MVP)
O Conselho reconhece o sucesso da entrega da versão v1.0, que estabeleceu:
*   **Arquitetura Sólida:** Frontend em React+Vite com design system premium e responsivo.
*   **Visibilidade Imediata:** A transformação de planilhas estáticas em insights interativos (Master View e Drill-down).
*   **Performance:** Carregamento instantâneo via processamento local de dados (JSON).

## 2. Oportunidades de Expansão (Visão de Produto)
Para elevar o nível estratégico da ferramenta, identificamos 3 pilares de evolução baseados em dados reais:

### Pilar A: Inteligência Temporal (Trend Analysis) 📅
*   **GAP Atual:** O dashboard mostra um snapshot estático (Junho/2025). Finanças são histórias contadas no tempo.
*   **Plano de Ação:** 
    1. Ingerir dados históricos (Jan 2025 - Mai 2025).
    2. Criar KPIs de **MoM (Month-over-Month)** e **YTD (Year-to-Date)**.
    3. **Visualização Proposta:** Gráficos de linha sobrepostos (Receita x Despesa) para identificar tendências de margem.

### Pilar B: Granularidade Operacional (Drill-Down Profundo) 🔍
*   **Descoberta:** Nossa análise dos dados brutos revelou duas colunas de valores distintas para cada unidade, que hoje são somadas.
    *   *Hipótese Técnica:* Coluna 1 parece ser "Estrutura/Clínica" (tem Pessoal) e Coluna 2 "Produção Médica" (tem Repasse).
*   **Plano de Ação:** 
    1. Confirmar a taxonomia dessas colunas.
    2. Implementar **"Análise de Margem por Centro de Custo"**.
    3. Saber se uma unidade dá lucro na operação mas perde no repasse médico (ou vice-versa).

### Pilar C: Benchmarking Inteligente (Cluster Analysis) 📊
*   **Conceito:** Não é justo comparar "Agudo" com "Matriz". Precisamos comparar maçãs com maçãs.
*   **Plano de Ação:**
    1. Agrupar unidades por porte (Pequeno, Médio, Hub).
    2. **Heatmap de Despesas:** Uma matriz visual onde cores quentes indicam unidades que fogem do desvio padrão em contas específicas (ex: quem gasta muito mais luz proporcionalmente?).
    3. **KPI Novo:** `Eficiência Operacional = (Despesa Fixa / Receita Bruta)`.

---

## 3. Roadmap Técnico (Implementação)

### Fase 1: Refinamento Visual & Heatmap (Imediato)
*   **Heatmap de Anomalias:** Criar uma nova visão que cruza `Unidades` x `Categorias de Despesa` e pinta de vermelho desvios > 20% da média.
*   **Top 3 Ofensores:** Card automático destacando: *"A unidade X gastou 40% a mais em Mat. Escritório que a média."*

### Fase 2: Estruturação de Dados (Curto Prazo)
*   Padronizar a entrada de dados para aceitar múltiplos meses (`financeData_2025_05.json`, `financeData_2025_06.json`).
*   Alterar o script ETL (`generate_data.js`) para fazer o *merge* temporal.

### Fase 3: Analytics Preditivo (Longo Prazo)
*   Usar regressão linear simples para projetar o fechamento do ano (Forecast).
*   Simulador de Cenários: *"O que acontece com o EBITDA Global se reduzirmos despesas de pessoal em 5% nas unidades deficitárias?"*

---

## 4. Próximos Passos (Action Items)

1.  **Aprovação:** O usuário concorda com a ingestão de **dados históricos** para habilitar a visão temporal?
2.  **Definição:** Podemos assumir a separação das colunas internas (Operação vs Médica) para criar novos gráficos de composição?

*Assinado,*  
*Antigravity - AI Tech Ops*

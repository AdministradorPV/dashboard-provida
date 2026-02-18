import { readFile, writeFile } from "fs/promises";
import { read, utils } from "xlsx";

const filePath = "./resultado janeiro 2026.xls";
const outputPath = "./src/data/financeData.json";

// Mapeia nomes de categoria do Excel para o padrão do JSON
const CATEGORY_MAP = {
  "01 - Despesas com Pessoal": "DESPESAS COM PESSOAL",
  "02 - Despesas com Clínica Médica": "DESPESAS COM CLINICA MEDICA",
  "03 - Repasse Prestadores Clinica Médica":
    "REPASSE PRESTADORES CLINICA MEDICA",
  "04 - Despesas com Veículos": "DESPESAS COM VEICULOS",
  "05 - Despesas com Aluguéis": "DESPESAS COM ALUGUEIS",
  "06 - Despesas com Vendas": "DESPESAS COM VENDAS",
  "07 - Despesas com Manutenção": "DESPESAS COM MANUTENCAO",
  "08 - Despesas com Utilidades e Serviços":
    "DESPESAS COM UTILIDADES E SERVICOS",
  "09 - Despesas Administrativas": "DESPESAS ADMINISTRATIVAS",
  "10 - Despesas Financeiras": "DESPESAS FINANCEIRAS",
  "18 - Funeral": "FUNERAL",
  "11 - Despesas Impostos e Taxas": "DESPESAS IMPOSTOS E TAXAS",
  "12 - Despesas Impostos sobre receita": "DESPESAS IMPOSTOS SOBRE RECEITA",
  "13 - Despesas Impostos sobre Lucro": "DESPESAS IMPOSTOS SOBRE LUCRO",
  "17 - Investimentos": "INVESTIMENTOS",
};

// Normaliza nome da unidade: remove " JANEIRO 26" do final
function normalizeUnitName(sheetName) {
  return sheetName.replace(/\s+JANEIRO\s+26\s*$/i, "").trim();
}

async function run() {
  try {
    const buf = await readFile(filePath);
    const workbook = read(buf);
    const units = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(sheet, { header: 1, defval: "" });

      let revenue = 0;
      let ebitda = 0;
      let netProfit = 0;
      const expenses = [];

      for (const row of data) {
        const rawCat = (row[0] || "").toString().trim();
        const value = typeof row[1] === "number" ? row[1] : 0;

        if (rawCat === "RECEITA" || rawCat === "RECEITAS") {
          revenue = value;
        } else if (rawCat.toLowerCase() === "ebitda") {
          ebitda = value;
        } else if (rawCat === "Total") {
          netProfit = value;
        } else if (CATEGORY_MAP[rawCat] !== undefined) {
          expenses.push({
            category: CATEGORY_MAP[rawCat],
            value: value,
            percentOfRevenue: 0,
          });
        }
      }

      // Calcula percentuais
      if (revenue > 0) {
        for (const exp of expenses) {
          exp.percentOfRevenue = (exp.value / revenue) * 100;
        }
      }

      const unitId = normalizeUnitName(sheetName);
      units.push({
        id: unitId,
        name: unitId,
        revenue,
        ebitda,
        netProfit,
        expenses,
      });
    }

    // Calcula consolidado
    const expenseMap = {};
    for (const unit of units) {
      for (const exp of unit.expenses) {
        expenseMap[exp.category] = (expenseMap[exp.category] || 0) + exp.value;
      }
    }

    const totalRevenue = units.reduce((acc, u) => acc + u.revenue, 0);
    const consolidated = {
      id: "CONSOLIDADO",
      name: "Consolidado (Grupo)",
      revenue: totalRevenue,
      ebitda: units.reduce((acc, u) => acc + u.ebitda, 0),
      netProfit: units.reduce((acc, u) => acc + u.netProfit, 0),
      expenses: Object.entries(expenseMap).map(([category, value]) => ({
        category,
        value,
        percentOfRevenue: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0,
      })),
    };

    const newPeriod = {
      meta: {
        period: "Janeiro/2026",
        generatedAt: new Date().toISOString(),
      },
      consolidated,
      units,
    };

    // Lê o JSON atual (array de períodos) e substitui Janeiro/2026
    const raw = await readFile(outputPath, "utf8");
    const allPeriods = JSON.parse(raw);
    const idx = allPeriods.findIndex((p) => p.meta?.period === "Janeiro/2026");

    if (idx >= 0) {
      allPeriods[idx] = newPeriod;
      console.log(`✅ Período Janeiro/2026 substituído (índice ${idx})`);
    } else {
      allPeriods.push(newPeriod);
      console.log("✅ Período Janeiro/2026 adicionado ao final");
    }

    await writeFile(outputPath, JSON.stringify(allPeriods, null, 2));
    console.log("📂 Salvo em:", outputPath);
    console.log("\nConsolidado:");
    console.log("  Receita:   R$", consolidated.revenue.toFixed(2));
    console.log("  EBITDA:    R$", consolidated.ebitda.toFixed(2));
    console.log("  Liq.Final: R$", consolidated.netProfit.toFixed(2));
    console.log("\nUnidades:");
    for (const u of units) {
      console.log(
        `  ${u.name.padEnd(30)} ebitda: ${u.ebitda.toFixed(2).padStart(12)} | netProfit: ${u.netProfit.toFixed(2).padStart(12)}`,
      );
    }
  } catch (err) {
    console.error("Erro:", err.message);
    process.exit(1);
  }
}

run();

import { readFile, writeFile } from "fs/promises";
import { read, utils } from "xlsx";

const filePath = "./resultado janeiro 2026.xls";
const outputPath = "./src/data/financeData.json";
const PERIOD = "Janeiro/2026";

// Remove numeric prefix like "01 - " and normalize to UPPERCASE
function normalizeCategory(name) {
  return name
    .replace(/^\d+\s*-\s*/, "") // remove "01 - " prefix
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove accents for consistency
}

async function run() {
  try {
    const buf = await readFile(filePath);
    const workbook = read(buf);

    const units = [];

    workbook.SheetNames.forEach((sheetName) => {
      // Strip period suffix from sheet names (e.g., "AGUDO JANEIRO 26" → "AGUDO")
      const cleanName = sheetName
        .trim()
        .replace(/\s+JANEIRO\s+\d+\s*$/i, "")
        .trim();
      const sheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(sheet, { header: 1, defval: null });

      // Filter to rows with some content
      const rows = data.filter((row) =>
        row.some((c) => c !== null && c !== ""),
      );

      // row[0] = unit title, row[1] = blank, row[2] = header "Geral por Conta" / "Jan"
      // row[3] = RECEITA
      // rows[4..N-2] = expenses (last before "Subtotal Debito")
      // row[N-1] = "Subtotal Debito"
      // row[N]   = "Total"

      let revenue = 0;
      let ebitda = 0;
      let netProfit = 0;
      const expenses = [];

      rows.forEach((row) => {
        const category = (row[0] || "").toString().trim();
        const value = typeof row[1] === "number" ? row[1] : 0;

        if (category === "RECEITA" || category === "RECEITAS") {
          revenue = value;
        } else if (category === "Total") {
          ebitda = value;
          netProfit = value;
        } else if (
          category === "Subtotal Debito" ||
          category === "Subtotal Débito" ||
          category === "Geral por Conta" ||
          category === cleanName ||
          value === null
        ) {
          // skip header, title, and subtotal rows
        } else if (/^\d/.test(category)) {
          // Numbered expense category
          const normalizedName = normalizeCategory(category);
          if (value !== 0) {
            expenses.push({
              category: normalizedName,
              value,
              percentOfRevenue: 0,
            });
          }
        }
      });

      // Calculate percentages
      if (revenue > 0) {
        expenses.forEach((exp) => {
          exp.percentOfRevenue = (exp.value / revenue) * 100;
        });
      }

      units.push({
        id: cleanName,
        name: cleanName,
        revenue,
        ebitda,
        netProfit,
        expenses,
      });
    });

    // Aggregate consolidated
    const expenseMap = {};
    units.forEach((unit) => {
      unit.expenses.forEach((exp) => {
        if (!expenseMap[exp.category]) expenseMap[exp.category] = 0;
        expenseMap[exp.category] += exp.value;
      });
    });

    const consolidatedRevenue = units.reduce((acc, u) => acc + u.revenue, 0);
    const consolidatedEbitda = units.reduce((acc, u) => acc + u.ebitda, 0);
    const consolidatedNetProfit = units.reduce(
      (acc, u) => acc + u.netProfit,
      0,
    );

    const consolidatedExpenses = Object.entries(expenseMap).map(
      ([category, value]) => ({
        category,
        value,
        percentOfRevenue:
          consolidatedRevenue > 0 ? (value / consolidatedRevenue) * 100 : 0,
      }),
    );

    const newPeriod = {
      meta: {
        period: PERIOD,
        generatedAt: new Date().toISOString(),
      },
      consolidated: {
        id: "CONSOLIDADO",
        name: "Consolidado (Grupo)",
        revenue: consolidatedRevenue,
        ebitda: consolidatedEbitda,
        netProfit: consolidatedNetProfit,
        expenses: consolidatedExpenses,
      },
      units,
    };

    // Read existing financeData.json and ensure it is an array
    let existing;
    try {
      const raw = await readFile(outputPath, "utf-8");
      const parsed = JSON.parse(raw);
      existing = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      existing = [];
    }

    // Remove any existing entry for the same period, then append
    const updated = existing.filter((p) => p.meta?.period !== PERIOD);
    updated.push(newPeriod);

    await writeFile(outputPath, JSON.stringify(updated, null, 2));
    console.log(`Data generated for: ${PERIOD}`);
    console.log(`Units: ${units.length}`);
    console.log(
      `Consolidated revenue: R$ ${consolidatedRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    );
    console.log(
      `Consolidated result: R$ ${consolidatedEbitda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    );
    console.log(`Saved to: ${outputPath}`);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();

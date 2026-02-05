import { readFile, writeFile } from 'fs/promises';
import { read, utils } from 'xlsx';
import path from 'path';

const filePath = '/Users/jonasspezia/Documents/projetos/provida/planilhafinanceiro/Provida Resultado mes 06.2025 JONAS (1).xlsx';
const outputPath = './src/data/financeData.json';

async function run() {
  try {
    const buf = await readFile(filePath);
    const workbook = read(buf);
    
    const units = [];

    workbook.SheetNames.forEach(sheetName => {
      // trimmed sheet name
      const cleanName = sheetName.trim();
      const sheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(sheet, { header: 1, range: 0, defval: '' });

      let revenue = 0;
      let ebitda = 0;
      let netProfit = 0;
      const expenses = [];

      data.forEach(row => {
        const category = (row[0] || '').toString().trim();
        // Value is column 3 (index 3) based on inspection
        const value = typeof row[3] === 'number' ? row[3] : 0;

        if (category === 'RECEITA') {
          revenue = value;
        } else if (category === 'EBITDA') {
          ebitda = value;
        } else if (category === 'RESULTADO LIQUIDO FINAL' || category === 'RESULTADO LÍQUIDO FINAL') {
          netProfit = value;
        } else if (category.startsWith('DESPESAS') || category.startsWith('REPASSE')) {
          // Add to expenses breakdown
          expenses.push({
            category: category,
            value: value,
            percentOfRevenue: 0 // Will calculate later if revenue > 0
          });
        }
      });

      // Calculate percentages
      if (revenue > 0) {
        expenses.forEach(exp => {
          exp.percentOfRevenue = (exp.value / revenue) * 100;
        });
      }

      units.push({
        id: cleanName,
        name: cleanName,
        revenue,
        ebitda,
        netProfit,
        expenses
      });
    });

    // Calculate Consolidated
    const consolidated = {
      id: "CONSOLIDADO",
      name: "Consolidado (Grupo)",
      revenue: units.reduce((acc, u) => acc + u.revenue, 0),
      ebitda: units.reduce((acc, u) => acc + u.ebitda, 0),
      netProfit: units.reduce((acc, u) => acc + u.netProfit, 0),
      expenses: [] // Need to aggregate expenses by category
    };

    // Aggregate expenses
    const expenseMap = {};
    units.forEach(unit => {
      unit.expenses.forEach(exp => {
        if (!expenseMap[exp.category]) {
          expenseMap[exp.category] = 0;
        }
        expenseMap[exp.category] += exp.value;
      });
    });

    Object.keys(expenseMap).forEach(key => {
        const val = expenseMap[key];
        consolidated.expenses.push({
            category: key,
            value: val,
            percentOfRevenue: consolidated.revenue > 0 ? (val / consolidated.revenue) * 100 : 0
        });
    });

    // Add consolidated to units list or keep separate?
    // User wants a filter. So maybe just a list of units, and the frontend handles aggregation?
    // But architecture-wise, having columns for "Unidade" and "Consolidado" suggests we treat Consolidated as a special Unit or sum.
    // I'll write a single JSON object.

    // Extract Period from Filename (e.g., "mes 06.2025")
    const filename = path.basename(filePath);
    const dateMatch = filename.match(/mes\s+(\d{2})\.(\d{4})/);
    let period = 'Data Desconhecida';

    if (dateMatch) {
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const monthIndex = parseInt(dateMatch[1], 10) - 1;
      period = `${monthNames[monthIndex]}/${dateMatch[2]}`;
    }

    const finalData = {
      meta: {
        period: period,
        generatedAt: new Date().toISOString()
      },
      consolidated: consolidated,
      units: units
    };

    // Ensure directory exists
    await writeFile(outputPath, JSON.stringify(finalData, null, 2));
    console.log(`✅ Data generated successfully for period: ${period}`);
    console.log(`📂 Saved to: ${outputPath}`);

  } catch (err) {
    console.error('Error generating data:', err);
  }
}

run();

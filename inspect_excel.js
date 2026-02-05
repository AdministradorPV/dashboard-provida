import { readFile } from 'fs/promises';
import { read, utils } from 'xlsx';

const filePath = '/Users/jonasspezia/Documents/projetos/provida/planilhafinanceiro/Provida Resultado mes 06.2025 JONAS (1).xlsx';

async function run() {
  try {
    const buf = await readFile(filePath);
    const workbook = read(buf);
    const sheetName = 'AGUDO'; // Check one sheet fully
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(sheet, { header: 1, range: 0, defval: '' });
    
    data.forEach((row, i) => console.log(`Row ${i}:`, JSON.stringify(row)));
  
  } catch (err) {
    console.error(err);
  }
}

run();

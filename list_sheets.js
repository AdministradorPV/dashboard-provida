import { readFile } from 'fs/promises';
import { read } from 'xlsx';

const filePath = '/Users/jonasspezia/Documents/projetos/provida/planilhafinanceiro/Provida Resultado mes 06.2025 JONAS (1).xlsx';

async function run() {
    try {
        const buf = await readFile(filePath);
        const workbook = read(buf);
        console.log('Total Sheets:', workbook.SheetNames.length);
        console.log('Sheet Names:', JSON.stringify(workbook.SheetNames, null, 2));
    } catch (err) {
        console.error(err);
    }
}
run();

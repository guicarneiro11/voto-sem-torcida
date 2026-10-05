// Rode antes de publicar: `pnpm verificar:lancamento`.
// Falha se ainda houver valores de exemplo na configuração ou no conteúdo.
import { readFileSync } from 'node:fs';

const arquivos = ['src/data/site.ts', 'astro.config.mjs', 'src/data/afirmacoes.json', 'SECURITY.md'];
const proibidos = [/PREENCHER/, /SEU-DOMINIO/, /SEU-EMAIL/, /\[EXEMPLO/];
let falhou = false;

for (const arquivo of arquivos) {
  const texto = readFileSync(arquivo, 'utf8');
  for (const padrao of proibidos) {
    if (padrao.test(texto)) {
      console.error(`✖ ${arquivo}: ainda contém ${padrao}`);
      falhou = true;
    }
  }
}

if (falhou) process.exit(1);
console.log('✓ Configuração pronta para lançamento.');

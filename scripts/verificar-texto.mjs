// Rode depois do build: `pnpm verificar:texto`.
// Procura no HTML final palavras coladas em links/negritos e pontuação sem espaço,
// um problema comum quando o formatador quebra linhas em arquivos .astro.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function htmls(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return htmls(caminho);
    return nome.endsWith('.html') ? [caminho] : [];
  });
}

const letra = 'A-Za-zÀ-ÿ0-9';
const regras = [
  {
    nome: 'palavra colada depois de link ou destaque',
    re: new RegExp(`</(a|strong|em|b|i|code)>[${letra}(]`, 'g'),
  },
  {
    nome: 'palavra colada antes de link ou destaque',
    re: new RegExp(`[${letra}:;,]<(a|strong|em|b|i|code)\\b`, 'g'),
  },
];
const regraTexto = { nome: 'pontuação sem espaço depois', re: /[a-zà-ÿ][.:;,!?][A-ZÀ-Ý][a-zà-ÿ]/g };

let problemas = 0;
for (const arquivo of htmls('dist')) {
  let html = readFileSync(arquivo, 'utf8');
  html = html.slice(html.indexOf('<body')).replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, '');
  const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  for (const { nome, re } of regras) {
    for (const m of html.matchAll(re)) {
      problemas++;
      const trecho = html.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, ' ');
      console.error(`✖ ${arquivo}: ${nome}\n    …${trecho}…`);
    }
  }
  for (const m of texto.matchAll(regraTexto.re)) {
    problemas++;
    console.error(
      `✖ ${arquivo}: ${regraTexto.nome}\n    …${texto.slice(Math.max(0, m.index - 40), m.index + 20)}…`,
    );
  }
}

if (problemas > 0) {
  console.error(
    `\n${problemas} problema(s) de espaçamento encontrado(s). Use {' '} no .astro para forçar o espaço.`,
  );
  process.exit(1);
}
console.log('✓ Nenhum problema de espaçamento no texto publicado.');

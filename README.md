# Voto sem Torcida

**[votosemtorcida.com.br](https://votosemtorcida.com.br)**

Um quiz para o 2º turno da eleição presidencial de 2026: você responde às propostas dos candidatos **sem saber de quem são** e, no final, vê de quem suas opiniões mais se aproximam e onde vocês concordam ou discordam.

Sem cadastro, sem anúncios e sem guardar nenhuma resposta.

## Como funciona

- As propostas vêm dos **planos de governo registrados no TSE**. Cada posição aponta para a página exata do PDF oficial.
- O cálculo segue o modelo do [Wahl-O-Mat](https://www.wahl-o-mat.de/), usado na Alemanha desde 2002: 2 pontos quando sua posição é igual à do candidato, 1 ponto quando uma das duas é neutra ("em partes"), 0 quando são opostas. Propostas marcadas como importantes valem o dobro.
- Cada candidato tem uma nota própria (os percentuais não somam 100%).
- "Tanto faz" não entra no cálculo, e um candidato sem posição sobre um tema não é penalizado por isso.

A explicação completa está na página de [Metodologia](https://votosemtorcida.com.br/metodologia), e todas as posições com suas fontes estão em [Fontes](https://votosemtorcida.com.br/fontes).

## Princípios

**Neutralidade verificada por teste**, não só por boa intenção:

- As regras de justiça do cálculo (simetria, empates, "sem posição" que não penaliza) são testes automáticos em [`src/lib/afinidade.test.ts`](src/lib/afinidade.test.ts).
- Os testes de conteúdo em [`src/data/conteudo.test.ts`](src/data/conteudo.test.ts) garantem que os candidatos têm o mesmo número de posições e que **quem concorda (ou discorda) de tudo termina em empate**, evitando que a redação favoreça um lado.
- Nenhuma cor de partido na interface, e a ordem de exibição em caso de empate é sorteada.

**Privacidade por design:**

- O site é 100% estático, e o cálculo roda no navegador. Nenhuma resposta é enviada ou salva.
- O lint bloqueia `fetch`, `localStorage`, cookies e `sendBeacon`: o código não consegue guardar ou enviar respostas nem por engano.
- Sem cookies, sem analytics no navegador e sem scripts ou fontes de terceiros.

**Segurança:**

- Content Security Policy com hashes, HSTS e demais headers de segurança.
- DNSSEC ativo, commits assinados e branch `main` protegida (só entra por PR com a CI aprovada).
- Dependências verificadas na CI (`pnpm audit`), versões publicadas há menos de 24h bloqueadas e scripts de instalação desativados por padrão.
- Análise de código com CodeQL e Dependabot ativo.

## Encontrou um erro?

- **Posição errada, fonte quebrada ou texto tendencioso:** [abra uma issue pública](https://github.com/guicarneiro11/voto-sem-torcida/issues/new) com o link da fonte correta.
- **Falha de segurança:** use o canal privado descrito no [`SECURITY.md`](SECURITY.md). Não abra uma issue pública.

## Stack

[Astro](https://astro.build/) (site estático) · [Svelte 5](https://svelte.dev/) (quiz interativo) · [Tailwind CSS 4](https://tailwindcss.com/) · TypeScript · [Vitest](https://vitest.dev/) · hospedado na [Cloudflare](https://www.cloudflare.com/) (Workers com arquivos estáticos).

## Rodando localmente

Requisitos: Node.js 24 (veja o [`.nvmrc`](.nvmrc)) e pnpm.

```bash
git clone https://github.com/guicarneiro11/voto-sem-torcida.git
cd voto-sem-torcida
pnpm install
pnpm dev
```

O site abre em `http://localhost:4321`. A CSP só é aplicada no build, então para testar como em produção use `pnpm build && pnpm preview`.

### Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Gera o site estático em `dist/` |
| `pnpm preview` | Serve o build localmente |
| `pnpm check` | Verificação de tipos (Astro e Svelte) e do schema do conteúdo |
| `pnpm lint` | ESLint, incluindo as regras de privacidade |
| `pnpm test` | Testes do cálculo, do conteúdo e do Pix |
| `pnpm verificar:texto` | Procura palavras coladas e pontuação sem espaço no HTML gerado (rodar depois do build) |
| `pnpm verificar:lancamento` | Confere se não sobrou nenhum valor de exemplo na configuração |

A CI roda `install`, `audit`, `lint`, `check`, `test`, `build` e `verificar:texto` em toda PR.

## Estrutura do conteúdo

As afirmações ficam em [`src/data/afirmacoes.json`](src/data/afirmacoes.json), validadas por um schema em [`src/content.config.ts`](src/content.config.ts). O build falha se:

- uma posição "a favor" ou "contra" não tiver fonte;
- uma fonte do plano do TSE não informar a página;
- uma fonte não usar HTTPS;
- faltar a posição de algum candidato em alguma afirmação.

Os candidatos são definidos em [`src/data/candidatos.ts`](src/data/candidatos.ts).

## Licença

- **Código:** [MIT](LICENSE).
- **Conteúdo** (afirmações, explicações e textos do site): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.pt-br). Você pode reutilizar, desde que cite o Voto sem Torcida como fonte.
- **Nome:** versões modificadas não devem usar o nome "Voto sem Torcida" nem se apresentar como o site original.

## Inspiração

[Wahl-O-Mat](https://www.wahl-o-mat.de/) (Alemanha, Bundeszentrale für politische Bildung) e [StemWijzer](https://stemwijzer.nl/) (Holanda, ProDemos).

---

Projeto independente, sem ligação com partidos, candidaturas ou campanhas. Não é pesquisa eleitoral nem recomendação de voto.

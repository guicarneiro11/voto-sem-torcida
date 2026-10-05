// Configuração pública do site. Preencha os campos marcados antes do lançamento.
export const SITE = {
  nome: 'Voto sem Torcida',
  descricao:
    'Responda às propostas dos candidatos sem saber de quem são e veja de qual candidato suas opiniões mais se aproximam.',
  url: 'https://votosemtorcida.com.br',
  repositorio: 'https://github.com/guicarneiro11/voto-sem-torcida',
  responsavel: 'Guilherme Carneiro',
  contato: 'guicarneiro.dev@gmail.com',
  eleicao: '2º turno da eleição presidencial de 2026',
  dataEleicao: '25 de outubro de 2026',
  pix: {
    chave: '30b0d333-d135-4798-b85a-f7c5b9f2506a',
    tipo: 'aleatória',
    titular: 'Guilherme Henrique Carneiro',
  },
} as const;

// Hash do commit publicado: Cloudflare Pages, Workers Builds ou GitHub Actions.
export const VERSAO = (
  process.env.CF_PAGES_COMMIT_SHA ??
  process.env.WORKERS_CI_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  'desenvolvimento'
).slice(0, 7);

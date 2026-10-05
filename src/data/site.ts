// Configuração pública do site. Preencha os campos marcados antes do lançamento.
export const SITE = {
  nome: 'Voto sem Torcida',
  descricao:
    'Responda às propostas dos candidatos sem saber de quem são e veja de qual delas suas opiniões mais se aproximam.',
  url: 'https://SEU-DOMINIO.com.br', // mesmo valor de `site` no astro.config.mjs
  repositorio: 'https://github.com/guicarneiro11/voto-sem-torcida',
  responsavel: 'PREENCHER: nome que você quer exibir', // ex.: "Guilherme Carneiro"
  contato: 'PREENCHER: e-mail de contato do projeto',
  eleicao: '2º turno da eleição presidencial de 2026',
  dataEleicao: '25 de outubro de 2026',
  pix: {
    chave: '', // deixe vazio até ter a chave; a seção de doação fica oculta
    tipo: 'aleatória', // tipo da chave, só para exibição
    titular: '',
  },
} as const;

// Hash do commit publicado: Cloudflare Pages, Workers Builds ou GitHub Actions.
export const VERSAO = (
  process.env.CF_PAGES_COMMIT_SHA ??
  process.env.WORKERS_CI_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  'desenvolvimento'
).slice(0, 7);

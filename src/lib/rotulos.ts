import type { PosicaoCandidato, RespostaEleitor } from './afinidade';
import type { FonteQuiz } from './tipos';

export const ROTULO_TEMA: Record<string, string> = {
  economia: 'Economia',
  trabalho: 'Trabalho',
  impostos: 'Impostos',
  seguranca: 'Segurança',
  educacao: 'Educação',
  saude: 'Saúde',
  estado: 'Estado e instituições',
  'meio-ambiente': 'Meio ambiente e terra',
  social: 'Programas sociais',
};

export const ROTULO_RESPOSTA: Record<RespostaEleitor, string> = {
  concordo: 'Concordo',
  discordo: 'Discordo',
  tanto_faz: 'Tanto faz',
};

export const ROTULO_POSICAO: Record<PosicaoCandidato, string> = {
  a_favor: 'A favor',
  contra: 'Contra',
  neutro: 'Neutro',
  sem_posicao: 'Sem posição encontrada',
};

export function rotuloFonte(fonte: FonteQuiz): string {
  if (fonte.tipo === 'plano_tse') return `Plano de governo no TSE, página ${fonte.pagina ?? '?'}`;
  if (fonte.tipo === 'votacao') return `Votação registrada (${fonte.veiculo})`;
  return `Declaração (${fonte.veiculo})`;
}

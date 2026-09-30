import type { PosicaoCandidato } from './afinidade';

export interface FonteQuiz {
  tipo: 'plano_tse' | 'declaracao' | 'votacao';
  url: string;
  veiculo: string;
  pagina?: number;
}

export interface AfirmacaoQuiz {
  id: string;
  tema: string;
  titulo: string;
  explicacao: string;
  posicoes: Record<string, { valor: PosicaoCandidato; fontes: FonteQuiz[] }>;
}

export interface CandidatoQuiz {
  id: string;
  nome: string;
  partido: string;
  numero: number;
}

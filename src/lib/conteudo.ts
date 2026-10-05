import { getCollection } from 'astro:content';
import { CANDIDATOS } from '../data/candidatos';
import type { AfirmacaoQuiz, CandidatoQuiz } from './tipos';

// Ponto único de leitura do conteúdo para todas as páginas.
export async function carregarConteudo(): Promise<{
  afirmacoes: AfirmacaoQuiz[];
  candidatos: CandidatoQuiz[];
}> {
  const afirmacoes = (await getCollection('afirmacoes')).map(({ data }) => ({
    id: data.id,
    tema: data.tema,
    titulo: data.titulo,
    explicacao: data.explicacao,
    posicoes: data.posicoes,
  }));
  return { afirmacoes, candidatos: CANDIDATOS.map((c) => ({ ...c })) };
}

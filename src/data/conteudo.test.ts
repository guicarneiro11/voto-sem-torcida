import { describe, expect, it } from 'vitest';
import afirmacoes from './afirmacoes.json';
import { CANDIDATO_IDS } from './candidatos';
import { calcularAfinidade, type PosicaoCandidato, type RespostaEleitor } from '../lib/afinidade';

// Guardas de conteúdo que rodam na CI, além do schema do Astro.
describe('conteúdo publicado', () => {
  it('não tem texto de exemplo nem marcação de rascunho', () => {
    const texto = JSON.stringify(afirmacoes);
    expect(texto).not.toMatch(/\[EXEMPLO|PREENCHER|TODO|rascunho/i);
  });

  it('ids são únicos', () => {
    const ids = afirmacoes.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a quantidade de posições definidas é equilibrada entre candidatos (diferença máxima de 2)', () => {
    const contagem = CANDIDATO_IDS.map(
      (id) =>
        afirmacoes.filter(
          (a) => (a.posicoes as Record<string, { valor: string }>)[id]?.valor !== 'sem_posicao',
        ).length,
    );
    expect(Math.max(...contagem) - Math.min(...contagem)).toBeLessThanOrEqual(2);
  });

  it('todo candidato tem ao menos uma afirmação em que discorda do outro', () => {
    const divergentes = afirmacoes.filter((a) => {
      const valores = CANDIDATO_IDS.map(
        (id) => (a.posicoes as Record<string, { valor: string }>)[id]?.valor,
      );
      return valores.includes('a_favor') && valores.includes('contra');
    });
    expect(divergentes.length).toBeGreaterThan(0);
  });

  // Viés de concordância: quem concorda (ou discorda) de tudo não pode ser empurrado
  // para um lado. Se falhar, há mais afirmações escritas como proposta de um candidato.
  it.each<RespostaEleitor>(['concordo', 'discordo'])(
    'responder "%s" em tudo resulta em empate entre os candidatos',
    (resposta) => {
      const resultado = calcularAfinidade({
        candidatoIds: CANDIDATO_IDS,
        afirmacoes: afirmacoes.map((a) => ({
          id: a.id,
          posicoes: Object.fromEntries(
            Object.entries(a.posicoes).map(([id, p]) => [id, p.valor as PosicaoCandidato]),
          ),
        })),
        respostas: Object.fromEntries(afirmacoes.map((a) => [a.id, resposta])),
      });
      expect(resultado.lideres.length).toBe(CANDIDATO_IDS.length);
    },
  );
});

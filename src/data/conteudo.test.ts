import { describe, expect, it } from 'vitest';
import afirmacoes from './afirmacoes.json';
import { CANDIDATO_IDS } from './candidatos';

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
});

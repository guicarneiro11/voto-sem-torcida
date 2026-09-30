import { describe, expect, it } from 'vitest';
import {
  calcularAfinidade,
  type AfirmacaoParaCalculo,
  type EntradaCalculo,
  type PosicaoCandidato,
  type RespostaEleitor,
} from './afinidade';

// Candidatos fictícios: os testes validam a REGRA, não um resultado político.
const A = 'candidato-a';
const B = 'candidato-b';
const IDS = [A, B] as const;

function afirmacao(id: string, a: PosicaoCandidato, b: PosicaoCandidato): AfirmacaoParaCalculo {
  return { id, posicoes: { [A]: a, [B]: b } };
}

function percentual(entrada: EntradaCalculo, id: string) {
  return calcularAfinidade(entrada).candidatos.find((c) => c.candidatoId === id)?.percentual;
}

// Três afirmações em que A e B discordam, mais uma em que concordam.
const BASE = [
  afirmacao('x1', 'a_favor', 'contra'),
  afirmacao('x2', 'contra', 'a_favor'),
  afirmacao('x3', 'a_favor', 'contra'),
  afirmacao('x4', 'a_favor', 'a_favor'),
];

describe('pontuação básica', () => {
  it('concordar com todas as posições de um candidato dá 100%', () => {
    const respostas = { x1: 'concordo', x2: 'discordo', x3: 'concordo', x4: 'concordo' } as const;
    expect(percentual({ candidatoIds: IDS, afirmacoes: BASE, respostas }, A)).toBe(100);
  });

  it('discordar de todas as posições de um candidato dá 0%', () => {
    const respostas = { x1: 'discordo', x2: 'concordo', x3: 'discordo', x4: 'discordo' } as const;
    expect(percentual({ candidatoIds: IDS, afirmacoes: BASE, respostas }, A)).toBe(0);
  });

  it('posição neutra do candidato vale metade dos pontos', () => {
    const afirmacoes = [afirmacao('n', 'neutro', 'a_favor')];
    expect(percentual({ candidatoIds: IDS, afirmacoes, respostas: { n: 'concordo' } }, A)).toBe(50);
  });
});

describe('regras de justiça', () => {
  it('respostas espelhadas geram empate exato', () => {
    // Concorda com A em x1 e com B em x2: um ponto para cada lado.
    const afirmacoes = BASE.slice(0, 2);
    const resultado = calcularAfinidade({
      candidatoIds: IDS,
      afirmacoes,
      respostas: { x1: 'concordo', x2: 'concordo' },
    });
    const [ra, rb] = resultado.candidatos;
    expect(ra?.percentual).toBe(rb?.percentual);
    expect(resultado.lideres).toEqual([A, B].sort());
  });

  it('trocar as posições dos candidatos troca exatamente os resultados', () => {
    const respostas = { x1: 'concordo', x2: 'concordo', x3: 'discordo', x4: 'concordo' } as const;
    const invertidas = BASE.map((af) =>
      afirmacao(af.id, af.posicoes[B] ?? 'sem_posicao', af.posicoes[A] ?? 'sem_posicao'),
    );

    const original = calcularAfinidade({ candidatoIds: IDS, afirmacoes: BASE, respostas });
    const trocado = calcularAfinidade({ candidatoIds: IDS, afirmacoes: invertidas, respostas });

    expect(trocado.candidatos[0]?.percentual).toBe(original.candidatos[1]?.percentual);
    expect(trocado.candidatos[1]?.percentual).toBe(original.candidatos[0]?.percentual);
  });

  it('a ordem dos candidatos na entrada não altera o resultado de ninguém', () => {
    const respostas = { x1: 'concordo', x2: 'concordo', x3: 'discordo' } as const;
    const normal = { candidatoIds: [A, B], afirmacoes: BASE, respostas };
    const invertida = { candidatoIds: [B, A], afirmacoes: BASE, respostas };
    expect(percentual(normal, A)).toBe(percentual(invertida, A));
    expect(percentual(normal, B)).toBe(percentual(invertida, B));
    expect(calcularAfinidade(normal).lideres).toEqual(calcularAfinidade(invertida).lideres);
  });

  it('a ordem das afirmações não altera o resultado', () => {
    const respostas = { x1: 'concordo', x2: 'discordo', x3: 'discordo', x4: 'concordo' } as const;
    const normal = calcularAfinidade({ candidatoIds: IDS, afirmacoes: BASE, respostas });
    const embaralhada = calcularAfinidade({
      candidatoIds: IDS,
      afirmacoes: [...BASE].reverse(),
      respostas,
    });
    expect(embaralhada.candidatos).toEqual(normal.candidatos);
  });

  it('"sem posição" não penaliza o candidato', () => {
    const respostas = { x1: 'concordo', x2: 'discordo' } as const;
    const antes = percentual({ candidatoIds: IDS, afirmacoes: BASE.slice(0, 2), respostas }, A);

    // Nova afirmação: A não se posicionou, B sim, e o eleitor concorda com B.
    const comNova = [...BASE.slice(0, 2), afirmacao('novo', 'sem_posicao', 'a_favor')];
    const depois = percentual(
      { candidatoIds: IDS, afirmacoes: comNova, respostas: { ...respostas, novo: 'concordo' } },
      A,
    );

    expect(depois).toBe(antes);
  });

  it('"tanto faz" não altera nenhum resultado', () => {
    const respostas: Record<string, RespostaEleitor> = { x1: 'concordo', x2: 'concordo' };
    const semTantoFaz = calcularAfinidade({ candidatoIds: IDS, afirmacoes: BASE, respostas });
    const comTantoFaz = calcularAfinidade({
      candidatoIds: IDS,
      afirmacoes: BASE,
      respostas: { ...respostas, x3: 'tanto_faz', x4: 'tanto_faz' },
    });
    expect(comTantoFaz.candidatos).toEqual(semTantoFaz.candidatos);
    expect(comTantoFaz.respondidas).toBe(2);
  });

  it('afirmação importante vale o dobro, para todos os candidatos igualmente', () => {
    const afirmacoes = BASE.slice(0, 2);
    const respostas = { x1: 'concordo', x2: 'concordo' } as const;
    const resultado = calcularAfinidade({
      candidatoIds: IDS,
      afirmacoes,
      respostas,
      importantes: new Set(['x1']),
    });
    // x1 (peso 2) favorece A; x2 (peso 1) favorece B.
    expect(resultado.lideres).toEqual([A]);
    expect(resultado.candidatos.map((c) => c.maximo)).toEqual([6, 6]);
  });

  it('empate por frações equivalentes é detectado sem erro de arredondamento', () => {
    // A: 1 de 3 comparações; B: 2 de 6. Mesma fração, deve ser empate.
    const afirmacoes = [
      afirmacao('p1', 'a_favor', 'a_favor'),
      afirmacao('p2', 'contra', 'contra'),
      afirmacao('p3', 'contra', 'contra'),
      afirmacao('p4', 'sem_posicao', 'a_favor'),
      afirmacao('p5', 'sem_posicao', 'contra'),
      afirmacao('p6', 'sem_posicao', 'contra'),
    ];
    const respostas = {
      p1: 'concordo',
      p2: 'concordo',
      p3: 'concordo',
      p4: 'concordo',
      p5: 'concordo',
      p6: 'concordo',
    } as const;
    const resultado = calcularAfinidade({ candidatoIds: IDS, afirmacoes, respostas });
    expect(resultado.lideres).toEqual([A, B].sort());
  });
});

describe('casos de borda', () => {
  it('sem nenhuma resposta válida, ninguém tem percentual nem lidera', () => {
    const resultado = calcularAfinidade({ candidatoIds: IDS, afirmacoes: BASE, respostas: {} });
    expect(resultado.candidatos.every((c) => c.percentual === null)).toBe(true);
    expect(resultado.lideres).toEqual([]);
    expect(resultado.respondidas).toBe(0);
  });

  it('candidato sem nenhuma posição comparável fica com percentual null, não 0', () => {
    const afirmacoes = [afirmacao('s', 'sem_posicao', 'a_favor')];
    const resultado = calcularAfinidade({
      candidatoIds: IDS,
      afirmacoes,
      respostas: { s: 'concordo' },
    });
    expect(resultado.candidatos[0]?.percentual).toBeNull();
    expect(resultado.lideres).toEqual([B]);
  });

  it('não modifica os objetos recebidos', () => {
    const respostas = { x1: 'concordo' } as const;
    const copia = structuredClone({ afirmacoes: BASE, respostas });
    calcularAfinidade({ candidatoIds: IDS, afirmacoes: BASE, respostas });
    expect({ afirmacoes: BASE, respostas }).toEqual(copia);
  });
});

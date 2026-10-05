/**
 * Cálculo de afinidade entre as respostas do eleitor e as posições dos candidatos.
 *
 * Inspirado no modelo do Wahl-O-Mat (bpb, Alemanha):
 *   - mesma posição ............ 2 pontos
 *   - uma das posições neutra .. 1 ponto
 *   - posições opostas ......... 0 pontos
 *   - afirmação marcada como importante vale o dobro
 *
 * Respostas do eleitor: "concordo", "em partes" (neutro, conta no cálculo como meio-termo),
 * "discordo" e "tanto faz" (ausência de opinião, não conta).
 *
 * Regras de justiça (cobertas por testes em afinidade.test.ts):
 *   1. "Tanto faz" não é uma opinião: a afirmação sai do cálculo.
 *   2. "Sem posição" de um candidato não o penaliza: a afirmação sai do cálculo SÓ para ele.
 *   3. A ordem dos candidatos e das afirmações não altera o resultado.
 *   4. Empates são reportados como empate, nunca desempatados pela ordem da lista.
 *   5. A função é pura: não lê nem grava nada fora dos parâmetros.
 */

export type RespostaEleitor = 'concordo' | 'em_partes' | 'discordo' | 'tanto_faz';
export type PosicaoCandidato = 'a_favor' | 'contra' | 'neutro' | 'sem_posicao';

export interface AfirmacaoParaCalculo {
  id: string;
  posicoes: Record<string, PosicaoCandidato>;
}

export interface EntradaCalculo {
  candidatoIds: readonly string[];
  afirmacoes: readonly AfirmacaoParaCalculo[];
  respostas: Readonly<Record<string, RespostaEleitor>>;
  importantes?: ReadonlySet<string>;
}

export interface ResultadoCandidato {
  candidatoId: string;
  pontos: number;
  maximo: number;
  /** 0 a 100, ou null quando nenhuma afirmação pôde ser comparada. */
  percentual: number | null;
  /** Quantas afirmações respondidas puderam ser comparadas com este candidato. */
  comparadas: number;
}

export interface ResultadoAfinidade {
  /** Mesma ordem de `candidatoIds` da entrada. Ordenação é papel da interface. */
  candidatos: ResultadoCandidato[];
  /** Afirmações com resposta que conta (concordo ou discordo). */
  respondidas: number;
  /** Ids dos candidatos com a maior afinidade. Mais de um = empate. */
  lideres: string[];
}

const VALOR_ELEITOR: Record<Exclude<RespostaEleitor, 'tanto_faz'>, number> = {
  concordo: 1,
  em_partes: 0, // concorda com uma parte: meio caminho entre concordar e discordar
  discordo: -1,
};

const VALOR_CANDIDATO: Record<Exclude<PosicaoCandidato, 'sem_posicao'>, number> = {
  a_favor: 1,
  neutro: 0,
  contra: -1,
};

/** 2 se iguais, 1 se a distância é de um passo (um lado neutro), 0 se opostos. */
function pontosPorAfirmacao(eleitor: number, candidato: number): number {
  return 2 - Math.abs(eleitor - candidato);
}

export function calcularAfinidade(entrada: EntradaCalculo): ResultadoAfinidade {
  const { candidatoIds, afirmacoes, respostas, importantes = new Set<string>() } = entrada;

  let respondidas = 0;
  const acumulado = new Map(
    candidatoIds.map((id) => [id, { pontos: 0, maximo: 0, comparadas: 0 }]),
  );

  for (const afirmacao of afirmacoes) {
    const resposta = respostas[afirmacao.id];
    if (resposta === undefined || resposta === 'tanto_faz') continue;
    respondidas += 1;

    const valorEleitor = VALOR_ELEITOR[resposta];
    const peso = importantes.has(afirmacao.id) ? 2 : 1;

    for (const id of candidatoIds) {
      const posicao = afirmacao.posicoes[id];
      if (posicao === undefined || posicao === 'sem_posicao') continue;

      const total = acumulado.get(id);
      if (!total) continue;
      total.pontos += pontosPorAfirmacao(valorEleitor, VALOR_CANDIDATO[posicao]) * peso;
      total.maximo += 2 * peso;
      total.comparadas += 1;
    }
  }

  const candidatos: ResultadoCandidato[] = candidatoIds.map((id) => {
    const { pontos, maximo, comparadas } = acumulado.get(id) ?? {
      pontos: 0,
      maximo: 0,
      comparadas: 0,
    };
    return {
      candidatoId: id,
      pontos,
      maximo,
      comparadas,
      percentual: maximo === 0 ? null : Math.round((pontos / maximo) * 100),
    };
  });

  return { candidatos, respondidas, lideres: encontrarLideres(candidatos) };
}

/**
 * Compara frações exatas (pontos/maximo) por multiplicação cruzada, para que
 * arredondamento de ponto flutuante nunca crie ou desfaça um empate.
 */
function encontrarLideres(candidatos: readonly ResultadoCandidato[]): string[] {
  const comparaveis = candidatos.filter((c) => c.maximo > 0);
  if (comparaveis.length === 0) return [];

  let lideres = [comparaveis[0]];
  for (const atual of comparaveis.slice(1)) {
    const referencia = lideres[0];
    const diferenca = atual.pontos * referencia.maximo - referencia.pontos * atual.maximo;
    if (diferenca > 0) lideres = [atual];
    else if (diferenca === 0) lideres.push(atual);
  }
  return lideres.map((c) => c.candidatoId).sort();
}

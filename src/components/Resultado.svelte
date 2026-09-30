<script lang="ts">
  import type { PosicaoCandidato, RespostaEleitor, ResultadoAfinidade } from '../lib/afinidade';
  import type { AfirmacaoQuiz, CandidatoQuiz, FonteQuiz } from '../lib/tipos';

  let {
    resultado,
    candidatos,
    afirmacoes,
    respostas,
    importantes,
    onRecomecar,
  }: {
    resultado: ResultadoAfinidade;
    candidatos: CandidatoQuiz[];
    afirmacoes: AfirmacaoQuiz[];
    respostas: Record<string, RespostaEleitor>;
    importantes: ReadonlySet<string>;
    onRecomecar: () => void;
  } = $props();

  const POUCAS_RESPOSTAS = 5;

  const nomes = $derived(new Map(candidatos.map((c) => [c.id, c.nome])));
  const nomeDe = (id: string) => nomes.get(id) ?? id;

  // Maior afinidade primeiro. Em caso de empate, a ordem é sorteada a cada
  // resultado, para que nenhum candidato apareça sempre em primeiro.
  const ordenados = $derived.by(() => {
    const sorteio = new Map(resultado.candidatos.map((c) => [c.candidatoId, Math.random()]));
    return [...resultado.candidatos].sort(
      (a, b) =>
        (b.percentual ?? -1) - (a.percentual ?? -1) ||
        (sorteio.get(a.candidatoId) ?? 0) - (sorteio.get(b.candidatoId) ?? 0),
    );
  });

  const lideresEmOrdem = $derived(
    ordenados
      .filter((c) => resultado.lideres.includes(c.candidatoId))
      .map((c) => nomeDe(c.candidatoId)),
  );

  const ROTULO_RESPOSTA: Record<RespostaEleitor, string> = {
    concordo: 'Concordo',
    discordo: 'Discordo',
    tanto_faz: 'Tanto faz',
  };

  const ROTULO_POSICAO: Record<PosicaoCandidato, string> = {
    a_favor: 'A favor',
    contra: 'Contra',
    neutro: 'Neutro',
    sem_posicao: 'Sem posição encontrada',
  };

  function rotuloFonte(fonte: FonteQuiz): string {
    if (fonte.tipo === 'plano_tse') return `Plano de governo no TSE, página ${fonte.pagina ?? '?'}`;
    if (fonte.tipo === 'votacao') return `Votação registrada (${fonte.veiculo})`;
    return `Declaração (${fonte.veiculo})`;
  }

  let titulo: HTMLHeadingElement | undefined = $state();
  $effect(() => titulo?.focus()); // leitores de tela anunciam o resultado ao chegar
</script>

<section class="mt-8" aria-labelledby="titulo-resultado">
  <h2
    id="titulo-resultado"
    class="text-xl font-medium outline-none"
    tabindex="-1"
    bind:this={titulo}
  >
    {#if lideresEmOrdem.length === 0}
      Não foi possível comparar suas respostas
    {:else if lideresEmOrdem.length > 1}
      Empate: suas respostas se aproximam igualmente de {lideresEmOrdem.join(' e ')}
    {:else}
      Suas respostas se aproximam mais de {lideresEmOrdem[0]}
    {/if}
  </h2>

  <p class="mt-2 text-sm text-neutral-600">
    Resultado baseado em {resultado.respondidas} de {afirmacoes.length} afirmações. Isto não é uma recomendação
    de voto: mostra só a proximidade entre suas respostas e as propostas registradas.
  </p>

  {#if resultado.respondidas < Math.min(POUCAS_RESPOSTAS, afirmacoes.length)}
    <p class="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
      Você respondeu poucas afirmações com uma opinião, então este resultado diz pouco. Refazer o
      teste com mais respostas deixa a comparação mais confiável.
    </p>
  {/if}

  <ul class="mt-6 space-y-4">
    {#each ordenados as c (c.candidatoId)}
      <li>
        <div class="flex items-baseline justify-between">
          <span class="font-medium">{nomeDe(c.candidatoId)}</span>
          <span class="tabular-nums"
            >{c.percentual === null ? 'Sem comparação' : `${c.percentual}%`}</span
          >
        </div>
        <!-- SVG em vez de style="width": respeita a CSP sem precisar de estilos inline -->
        <svg
          class="mt-1 h-2 w-full"
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect width="100" height="8" rx="4" class="fill-neutral-200" />
          <rect width={c.percentual ?? 0} height="8" rx="4" class="fill-neutral-800" />
        </svg>
        <p class="mt-1 text-xs text-neutral-500">Comparado em {c.comparadas} afirmação(ões)</p>
      </li>
    {/each}
  </ul>

  <h3 class="mt-10 font-medium">Onde você concordou e discordou</h3>
  <ul class="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
    {#each afirmacoes as a (a.id)}
      <li>
        <details class="py-3">
          <summary class="cursor-pointer">
            {a.titulo}
            <span class="block text-sm text-neutral-500">
              Você: {respostas[a.id]
                ? ROTULO_RESPOSTA[respostas[a.id]]
                : 'Sem resposta'}{importantes.has(a.id) ? ' (importante)' : ''}
            </span>
          </summary>
          <dl class="mt-3 space-y-3 pl-4 text-sm">
            {#each candidatos as candidato (candidato.id)}
              {@const posicao = a.posicoes[candidato.id]}
              <div>
                <dt class="font-medium">{candidato.nome}</dt>
                <dd>{posicao ? ROTULO_POSICAO[posicao.valor] : ROTULO_POSICAO.sem_posicao}</dd>
                {#each posicao?.fontes ?? [] as fonte (fonte.url)}
                  <dd>
                    <a class="underline" href={fonte.url} target="_blank" rel="noopener noreferrer"
                      >{rotuloFonte(fonte)}</a
                    >
                  </dd>
                {/each}
              </div>
            {/each}
          </dl>
        </details>
      </li>
    {/each}
  </ul>

  <button class="mt-8 rounded border px-4 py-2 hover:bg-neutral-100" onclick={onRecomecar}
    >Refazer o teste</button
  >
</section>

<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { calcularAfinidade, type RespostaEleitor } from '../lib/afinidade';
  import { ROTULO_TEMA } from '../lib/rotulos';
  import type { AfirmacaoQuiz, CandidatoQuiz } from '../lib/tipos';
  import Resultado from './Resultado.svelte';

  let {
    afirmacoes,
    candidatos,
    endereco,
  }: { afirmacoes: AfirmacaoQuiz[]; candidatos: CandidatoQuiz[]; endereco: string } = $props();

  type Fase = 'inicio' | 'perguntas' | 'calculando' | 'resultado';

  // Estado só em memória: fechar ou recarregar a aba apaga tudo (é intencional).
  let fase = $state<Fase>('inicio');
  let indice = $state(0);
  let respostas = $state<Record<string, RespostaEleitor>>({});
  const importantes = new SvelteSet<string>();

  const atual = $derived(afirmacoes[indice]);
  const minutos = $derived(Math.max(3, Math.round(afirmacoes.length / 3)));

  const resultado = $derived(
    fase === 'resultado'
      ? calcularAfinidade({
          candidatoIds: candidatos.map((c) => c.id),
          afirmacoes: afirmacoes.map((a) => ({
            id: a.id,
            posicoes: Object.fromEntries(
              Object.entries(a.posicoes).map(([id, p]) => [id, p.valor]),
            ),
          })),
          respostas,
          importantes,
        })
      : null,
  );

  let titulo: HTMLHeadingElement | undefined = $state();
  $effect(() => {
    // Move o foco para a nova afirmação: leitores de tela anunciam a troca.
    if (fase === 'perguntas' && indice >= 0) titulo?.focus();
  });

  function comecar() {
    fase = 'perguntas';
    indice = 0;
  }

  function responder(resposta: RespostaEleitor) {
    if (!atual) return;
    respostas[atual.id] = resposta;
    if (indice < afirmacoes.length - 1) indice += 1;
    else calcular();
  }

  function voltar() {
    if (indice > 0) indice -= 1;
  }

  function alternarImportante() {
    if (!atual) return;
    if (importantes.has(atual.id)) importantes.delete(atual.id);
    else importantes.add(atual.id);
  }

  function calcular() {
    fase = 'calculando';
    // A pausa é só de experiência (o cálculo é instantâneo). Quem pede
    // menos movimento no sistema vai direto para o resultado.
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => (fase = 'resultado'), reduzirMovimento ? 0 : 1600);
  }

  function recomecar() {
    respostas = {};
    importantes.clear();
    indice = 0;
    fase = 'inicio';
  }

  const opcoes: { valor: RespostaEleitor; rotulo: string; simbolo: string }[] = [
    { valor: 'concordo', rotulo: 'Concordo', simbolo: '✓' },
    { valor: 'discordo', rotulo: 'Discordo', simbolo: '✕' },
    { valor: 'tanto_faz', rotulo: 'Tanto faz', simbolo: '–' },
  ];
</script>

{#if fase === 'inicio'}
  <section aria-labelledby="titulo-inicio">
    <p class="text-acento text-sm font-semibold tracking-wide uppercase">
      {candidatos.length === 2 ? '2º turno · Presidência' : 'Presidência'}
    </p>
    <h1 id="titulo-inicio" class="mt-3 text-4xl leading-tight font-semibold sm:text-5xl">
      Vote nas propostas, não na camisa do time.
    </h1>
    <p class="text-suave mt-5 text-lg leading-relaxed">
      Você vai ver {afirmacoes.length} propostas tiradas dos planos de governo registrados no TSE, sem
      saber de qual candidato é cada uma. No final, mostramos de quem suas respostas mais se aproximam
      e em quais propostas você concorda ou discorda de cada um.
    </p>

    <ul class="mt-8 grid gap-3 text-sm sm:grid-cols-3">
      <li class="border-linha bg-cartao rounded-lg border p-4">
        <span class="block font-semibold">Cerca de {minutos} minutos</span>
        <span class="text-suave">Linguagem simples, sem pegadinha.</span>
      </li>
      <li class="border-linha bg-cartao rounded-lg border p-4">
        <span class="block font-semibold">Nada é salvo</span>
        <span class="text-suave">Suas respostas não saem do seu aparelho.</span>
      </li>
      <li class="border-linha bg-cartao rounded-lg border p-4">
        <span class="block font-semibold">Tudo com fonte</span>
        <span class="text-suave">Cada posição tem a página do plano oficial.</span>
      </li>
    </ul>

    <button
      class="bg-tinta text-papel hover:bg-acento-forte mt-10 w-full rounded-lg px-6 py-4 text-lg font-semibold transition sm:w-auto"
      onclick={comecar}>Começar</button
    >
    <p class="text-suave mt-4 text-sm">
      Não é pesquisa eleitoral nem recomendação de voto. <a class="underline" href="/metodologia"
        >Veja como funciona</a
      >.
    </p>
  </section>
{:else if fase === 'perguntas' && atual}
  <article
    class="border-linha bg-cartao rounded-xl border p-6 shadow-sm sm:p-8"
    aria-labelledby="titulo-afirmacao"
  >
    <div class="text-suave flex items-center justify-between gap-4 text-sm">
      <span>
        <span class="text-tinta font-semibold">{indice + 1}</span> de {afirmacoes.length}
        <span aria-hidden="true">·</span>
        {ROTULO_TEMA[atual.tema] ?? atual.tema}
      </span>
      <progress
        class="accent-acento h-1.5 w-28 overflow-hidden rounded-full sm:w-40"
        max={afirmacoes.length}
        value={indice}>{indice} de {afirmacoes.length}</progress
      >
    </div>

    <h2
      id="titulo-afirmacao"
      class="mt-5 text-2xl leading-snug font-semibold outline-none sm:text-3xl"
      tabindex="-1"
      bind:this={titulo}
    >
      {atual.titulo}
    </h2>
    <p class="text-suave mt-4 leading-relaxed">{atual.explicacao}</p>

    <div class="mt-8 grid gap-3 sm:grid-cols-3" role="group" aria-label="Sua resposta">
      {#each opcoes as opcao (opcao.valor)}
        {@const marcada = respostas[atual.id] === opcao.valor}
        <button
          class={[
            'flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3.5 text-base font-semibold transition',
            marcada ? 'border-tinta bg-tinta text-papel' : 'border-linha hover:border-tinta',
          ]}
          aria-pressed={marcada}
          onclick={() => responder(opcao.valor)}
        >
          <span aria-hidden="true">{opcao.simbolo}</span>{opcao.rotulo}
        </button>
      {/each}
    </div>
    <p class="text-suave mt-3 text-sm">"Tanto faz" não entra no seu resultado.</p>

    <div
      class="border-linha mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-sm"
    >
      <button
        class="rounded px-2 py-1 underline disabled:no-underline disabled:opacity-40"
        disabled={indice === 0}
        onclick={voltar}>← Voltar</button
      >
      <button
        class={[
          'rounded-full border px-4 py-2 font-medium transition',
          importantes.has(atual.id)
            ? 'border-acento bg-acento-claro text-acento-forte'
            : 'border-linha hover:border-tinta',
        ]}
        aria-pressed={importantes.has(atual.id)}
        onclick={alternarImportante}
      >
        {importantes.has(atual.id)
          ? '★ Importante para mim (vale o dobro)'
          : '☆ Isso é importante para mim'}
      </button>
    </div>
  </article>
{:else if fase === 'calculando'}
  <div class="flex flex-col items-center gap-5 py-24" role="status" aria-live="polite">
    <div
      class="border-linha border-t-acento size-14 animate-spin rounded-full border-4 motion-reduce:animate-none"
      aria-hidden="true"
    ></div>
    <p class="text-suave">Comparando suas respostas com os planos de governo…</p>
  </div>
{:else if fase === 'resultado' && resultado}
  <Resultado
    {resultado}
    {candidatos}
    {afirmacoes}
    {respostas}
    {importantes}
    {endereco}
    onRecomecar={recomecar}
  />
{/if}

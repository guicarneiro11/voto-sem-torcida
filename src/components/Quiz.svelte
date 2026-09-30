<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { calcularAfinidade, type RespostaEleitor } from '../lib/afinidade';
  import type { AfirmacaoQuiz, CandidatoQuiz } from '../lib/tipos';
  import Resultado from './Resultado.svelte';

  let { afirmacoes, candidatos }: { afirmacoes: AfirmacaoQuiz[]; candidatos: CandidatoQuiz[] } =
    $props();

  type Fase = 'perguntas' | 'calculando' | 'resultado';

  // Estado só em memória: fechar ou recarregar a aba apaga tudo (é intencional).
  let fase = $state<Fase>('perguntas');
  let indice = $state(0);
  let respostas = $state<Record<string, RespostaEleitor>>({});
  const importantes = new SvelteSet<string>();

  const atual = $derived(afirmacoes[indice]);

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
    setTimeout(() => (fase = 'resultado'), reduzirMovimento ? 0 : 1400);
  }

  function recomecar() {
    respostas = {};
    importantes.clear();
    indice = 0;
    fase = 'perguntas';
  }

  const opcoes: { valor: RespostaEleitor; rotulo: string }[] = [
    { valor: 'concordo', rotulo: 'Concordo' },
    { valor: 'discordo', rotulo: 'Discordo' },
    { valor: 'tanto_faz', rotulo: 'Tanto faz' },
  ];
</script>

{#if fase === 'perguntas' && atual}
  <article class="mt-8 rounded-lg border border-neutral-200 p-6" aria-labelledby="titulo-afirmacao">
    <div class="flex items-center justify-between gap-4 text-sm text-neutral-500">
      <span>{indice + 1} de {afirmacoes.length}</span>
      <progress class="h-1.5 w-32 accent-neutral-800" max={afirmacoes.length} value={indice}
        >{indice} de {afirmacoes.length}</progress
      >
    </div>

    <h2 id="titulo-afirmacao" class="mt-3 text-xl font-medium">{atual.titulo}</h2>
    <p class="mt-3 leading-relaxed text-neutral-700">{atual.explicacao}</p>

    <div class="mt-6 flex flex-wrap gap-3">
      {#each opcoes as opcao (opcao.valor)}
        <button
          class="rounded border px-4 py-2 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2"
          class:bg-neutral-100={respostas[atual.id] === opcao.valor}
          aria-pressed={respostas[atual.id] === opcao.valor}
          onclick={() => responder(opcao.valor)}>{opcao.rotulo}</button
        >
      {/each}
    </div>
    <p class="mt-2 text-sm text-neutral-500">"Tanto faz" não entra no seu resultado.</p>

    <div class="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm">
      <button
        class="underline disabled:no-underline disabled:opacity-40"
        disabled={indice === 0}
        onclick={voltar}>Voltar</button
      >
      <button
        class="rounded px-3 py-1.5"
        class:bg-neutral-900={importantes.has(atual.id)}
        class:text-white={importantes.has(atual.id)}
        aria-pressed={importantes.has(atual.id)}
        onclick={alternarImportante}
      >
        {importantes.has(atual.id) ? 'Marcado como importante' : 'Isso é importante para mim'}
      </button>
    </div>
  </article>
{:else if fase === 'calculando'}
  <div class="mt-16 flex flex-col items-center gap-4" role="status" aria-live="polite">
    <div
      class="size-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800 motion-reduce:animate-none"
      aria-hidden="true"
    ></div>
    <p class="text-neutral-600">Comparando suas respostas com os planos de governo…</p>
  </div>
{:else if fase === 'resultado' && resultado}
  <Resultado
    {resultado}
    {candidatos}
    {afirmacoes}
    {respostas}
    {importantes}
    onRecomecar={recomecar}
  />
{/if}

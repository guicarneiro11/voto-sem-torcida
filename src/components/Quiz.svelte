<script lang="ts">
  type Resposta = 'concordo' | 'discordo' | 'tanto_faz';

  interface Afirmacao {
    id: string;
    tema: string;
    titulo: string;
    explicacao: string;
  }

  let { afirmacoes }: { afirmacoes: Afirmacao[] } = $props();

  // Estado só em memória: fechar a aba apaga tudo (é intencional).
  let indice = $state(0);
  let respostas = $state<Record<string, Resposta>>({});

  const atual = $derived(afirmacoes[indice]);

  function responder(resposta: Resposta) {
    if (!atual) return;
    respostas[atual.id] = resposta;
    indice += 1;
  }

  function recomecar() {
    indice = 0;
    respostas = {};
  }
</script>

{#if atual}
  <article class="mt-8 rounded-lg border border-neutral-200 p-6">
    <p class="text-sm text-neutral-500">{indice + 1} de {afirmacoes.length}</p>
    <h2 class="mt-2 text-xl font-medium">{atual.titulo}</h2>
    <p class="mt-3 leading-relaxed text-neutral-700">{atual.explicacao}</p>
    <div class="mt-6 flex flex-wrap gap-3">
      <button class="rounded border px-4 py-2" onclick={() => responder('concordo')}>Concordo</button>
      <button class="rounded border px-4 py-2" onclick={() => responder('discordo')}>Discordo</button>
      <button class="rounded border px-4 py-2" onclick={() => responder('tanto_faz')}>Tanto faz</button>
    </div>
  </article>
{:else}
  <section class="mt-8">
    <p>Você respondeu {Object.keys(respostas).length} afirmação(ões). Nada foi enviado ou salvo.</p>
    <button class="mt-4 rounded border px-4 py-2" onclick={recomecar}>Recomeçar</button>
  </section>
{/if}

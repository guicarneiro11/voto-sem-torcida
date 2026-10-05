<script lang="ts">
  let { chave }: { chave: string } = $props();
  let copiado = $state(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(chave);
      copiado = true;
      setTimeout(() => (copiado = false), 2500);
    } catch {
      copiado = false;
    }
  }
</script>

<div class="mt-3 flex flex-wrap items-center gap-3">
  <code class="bg-papel rounded px-3 py-2 text-sm break-all">{chave}</code>
  <button
    class="border-linha hover:border-tinta rounded-lg border-2 px-4 py-2 text-sm font-semibold"
    onclick={copiar}
  >
    {copiado ? 'Copiado ✓' : 'Copiar chave'}
  </button>
  <span class="sr-only" aria-live="polite">{copiado ? 'Chave copiada' : ''}</span>
</div>

<script lang="ts">
  import type { RespostaEleitor, ResultadoAfinidade } from '../lib/afinidade';
  import { gerarCartao } from '../lib/cartao';
  import { ROTULO_POSICAO, ROTULO_RESPOSTA, rotuloFonte } from '../lib/rotulos';
  import type { AfirmacaoQuiz, CandidatoQuiz } from '../lib/tipos';

  let {
    resultado,
    candidatos,
    afirmacoes,
    respostas,
    importantes,
    endereco,
    onRecomecar,
  }: {
    resultado: ResultadoAfinidade;
    candidatos: CandidatoQuiz[];
    afirmacoes: AfirmacaoQuiz[];
    respostas: Record<string, RespostaEleitor>;
    importantes: ReadonlySet<string>;
    endereco: string;
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

  const lideres = $derived(
    ordenados
      .filter((c) => resultado.lideres.includes(c.candidatoId))
      .map((c) => nomeDe(c.candidatoId)),
  );

  const manchete = $derived(
    lideres.length === 0
      ? 'Não deu para comparar minhas respostas'
      : lideres.length > 1
        ? `Minhas respostas se aproximam igualmente de ${lideres.join(' e ')}`
        : `Minhas respostas se aproximam mais de ${lideres[0]}`,
  );

  // Comparação por afirmação, para o detalhamento "onde concordamos".
  function situacao(
    afirmacao: AfirmacaoQuiz,
    candidatoId: string,
  ): 'igual' | 'oposto' | 'parcial' | null {
    const r = respostas[afirmacao.id];
    const p = afirmacao.posicoes[candidatoId]?.valor;
    if (!r || r === 'tanto_faz' || !p || p === 'sem_posicao') return null;
    const rNeutra = r === 'em_partes';
    const pNeutra = p === 'neutro';
    if (rNeutra && pNeutra) return 'igual';
    if (rNeutra || pNeutra) return 'parcial';
    return (r === 'concordo') === (p === 'a_favor') ? 'igual' : 'oposto';
  }

  let titulo: HTMLHeadingElement | undefined = $state();
  $effect(() => titulo?.focus()); // leitores de tela anunciam o resultado ao chegar

  let compartilhando = $state(false);
  let erroCompartilhar = $state('');

  async function compartilhar() {
    compartilhando = true;
    erroCompartilhar = '';
    try {
      const imagem = await gerarCartao({
        manchete,
        linhas: ordenados.map((c) => ({ nome: nomeDe(c.candidatoId), percentual: c.percentual })),
        respondidas: resultado.respondidas,
        total: afirmacoes.length,
        endereco: endereco.replace(/^https?:\/\//, ''),
      });
      const arquivo = new File([imagem], 'voto-sem-torcida.png', { type: 'image/png' });
      const texto = `Fiz o Voto sem Torcida: respondi às propostas sem saber de quem eram. Faça o seu: ${endereco}`;

      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: texto });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(imagem);
        link.download = arquivo.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }
    } catch (erro) {
      // Cancelar o compartilhamento não é erro.
      if (!(erro instanceof DOMException && erro.name === 'AbortError')) {
        erroCompartilhar = 'Não foi possível gerar a imagem neste navegador.';
      }
    } finally {
      compartilhando = false;
    }
  }
</script>

<section aria-labelledby="titulo-resultado">
  <p class="text-acento text-sm font-semibold tracking-wide uppercase">Seu resultado</p>
  <h1
    id="titulo-resultado"
    class="mt-3 text-3xl leading-tight font-semibold outline-none sm:text-4xl"
    tabindex="-1"
    bind:this={titulo}
  >
    {#if lideres.length === 0}
      Não foi possível comparar suas respostas
    {:else if lideres.length > 1}
      Empate: suas respostas se aproximam igualmente de {lideres.join(' e ')}
    {:else}
      Suas respostas se aproximam mais de {lideres[0]}
    {/if}
  </h1>

  <p class="text-suave mt-4 leading-relaxed">
    Resultado baseado em {resultado.respondidas} de {afirmacoes.length} propostas. Isto não é uma recomendação
    de voto: mostra só a proximidade entre suas respostas e os planos de governo registrados no TSE.
  </p>

  {#if resultado.respondidas < Math.min(POUCAS_RESPOSTAS, afirmacoes.length)}
    <p class="border-aviso/30 bg-aviso-claro text-aviso mt-5 rounded-lg border p-4 text-sm">
      Você deu sua opinião em poucas propostas, então este resultado diz pouco. Refazer o teste com
      mais respostas deixa a comparação mais confiável.
    </p>
  {/if}

  <ul class="border-linha bg-cartao mt-8 space-y-6 rounded-xl border p-6 sm:p-8">
    {#each ordenados as c (c.candidatoId)}
      <li>
        <div class="flex items-baseline justify-between gap-4">
          <span class="font-display text-xl font-semibold">{nomeDe(c.candidatoId)}</span>
          <span class="text-2xl font-semibold tabular-nums">
            {c.percentual === null ? '—' : `${c.percentual}%`}
          </span>
        </div>
        <!-- SVG em vez de style="width": respeita a CSP sem precisar de estilos inline -->
        <svg
          class="mt-2 h-3 w-full"
          viewBox="0 0 100 6"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect width="100" height="6" rx="3" class="fill-linha" />
          <rect width={c.percentual ?? 0} height="6" rx="3" class="fill-acento" />
        </svg>
        <p class="text-suave mt-1.5 text-sm">
          {c.percentual === null
            ? 'Nenhuma proposta respondida tinha posição deste candidato.'
            : `Comparado em ${c.comparadas} ${c.comparadas === 1 ? 'proposta' : 'propostas'}.`}
        </p>
      </li>
    {/each}
  </ul>

  <div class="mt-6 flex flex-wrap gap-3">
    <button
      class="bg-tinta text-papel hover:bg-acento-forte rounded-lg px-5 py-3 font-semibold transition disabled:opacity-60"
      disabled={compartilhando}
      onclick={compartilhar}>{compartilhando ? 'Gerando imagem…' : 'Compartilhar resultado'}</button
    >
    <button
      class="border-linha hover:border-tinta rounded-lg border-2 px-5 py-3 font-semibold"
      onclick={onRecomecar}>Refazer o teste</button
    >
  </div>
  {#if erroCompartilhar}
    <p class="text-aviso mt-2 text-sm" role="alert">{erroCompartilhar}</p>
  {/if}
  <p class="text-suave mt-2 text-sm">A imagem é gerada no seu aparelho. Nada é enviado para nós.</p>

  <h2 class="mt-14 text-2xl font-semibold">Onde você concordou e discordou</h2>
  <p class="text-suave mt-2">
    Toque em cada proposta para ver a posição de cada candidato e a fonte.
  </p>

  <ul class="divide-linha border-linha bg-cartao mt-5 divide-y rounded-xl border">
    {#each afirmacoes as a (a.id)}
      <li>
        <details class="group px-5 py-4">
          <summary class="cursor-pointer list-none">
            <span class="flex items-start justify-between gap-4">
              <span class="font-medium">{a.titulo}</span>
              <span class="text-suave shrink-0 transition group-open:rotate-90" aria-hidden="true"
                >›</span
              >
            </span>
            <span class="text-suave mt-1 block text-sm">
              Você: {respostas[a.id]
                ? ROTULO_RESPOSTA[respostas[a.id]]
                : 'Sem resposta'}{importantes.has(a.id) ? ' · ★ importante' : ''}
            </span>
          </summary>
          <dl class="mt-4 grid gap-4 sm:grid-cols-2">
            {#each candidatos as candidato (candidato.id)}
              {@const posicao = a.posicoes[candidato.id]}
              {@const s = situacao(a, candidato.id)}
              <div class="bg-papel rounded-lg p-4 text-sm">
                <dt class="font-semibold">{candidato.nome}</dt>
                <dd class="mt-1">
                  {posicao ? ROTULO_POSICAO[posicao.valor] : ROTULO_POSICAO.sem_posicao}
                  {#if s === 'igual'}<span class="text-acento"> · igual à sua</span>{/if}
                  {#if s === 'oposto'}<span class="text-suave"> · oposta à sua</span>{/if}
                  {#if s === 'parcial'}<span class="text-suave"> · parcialmente próxima</span>{/if}
                </dd>
                {#if posicao?.valor === 'sem_posicao'}
                  <dd class="text-suave mt-1">Não entra no cálculo deste candidato.</dd>
                {/if}
                {#each posicao?.fontes ?? [] as fonte (fonte.url)}
                  <dd class="mt-1">
                    <a
                      class="text-acento underline"
                      href={fonte.url}
                      target="_blank"
                      rel="noopener noreferrer">{rotuloFonte(fonte)}</a
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
</section>

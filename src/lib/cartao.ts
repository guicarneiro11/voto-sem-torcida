/**
 * Gera, no próprio navegador, a imagem de compartilhamento do resultado.
 * Nada é enviado a servidor algum: o canvas vira um arquivo PNG local.
 */

export interface LinhaCartao {
  nome: string;
  percentual: number | null;
}

export type FormatoCartao = 'feed' | 'stories';

export interface DadosCartao {
  formato: FormatoCartao;
  manchete: string;
  linhas: LinhaCartao[];
  respondidas: number;
  total: number;
  endereco: string;
}

const L = 1080;
// Feed (4:5) para WhatsApp, X e feed do Instagram; Stories (9:16) para Instagram/WhatsApp Status.
const ALTURA: Record<FormatoCartao, number> = { feed: 1350, stories: 1920 };
// Nos Stories, o topo e a base ficam cobertos pela interface do app: o conteúdo fica no meio.
const ZONA_SEGURA: Record<FormatoCartao, { topo: number; base: number }> = {
  feed: { topo: 0, base: 0 },
  stories: { topo: 230, base: 300 },
};
const COR = {
  papel: '#f6f3ec',
  tinta: '#1d1b24',
  suave: '#5c5966',
  linha: '#dcd6c9',
  acento: '#4a3db8',
  trilho: '#e4dfd3',
};
const SERIFA = "'Fraunces Variable', Georgia, serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, largura: number): string[] {
  const palavras = texto.split(' ');
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of palavras) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > largura && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function barra(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cor: string,
) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
}

export async function gerarCartao(dados: DadosCartao): Promise<Blob> {
  await document.fonts.ready;
  const A = ALTURA[dados.formato];
  const { topo, base } = ZONA_SEGURA[dados.formato];
  const fim = A - base;
  const canvas = document.createElement('canvas');
  canvas.width = L;
  canvas.height = A;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');

  const margem = 96;
  const largura = L - margem * 2;

  ctx.fillStyle = COR.papel;
  ctx.fillRect(0, 0, L, A);

  ctx.fillStyle = COR.acento;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText('VOTO SEM TORCIDA', margem, topo + 150);

  ctx.fillStyle = COR.tinta;
  ctx.font = `600 76px ${SERIFA}`;
  let y = topo + 270;
  for (const linha of quebrarTexto(ctx, dados.manchete, largura)) {
    ctx.fillText(linha, margem, y);
    y += 92;
  }

  y += 50;
  for (const item of dados.linhas) {
    ctx.fillStyle = COR.tinta;
    ctx.font = `600 44px ${SANS}`;
    ctx.fillText(item.nome, margem, y);
    const valor = item.percentual === null ? 'sem comparação' : `${item.percentual}%`;
    ctx.font = `600 44px ${SANS}`;
    ctx.textAlign = 'right';
    ctx.fillText(valor, L - margem, y);
    ctx.textAlign = 'left';
    y += 32;
    barra(ctx, margem, y, largura, 28, COR.trilho);
    if (item.percentual)
      barra(ctx, margem, y, Math.max(28, (largura * item.percentual) / 100), 28, COR.acento);
    y += 110;
  }

  ctx.fillStyle = COR.suave;
  ctx.font = `400 32px ${SANS}`;
  const rodape = [
    `Resultado baseado em ${dados.respondidas} de ${dados.total} propostas.`,
    'Não é recomendação de voto: só mostra a proximidade entre',
    'minhas respostas e os planos de governo registrados no TSE.',
  ];
  let yr = fim - 260;
  for (const linha of rodape) {
    ctx.fillText(linha, margem, yr);
    yr += 46;
  }

  ctx.strokeStyle = COR.linha;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margem, fim - 110);
  ctx.lineTo(L - margem, fim - 110);
  ctx.stroke();

  ctx.fillStyle = COR.tinta;
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText(`Faça o seu: ${dados.endereco}`, margem, fim - 58);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar imagem'))),
      'image/png',
    ),
  );
}

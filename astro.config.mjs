// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: 'https://votosemtorcida.com.br',
  output: 'static', // sem servidor = sem superfície de ataque de backend
  markdown: { syntaxHighlight: false }, // o site não exibe código; evita estilos inline
  integrations: [svelte(), sitemap()],
  vite: { plugins: [tailwindcss()] },

  // CSP nativa do Astro 6: gera hashes de todo script/estilo que o Astro emite,
  // então NENHUM script inline ou de terceiro roda sem estar no build.
  // Obs.: só vale no build/preview, não no `astro dev`.
  security: {
    csp: {
      algorithm: 'SHA-384',
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:", // data/blob: card de resultado gerado no navegador
        "font-src 'self'", // fontes self-hosted (sem Google Fonts = sem vazar IP do eleitor)
        "connect-src 'self'", // o quiz não conversa com nenhum servidor externo
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        'upgrade-insecure-requests',
      ],
    },
  },
});
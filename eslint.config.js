import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default defineConfig(
  { ignores: ['dist/', '.astro/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.strict,
  astro.configs.recommended,
  svelte.configs.recommended,
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.svelte'] },
    },
  },
  {
    // Scripts de manutenção rodam no Node, não no navegador.
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      // Execução de código dinâmico: nunca
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      // Equivalente ao innerHTML: abre porta para XSS
      'svelte/no-at-html-tags': 'error',

      // Privacidade por design: as respostas do eleitor NUNCA saem do navegador
      // nem ficam salvas nele. Se um dia precisar, isso vira decisão explícita.
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'O quiz não faz requisições de rede.' },
        { name: 'XMLHttpRequest', message: 'O quiz não faz requisições de rede.' },
        { name: 'localStorage', message: 'Não persistimos respostas do eleitor.' },
        { name: 'sessionStorage', message: 'Não persistimos respostas do eleitor.' },
        { name: 'indexedDB', message: 'Não persistimos respostas do eleitor.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'navigator', property: 'sendBeacon', message: 'Sem telemetria.' },
        { object: 'document', property: 'cookie', message: 'O site não usa cookies.' },
        { object: 'window', property: 'localStorage', message: 'Não persistimos respostas.' },
      ],
    },
  },
);

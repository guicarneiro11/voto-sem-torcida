# Quiz eleitoral — starter (testado com Astro 7.3, pnpm 10.34, Node 22)

```bash
pnpm create astro@latest quiz-eleitoral --template minimal
cd quiz-eleitoral
pnpm astro add svelte tailwind --yes
# copie os arquivos deste starter por cima (menos este README)
pnpm add -D @astrojs/check vitest eslint @eslint/js typescript-eslint eslint-plugin-astro \
  eslint-plugin-svelte globals prettier prettier-plugin-astro prettier-plugin-svelte \
  prettier-plugin-tailwindcss
```

Scripts do package.json:
```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "check": "astro check",
  "lint": "eslint .",
  "test": "vitest run --passWithNoTests",
  "format": "prettier --write .",
  "astro": "astro"
}
```

Validação: `pnpm check && pnpm lint && pnpm test && pnpm build && pnpm preview`

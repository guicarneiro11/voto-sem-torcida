import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { CANDIDATO_IDS } from './data/candidatos';

// Toda posição precisa de fonte verificável. Se o JSON violar qualquer regra,
// o BUILD FALHA: conteúdo sem fonte nunca chega em produção.
const fonte = z
  .object({
    tipo: z.enum(['plano_tse', 'declaracao', 'votacao']),
    url: z.url({ protocol: /^https$/, error: 'Fonte precisa ser uma URL HTTPS' }),
    veiculo: z.string().min(2),
    pagina: z.number().int().positive().optional(),
    acessadoEm: z.iso.date({ error: 'Use o formato AAAA-MM-DD' }),
  })
  .refine((f) => f.tipo !== 'plano_tse' || f.pagina !== undefined, {
    message: 'Fonte do plano do TSE precisa informar a página do PDF',
  });

const posicao = z
  .object({
    valor: z.enum(['a_favor', 'contra', 'neutro', 'sem_posicao']),
    fontes: z.array(fonte),
  })
  .refine((p) => p.valor === 'sem_posicao' || p.fontes.length > 0, {
    message: 'Posição definida exige ao menos uma fonte',
  });

const afirmacoes = defineCollection({
  loader: file('src/data/afirmacoes.json'),
  schema: z
    .object({
      id: z.string().regex(/^[a-z0-9-]+$/),
      tema: z.enum([
        'economia', 'trabalho', 'impostos', 'seguranca', 'educacao',
        'saude', 'estado', 'meio-ambiente', 'social',
      ]),
      titulo: z.string().min(10).max(140),
      explicacao: z.string().min(40).max(700), // linguagem simples, sem opinião
      posicoes: z.record(z.string(), posicao),
    })
    .superRefine((a, ctx) => {
      // Simetria: toda afirmação tem entrada para TODOS os candidatos (nem que seja sem_posicao)
      for (const id of CANDIDATO_IDS) {
        if (!(id in a.posicoes)) {
          ctx.addIssue({ code: 'custom', message: `Falta a posição de "${id}"` });
        }
      }
      for (const id of Object.keys(a.posicoes)) {
        if (!(CANDIDATO_IDS as readonly string[]).includes(id)) {
          ctx.addIssue({ code: 'custom', message: `Candidato desconhecido: "${id}"` });
        }
      }
    }),
});

export const collections = { afirmacoes };

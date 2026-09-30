// Fonte única da lista de candidatos. Trocar aqui após o resultado do 1º turno.
export const CANDIDATOS = [
  { id: 'lula', nome: 'Lula', partido: 'PT', numero: 13 },
  { id: 'flavio', nome: 'Flávio Bolsonaro', partido: 'PL', numero: 22 },
] as const;

export type CandidatoId = (typeof CANDIDATOS)[number]['id'];
export const CANDIDATO_IDS = CANDIDATOS.map((c) => c.id);

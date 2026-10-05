import { describe, expect, it } from 'vitest';
import { crc16, gerarPixCopiaECola } from './pix';

describe('PIX Copia e Cola', () => {
  it('calcula o CRC16 igual ao exemplo do manual do Banco Central', () => {
    const exemplo =
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304';
    expect(crc16(exemplo)).toBe('1D3D');
  });

  it('gera o payload com a chave, o nome e a cidade normalizados', () => {
    const payload = gerarPixCopiaECola({
      chave: '123e4567-e12b-12d1-a456-426655440000',
      nome: 'José da Silva',
      cidade: 'Jaú',
    });
    expect(payload).toContain('0136123e4567-e12b-12d1-a456-426655440000');
    expect(payload).toContain('5913JOSE DA SILVA');
    expect(payload).toContain('6003JAU');
    expect(payload.slice(-8, -4)).toBe('6304');
    expect(crc16(payload.slice(0, -4))).toBe(payload.slice(-4));
  });

  it('abrevia nomes do meio quando o nome não cabe em 25 caracteres', () => {
    const payload = gerarPixCopiaECola({
      chave: 'abc',
      nome: 'Guilherme Henrique Carneiro',
      cidade: 'Jaú',
    });
    expect(payload).toContain('5920GUILHERME H CARNEIRO');
  });

  it('respeita os tamanhos máximos de nome (25) e cidade (15)', () => {
    const payload = gerarPixCopiaECola({
      chave: 'abc',
      nome: 'Um Nome Muito Comprido Demais Para o Campo',
      cidade: 'Cidade Com Nome Enorme',
    });
    const tamanhoNome = Number(payload.match(/5802BR59(\d{2})/)?.[1]);
    expect(tamanhoNome).toBeLessThanOrEqual(25);
    expect(payload).toContain('6015CIDADE COM NOME62');
  });
});

/**
 * Gera o "PIX Copia e Cola" estático (BR Code) seguindo o padrão EMV do Banco Central.
 * Sem valor definido: quem doa escolhe o valor no próprio app do banco.
 */

function campo(id: string, valor: string): string {
  return `${id}${valor.length.toString().padStart(2, '0')}${valor}`;
}

/** Remove acentos e caracteres fora do conjunto aceito, e corta no tamanho máximo. */
function normalizar(texto: string, max: number): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .slice(0, max)
    .trim();
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63. */
export function crc16(dados: string): string {
  let crc = 0xffff;
  for (let i = 0; i < dados.length; i++) {
    crc ^= dados.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Abrevia nomes do meio quando o nome completo não cabe: "Guilherme Henrique Carneiro" vira "GUILHERME H CARNEIRO". */
function nomeRecebedor(nome: string): string {
  const completo = normalizar(nome, 99);
  if (completo.length <= 25) return completo;
  const partes = completo.split(/\s+/);
  if (partes.length < 3) return completo.slice(0, 25).trim();
  const meio = partes.slice(1, -1).map((p) => p[0]);
  return [partes[0], ...meio, partes.at(-1)].join(' ').slice(0, 25).trim();
}

export interface DadosPix {
  chave: string;
  nome: string;
  cidade: string;
}

export function gerarPixCopiaECola({ chave, nome, cidade }: DadosPix): string {
  const contaRecebedor = campo('00', 'br.gov.bcb.pix') + campo('01', chave);
  const semCrc =
    campo('00', '01') +
    campo('26', contaRecebedor) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('58', 'BR') +
    campo('59', nomeRecebedor(nome)) +
    campo('60', normalizar(cidade, 15)) +
    campo('62', campo('05', '***')) +
    '6304';
  return semCrc + crc16(semCrc);
}

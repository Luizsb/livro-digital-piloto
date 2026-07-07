/** Pluralização correta em português (evita "sessãoões"). */
export function pluralSessao(count: number): string {
  return count === 1 ? 'sessão' : 'sessões';
}

export function pluralValida(count: number): string {
  return count === 1 ? 'válida' : 'válidas';
}

export function pluralParticipante(count: number): string {
  return count === 1 ? 'participante' : 'participantes';
}

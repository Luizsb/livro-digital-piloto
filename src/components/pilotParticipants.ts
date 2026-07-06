export interface PilotParticipant {
  id: string;
  name: string;
}

/** Participantes do teste interno — ordem alfabética por nome. */
export const PILOT_PARTICIPANTS: PilotParticipant[] = [
  { id: 'P01', name: 'Andressa' },
  { id: 'P02', name: 'Breno' },
  { id: 'P03', name: 'Daniel' },
  { id: 'P04', name: 'Danielle' },
  { id: 'P05', name: 'Diego' },
  { id: 'P06', name: 'João' },
  { id: 'P07', name: 'Juliana' },
  { id: 'P08', name: 'Luigi' },
  { id: 'P09', name: 'Mariana Michels' },
  { id: 'P10', name: 'Mariana Pitombeira' },
  { id: 'P11', name: 'Nayara' },
  { id: 'P12', name: 'Nick' },
  { id: 'P13', name: 'Thiago' },
];

export function getPilotParticipantName(participantId: string | null): string | null {
  if (!participantId) return null;
  return PILOT_PARTICIPANTS.find((p) => p.id === participantId)?.name ?? null;
}

export function isPilotParticipantId(participantId: string): boolean {
  return PILOT_PARTICIPANTS.some((p) => p.id === participantId);
}

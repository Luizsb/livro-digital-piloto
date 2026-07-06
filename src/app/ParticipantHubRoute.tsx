import { FormEvent, useState } from 'react';
import { useAnalytics } from '@analytics/SessionProvider';
import ProjectHubPage from '@app/ProjectHubPage';

function extractParticipantNumber(participantId: string | null): string {
  if (!participantId) return '';
  const match = participantId.match(/^P(\d{2})$/i);
  return match ? match[1] : '';
}

/** Hub do projeto acessível via #/projeto (com ou sem sessão ativa). */
export default function ParticipantHubRoute() {
  const { participantId, setParticipantId } = useAnalytics();
  const [participantNumber, setParticipantNumber] = useState(() =>
    extractParticipantNumber(participantId),
  );
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!participantNumber) {
      setError('Informe o número do participante (ex.: 01, 02, 03…)');
      return;
    }
    const code = `P${participantNumber.padStart(2, '0')}`;
    const ok = setParticipantId(code);
    if (!ok) {
      setError('Use um número de 01 a 99.');
      return;
    }
    setError('');
    window.location.hash = '#/';
  };

  const handleNumberChange = (raw: string) => {
    setParticipantNumber(raw.replace(/\D/g, '').slice(0, 2));
    setError('');
  };

  return (
    <ProjectHubPage
      participantNumber={participantNumber}
      onParticipantNumberChange={handleNumberChange}
      onSubmit={handleSubmit}
      error={error}
      participantId={participantId}
    />
  );
}

import { FormEvent } from 'react';
import { PILOT_PARTICIPANTS } from './pilotParticipants';

interface TestPilotGateProps {
  selectedParticipantId: string;
  onParticipantSelect: (participantId: string) => void;
  onSubmit: (event: FormEvent) => void;
  error?: string;
}

export function TestPilotGate({
  selectedParticipantId,
  onParticipantSelect,
  onSubmit,
  error,
}: TestPilotGateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#80298F]/20 bg-white p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#80298F]">Teste piloto</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">História · Capítulo 07</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Selecione seu nome para iniciar. Ao terminar, use{' '}
          <strong className="font-semibold text-slate-800">Finalizar teste</strong> e exporte o
          relatório JSON para enviar à equipe.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="pilot-participant" className="mb-1.5 block text-sm font-medium text-slate-700">
              Participante
            </label>
            <select
              id="pilot-participant"
              value={selectedParticipantId}
              onChange={(event) => onParticipantSelect(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-900 outline-none ring-[#80298F]/30 focus:border-[#80298F] focus:ring-2"
            >
              <option value="">Selecione seu nome</option>
              {PILOT_PARTICIPANTS.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={!selectedParticipantId}
            className="w-full rounded-lg bg-[#80298F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6b2278] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Iniciar teste
          </button>
        </form>
      </div>
    </div>
  );
}

export default TestPilotGate;

import { useState } from 'react';
import { useStoredEvents } from '../ld/useStoredEvents';
import EventReportPanel from './EventReportPanel';

function EventsPanelButton() {
  const [open, setOpen] = useState(false);
  const events = useStoredEvents();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[#80298F] bg-white px-4 py-2 text-sm font-semibold text-[#80298F] shadow-lg transition hover:bg-[#80298F]/5"
        title="Visualizar eventos coletados em tempo real"
      >
        Ver eventos ({events.length})
      </button>
      {open ? <EventReportPanel events={events} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export default EventsPanelButton;

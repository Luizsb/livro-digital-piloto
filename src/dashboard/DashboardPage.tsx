import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { parseReportFile, parseMultipleReportFiles, ReportParseError } from './parseReport';
import type { DashboardViewMode, GroupReport, ParsedDashboardReport } from './types';
import { aggregateSessionReports } from './buildGroupReport';
import { downloadGroupReportJson } from './exportGroupReport';
import {
  downloadGroupReportCsv,
  downloadGroupReportPdf,
} from './exportGroupReportSchool';
import GroupReportContent from './GroupReportContent';
import SessionReportContent from './SessionReportContent';
import { ScrollToTopButton } from '@shared/components/ScrollToTopButton';
import { pluralSessao } from '@shared/lib/pluralizePt';
import { formatExportedAt } from './reportExtractors';

function IconDownload({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.69L6.3 8.49a.75.75 0 0 0-1.1 1.02l4.25 4.5c.3.32.8.32 1.1 0l4.25-4.5a.75.75 0 1 0-1.1-1.02l-2.95 3.12V2.75Z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
  );
}

function IconSwap({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M13.2 3.2a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06L14.94 7.5H5.75a.75.75 0 0 1 0-1.5h9.19l-1.74-1.74a.75.75 0 0 1 0-1.06ZM6.8 10.2a.75.75 0 0 1 0 1.06L5.06 13H14.25a.75.75 0 0 1 0 1.5H5.06l1.74 1.74a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3a.75.75 0 0 1 1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconHome({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3H9v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function GroupExportMenu({ report }: { report: GroupReport }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const exportOptions = [
    {
      id: 'json',
      label: 'JSON consolidado',
      hint: 'Arquivo completo do relatório',
      run: () => downloadGroupReportJson(report),
    },
    {
      id: 'csv',
      label: 'CSV (escola / BI)',
      hint: 'KPIs, heatmap e participantes',
      run: () => downloadGroupReportCsv(report),
    },
    {
      id: 'pdf',
      label: 'PDF resumido',
      hint: 'Para enviar sem o dashboard',
      run: () => downloadGroupReportPdf(report),
    },
  ] as const;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        <IconDownload />
        Exportar
        <svg
          className={`size-3.5 transition ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {exportOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitem"
              onClick={() => {
                option.run();
                setOpen(false);
              }}
              className="flex w-full flex-col px-4 py-2.5 text-left transition hover:bg-[#F9DDFF]/50"
            >
              <span className="text-sm font-semibold text-slate-900">{option.label}</span>
              <span className="text-xs text-slate-500">{option.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function IconUser({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
    </svg>
  );
}

function IconUsers({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM2.845 12.152A5.002 5.002 0 0 1 7.5 10.5h5a5.002 5.002 0 0 1 4.655 1.652 1.5 1.5 0 0 1-.327 2.146A9.96 9.96 0 0 1 10 17.5a9.96 9.96 0 0 1-6.828-2.702 1.5 1.5 0 0 1-.327-2.146Z" />
    </svg>
  );
}

function DashboardPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<DashboardViewMode>('single');
  const [parsed, setParsed] = useState<ParsedDashboardReport | null>(null);
  const [groupSessions, setGroupSessions] = useState<ParsedDashboardReport[]>([]);
  const [groupLoadErrors, setGroupLoadErrors] = useState<{ fileName: string; message: string }[]>(
    [],
  );
  const [includeDubiousSessions, setIncludeDubiousSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const filteredGroupReport = useMemo(
    () => aggregateSessionReports(groupSessions, groupLoadErrors),
    [groupSessions, groupLoadErrors],
  );
  const fullGroupReport = useMemo(
    () =>
      aggregateSessionReports(groupSessions, groupLoadErrors, {
        includeLowQualitySessions: true,
      }),
    [groupSessions, groupLoadErrors],
  );
  const groupReport = includeDubiousSessions ? fullGroupReport : filteredGroupReport;

  useEffect(() => {
    setIncludeDubiousSessions(false);
  }, [groupSessions]);

  const handleSingleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const result = await parseReportFile(file);
      setParsed(result);
      setGroupSessions([]);
      setGroupLoadErrors([]);
    } catch (err) {
      setParsed(null);
      setError(
        err instanceof ReportParseError
          ? err.message
          : 'Não foi possível carregar o relatório.',
      );
    }
  };

  const handleGroupFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);
    const result = await parseMultipleReportFiles(files);
    setGroupSessions(result.sessions);
    setGroupLoadErrors(result.loadErrors);
    setParsed(null);

    if (result.sessions.length === 0) {
      setError(
        result.loadErrors.length > 0
          ? 'Nenhum JSON válido no lote. Verifique os arquivos selecionados.'
          : 'Selecione ao menos um arquivo JSON.',
      );
      return;
    }
  };

  const filterJsonFiles = (files: File[]): File[] =>
    files.filter(
      (file) =>
        file.name.toLowerCase().endsWith('.json') || file.type === 'application/json',
    );

  const handleFiles = (files: File[]) => {
    const jsonFiles = filterJsonFiles(files);
    if (jsonFiles.length === 0) {
      setError('Selecione ao menos um arquivo .json exportado pelo piloto.');
      return;
    }
    if (jsonFiles.length >= 2) {
      setMode('group');
      void handleGroupFiles(jsonFiles);
      return;
    }
    setMode('single');
    void handleSingleFile(jsonFiles[0] ?? null);
  };

  const handleFileInput = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleFiles([...files]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const related = event.relatedTarget as Node | null;
    if (!event.currentTarget.contains(related)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFiles([...event.dataTransfer.files]);
  };

  const switchMode = (next: DashboardViewMode) => {
    setMode(next);
    setError(null);
    setParsed(null);
    setGroupSessions([]);
    setGroupLoadErrors([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const hasContent = mode === 'single' ? parsed !== null : groupSessions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <header className="border-b border-[#80298F]/20 bg-gradient-to-r from-[#80298F] to-[#9B4DAB] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              LD Insights
            </p>
            <h1 className="text-2xl font-bold">Dashboard do Livro Digital</h1>
            {hasContent ? (
              <p className="mt-1 text-sm text-white/90">
                {mode === 'group' ? (
                  <>
                    Relatório de grupo · {groupReport.book_id} · {groupReport.chapter_id} ·{' '}
                    {groupReport.valid_sessions_count}{' '}
                    {pluralSessao(groupReport.valid_sessions_count)}
                  </>
                ) : (
                  <>
                    Relatório individual · {parsed!.report.book_id} · {parsed!.report.chapter_id}
                    {parsed!.report.exported_at
                      ? ` · ${formatExportedAt(parsed!.report.exported_at)}`
                      : ''}
                  </>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/90">
                {mode === 'group'
                  ? 'Carregue vários JSONs — visão executiva ou consolidada'
                  : 'Carregue um JSON exportado pelo piloto'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              multiple
              className="hidden"
              onChange={(e) => handleFileInput(e.target.files)}
            />
            {mode === 'group' && groupSessions.length > 0 ? (
              <GroupExportMenu report={groupReport} />
            ) : null}
            {hasContent ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <IconSwap />
                {mode === 'group' ? 'Trocar lote' : 'Trocar arquivo'}
              </button>
            ) : null}
            <a
              href="#/projeto"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#80298F] shadow-sm transition hover:bg-[#F9DDFF]"
            >
              <IconHome />
              Voltar à home
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Tipo de relatório</p>
            <p className="text-xs text-slate-500">
              {mode === 'group'
                ? '7 visões: estratégia, jornada, pedagogia, produto, recursos, QA e IA'
                : 'Consolidado, timeline, recursos digitais ou técnico & QA'}
            </p>
          </div>
          <div className="flex w-fit rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => switchMode('single')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                mode === 'single'
                  ? 'bg-[#80298F] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <IconUser />
              1 sessão
            </button>
            <button
              type="button"
              onClick={() => switchMode('group')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                mode === 'group'
                  ? 'bg-[#80298F] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <IconUsers />
              Grupo
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-red-800">
            {error}
          </div>
        ) : null}

        {!hasContent && !error ? (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-16 text-center shadow-sm transition ${
              isDragOver
                ? 'border-[#80298F] bg-[#F9DDFF]/40 ring-2 ring-[#80298F]/25'
                : 'border-[#80298F]/30 bg-white hover:border-[#80298F]/50 hover:bg-[#F9DDFF]/10'
            }`}
          >
            <p className="text-lg font-semibold text-slate-800">
              {isDragOver
                ? 'Solte os arquivos aqui'
                : mode === 'group'
                  ? 'Nenhum lote carregado'
                  : 'Nenhum relatório carregado'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {mode === 'group' ? (
                <>
                  Exporte um JSON por participante no piloto e arraste ou selecione dois ou mais
                  arquivos para o relatório de grupo.
                </>
              ) : (
                <>
                  Exporte os eventos no piloto e selecione um JSON — vários arquivos abrem o modo
                  grupo automaticamente.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
              className="mt-6 rounded-full bg-[#80298F] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#6b2278]"
            >
              {mode === 'group' ? 'Selecionar JSONs (.json)' : 'Selecionar arquivo(s) .json'}
            </button>
          </div>
        ) : null}

        {mode === 'single' && parsed ? <SessionReportContent parsed={parsed} /> : null}
        {mode === 'group' && groupSessions.length > 0 ? (
          <GroupReportContent
            analyticalReport={filteredGroupReport}
            fullReport={fullGroupReport}
            includeDubiousSessions={includeDubiousSessions}
            onIncludeDubiousSessionsChange={setIncludeDubiousSessions}
          />
        ) : null}
      </main>
      {hasContent ? <ScrollToTopButton /> : null}
    </div>
  );
}

export default DashboardPage;

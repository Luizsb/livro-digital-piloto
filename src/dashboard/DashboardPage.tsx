import { useMemo, useRef, useState, type DragEvent } from 'react';
import { parseReportFile, parseMultipleReportFiles, ReportParseError } from './parseReport';
import type { DashboardViewMode, ParsedDashboardReport } from './types';
import { aggregateSessionReports } from './buildGroupReport';
import { downloadGroupReportJson } from './exportGroupReport';
import GroupReportContent from './GroupReportContent';
import SessionReportContent from './SessionReportContent';
import { ScrollToTopButton } from '@shared/components/ScrollToTopButton';
import { pluralSessao } from '@shared/lib/pluralizePt';
import { formatExportedAt } from './reportExtractors';

function DashboardPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<DashboardViewMode>('single');
  const [parsed, setParsed] = useState<ParsedDashboardReport | null>(null);
  const [groupSessions, setGroupSessions] = useState<ParsedDashboardReport[]>([]);
  const [groupLoadErrors, setGroupLoadErrors] = useState<{ fileName: string; message: string }[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const groupReport = useMemo(
    () => aggregateSessionReports(groupSessions, groupLoadErrors),
    [groupSessions, groupLoadErrors],
  );

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
            {hasContent ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {mode === 'group' ? 'Trocar lote' : 'Trocar arquivo'}
              </button>
            ) : null}
            {mode === 'group' && groupSessions.length > 0 ? (
              <button
                type="button"
                onClick={() => downloadGroupReportJson(groupReport)}
                className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Exportar JSON consolidado
              </button>
            ) : null}
            <a
              href="#/projeto"
              className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
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
                ? 'Executivo, consolidado, recursos ou técnico & QA'
                : 'Consolidado, recursos digitais ou técnico & QA'}
            </p>
          </div>
          <div className="flex w-fit rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => switchMode('single')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                mode === 'single'
                  ? 'bg-[#80298F] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              1 sessão
            </button>
            <button
              type="button"
              onClick={() => switchMode('group')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                mode === 'group'
                  ? 'bg-[#80298F] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
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
          <GroupReportContent report={groupReport} />
        ) : null}
      </main>
      {hasContent ? <ScrollToTopButton /> : null}
    </div>
  );
}

export default DashboardPage;

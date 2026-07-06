function ContinuaProximaPagina() {
  return (
    <div className="flex items-center justify-center gap-2" style={{ marginTop: '1.5rem', minHeight: '2rem' }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-[#D98817] px-4 py-2 
                   text-white text-sm font-semibold -bottom-3"
        style={{
          fontFamily: 'Ubuntu',
        }}
      >
        continua na próxima página
      </div>
    </div>
  );
}

export default ContinuaProximaPagina;


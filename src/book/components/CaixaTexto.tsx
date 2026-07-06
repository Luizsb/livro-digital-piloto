import { ReactNode } from 'react';

interface CaixaTextoProps {
  title?: string;
  children: ReactNode;
  backgroundColor?: string;
  columns?: number;
}

function CaixaTexto({ title, children, columns }: CaixaTextoProps) {
  const contentStyle: React.CSSProperties = {
    ...(columns && columns > 1 ? {
      // columnCount: columns,
      columnGap: '2rem',
      columnFill: 'auto',
    } : {}),
  };

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: '#FFF8EB',
      }}
      className="p-4 my-4"
    >
      {title && (
        <h4
          style={{
            color: '#BF3154',
            fontFamily: 'myriad-vf',
            fontSize: '20px',
            fontStyle: 'normal',
            fontWeight: 700,
            lineHeight: 'normal',
          }}
          className="mb-4"
        >
          {title}
        </h4>
      )}
      <div className="texto-corrido" style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

export default CaixaTexto;


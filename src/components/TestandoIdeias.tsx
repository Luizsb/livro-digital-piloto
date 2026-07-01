import { publicUrl } from '../lib/publicUrl';

function TestandoIdeias() {
    return (
      <div className="flex items-center gap-3 my-6">
        <img
          src={publicUrl('images/testandoIdeias.png')}
          alt="Testando as ideias"
          className="object-contain"
        />
        <h2
          style={{
            color: '#00000',
            fontFamily: "'Filson Soft', sans-serif",
            fontSize: '20px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 'normal',
            textTransform: 'uppercase',
          }}
        >
          Testando as ideias
        </h2>
      </div>
    );
  }
  
  export default TestandoIdeias;
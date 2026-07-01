import { publicUrl } from '../lib/publicUrl';

function AgoraVoceJaSabe() {
    return (
      <div className="flex items-center gap-3 my-6">
        <img
          src={publicUrl('images/agoraVoceJaSabe.png')}
          alt="Agora você já sabe"
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
          Agora você já sabe
        </h2>
      </div>
    );
  }
  
  export default AgoraVoceJaSabe;
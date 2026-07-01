import { publicUrl } from '../lib/publicUrl';

function ConversaVai() {
    return (
      <div className="flex items-center gap-3 my-6">
        <img
          src={publicUrl('images/conversaVai.png')}
          alt="Conversa vai"
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
          Conversa vai
        </h2>
      </div>
    );
  }
  
  export default ConversaVai;
import { publicUrl } from '../lib/publicUrl';

function Footer() {
    return (
        <footer style={{
            backgroundColor: '#FFF', display: 'flex',
            boxShadow: '0 -2px 16.5px 0 rgba(0, 0, 0, 0.25)',
            // width: '939px',
            height: '150px',
            paddingBottom: '10px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
        }}>
            <img src={publicUrl('images/SAELogo.png')} alt="Logo" style={{ width: '115px', height: '45px' }} />
            <p className="font-myriad-vf" style={{
                color: '#000',
                textAlign: 'center',
                fontSize: '12px',
                fontStyle: 'normal',
                fontWeight: '400',
                lineHeight: 'normal',
                
            }}>
                É um Selo Editorial da Companhia Brasileira de Educação e
                Sistemas de Ensino S.A
            </p>
        </footer>
    );
}

export default Footer;


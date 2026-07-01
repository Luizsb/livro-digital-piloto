import { Button } from './Button.js';
import SoundManager from '../managers/SoundManager.js';

export class FeedbackPositivo {
    constructor(
        scene,
        titulo = 'MUITO BEM!',
        texto = 'PARABENS, VOCE ACERTOU!',
        isFinal = false,
        props = {}
    ) {
        if (typeof isFinal === 'object' && isFinal !== null) {
            props = isFinal;
            isFinal = !!props.isFinal;
        }

        this.scene = scene;
        this.isVisible = false;
        this.titulo = titulo;
        this.texto = texto;
        this.isFinal = isFinal;
        this.props = props || {};
        this.buttonText = this.props.buttonText || (this.isFinal ? 'JOGAR NOVAMENTE' : 'VAMOS LA');
        this.onButtonClick = this.props.onButtonClick || null;
        this.create();
    }

    create() {
        this.background = this.scene.add.rectangle(0, 0, 1920, 1080, 0x000000);
        this.background.setAlpha(0.8);
        this.background.setOrigin(0, 0);
        this.background.setInteractive();

        this.imageBox = this.scene.add.image(1920 / 2, 1080 / 2, 'modalFeedbackPositivo').setOrigin(0.5, 0.5);

        // this.digi = this.scene.add.image(
        //     this.imageBox.x + (this.imageBox.width / 2) - 185,
        //     this.imageBox.y + (this.imageBox.height / 2) - 190,
        //     'digiPositivo'
        // ).setOrigin(0.5);

        const titleStyle = {
            fontFamily: 'Nunito-ExtraBold',
            fontSize: '48px',
            color: '#FFFFFF',
            align: 'center',
            stroke: '#1F292D',
            strokeThickness: 12,
            fontStyle: 'normal',
            lineSpacing: 'normal'
        };

        const layoutConfig =  {
            titleY: this.imageBox.y - 150,
            textBoxY: this.imageBox.y
        };

        const title = this.scene.add.text(
            this.imageBox.x,
            layoutConfig.titleY,
            this.titulo,
            titleStyle
        ).setOrigin(0.5);

        const textBox = this.scene.add.rectangle(
            this.imageBox.x,
            layoutConfig.textBoxY,
            1137,
            400,
            0xFF0000
        ).setOrigin(0.5);
        textBox.setAlpha(0);

        const mainText = this.scene.add.dom(textBox.x, textBox.y).createFromHTML(`
            <div style="
                font-family: Nunito-SemiBold;
                font-size: 38px;
                font-weight: 800;
                color: #1F292D;
                text-align: center;
                width: 1137px;
                user-select: text;
                -webkit-user-select: text;
                white-space: pre-line;
                line-height: 52px;
            ">
                ${this.texto}
            </div>
        `);
        mainText.setOrigin(0.5);

        const buttonY = this.imageBox.y + (this.imageBox.height / 2) - 160;

        const button = new Button(this.scene, {
            text: this.buttonText
        });
        button.x = this.imageBox.x - (button.width / 2);
        button.y = buttonY - (button.height / 2);
        button.on('buttonClick', () => {
            if (typeof this.onButtonClick === 'function') {
                this.hide();
                this.onButtonClick(this);
                return;
            }
            if (this.isFinal) {
                this.hide();
                this.goToFirstScene();
            } else {
                this.hide();
            }
        });

        const containerChildren = [
            this.background,
            this.imageBox,
            title,
            textBox,
            mainText,
            button
        ];
        if (this.digi) {
            containerChildren.splice(2, 0, this.digi);
        }

        this.container = this.scene.add.container(0, 0, containerChildren.filter(Boolean));

        this.container.setVisible(false);
        this.container.setDepth(9999);
    }

    show() {
        this.container.setVisible(true);
        this.isVisible = true;
        SoundManager.play('acerto');
    }

    hide() {
        this.container.setVisible(false);
        this.isVisible = false;
    }

    goToFirstScene() {
        const controller = this.scene.controladorDeCenas || this.scene.game?.controladorDeCenas;
        if (controller?.mudarCena) {
            controller.mudarCena(0);
            return;
        }

        if (controller?.home) {
            controller.home();
            return;
        }

        if (controller?.cenas?.length) {
            controller.cenaAtualIndex = 0;
            this.scene.scene.start(controller.cenas[0].key);
            return;
        }

        this.scene.scene.start('Capa');
    }
}

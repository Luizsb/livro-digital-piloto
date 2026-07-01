import { BaseCena } from '../../js/library/base/BaseCena.js';
import { Button } from '../../js/library/components/Button.js';
import { ButtonIcon } from '../../js/library/components/ButtonIcon.js';

export class Intro extends BaseCena {
    constructor(controladorDeCenas) {
        super('Intro');
        this.controladorDeCenas = controladorDeCenas;
        this.loaded = false;
        this.bgKeys = ['intro1', 'intro2', 'intro3'];
        this.currentBgIndex = 0;
    }

    create() {
        this.currentBgIndex = 0;
        this.background = this.add.image(0, 0, this.bgKeys[this.currentBgIndex]).setOrigin(0, 0);

        this.nextButton = new ButtonIcon(this, {
            iconKey: 'iconRight'
        });
        this.nextButton.x = 1182 - this.nextButton.width;
        this.nextButton.y = 882;
        this.nextButton.on('buttonClick', () => {
            this.goToNextBackground();
        });

        this.previousButton = new ButtonIcon(this, {
            iconKey: 'iconLeft'
        });
        this.previousButton.x = 370 - this.previousButton.width;
        this.previousButton.y = 882;
        this.previousButton.on('buttonClick', () => {
            this.goToPreviousBackground();
        });

        this.startButton = new Button(this, {
            text: 'COMEÇAR'
        });
        this.startButton.x = 1182 - this.startButton.width;
        this.startButton.y = 882;
        this.startButton.on('buttonClick', () => {
            this.controladorDeCenas.proximaCena(3);
        });

        this.updateBackgroundAndButtons();

        super.create();
    }

    goToNextBackground() {
        if (this.currentBgIndex >= this.bgKeys.length - 1) {
            return;
        }

        this.currentBgIndex += 1;
        this.updateBackgroundAndButtons();
    }

    goToPreviousBackground() {
        if (this.currentBgIndex <= 0) {
            return;
        }

        this.currentBgIndex -= 1;
        this.updateBackgroundAndButtons();
    }

    updateBackgroundAndButtons() {
        const isFirst = this.currentBgIndex === 0;
        const isLast = this.currentBgIndex === this.bgKeys.length - 1;
        const hasPrevious = !isFirst;
        const hasNext = !isLast;

        this.background.setTexture(this.bgKeys[this.currentBgIndex]);
        this.nextButton.setVisible(hasNext);
        this.previousButton.setVisible(hasPrevious);
        this.startButton.setVisible(isLast);
    }
}

export default Intro;

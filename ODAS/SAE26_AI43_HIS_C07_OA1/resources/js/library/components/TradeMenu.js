import SoundManager from '../managers/SoundManager.js';

export class TradeMenu extends Phaser.GameObjects.Container {
  constructor(scene, config = {}) {
    super(scene, 0, 0);

    this.scene = scene;
    this.config = {
      topOffset: 220,
      gap: 32,
      clickOffsetBottom: 206,
      clickOffsetRight: 184,
      tutorialMode: false,
      onCardClick: null,
      ...config
    };

    this.create();
    this.scene.add.existing(this);
  }

  create() {
    this.background = this.scene.add.image(0, 0, 'objectsContainerTrocas').setOrigin(0, 0);
    this.add(this.background);

    this.cardsContainer = this.scene.add.container(this.background.width / 2, this.config.topOffset);
    this.add(this.cardsContainer);

    this.comercianteContainer = this.createCardContainer('objectsCartasComerciante', 'comerciante');
    this.jogadorContainer = this.createCardContainer('objectsCartasJogador', 'jogador');

    const cardWidth = this.comercianteContainer.width;
    const totalWidth = (cardWidth * 2) + this.config.gap;
    const firstX = -totalWidth / 2;

    this.comercianteContainer.setPosition(firstX, 0);
    this.jogadorContainer.setPosition(firstX + cardWidth + this.config.gap, 0);

    this.cardsContainer.add([this.comercianteContainer, this.jogadorContainer]);

    this.setSize(this.background.width, this.background.height);

    if (this.config.tutorialMode) {
      this.showOnlyComerciante();
    }
  }

  createCardContainer(cardAssetKey, type) {
    const cardContainer = this.scene.add.container(0, 0);

    const cardBackground = this.scene.add.image(0, 0, cardAssetKey)
      .setOrigin(0, 0)
      .setInteractive({ cursor: 'pointer' });
    cardContainer.add(cardBackground);

    const clickableCard = this.scene.add.image(
      cardBackground.width - this.config.clickOffsetRight,
      cardBackground.height - this.config.clickOffsetBottom,
      'objectsIconeCentroCarta'
    ).setOrigin(1, 1);

    cardBackground.on('pointerdown', () => {
      SoundManager.play('click', 1, false, () => {
        const payload = { type };

        if (typeof this.config.onCardClick === 'function') {
          this.config.onCardClick.call(this.scene, payload);
        }

        this.emit('cardClick', payload);
      });
    });

    cardContainer.add(clickableCard);
    cardContainer.setSize(cardBackground.width, cardBackground.height);
    cardContainer.cardBackground = cardBackground;
    cardContainer.clickableTarget = cardBackground;
    cardContainer.clickableCard = clickableCard;
    cardContainer.cardType = type;

    return cardContainer;
  }

  setOnCardClick(callback) {
    this.config.onCardClick = callback;
    return this;
  }

  showOnlyComerciante() {
    if (this.comercianteContainer) {
      this.comercianteContainer.setVisible(true);
      if (this.comercianteContainer.clickableTarget?.input) {
        this.comercianteContainer.clickableTarget.input.enabled = true;
      }
    }
    if (this.jogadorContainer) {
      this.jogadorContainer.setVisible(false);
      if (this.jogadorContainer.clickableTarget?.input) {
        this.jogadorContainer.clickableTarget.input.enabled = false;
      }
    }
    return this;
  }

  showBaseCards() {
    if (this.comercianteContainer) {
      this.comercianteContainer.setVisible(true);
      if (this.comercianteContainer.clickableTarget?.input) {
        this.comercianteContainer.clickableTarget.input.enabled = true;
      }
    }
    if (this.jogadorContainer) {
      this.jogadorContainer.setVisible(true);
      if (this.jogadorContainer.clickableTarget?.input) {
        this.jogadorContainer.clickableTarget.input.enabled = true;
      }
    }
    return this;
  }

  showOnlyJogador() {
    if (this.comercianteContainer) {
      this.comercianteContainer.setVisible(false);
      if (this.comercianteContainer.clickableTarget?.input) {
        this.comercianteContainer.clickableTarget.input.enabled = false;
      }
    }

    if (this.jogadorContainer) {
      this.jogadorContainer.setVisible(true);
      if (this.jogadorContainer.clickableTarget?.input) {
        this.jogadorContainer.clickableTarget.input.enabled = true;
      }
    }

    return this;
  }
}

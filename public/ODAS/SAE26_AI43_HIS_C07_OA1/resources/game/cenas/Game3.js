import { BaseCena } from "../../js/library/base/BaseCena.js";

// COMPONENTS
import { Banner } from "../../js/library/components/Banner.js";
import { Button } from "../../js/library/components/Button.js";
import { FeedbackErro } from "../../js/library/components/FeedbackErro.js";
import { ModalInfo } from "../../js/library/components/ModalInfo.js";
import SoundManager from "../../js/library/managers/SoundManager.js";
import { TradeStateManager } from "../../js/library/managers/TradeStateManager.js";

export class Game3 extends BaseCena {
  constructor(controladorDeCenas) {
    super("Game3");
    this.controladorDeCenas = controladorDeCenas;
    this.loaded = false;
    this.bgKeys = ["jogosDialogoFase3", "jogosBg"];
    this.currentBgIndex = 0;
    this.uiFadeInDuration = 450;
    this.flowStep = "idle";
    this.selectedChoice = null;
    this.pendingDiscardCardId = null;
    this.modalOverlay = null;
  }

  create() {
    super.create();

    TradeStateManager.init(this.game);

    this.currentBgIndex = 0;
    this.flowStep = "banner";
    this.selectedChoice = null;

    this.background = this.add.image(0, 0, "jogosBg").setOrigin(0, 0).setDepth(0);
    this.banner = new Banner(this, {
      fase: 3,
      topShadowHeight: 0,
      overlayAlpha: 0
    });

    this.continueButton = new Button(this, { text: "CONTINUAR" });
    this.choiceSeguroCard = this.add.image(0, 0, "objectsEscolhaSeguro").setOrigin(0, 0);
    this.choiceTempestadeCard = this.add.image(0, 0, "objectsEscolhaTempestade").setOrigin(0, 0);
    this.choiceSeguroButton = new Button(this, { text: "ESCOLHER" });
    this.choiceTempestadeButton = new Button(this, { text: "ESCOLHER" });

    this.enunciadoDescarte = this.add.image(0, 0, "objectsEnunciadoDescarte").setOrigin(0, 0);
    this.objectsTable = this.add.image(0, 0, "objectsTable").setOrigin(0, 0);
    this.cartasMContainer = this.createCartasMContainer();
    this.modalInfo = new ModalInfo(this, {
      modalKey: "modalSal",
      onSelect: this.handleDiscardModalSelect,
      onClose: this.handleDiscardModalClose
    });
    this.modalInfo.setDepth(10001);
    if (this.modalInfo.btSelecionar?.setText) {
      this.modalInfo.btSelecionar.setText("DESCARTAR");
      this.modalInfo.layoutContent();
    }
    this.modalOverlay = this.add.rectangle(
      0,
      0,
      this.getViewportWidth(),
      this.getViewportHeight(),
      0x000000,
      0.7
    )
      .setOrigin(0, 0)
      .setDepth(10000)
      .setVisible(false)
      .setAlpha(0)
      .setInteractive();
    this.feedbackErro = new FeedbackErro(this, {
      backgroundKey: "feedbackErroFase3",
      onBack: this.handleFeedbackErroBack,
      onClose: this.handleFeedbackErroClose
    });

    this.continueButton.on("buttonClick", this.handleContinueClick, this);
    this.choiceSeguroButton.on("buttonClick", this.handleEscolhaSeguroClick, this);
    this.choiceTempestadeButton.on("buttonClick", this.handleEscolhaTempestadeClick, this);

    this.choiceSeguroCard.setDepth(2);
    this.choiceTempestadeCard.setDepth(2);
    this.enunciadoDescarte.setDepth(2);
    this.objectsTable.setDepth(2);
    this.cartasMContainer.setDepth(2);
    this.continueButton.setDepth(3);
    this.choiceSeguroButton.setDepth(3);
    this.choiceTempestadeButton.setDepth(3);

    this.continueButton.setVisible(false);
    this.continueButton.setAlpha(0);
    this.choiceSeguroCard.setVisible(false);
    this.choiceSeguroCard.setAlpha(0);
    this.choiceTempestadeCard.setVisible(false);
    this.choiceTempestadeCard.setAlpha(0);
    this.choiceSeguroButton.setVisible(false);
    this.choiceSeguroButton.setAlpha(0);
    this.choiceTempestadeButton.setVisible(false);
    this.choiceTempestadeButton.setAlpha(0);
    this.enunciadoDescarte.setVisible(false);
    this.enunciadoDescarte.setAlpha(0);
    this.objectsTable.setVisible(false);
    this.objectsTable.setAlpha(0);
    this.cartasMContainer.setVisible(false);
    this.cartasMContainer.setAlpha(0);

    this.layoutComponents();

    if (typeof this.banner?.play === "function" && typeof this.banner?.resetAnimation === "function") {
      this.banner.resetAnimation();
      this.banner.play(3);
    }

    this.banner.once("bannerComplete", this.handleBannerComplete, this);
    this.scale.on("resize", this.layoutComponents, this);
    this.events.once("shutdown", () => {
      this.scale.off("resize", this.layoutComponents, this);
      this.banner.off("bannerComplete", this.handleBannerComplete, this);
      this.continueButton.off("buttonClick", this.handleContinueClick, this);
      this.choiceSeguroButton.off("buttonClick", this.handleEscolhaSeguroClick, this);
      this.choiceTempestadeButton.off("buttonClick", this.handleEscolhaTempestadeClick, this);
      if (this.modalInfo) {
        this.modalInfo.destroy();
        this.modalInfo = null;
      }
      if (this.feedbackErro) {
        this.feedbackErro.destroy();
        this.feedbackErro = null;
      }
      if (this.modalOverlay) {
        this.modalOverlay.destroy();
        this.modalOverlay = null;
      }
    });
  }

  createCartasMContainer() {
    const container = this.add.container(0, 0);
    container.setSize(0, 0);
    return container;
  }

  renderPlayerCardsForDiscard() {
    if (!this.cartasMContainer) {
      return;
    }

    this.cartasMContainer.removeAll(true);

    const playerCards = TradeStateManager.getPlayerCards(this.game);
    const gap = 40;
    let cursorX = 0;
    let maxHeight = 0;

    playerCards.forEach((cardId, index) => {
      const cardKey = TradeStateManager.getAssetKeyForCardId(cardId);
      const card = this.add.image(cursorX, 0, cardKey)
        .setOrigin(0, 0)
        .setInteractive({ cursor: "pointer" });

      card.on("pointerdown", () => {
        SoundManager.play("click", 1, false, () => {
          this.handleDiscardCardPressed(cardId);
        });
      });

      this.cartasMContainer.add(card);

      cursorX += card.displayWidth;
      if (index < playerCards.length - 1) {
        cursorX += gap;
      }

      maxHeight = Math.max(maxHeight, card.displayHeight);
    });

    this.cartasMContainer.setSize(cursorX, maxHeight);
    this.layoutComponents();
  }

  handleBannerComplete() {
    this.flowStep = "intro";
    this.currentBgIndex = 0;
    this.background.setTexture(this.bgKeys[this.currentBgIndex]);

    this.hideChoiceCards();
    this.hideDiscardSelectionAssets();

    this.continueButton.setVisible(true);
    this.continueButton.setAlpha(0);
    this.layoutComponents();

    this.tweens.add({
      targets: this.continueButton,
      alpha: 1,
      duration: this.uiFadeInDuration,
      ease: "Sine.Out"
    });
  }

  handleContinueClick() {
    if (this.flowStep === "intro") {
      this.goToNextBackground();
      this.showChoiceCardsStep();
      return;
    }

    if (this.flowStep === "secureResult") {
      this.continueButton.setVisible(false);
      this.continueButton.setAlpha(0);

      if (this.controladorDeCenas?.proximaCena) {
        this.controladorDeCenas.proximaCena();
        return;
      }

      if (this.game?.controladorDeCenas?.proximaCena) {
        this.game.controladorDeCenas.proximaCena();
      }
      return;
    }

    if (this.flowStep === "tempestadeResult") {
      this.showDiscardSelectionStep();
    }
  }

  goToNextBackground() {
    if (this.currentBgIndex >= this.bgKeys.length - 1) {
      return;
    }

    this.currentBgIndex += 1;
    this.background.setTexture(this.bgKeys[this.currentBgIndex]);
  }

  showChoiceCardsStep() {
    this.flowStep = "choice";
    this.hideDiscardSelectionAssets();

    this.continueButton.setVisible(false);
    this.continueButton.setAlpha(0);

    this.choiceSeguroCard.setVisible(true);
    this.choiceSeguroCard.setAlpha(0);
    this.choiceTempestadeCard.setVisible(true);
    this.choiceTempestadeCard.setAlpha(0);
    this.choiceSeguroButton.setVisible(true);
    this.choiceSeguroButton.setAlpha(0);
    this.choiceTempestadeButton.setVisible(true);
    this.choiceTempestadeButton.setAlpha(0);

    this.layoutComponents();

    this.tweens.add({
      targets: [
        this.choiceSeguroCard,
        this.choiceTempestadeCard,
        this.choiceSeguroButton,
        this.choiceTempestadeButton
      ],
      alpha: 1,
      duration: this.uiFadeInDuration,
      ease: "Sine.Out"
    });
  }

  hideChoiceCards() {
    this.choiceSeguroCard.setVisible(false);
    this.choiceSeguroCard.setAlpha(0);
    this.choiceTempestadeCard.setVisible(false);
    this.choiceTempestadeCard.setAlpha(0);
    this.choiceSeguroButton.setVisible(false);
    this.choiceSeguroButton.setAlpha(0);
    this.choiceTempestadeButton.setVisible(false);
    this.choiceTempestadeButton.setAlpha(0);
  }

  showSecureChoiceResult() {
    this.flowStep = "secureResult";
    this.hideChoiceCards();
    this.hideDiscardSelectionAssets();

    if (this.background) {
      this.background.setTexture("jogosDialogoFase3Acerto");
    }

    SoundManager.play("acerto");

    this.continueButton.setVisible(true);
    this.continueButton.setAlpha(0);
    this.layoutComponents();

    this.tweens.add({
      targets: this.continueButton,
      alpha: 1,
      duration: this.uiFadeInDuration,
      ease: "Sine.Out"
    });
  }

  showTempestadeChoiceResult() {
    this.flowStep = "tempestadeResult";
    this.hideChoiceCards();
    this.hideDiscardSelectionAssets();

    if (this.background) {
      this.background.setTexture("jogosDialogoFase3Erro");
    }

    SoundManager.play("erro");

    this.continueButton.setVisible(true);
    this.continueButton.setAlpha(0);
    this.layoutComponents();

    this.tweens.add({
      targets: this.continueButton,
      alpha: 1,
      duration: this.uiFadeInDuration,
      ease: "Sine.Out"
    });
  }

  showDiscardSelectionStep() {
    this.flowStep = "discardSelection";
    this.continueButton.setVisible(false);
    this.continueButton.setAlpha(0);

    if (this.background) {
      this.background.setTexture("jogosBg");
    }

    this.enunciadoDescarte.setVisible(true);
    this.enunciadoDescarte.setAlpha(0);
    this.objectsTable.setVisible(true);
    this.objectsTable.setAlpha(0);

    this.renderPlayerCardsForDiscard();
    this.cartasMContainer.setVisible(true);
    this.cartasMContainer.setAlpha(0);
    this.layoutComponents();

    this.tweens.add({
      targets: [this.enunciadoDescarte, this.objectsTable, this.cartasMContainer],
      alpha: 1,
      duration: this.uiFadeInDuration,
      ease: "Sine.Out"
    });
  }

  hideDiscardSelectionAssets() {
    this.enunciadoDescarte.setVisible(false);
    this.enunciadoDescarte.setAlpha(0);
    this.objectsTable.setVisible(false);
    this.objectsTable.setAlpha(0);
    this.cartasMContainer.setVisible(false);
    this.cartasMContainer.setAlpha(0);
  }

  handleEscolhaSeguroClick() {
    if (this.flowStep !== "choice") {
      return;
    }

    this.selectedChoice = "seguro";
    this.showSecureChoiceResult();
  }

  handleEscolhaTempestadeClick() {
    if (this.flowStep !== "choice") {
      return;
    }

    this.selectedChoice = "tempestade";
    this.showTempestadeChoiceResult();
  }

  handleDiscardCardSelected(cardId) {
    if (this.flowStep !== "discardSelection") {
      return;
    }

    const discarded = this.discardPlayerCard(cardId);
    if (!discarded) {
      return;
    }

    this.flowStep = "discarded";
    this.renderPlayerCardsForDiscard();

    this.time.delayedCall(300, () => {
      if (this.flowStep !== "discarded") {
        return;
      }

      if (this.controladorDeCenas?.proximaCena) {
        this.controladorDeCenas.proximaCena();
        return;
      }

      if (this.game?.controladorDeCenas?.proximaCena) {
        this.game.controladorDeCenas.proximaCena();
      }
    });
  }

  handleDiscardCardPressed(cardId) {
    if (this.flowStep !== "discardSelection") {
      return;
    }

    if (!this.modalInfo) {
      this.handleDiscardCardSelected(cardId);
      return;
    }

    this.pendingDiscardCardId = cardId;
    this.flowStep = "awaitDiscardModal";
    this.showModalOverlay();
    this.modalInfo.setModalKey(this.getModalKeyForCardId(cardId));
    this.modalInfo.open();
  }

  handleDiscardModalSelect() {
    const cardId = this.pendingDiscardCardId;
    this.pendingDiscardCardId = null;

    if (!cardId) {
      this.flowStep = "discardSelection";
      return;
    }

    if (cardId === TradeStateManager.CARD_IDS.SAL) {
      this.flowStep = "discardSelection";
      this.showFeedbackErro();
      return;
    }

    this.flowStep = "discardSelection";
    this.handleDiscardCardSelected(cardId);
  }

  handleDiscardModalClose(payload = {}) {
    this.hideModalOverlay();

    if (payload?.trigger === "select") {
      return;
    }

    this.pendingDiscardCardId = null;
    if (this.flowStep === "awaitDiscardModal") {
      this.flowStep = "discardSelection";
    }
  }

  showFeedbackErro() {
    if (!this.feedbackErro) {
      return;
    }

    this.feedbackErro.open();
  }

  handleFeedbackErroBack() {
    this.flowStep = "discardSelection";
    this.pendingDiscardCardId = null;
  }

  handleFeedbackErroClose() {
    if (this.flowStep !== "discarded") {
      this.flowStep = "discardSelection";
    }
    this.pendingDiscardCardId = null;
  }

  getModalKeyForCardId(cardId) {
    if (cardId === TradeStateManager.CARD_IDS.SAL) {
      return "modalSal";
    }

    if (cardId === TradeStateManager.CARD_IDS.COLAR) {
      return "modalColar";
    }

    if (cardId === TradeStateManager.CARD_IDS.TECIDO) {
      return "modalTecido";
    }

    if (cardId === TradeStateManager.CARD_IDS.FRUTAS) {
      return "modalFrutas";
    }

    return "modalSal";
  }

  showModalOverlay() {
    if (!this.modalOverlay) {
      return;
    }

    this.tweens.killTweensOf(this.modalOverlay);
    this.modalOverlay.setSize(this.getViewportWidth(), this.getViewportHeight());
    this.modalOverlay.setPosition(0, 0);
    this.modalOverlay.setVisible(true);
    this.modalOverlay.setAlpha(0);

    this.tweens.add({
      targets: this.modalOverlay,
      alpha: 0.55,
      duration: 200,
      ease: "Sine.Out"
    });
  }

  hideModalOverlay() {
    if (!this.modalOverlay) {
      return;
    }

    this.tweens.killTweensOf(this.modalOverlay);
    this.tweens.add({
      targets: this.modalOverlay,
      alpha: 0,
      duration: 180,
      ease: "Sine.Out",
      onComplete: () => {
        if (this.modalOverlay) {
          this.modalOverlay.setVisible(false);
        }
      }
    });
  }

  discardPlayerCard(cardId) {
    const tradeState = TradeStateManager.getState(this.game);
    if (!tradeState || !Array.isArray(tradeState.playerCards)) {
      return false;
    }

    const cardIndex = tradeState.playerCards.indexOf(cardId);
    if (cardIndex < 0) {
      return false;
    }

    tradeState.playerCards.splice(cardIndex, 1);
    return true;
  }

  layoutComponents() {
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();

    if (this.modalOverlay) {
      this.modalOverlay.setSize(viewportWidth, viewportHeight);
      this.modalOverlay.setPosition(0, 0);
    }

    if (this.banner) {
      if (this.banner.banner) {
        const naturalBannerWidth = this.banner.banner.frame?.width || this.banner.banner.width || 0;
        if (naturalBannerWidth > 0) {
          const targetWidth = viewportWidth + 2;
          const scale = targetWidth / naturalBannerWidth;
          this.banner.banner.setScale(scale);
          this.banner.banner.setPosition(0, 0);
          this.banner.setSize(this.banner.banner.displayWidth, this.banner.banner.displayHeight);
        }
      }

      const bannerWidth = this.banner.displayWidth || this.banner.width || 0;
      const bannerHeight = this.banner.displayHeight || this.banner.height || 0;
      const bannerX = (viewportWidth - bannerWidth) / 2;
      const bannerY = (viewportHeight - bannerHeight) / 2 - 80;
      this.banner.setPosition(bannerX, bannerY);
    }

    if (this.continueButton) {
      const buttonWidth = this.continueButton.displayWidth || this.continueButton.width || 0;
      const buttonHeight = this.continueButton.displayHeight || this.continueButton.height || 0;
      const x = ((viewportWidth - buttonWidth) / 2) ;
      const y = viewportHeight - buttonHeight - 80;
      this.continueButton.setPosition(x, y);
    }

    if (this.choiceSeguroCard && this.choiceTempestadeCard) {
      const cardY = 243;
      const cardGap = 80;
      const seguroWidth = this.choiceSeguroCard.displayWidth || this.choiceSeguroCard.width || 0;
      const tempestadeWidth = this.choiceTempestadeCard.displayWidth || this.choiceTempestadeCard.width || 0;
      const totalWidth = seguroWidth + tempestadeWidth + cardGap;
      const startX = (viewportWidth - totalWidth) / 2;

      this.choiceSeguroCard.setPosition(startX, cardY);
      this.choiceTempestadeCard.setPosition(startX + seguroWidth + cardGap, cardY);
    }

    if (this.choiceSeguroButton && this.choiceSeguroCard) {
      const seguroButtonWidth = this.choiceSeguroButton.displayWidth || this.choiceSeguroButton.width || 0;
      const seguroButtonHeight = this.choiceSeguroButton.displayHeight || this.choiceSeguroButton.height || 0;
      const seguroCardWidth = this.choiceSeguroCard.displayWidth || this.choiceSeguroCard.width || 0;
      const seguroCardHeight = this.choiceSeguroCard.displayHeight || this.choiceSeguroCard.height || 0;
      const x = this.choiceSeguroCard.x + ((seguroCardWidth - seguroButtonWidth) / 2);
      const y = this.choiceSeguroCard.y + seguroCardHeight - seguroButtonHeight - 84;
      this.choiceSeguroButton.setPosition(x, y);
    }

    if (this.choiceTempestadeButton && this.choiceTempestadeCard) {
      const tempestadeButtonWidth = this.choiceTempestadeButton.displayWidth || this.choiceTempestadeButton.width || 0;
      const tempestadeButtonHeight = this.choiceTempestadeButton.displayHeight || this.choiceTempestadeButton.height || 0;
      const tempestadeCardWidth = this.choiceTempestadeCard.displayWidth || this.choiceTempestadeCard.width || 0;
      const tempestadeCardHeight = this.choiceTempestadeCard.displayHeight || this.choiceTempestadeCard.height || 0;
      const x = this.choiceTempestadeCard.x + ((tempestadeCardWidth - tempestadeButtonWidth) / 2);
      const y = this.choiceTempestadeCard.y + tempestadeCardHeight - tempestadeButtonHeight - 84;
      this.choiceTempestadeButton.setPosition(x, y);
    }

    if (this.enunciadoDescarte) {
      const dialogWidth = this.enunciadoDescarte.displayWidth || this.enunciadoDescarte.width || 0;
      const x = (viewportWidth - dialogWidth) / 2;
      this.enunciadoDescarte.setPosition(x, 0);
    }

    if (this.objectsTable) {
      const tableWidth = this.objectsTable.displayWidth || this.objectsTable.width || 0;
      const tableHeight = this.objectsTable.displayHeight || this.objectsTable.height || 0;
      const x = (viewportWidth - tableWidth) / 2;
      const y = viewportHeight - tableHeight;
      this.objectsTable.setPosition(x, y);
    }

    if (this.cartasMContainer) {
      const cardsWidth = this.cartasMContainer.width || 0;
      const cardsHeight = this.cartasMContainer.height || 0;
      const x = (viewportWidth - cardsWidth) / 2;
      const y = viewportHeight - cardsHeight - 45;
      this.cartasMContainer.setPosition(x, y);
    }
  }

  getViewportWidth() {
    return this.scale?.width || this.cameras?.main?.width || Number(this.sys.game.config.width) || 1920;
  }

  getViewportHeight() {
    return this.scale?.height || this.cameras?.main?.height || Number(this.sys.game.config.height) || 1080;
  }
}

export default Game3;

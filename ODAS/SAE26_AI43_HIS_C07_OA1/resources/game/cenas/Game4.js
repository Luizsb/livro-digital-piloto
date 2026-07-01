import { BaseCena } from "../../js/library/base/BaseCena.js";

// COMPONENTS
import { Banner } from "../../js/library/components/Banner.js";
import { Button } from "../../js/library/components/Button.js";
import { FeedbackErro } from "../../js/library/components/FeedbackErro.js";
import { ModalInfo } from "../../js/library/components/ModalInfo.js";
import { StepperFeedback } from "../../js/library/components/StepperFeedback.js";
import { TradeMenu } from "../../js/library/components/TradeMenu.js";
import { ColorManager } from "../../js/library/managers/ColorManager.js";
import SoundManager from "../../js/library/managers/SoundManager.js";
import { TradeStateManager } from "../../js/library/managers/TradeStateManager.js";

export class Game4 extends BaseCena {
  constructor(controladorDeCenas) {
    super("Game4");
    this.controladorDeCenas = controladorDeCenas;
    this.loaded = false;
    this.initialBgKey = "jogosBg";
    this.introBgKey = "jogosDialogoComercianteFase41";
    this.endBgKey = "jogosDialogosComercianteFase42";
    this.uiFadeInDuration = 450;
    this.tradeTutorialStep = "idle";
    this.pendingSelectionType = null;
    this.stepperFeedbackX = 510;
    this.stepperFeedbackY = 114;
    this.selectedTradeCardOffsetBottom = 57;
    this.selectedTradeCardOffsetRight = 91;
    this.selectedMerchantCardId = null;
    this.selectedPlayerCardId = null;
    this.pendingPlayerCardId = null;
    this.pendingMerchantCardId = null;
    this.modalOverlay = null;
    this.feedbackAcertoTroca = null;
    this.tradeSuccessDisplayDuration = 800;
    this.merchantCards = this.getInitialMerchantCards();
  }

  create() {
    super.create();

    TradeStateManager.init(this.game);
    this.merchantCards = this.getInitialMerchantCards();
    const marca = ColorManager.getCurrentMarca(this);
    const redButtonColors = ColorManager.getColors(marca, ColorManager.RED);
    const greenButtonColors = ColorManager.getColors(marca, ColorManager.GREEN);

    this.background = this.add.image(0, 0, this.initialBgKey).setOrigin(0, 0).setDepth(0);
    this.banner = new Banner(this, {
      fase: 4,
      topShadowHeight: 0,
      overlayAlpha: 0
    });

    this.dialogoFase2 = this.add.image(0, 0, "jogosDialogoFase4").setOrigin(0, 0);
    this.enunciadoCartaMercador = this.add.image(0, 0, "objectsEnunciadoCartaMercador").setOrigin(0, 0);
    this.enunciadoCartaPlayer = this.add.image(0, 0, "objectsEnunciadoCartaPlayer").setOrigin(0, 0);
    this.objectsTable = this.add.image(0, 0, "objectsTable").setOrigin(0, 0);
    this.jogosComerciante = this.add.image(0, 0, "jogosComerciante").setOrigin(0, 0);
    this.cartasMContainer = this.createCartasMContainer();
    this.cartasComercianteContainer = this.createCartasComercianteContainer();

    this.tradeMenu = new TradeMenu(this, { tutorialMode: false });
    this.stepperFeedback = new StepperFeedback(this, {
      x: this.stepperFeedbackX,
      y: this.stepperFeedbackY,
      startVisible: false,
      secondaryNodeKey: "feedbackAcertoNode2",
      tertiaryNodeKey: "feedbackAcertoNode3",
      secondaryNodeOffsetX: 93,
      tertiaryNodeOffsetX: 186,
      showFirstTwoBeforeTertiary: true
    });

    this.introContinueButton = new Button(this, { text: "CONTINUAR" });
    this.confirmTradeButton = new Button(this, { text: "CONFIRMAR" });
    this.continueButton = new Button(this, {
      text: "FINALIZAR",
      colors: greenButtonColors
    });
    this.backButton = new Button(this, {
      text: "VOLTAR",
      showIcon: true,
      iconKey: "iconReload",
      colors: redButtonColors
    });
    this.introContinueButton.on("buttonClick", this.handleIntroContinueClick, this);
    this.confirmTradeButton.on("buttonClick", this.handleConfirmTradeClick, this);
    this.continueButton.on("buttonClick", this.handleContinueButtonClick, this);
    this.backButton.on("buttonClick", this.handleBackButtonClick, this);

    this.modalInfo = new ModalInfo(this, {
      modalKey: "modalSal",
      onSelect: this.handleCardModalSelect,
      onClose: this.handleCardModalClose
    });
    this.modalInfo.setDepth(10001);
    this.feedbackErro = new FeedbackErro(this, {
      backgroundKey: "feedbackErroFase4",
      onBack: this.handleFeedbackErroBack
    });
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
    this.feedbackAcertoTroca = this.add.image(0, 0, "feedbackAcertoTroca")
      .setOrigin(0.5, 0.5)
      .setVisible(false)
      .setAlpha(0);

    this.createSelectedTradeCardPreviews();

    this.dialogoFase2.setDepth(2);
    this.enunciadoCartaMercador.setDepth(2);
    this.enunciadoCartaPlayer.setDepth(2);
    this.objectsTable.setDepth(2);
    this.jogosComerciante.setDepth(2);
    this.cartasMContainer.setDepth(2);
    this.cartasComercianteContainer.setDepth(2);
    this.tradeMenu.setDepth(2);
    this.stepperFeedback.setDepth(2);
    this.introContinueButton.setDepth(3);
    this.confirmTradeButton.setDepth(3);
    this.continueButton.setDepth(3);
    this.backButton.setDepth(3);
    this.feedbackAcertoTroca.setDepth(4);

    this.renderPlayerCards();
    this.renderMerchantCards();
    this.layoutComponents();

    this.dialogoFase2.setVisible(false);
    this.dialogoFase2.setAlpha(0);
    this.enunciadoCartaMercador.setVisible(false);
    this.enunciadoCartaMercador.setAlpha(0);
    this.enunciadoCartaPlayer.setVisible(false);
    this.enunciadoCartaPlayer.setAlpha(0);
    this.objectsTable.setVisible(false);
    this.objectsTable.setAlpha(0);
    this.jogosComerciante.setVisible(false);
    this.jogosComerciante.setAlpha(0);
    this.cartasMContainer.setVisible(false);
    this.cartasMContainer.setAlpha(0);
    this.cartasComercianteContainer.setVisible(false);
    this.cartasComercianteContainer.setAlpha(0);
    this.tradeMenu.setVisible(false);
    this.tradeMenu.setAlpha(0);
    this.introContinueButton.setVisible(false);
    this.introContinueButton.setAlpha(0);
    this.confirmTradeButton.setVisible(false);
    this.confirmTradeButton.setAlpha(0);
    this.confirmTradeButton.setDisabled(true);
    this.continueButton.setVisible(false);
    this.continueButton.setAlpha(0);
    this.backButton.setVisible(false);
    this.backButton.setAlpha(0);
    this.stepperFeedback.hide();
    this.feedbackAcertoTroca.setVisible(false);
    this.feedbackAcertoTroca.setAlpha(0);

    if (typeof this.banner?.play === "function" && typeof this.banner?.resetAnimation === "function") {
      this.banner.resetAnimation();
      this.banner.play(4);
    }

    this.banner.once("bannerComplete", this.handleBannerComplete, this);

    this.scale.on("resize", this.layoutComponents, this);
    this.events.once("shutdown", () => {
      this.scale.off("resize", this.layoutComponents, this);
      this.banner.off("bannerComplete", this.handleBannerComplete, this);
      this.tradeMenu.off("cardClick", this.handleTradeCardClick, this);
      this.introContinueButton.off("buttonClick", this.handleIntroContinueClick, this);
      this.confirmTradeButton.off("buttonClick", this.handleConfirmTradeClick, this);
      this.continueButton.off("buttonClick", this.handleContinueButtonClick, this);
      this.backButton.off("buttonClick", this.handleBackButtonClick, this);
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
      if (this.stepperFeedback) {
        this.stepperFeedback.destroy();
        this.stepperFeedback = null;
      }
      if (this.feedbackAcertoTroca) {
        this.feedbackAcertoTroca.destroy();
        this.feedbackAcertoTroca = null;
      }
    });
  }

  createCartasMContainer() {
    const container = this.add.container(0, 0);
    container.setSize(0, 0);
    return container;
  }

  createCartasComercianteContainer() {
    const container = this.add.container(0, 0);
    container.setSize(0, 0);
    return container;
  }

  createSelectedTradeCardPreviews() {
    if (!this.tradeMenu?.comercianteContainer || !this.tradeMenu?.jogadorContainer) {
      return;
    }

    this.selectedMerchantCardPreview = this.add.image(0, 0, "cartasSalP").setOrigin(1, 1);
    this.selectedPlayerCardPreview = this.add.image(0, 0, "cartasFrutasP").setOrigin(1, 1);
    this.selectedMerchantCardPreview.setVisible(false);
    this.selectedPlayerCardPreview.setVisible(false);
    this.tradeMenu.comercianteContainer.add(this.selectedMerchantCardPreview);
    this.tradeMenu.jogadorContainer.add(this.selectedPlayerCardPreview);
    this.fitSelectedTradeCardPreview(this.selectedMerchantCardPreview, this.tradeMenu.comercianteContainer, 0.56, 0.72);
    this.fitSelectedTradeCardPreview(this.selectedPlayerCardPreview, this.tradeMenu.jogadorContainer, 0.56, 0.72);
  }

  fitSelectedTradeCardPreview(preview, cardContainer, widthFactor = 0.56, heightFactor = 0.72) {
    if (!preview || !cardContainer?.cardBackground) {
      return;
    }

    const cardBackground = cardContainer.cardBackground;
    const backgroundWidth = cardBackground.displayWidth || cardBackground.width || 0;
    const backgroundHeight = cardBackground.displayHeight || cardBackground.height || 0;

    if (backgroundWidth <= 0 || backgroundHeight <= 0) {
      return;
    }

    const maxWidth = backgroundWidth * widthFactor;
    const maxHeight = backgroundHeight * heightFactor;
    const safeWidth = preview.width || 1;
    const safeHeight = preview.height || 1;
    const scale = Math.min(maxWidth / safeWidth, maxHeight / safeHeight);

    preview.setScale(scale);
    preview.setPosition(
      backgroundWidth - this.selectedTradeCardOffsetRight,
      backgroundHeight - this.selectedTradeCardOffsetBottom
    );
  }

  showSelectedMerchantCardPreview(cardId) {
    if (!this.selectedMerchantCardPreview) {
      return;
    }

    const cardAssetKey = this.getPlayerPreviewAssetKeyForCardId(cardId);
    if (this.textures?.exists(cardAssetKey)) {
      this.selectedMerchantCardPreview.setTexture(cardAssetKey);
    }

    this.fitSelectedTradeCardPreview(this.selectedMerchantCardPreview, this.tradeMenu?.comercianteContainer, 0.56, 0.72);
    this.selectedMerchantCardPreview.setVisible(true);
  }

  showSelectedPlayerCardPreview(cardId) {
    if (!this.selectedPlayerCardPreview) {
      return;
    }

    const cardAssetKey = this.getPlayerPreviewAssetKeyForCardId(cardId);
    if (this.textures?.exists(cardAssetKey)) {
      this.selectedPlayerCardPreview.setTexture(cardAssetKey);
    }

    this.fitSelectedTradeCardPreview(this.selectedPlayerCardPreview, this.tradeMenu?.jogadorContainer, 0.56, 0.72);
    this.selectedPlayerCardPreview.setVisible(true);
  }

  hideSelectedTradeCardPreviews() {
    if (this.selectedMerchantCardPreview) {
      this.selectedMerchantCardPreview.setVisible(false);
    }

    if (this.selectedPlayerCardPreview) {
      this.selectedPlayerCardPreview.setVisible(false);
    }
  }

  renderPlayerCards() {
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
          this.handlePlayerCardSelected(cardId);
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

  renderMerchantCards() {
    if (!this.cartasComercianteContainer) {
      return;
    }

    this.cartasComercianteContainer.removeAll(true);

    const merchantCards = [...this.merchantCards];
    const gap = 40;
    let cursorX = 0;
    let maxHeight = 0;

    merchantCards.forEach((cardId, index) => {
      const cardKey = TradeStateManager.getAssetKeyForCardId(cardId);
      const card = this.add.image(cursorX, 0, cardKey)
        .setOrigin(0, 0)
        .setInteractive({ cursor: "pointer" });

      card.on("pointerdown", () => {
        SoundManager.play("click", 1, false, () => {
          this.handleMerchantCardSelected(cardId);
        });
      });

      this.cartasComercianteContainer.add(card);

      cursorX += card.displayWidth;
      if (index < merchantCards.length - 1) {
        cursorX += gap;
      }

      maxHeight = Math.max(maxHeight, card.displayHeight);
    });

    this.cartasComercianteContainer.setSize(cursorX, maxHeight);
    this.layoutComponents();
  }

  handleBannerComplete() {
    if (this.background && this.textures?.exists(this.introBgKey)) {
      this.background.setTexture(this.introBgKey);
    }

    if (this.introContinueButton) {
      this.introContinueButton.setVisible(true);
      this.introContinueButton.setAlpha(1);
    }

    this.layoutComponents();
  }

  handleIntroContinueClick() {
    if (this.background && this.textures?.exists(this.initialBgKey)) {
      this.background.setTexture(this.initialBgKey);
    }

    if (this.introContinueButton) {
      this.introContinueButton.setVisible(false);
      this.introContinueButton.setAlpha(0);
    }

    this.showTradeIntroAssets();
  }

  showTradeIntroAssets() {
    this.tradeTutorialStep = "awaitSelections";
    this.pendingSelectionType = null;
    this.pendingPlayerCardId = null;
    this.pendingMerchantCardId = null;
    this.selectedMerchantCardId = null;
    this.selectedPlayerCardId = null;
    this.merchantCards = this.getInitialMerchantCards();
    this.hideSelectedTradeCardPreviews();
    this.hideTradeSuccessFeedback();

    if (this.stepperFeedback) {
      this.stepperFeedback.hide();
    }

    if (this.feedbackErro) {
      this.feedbackErro.hide();
    }

    if (this.introContinueButton) {
      this.introContinueButton.setVisible(false);
      this.introContinueButton.setAlpha(0);
    }

    if (this.continueButton) {
      this.continueButton.setVisible(false);
      this.continueButton.setAlpha(0);
    }

    if (this.backButton) {
      this.backButton.setVisible(false);
      this.backButton.setAlpha(0);
    }

    if (this.enunciadoCartaMercador) {
      this.enunciadoCartaMercador.setVisible(false);
      this.enunciadoCartaMercador.setAlpha(0);
    }

    if (this.enunciadoCartaPlayer) {
      this.enunciadoCartaPlayer.setVisible(false);
      this.enunciadoCartaPlayer.setAlpha(0);
    }

    if (this.objectsTable) {
      this.objectsTable.setVisible(false);
      this.objectsTable.setAlpha(0);
    }

    if (this.jogosComerciante) {
      this.jogosComerciante.setVisible(false);
      this.jogosComerciante.setAlpha(0);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(false);
      this.cartasMContainer.setAlpha(0);
    }

    if (this.cartasComercianteContainer) {
      this.cartasComercianteContainer.setVisible(false);
      this.cartasComercianteContainer.setAlpha(0);
    }

    this.renderMerchantCards();

    if (this.tradeMenu) {
      this.tradeMenu.off("cardClick", this.handleTradeCardClick, this);
      this.tradeMenu.on("cardClick", this.handleTradeCardClick, this);
      this.tradeMenu.showBaseCards();
      this.tradeMenu.setVisible(true);
      this.tradeMenu.setAlpha(0);
      this.tweens.add({
        targets: this.tradeMenu,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    if (this.dialogoFase2) {
      this.dialogoFase2.setVisible(true);
      this.dialogoFase2.setAlpha(0);
      this.tweens.add({
        targets: this.dialogoFase2,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    if (this.confirmTradeButton) {
      this.layoutComponents();
      this.confirmTradeButton.setVisible(true);
      this.confirmTradeButton.setAlpha(0);
      this.tweens.add({
        targets: this.confirmTradeButton,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    this.updateConfirmButtonState();
  }

  handleTradeCardClick(payload) {
    if (this.tradeTutorialStep !== "awaitSelections") {
      return;
    }

    if (payload?.type === "comerciante") {
      this.showMerchantCardsSelectionStep();
      return;
    }

    if (payload?.type === "jogador") {
      this.showPlayerCardsSelectionStep();
    }
  }

  showMerchantCardsSelectionStep() {
    this.tradeTutorialStep = "awaitMerchantCardSelection";
    this.pendingSelectionType = null;
    this.pendingPlayerCardId = null;
    this.pendingMerchantCardId = null;

    if (this.tradeMenu) {
      this.tradeMenu.setVisible(false);
    }

    if (this.confirmTradeButton) {
      this.confirmTradeButton.setVisible(false);
      this.confirmTradeButton.setAlpha(0);
    }

    if (this.dialogoFase2) {
      this.dialogoFase2.setVisible(false);
      this.dialogoFase2.setAlpha(0);
    }

    if (this.enunciadoCartaPlayer) {
      this.enunciadoCartaPlayer.setVisible(false);
      this.enunciadoCartaPlayer.setAlpha(0);
    }

    if (this.enunciadoCartaMercador) {
      this.enunciadoCartaMercador.setVisible(true);
      this.enunciadoCartaMercador.setAlpha(0);
      this.tweens.add({
        targets: this.enunciadoCartaMercador,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    if (this.objectsTable) {
      this.objectsTable.setVisible(true);
      this.objectsTable.setAlpha(0);
      this.tweens.add({
        targets: this.objectsTable,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    if (this.jogosComerciante) {
      this.jogosComerciante.setVisible(true);
      this.jogosComerciante.setAlpha(1);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(false);
      this.cartasMContainer.setAlpha(0);
    }

    this.renderMerchantCards();

    if (this.cartasComercianteContainer) {
      this.cartasComercianteContainer.setVisible(true);
      this.cartasComercianteContainer.setAlpha(0);
      this.tweens.add({
        targets: this.cartasComercianteContainer,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    if (this.backButton) {
      this.backButton.setVisible(true);
      this.backButton.setAlpha(1);
    }

    this.layoutComponents();
  }

  showPlayerCardsSelectionStep() {
    this.tradeTutorialStep = "awaitPlayerCardSelection";
    this.pendingSelectionType = null;
    this.pendingPlayerCardId = null;
    this.pendingMerchantCardId = null;

    if (this.tradeMenu) {
      this.tradeMenu.setVisible(false);
    }

    if (this.confirmTradeButton) {
      this.confirmTradeButton.setVisible(false);
      this.confirmTradeButton.setAlpha(0);
    }

    if (this.dialogoFase2) {
      this.dialogoFase2.setVisible(false);
      this.dialogoFase2.setAlpha(0);
    }

    if (this.enunciadoCartaMercador) {
      this.enunciadoCartaMercador.setVisible(false);
      this.enunciadoCartaMercador.setAlpha(0);
    }

    if (this.enunciadoCartaPlayer) {
      this.enunciadoCartaPlayer.setVisible(true);
      this.enunciadoCartaPlayer.setAlpha(0);
      this.tweens.add({
        targets: this.enunciadoCartaPlayer,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    if (this.objectsTable) {
      this.objectsTable.setVisible(true);
      this.objectsTable.setAlpha(0);
      this.tweens.add({
        targets: this.objectsTable,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    if (this.jogosComerciante) {
      this.jogosComerciante.setVisible(false);
      this.jogosComerciante.setAlpha(0);
    }

    this.renderPlayerCards();

    if (this.cartasComercianteContainer) {
      this.cartasComercianteContainer.setVisible(false);
      this.cartasComercianteContainer.setAlpha(0);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(true);
      this.cartasMContainer.setAlpha(0);
      this.tweens.add({
        targets: this.cartasMContainer,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    if (this.backButton) {
      this.backButton.setVisible(true);
      this.backButton.setAlpha(1);
    }

    this.layoutComponents();
  }

  handlePlayerCardSelected(playerCardId) {
    if (this.tradeTutorialStep !== "awaitPlayerCardSelection") {
      return;
    }

    if (!this.modalInfo) {
      return;
    }

    this.pendingSelectionType = "player";
    this.pendingPlayerCardId = playerCardId;
    this.tradeTutorialStep = "awaitPlayerModalSelection";
    this.showModalOverlay();
    this.modalInfo.setModalKey(this.getModalKeyForCardId(playerCardId));
    this.modalInfo.open();
  }

  handleMerchantCardSelected(merchantCardId) {
    if (this.tradeTutorialStep !== "awaitMerchantCardSelection") {
      return;
    }

    if (!this.modalInfo) {
      return;
    }

    this.pendingSelectionType = "merchant";
    this.pendingMerchantCardId = merchantCardId;
    this.pendingPlayerCardId = null;
    this.tradeTutorialStep = "awaitMerchantModalSelection";
    this.showModalOverlay();
    this.modalInfo.setModalKey(this.getModalKeyForCardId(merchantCardId));
    this.modalInfo.open();
  }

  handleCardModalSelect() {
    if (this.pendingSelectionType === "merchant") {
      const merchantCardId = this.pendingMerchantCardId || (TradeStateManager.getCurrentMerchantCardId(this.game) || TradeStateManager.CARD_IDS.SAL);
      this.selectedMerchantCardId = merchantCardId;
      this.pendingMerchantCardId = null;
      this.showSelectedMerchantCardPreview(merchantCardId);
      this.returnToMainTradeStep();
      return;
    }

    if (this.pendingSelectionType === "player") {
      if (!this.pendingPlayerCardId) {
        this.tradeTutorialStep = "awaitPlayerCardSelection";
        return;
      }

      this.selectedPlayerCardId = this.pendingPlayerCardId;
      this.pendingMerchantCardId = null;
      this.showSelectedPlayerCardPreview(this.pendingPlayerCardId);
      this.returnToMainTradeStep();
    }
  }

  handleCardModalClose(payload = {}) {
    this.hideModalOverlay();

    if (payload?.trigger === "select") {
      return;
    }

    if (this.tradeTutorialStep === "awaitMerchantModalSelection") {
      this.pendingSelectionType = null;
      this.pendingMerchantCardId = null;
      this.pendingPlayerCardId = null;
      this.tradeTutorialStep = "awaitMerchantCardSelection";
      return;
    }

    if (this.tradeTutorialStep === "awaitPlayerModalSelection") {
      this.pendingSelectionType = "player";
      this.tradeTutorialStep = "awaitPlayerCardSelection";
    }
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

  returnToMainTradeStep() {
    this.tradeTutorialStep = "awaitSelections";
    this.pendingSelectionType = null;
    this.pendingPlayerCardId = null;
    this.pendingMerchantCardId = null;

    if (this.enunciadoCartaMercador) {
      this.enunciadoCartaMercador.setVisible(false);
      this.enunciadoCartaMercador.setAlpha(0);
    }

    if (this.enunciadoCartaPlayer) {
      this.enunciadoCartaPlayer.setVisible(false);
      this.enunciadoCartaPlayer.setAlpha(0);
    }

    if (this.objectsTable) {
      this.objectsTable.setVisible(false);
      this.objectsTable.setAlpha(0);
    }

    if (this.jogosComerciante) {
      this.jogosComerciante.setVisible(false);
      this.jogosComerciante.setAlpha(0);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(false);
      this.cartasMContainer.setAlpha(0);
    }

    if (this.cartasComercianteContainer) {
      this.cartasComercianteContainer.setVisible(false);
      this.cartasComercianteContainer.setAlpha(0);
    }

    if (this.tradeMenu) {
      this.tradeMenu.showBaseCards();
      this.tradeMenu.setVisible(true);
      this.tradeMenu.setAlpha(1);
    }

    if (this.dialogoFase2) {
      this.dialogoFase2.setVisible(true);
      this.dialogoFase2.setAlpha(1);
    }

    if (this.confirmTradeButton) {
      this.confirmTradeButton.setVisible(true);
      this.confirmTradeButton.setAlpha(1);
    }

    if (this.backButton) {
      this.backButton.setVisible(false);
      this.backButton.setAlpha(0);
    }

    this.updateConfirmButtonState();
    this.layoutComponents();
  }

  updateConfirmButtonState() {
    if (!this.confirmTradeButton) {
      return;
    }

    const canConfirm = Boolean(this.selectedMerchantCardId && this.selectedPlayerCardId);
    this.confirmTradeButton.setDisabled(!canConfirm);
  }

  handleConfirmTradeClick() {
    if (this.tradeTutorialStep !== "awaitSelections") {
      return;
    }

    const playerCardId = this.selectedPlayerCardId;
    const merchantCardId = this.selectedMerchantCardId || TradeStateManager.getCurrentMerchantCardId(this.game) || TradeStateManager.CARD_IDS.SAL;

    if (!playerCardId || !merchantCardId) {
      return;
    }

    const invalidByPlayerSalt = playerCardId === TradeStateManager.CARD_IDS.SAL;
    const invalidByMerchantFrutasSecas = merchantCardId === TradeStateManager.CARD_IDS.FRUTAS;
    const invalidByMerchantSalRule =
      merchantCardId === TradeStateManager.CARD_IDS.SAL &&
      playerCardId !== TradeStateManager.CARD_IDS.TECIDO;
    const invalidByMerchantTecidoRule =
      merchantCardId === TradeStateManager.CARD_IDS.TECIDO &&
      playerCardId === TradeStateManager.CARD_IDS.TECIDO;

    if (
      invalidByPlayerSalt ||
      invalidByMerchantFrutasSecas ||
      invalidByMerchantSalRule ||
      invalidByMerchantTecidoRule
    ) {
      this.showFeedbackErro();
      return;
    }

    if (merchantCardId === TradeStateManager.CARD_IDS.TECIDO) {
      const success = this.applyMerchantTecidoTrade(playerCardId);
      if (!success) {
        this.showFeedbackErro();
        return;
      }

      this.showTradeSuccessFeedback();
      return;
    }

    const result = TradeStateManager.applyTrade(this.game, {
      playerCardId,
      merchantCardId
    });

    if (!result.success) {
      this.showFeedbackErro();
      return;
    }

    this.updateMerchantCardsAfterTrade(playerCardId, merchantCardId);
    this.clearTradeSelections();
    this.renderPlayerCards();
    this.renderMerchantCards();
    this.showPostConfirmStep();
  }

  showFeedbackErro() {
    if (!this.feedbackErro) {
      return;
    }

    this.feedbackErro.open();
  }

  handleFeedbackErroBack() {
    this.tradeTutorialStep = "awaitSelections";
    this.clearTradeSelections();
  }

  clearTradeSelections() {
    this.selectedMerchantCardId = null;
    this.selectedPlayerCardId = null;
    this.pendingSelectionType = null;
    this.pendingPlayerCardId = null;
    this.pendingMerchantCardId = null;
    this.hideSelectedTradeCardPreviews();
    this.updateConfirmButtonState();
  }

  showPostConfirmStep() {
    this.tradeTutorialStep = "postConfirm";
    this.hideTradeSuccessFeedback();
    this.setTradeMenuCardsInteractive(true);

    if (this.feedbackErro) {
      this.feedbackErro.hide();
    }

    if (this.background && this.textures?.exists(this.endBgKey)) {
      this.background.setTexture(this.endBgKey);
    }

    if (this.dialogoFase2) {
      this.dialogoFase2.setVisible(false);
      this.dialogoFase2.setAlpha(0);
    }

    if (this.enunciadoCartaMercador) {
      this.enunciadoCartaMercador.setVisible(false);
      this.enunciadoCartaMercador.setAlpha(0);
    }

    if (this.enunciadoCartaPlayer) {
      this.enunciadoCartaPlayer.setVisible(false);
      this.enunciadoCartaPlayer.setAlpha(0);
    }

    if (this.objectsTable) {
      this.objectsTable.setVisible(false);
      this.objectsTable.setAlpha(0);
    }

    if (this.jogosComerciante) {
      this.jogosComerciante.setVisible(false);
      this.jogosComerciante.setAlpha(0);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(false);
      this.cartasMContainer.setAlpha(0);
    }

    if (this.cartasComercianteContainer) {
      this.cartasComercianteContainer.setVisible(false);
      this.cartasComercianteContainer.setAlpha(0);
    }

    const buttonX = this.confirmTradeButton ? this.confirmTradeButton.x : 0;
    const buttonY = this.confirmTradeButton ? this.confirmTradeButton.y : 0;

    if (this.confirmTradeButton) {
      this.confirmTradeButton.setVisible(false);
      this.confirmTradeButton.setAlpha(0);
    }

    if (this.tradeMenu) {
      this.tradeMenu.setVisible(false);
      this.tradeMenu.setAlpha(0);
    }

    if (this.backButton) {
      this.backButton.setVisible(false);
      this.backButton.setAlpha(0);
    }

    this.hideSelectedTradeCardPreviews();

    if (this.stepperFeedback) {
      this.stepperFeedback.show(this.stepperFeedbackX, this.stepperFeedbackY);
    }

    if (this.continueButton) {
      this.continueButton.setPosition(buttonX - 400, buttonY);
      this.continueButton.setVisible(true);
      this.continueButton.setAlpha(0);
      this.tweens.add({
        targets: this.continueButton,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }
  }

  handleContinueButtonClick() {
    if (!this.continueButton || !this.continueButton.visible) {
      return;
    }

    this.continueButton.setVisible(false);
    this.continueButton.setAlpha(0);

    TradeStateManager.reset(this.game);

    if (this.controladorDeCenas?.mudarCena) {
      this.controladorDeCenas.mudarCena(0);
      return;
    }

    if (this.game?.controladorDeCenas?.mudarCena) {
      this.game.controladorDeCenas.mudarCena(0);
    }
  }

  handleBackButtonClick() {
    if (!this.backButton || !this.backButton.visible) {
      return;
    }

    this.returnToMainTradeStep();
  }

  getInitialMerchantCards() {
    return [
      TradeStateManager.CARD_IDS.SAL,
      TradeStateManager.CARD_IDS.TECIDO,
      TradeStateManager.CARD_IDS.FRUTAS
    ];
  }

  applyMerchantTecidoTrade(playerCardId) {
    const tradeState = TradeStateManager.getState(this.game);
    if (!tradeState || !Array.isArray(tradeState.playerCards)) {
      return false;
    }

    const playerCardIndex = tradeState.playerCards.indexOf(playerCardId);
    if (playerCardIndex < 0) {
      return false;
    }

    tradeState.playerCards.splice(playerCardIndex, 1, TradeStateManager.CARD_IDS.TECIDO);
    this.updateMerchantCardsAfterTrade(playerCardId, TradeStateManager.CARD_IDS.TECIDO);
    return true;
  }

  updateMerchantCardsAfterTrade(playerCardId, merchantCardId) {
    const merchantCardIndex = this.merchantCards.indexOf(merchantCardId);
    if (merchantCardIndex < 0) {
      return;
    }

    this.merchantCards.splice(merchantCardIndex, 1, playerCardId);
  }

  showTradeSuccessFeedback() {
    if (!this.feedbackAcertoTroca) {
      return;
    }

    this.tradeTutorialStep = "resolvingTrade";
    this.setTradeMenuCardsInteractive(false);

    if (this.confirmTradeButton) {
      this.confirmTradeButton.setDisabled(true);
    }

    this.positionTradeSuccessFeedback();
    this.tweens.killTweensOf(this.feedbackAcertoTroca);
    this.feedbackAcertoTroca.setVisible(true);
    this.feedbackAcertoTroca.setAlpha(0);

    SoundManager.play("acerto");

    this.tweens.add({
      targets: this.feedbackAcertoTroca,
      alpha: 1,
      duration: 120,
      ease: "Sine.Out",
      onComplete: () => {
        this.time.delayedCall(this.tradeSuccessDisplayDuration, () => {
          if (!this.feedbackAcertoTroca) {
            return;
          }

          this.tweens.add({
            targets: this.feedbackAcertoTroca,
            alpha: 0,
            duration: 120,
            ease: "Sine.Out",
            onComplete: () => {
              this.hideTradeSuccessFeedback();
              this.clearTradeSelections();
              this.renderPlayerCards();
              this.renderMerchantCards();
              this.setTradeMenuCardsInteractive(true);
              this.tradeTutorialStep = "awaitSelections";
              this.updateConfirmButtonState();
            }
          });
        });
      }
    });
  }

  hideTradeSuccessFeedback() {
    if (!this.feedbackAcertoTroca) {
      return;
    }

    this.tweens.killTweensOf(this.feedbackAcertoTroca);
    this.feedbackAcertoTroca.setVisible(false);
    this.feedbackAcertoTroca.setAlpha(0);
  }

  setTradeMenuCardsInteractive(enabled) {
    const toggleInput = (cardContainer) => {
      if (cardContainer?.clickableTarget?.input) {
        cardContainer.clickableTarget.input.enabled = enabled;
      }
    };

    toggleInput(this.tradeMenu?.comercianteContainer);
    toggleInput(this.tradeMenu?.jogadorContainer);
  }

  positionTradeSuccessFeedback() {
    if (
      !this.feedbackAcertoTroca ||
      !this.tradeMenu?.cardsContainer ||
      !this.tradeMenu?.comercianteContainer ||
      !this.tradeMenu?.jogadorContainer
    ) {
      return;
    }

    const cardsContainer = this.tradeMenu.cardsContainer;
    const comercianteContainer = this.tradeMenu.comercianteContainer;
    const jogadorContainer = this.tradeMenu.jogadorContainer;
    const comercianteTarget = comercianteContainer.clickableCard || comercianteContainer.cardBackground;
    const jogadorTarget = jogadorContainer.clickableCard || jogadorContainer.cardBackground;

    if (!comercianteTarget || !jogadorTarget) {
      return;
    }

    const merchantX =
      this.tradeMenu.x +
      cardsContainer.x +
      comercianteContainer.x +
      comercianteTarget.x;
    const playerX =
      this.tradeMenu.x +
      cardsContainer.x +
      jogadorContainer.x +
      jogadorTarget.x;
    const centerY =
      this.tradeMenu.y +
      cardsContainer.y +
      comercianteContainer.y +
      comercianteTarget.y;

    this.feedbackAcertoTroca.setPosition((merchantX + playerX) / 2, centerY);
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

  getPlayerPreviewAssetKeyForCardId(cardId) {
    if (cardId === TradeStateManager.CARD_IDS.SAL) {
      return "cartasSalP";
    }

    if (cardId === TradeStateManager.CARD_IDS.COLAR) {
      return "cartasColarP";
    }

    if (cardId === TradeStateManager.CARD_IDS.TECIDO) {
      return "cartasTecidoP";
    }

    if (cardId === TradeStateManager.CARD_IDS.FRUTAS) {
      return "cartasFrutasP";
    }

    return "cartasFrutasP";
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

    if (this.tradeMenu) {
      const tradeWidth = this.tradeMenu.displayWidth || this.tradeMenu.width || 0;
      const tradeHeight = this.tradeMenu.displayHeight || this.tradeMenu.height || 0;
      const x = viewportWidth - tradeWidth - 40;
      const y = viewportHeight - tradeHeight - 40;

      this.tradeMenu.setPosition(x, y);
      this.fitSelectedTradeCardPreview(this.selectedMerchantCardPreview, this.tradeMenu.comercianteContainer, 0.56, 0.72);
      this.fitSelectedTradeCardPreview(this.selectedPlayerCardPreview, this.tradeMenu.jogadorContainer, 0.56, 0.72);
    }

    if (this.confirmTradeButton && this.tradeMenu) {
      const tradeWidth = this.tradeMenu.displayWidth || this.tradeMenu.width || 0;
      const buttonWidth = this.confirmTradeButton.displayWidth || this.confirmTradeButton.width || 0;
      const cardsTop = this.tradeMenu.cardsContainer?.y || 0;
      const cardHeight = this.tradeMenu.comercianteContainer?.height || 0;

      const x = this.tradeMenu.x + ((tradeWidth - buttonWidth) / 2);
      const y = this.tradeMenu.y + cardsTop + cardHeight + 80;
      this.confirmTradeButton.setPosition(x, y);
    }

    if (this.introContinueButton) {
      const buttonWidth = this.introContinueButton.displayWidth || this.introContinueButton.width || 0;
      const buttonHeight = this.introContinueButton.displayHeight || this.introContinueButton.height || 0;
      const x = (viewportWidth - buttonWidth) / 2;
      const y = viewportHeight - buttonHeight - 80;
      this.introContinueButton.setPosition(x, y);
    }

    if (this.continueButton?.visible && this.confirmTradeButton) {
      this.continueButton.setPosition(this.confirmTradeButton.x, this.confirmTradeButton.y);
    }

    if (this.backButton) {
      const buttonWidth = this.backButton.displayWidth || this.backButton.width || 0;
      const x = viewportWidth - buttonWidth - 40;
      const y = 40;
      this.backButton.setPosition(x, y);
    }

    if (this.dialogoFase2) {
      const dialogHeight = this.dialogoFase2.displayHeight || this.dialogoFase2.height || 0;
      const x = 60;
      const y = viewportHeight - dialogHeight - 280;
      this.dialogoFase2.setPosition(x, y);
    }

    if (this.enunciadoCartaMercador) {
      const dialogWidth = this.enunciadoCartaMercador.displayWidth || this.enunciadoCartaMercador.width || 0;
      const x = (viewportWidth - dialogWidth) / 2;
      const y = 0;
      this.enunciadoCartaMercador.setPosition(x, y);
    }

    if (this.enunciadoCartaPlayer) {
      const dialogWidth = this.enunciadoCartaPlayer.displayWidth || this.enunciadoCartaPlayer.width || 0;
      const x = (viewportWidth - dialogWidth) / 2;
      const y = 0;
      this.enunciadoCartaPlayer.setPosition(x, y);
    }

    if (this.objectsTable) {
      const tableWidth = this.objectsTable.displayWidth || this.objectsTable.width || 0;
      const tableHeight = this.objectsTable.displayHeight || this.objectsTable.height || 0;
      const x = (viewportWidth - tableWidth) / 2;
      const y = viewportHeight - tableHeight;
      this.objectsTable.setPosition(x, y);
    }

    if (this.jogosComerciante) {
      const comercianteHeight = this.jogosComerciante.displayHeight || this.jogosComerciante.height || 0;
      const x = 22;
      const y = viewportHeight - comercianteHeight;
      this.jogosComerciante.setPosition(x, y);
    }

    if (this.cartasMContainer || this.cartasComercianteContainer) {
      const merchantVisible = Boolean(this.cartasComercianteContainer?.visible);
      const playerVisible = Boolean(this.cartasMContainer?.visible);
      const merchantWidth = this.cartasComercianteContainer?.width || 0;
      const merchantHeight = this.cartasComercianteContainer?.height || 0;
      const playerWidth = this.cartasMContainer?.width || 0;
      const playerHeight = this.cartasMContainer?.height || 0;
      const gap = 80;
      const maxHeight = Math.max(
        merchantVisible ? merchantHeight : 0,
        playerVisible ? playerHeight : 0
      );
      const baseY = viewportHeight - maxHeight - 45;

      if (merchantVisible && playerVisible) {
        const totalWidth = merchantWidth + playerWidth + gap;
        const startX = (viewportWidth - totalWidth) / 2;

        this.cartasComercianteContainer.setPosition(startX, baseY);
        this.cartasMContainer.setPosition(startX + merchantWidth + gap, baseY);
      } else if (merchantVisible) {
        const merchantX = (viewportWidth - merchantWidth) / 2;
        this.cartasComercianteContainer.setPosition(merchantX, baseY);
      } else if (playerVisible) {
        const playerX = (viewportWidth - playerWidth) / 2;
        this.cartasMContainer.setPosition(playerX, baseY);
      }
    }

    if (this.stepperFeedback) {
      this.stepperFeedback.setPosition(this.stepperFeedbackX, this.stepperFeedbackY);
    }

    if (this.feedbackAcertoTroca?.visible) {
      this.positionTradeSuccessFeedback();
    }
  }

  getViewportWidth() {
    return this.scale?.width || this.cameras?.main?.width || Number(this.sys.game.config.width) || 1920;
  }

  getViewportHeight() {
    return this.scale?.height || this.cameras?.main?.height || Number(this.sys.game.config.height) || 1080;
  }
}

export default Game4;

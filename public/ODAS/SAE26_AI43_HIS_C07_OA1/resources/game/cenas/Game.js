import { BaseCena } from "../../js/library/base/BaseCena.js";

// COMPONENTS
import { Banner } from "../../js/library/components/Banner.js";
import { Button } from "../../js/library/components/Button.js";
import { ModalInfo } from "../../js/library/components/ModalInfo.js";
import { StepperFeedback } from "../../js/library/components/StepperFeedback.js";
import { TradeMenu } from "../../js/library/components/TradeMenu.js";
import { TutorialHand } from "../../js/library/components/TutorialHand.js";
import SoundManager from "../../js/library/managers/SoundManager.js";
import { TradeStateManager } from "../../js/library/managers/TradeStateManager.js";

export class Game extends BaseCena {
  constructor(controladorDeCenas) {
    super("Game");
    this.controladorDeCenas = controladorDeCenas;
    this.loaded = false;
    this.initialBgKey = "jogosBg";
    this.introBgKey = "jogosIntroFase1";
    this.endBgKey = "jogosDialogoFase1Fim";
    this.uiFadeInDuration = 450;
    this.tradeTutorialStep = "idle";
    this.stepperFeedbackX = 510;
    this.stepperFeedbackY = 114;
    this.tutorialHandOffsetY = 120;
    this.selectedTradeCardOffsetBottom = 57;
    this.selectedTradeCardOffsetRight = 91;
    this.selectedMerchantCardId = null;
    this.selectedPlayerCardId = null;
    this.pendingPlayerCardId = null;
    this.modalOverlay = null;
  }

  create() {
    super.create();

    TradeStateManager.init(this.game);

    this.background = this.add.image(0, 0, this.initialBgKey).setOrigin(0, 0).setDepth(0);

    this.banner = new Banner(this, { topShadowHeight: 0 });
    this.dialogoFase1 = this.add.image(0, 0, "jogosDialogoFase1").setOrigin(0, 0);
    this.dialogoComercianteFase1 = this.add.image(0, 0, "jogosDialogoComercianteFase1").setOrigin(0, 0);
    this.dialogoComercianteFase12 = this.add.image(0, 0, "jogosDialogoComercianteFase12").setOrigin(0, 0);
    this.objectsTable = this.add.image(0, 0, "objectsTable").setOrigin(0, 0);
    this.merchantSalCard = this.add.image(0, 0, "cartasSalM")
      .setOrigin(0, 0)
      .setInteractive({ cursor: "pointer" });
    this.cartasMContainer = this.createCartasMContainer();

    this.tradeMenu = new TradeMenu(this, { tutorialMode: true });
    this.stepperFeedback = new StepperFeedback(this, {
      x: this.stepperFeedbackX,
      y: this.stepperFeedbackY,
      startVisible: false
    });
    this.startButton = new Button(this, { text: "COMEÇAR" });
    this.confirmTradeButton = new Button(this, { text: "CONFIRMAR" });
    this.continueButton = new Button(this, { text: "CONTINUAR" });
    this.startButton.on("buttonClick", this.handleStartButtonClick, this);
    this.confirmTradeButton.on("buttonClick", this.handleConfirmTradeClick, this);
    this.continueButton.on("buttonClick", this.handleContinueButtonClick, this);
    this.merchantSalCard.on("pointerdown", this.handleMerchantSalCardClick, this);

    this.modalInfo = new ModalInfo(this, {
      modalKey: "modalSal",
      onSelect: this.handleMerchantModalSelect,
      onClose: this.handleMerchantModalClose
    });
    this.modalInfo.setDepth(10001);
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

    this.createSelectedTradeCardPreviews();

    this.dialogoFase1.setDepth(2);
    this.dialogoComercianteFase1.setDepth(2);
    this.dialogoComercianteFase12.setDepth(2);
    this.objectsTable.setDepth(2);
    this.merchantSalCard.setDepth(2);
    this.cartasMContainer.setDepth(2);
    this.tradeMenu.setDepth(2);
    this.stepperFeedback.setDepth(2);
    this.startButton.setDepth(3);
    this.confirmTradeButton.setDepth(3);
    this.continueButton.setDepth(3);

    this.renderPlayerCards();
    this.layoutComponents();

    this.dialogoFase1.setVisible(false);
    this.dialogoFase1.setAlpha(0);
    this.dialogoComercianteFase1.setVisible(false);
    this.dialogoComercianteFase1.setAlpha(0);
    this.dialogoComercianteFase12.setVisible(false);
    this.dialogoComercianteFase12.setAlpha(0);
    this.objectsTable.setVisible(false);
    this.objectsTable.setAlpha(0);
    this.merchantSalCard.setVisible(false);
    this.merchantSalCard.setAlpha(0);
    this.cartasMContainer.setVisible(false);
    this.cartasMContainer.setAlpha(0);
    this.tradeMenu.setVisible(false);
    this.tradeMenu.setAlpha(0);
    this.startButton.setVisible(false);
    this.confirmTradeButton.setVisible(false);
    this.confirmTradeButton.setAlpha(0);
    this.continueButton.setVisible(false);
    this.continueButton.setAlpha(0);
    this.stepperFeedback.hide();

    if (typeof this.banner?.play === "function" && typeof this.banner?.resetAnimation === "function") {
      this.banner.resetAnimation();
      this.banner.play();
    }

    this.banner.once("bannerComplete", this.handleBannerComplete, this);

    this.scale.on("resize", this.layoutComponents, this);
    this.events.once("shutdown", () => {
      this.scale.off("resize", this.layoutComponents, this);
      this.banner.off("bannerComplete", this.handleBannerComplete, this);
      this.startButton.off("buttonClick", this.handleStartButtonClick, this);
      this.confirmTradeButton.off("buttonClick", this.handleConfirmTradeClick, this);
      this.continueButton.off("buttonClick", this.handleContinueButtonClick, this);
      this.merchantSalCard.off("pointerdown", this.handleMerchantSalCardClick, this);
      this.tradeMenu.off("cardClick", this.handleTradeTutorialStepComplete, this);
      if (this.tradeOverlay) {
        this.tradeOverlay.destroy();
        this.tradeOverlay = null;
      }
      if (this.modalInfo) {
        this.modalInfo.destroy();
        this.modalInfo = null;
      }
      if (this.modalOverlay) {
        this.modalOverlay.destroy();
        this.modalOverlay = null;
      }
      if (this.stepperFeedback) {
        this.stepperFeedback.destroy();
        this.stepperFeedback = null;
      }
      this.stopTradeTutorialHand();
    });
  }

  createCartasMContainer() {
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

    const merchantBackground = cardContainer.cardBackground;
    const backgroundWidth = merchantBackground.displayWidth || merchantBackground.width || 0;
    const backgroundHeight = merchantBackground.displayHeight || merchantBackground.height || 0;

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

  handleBannerComplete() {
    if (this.background && this.textures?.exists(this.introBgKey)) {
      this.background.setTexture(this.introBgKey);
    }

    if (this.startButton) {
      this.startButton.setVisible(true);
    }
  }

  handleStartButtonClick() {
    if (this.background && this.textures?.exists(this.initialBgKey)) {
      this.background.setTexture(this.initialBgKey);
    }

    if (this.startButton) {
      this.startButton.setVisible(false);
    }

    this.showTradeIntroAssets();
  }

  showTradeIntroAssets() {
    this.showTradeOverlay();
    this.tradeTutorialStep = "awaitMerchantClick";

    if (this.tradeMenu) {
      this.tradeMenu.off("cardClick", this.handleTradeTutorialStepComplete, this);
      this.tradeMenu.on("cardClick", this.handleTradeTutorialStepComplete, this);
      this.tradeMenu.showOnlyComerciante();
      this.tradeMenu.setAlpha(0);
      this.tradeMenu.setVisible(true);
      this.tweens.add({
        targets: this.tradeMenu,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out",
        onComplete: () => {
          this.startTradeTutorialHand("comerciante");
        }
      });
    }

    if (this.dialogoFase1) {
      this.dialogoFase1.setAlpha(0);
      this.dialogoFase1.setVisible(true);
      this.tweens.add({
        targets: this.dialogoFase1,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }
  }

  showTradeOverlay() {
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();

    if (!this.tradeOverlay) {
      this.tradeOverlay = this.add.rectangle(0, 0, viewportWidth, viewportHeight, 0x000000, 0.8)
        .setOrigin(0, 0)
        .setDepth(1)
        .setAlpha(0)
        .setVisible(false);
    }

    this.tradeOverlay.setSize(viewportWidth, viewportHeight);
    this.tradeOverlay.setPosition(0, 0);
    this.tradeOverlay.setVisible(true);

    this.tweens.add({
      targets: this.tradeOverlay,
      alpha: 0.45,
      duration: this.uiFadeInDuration,
      ease: "Sine.Out"
    });
  }

  handleTradeTutorialStepComplete(payload) {
    if (this.tradeTutorialStep === "awaitMerchantClick" && payload?.type === "comerciante") {
      this.stopTradeTutorialHand();
      this.showComercianteOfferStepAssets();
      return;
    }

    if (this.tradeTutorialStep === "awaitJogadorClick" && payload?.type === "jogador") {
      this.stopTradeTutorialHand();
      this.showPlayerCardsSelectionStep();
    }
  }

  handleMerchantSalCardClick() {
    if (this.tradeTutorialStep !== "awaitMerchantSalCardSelection") {
      return;
    }

    SoundManager.play("click", 1, false, () => {
      if (!this.modalInfo) {
        return;
      }

      const merchantCardId = TradeStateManager.getCurrentMerchantCardId(this.game) || TradeStateManager.CARD_IDS.SAL;
      this.tradeTutorialStep = "awaitMerchantModalSelection";
      this.showModalOverlay();
      this.modalInfo.setModalKey(this.getModalKeyForCardId(merchantCardId));
      this.modalInfo.open();
    });
  }

  handleMerchantModalSelect() {
    if (this.tradeTutorialStep === "awaitPlayerModalSelection") {
      const playerCardId = this.pendingPlayerCardId;
      this.pendingPlayerCardId = null;

      if (!playerCardId) {
        this.tradeTutorialStep = "awaitPlayerCardSelection";
        return;
      }

      this.selectedPlayerCardId = playerCardId;
      this.showSelectedPlayerCardPreview(playerCardId);
      this.showTradeConfirmationStep();
      return;
    }

    if (this.tradeTutorialStep !== "awaitMerchantModalSelection") {
      return;
    }

    const merchantCardId = TradeStateManager.getCurrentMerchantCardId(this.game) || TradeStateManager.CARD_IDS.SAL;
    this.selectedMerchantCardId = merchantCardId;

    if (this.dialogoComercianteFase1) {
      this.dialogoComercianteFase1.setVisible(false);
    }

    if (this.objectsTable) {
      this.objectsTable.setVisible(false);
    }

    if (this.merchantSalCard) {
      this.merchantSalCard.setVisible(false);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(false);
    }

    this.tradeTutorialStep = "awaitJogadorClick";

    if (this.tradeMenu) {
      this.tradeMenu.showBaseCards();
      this.tradeMenu.setVisible(true);
      this.tradeMenu.setAlpha(1);

      const comercianteTarget = this.tradeMenu.comercianteContainer?.clickableTarget;
      if (comercianteTarget?.input) {
        comercianteTarget.input.enabled = false;
      }

      const jogadorTarget = this.tradeMenu.jogadorContainer?.clickableTarget;
      if (jogadorTarget?.input) {
        jogadorTarget.input.enabled = true;
      }
    }

    if (this.dialogoFase1) {
      this.dialogoFase1.setVisible(true);
      this.dialogoFase1.setAlpha(1);
    }

    this.showSelectedMerchantCardPreview(merchantCardId);
    this.startTradeTutorialHand("jogador");
  }

  handleMerchantModalClose(payload = {}) {
    this.hideModalOverlay();

    if (payload?.trigger === "select") {
      return;
    }

    if (this.tradeTutorialStep === "awaitMerchantModalSelection") {
      this.tradeTutorialStep = "awaitMerchantSalCardSelection";
      return;
    }

    if (this.tradeTutorialStep === "awaitPlayerModalSelection") {
      this.pendingPlayerCardId = null;
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

  showComercianteOfferStepAssets() {
    this.tradeTutorialStep = "awaitMerchantSalCardSelection";

    if (this.dialogoFase1) {
      this.dialogoFase1.setVisible(false);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(false);
    }

    if (this.tradeMenu) {
      this.tradeMenu.setVisible(false);
      this.tradeMenu.setAlpha(0);
    }

    const targets = [this.dialogoComercianteFase1, this.objectsTable, this.merchantSalCard].filter(Boolean);
    targets.forEach((target) => {
      target.setAlpha(0);
      target.setVisible(true);
      this.tweens.add({
        targets: target,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    });
  }

  showPlayerCardsSelectionStep() {
    this.tradeTutorialStep = "awaitPlayerCardSelection";

    if (this.tradeMenu) {
      this.tradeMenu.setVisible(false);
    }

    if (this.dialogoFase1) {
      this.dialogoFase1.setVisible(false);
    }

    if (this.dialogoComercianteFase12) {
      this.dialogoComercianteFase12.setAlpha(0);
      this.dialogoComercianteFase12.setVisible(true);
      this.tweens.add({
        targets: this.dialogoComercianteFase12,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    this.renderPlayerCards();

    if (this.cartasMContainer) {
      this.cartasMContainer.setAlpha(0);
      this.cartasMContainer.setVisible(true);
      this.tweens.add({
        targets: this.cartasMContainer,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }
  }

  showTradeConfirmationStep() {
    this.tradeTutorialStep = "awaitTradeConfirmation";

    if (this.dialogoComercianteFase12) {
      this.dialogoComercianteFase12.setVisible(false);
      this.dialogoComercianteFase12.setAlpha(0);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(false);
    }

    if (this.tradeMenu) {
      this.tradeMenu.showBaseCards();
      this.tradeMenu.setVisible(true);
      this.tradeMenu.setAlpha(1);

      const comercianteTarget = this.tradeMenu.comercianteContainer?.clickableTarget;
      if (comercianteTarget?.input) {
        comercianteTarget.input.enabled = false;
      }

      const jogadorTarget = this.tradeMenu.jogadorContainer?.clickableTarget;
      if (jogadorTarget?.input) {
        jogadorTarget.input.enabled = false;
      }
    }

    if (this.dialogoFase1) {
      this.dialogoFase1.setVisible(true);
      this.dialogoFase1.setAlpha(1);
    }

    if (this.confirmTradeButton) {
      this.layoutComponents();
      this.confirmTradeButton.setAlpha(0);
      this.confirmTradeButton.setVisible(true);
      this.tweens.add({
        targets: this.confirmTradeButton,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }
  }

  handleConfirmTradeClick() {
    if (this.tradeTutorialStep !== "awaitTradeConfirmation") {
      return;
    }

    const playerCardId = this.selectedPlayerCardId;
    const merchantCardId = this.selectedMerchantCardId || TradeStateManager.getCurrentMerchantCardId(this.game) || TradeStateManager.CARD_IDS.SAL;

    if (!playerCardId) {
      return;
    }

    const result = TradeStateManager.applyTrade(this.game, {
      playerCardId,
      merchantCardId
    });

    if (!result.success) {
      return;
    }

    this.selectedMerchantCardId = null;
    this.selectedPlayerCardId = null;
    this.renderPlayerCards();
    this.showPostConfirmStep();
  }

  handleContinueButtonClick() {
    if (!this.continueButton || !this.continueButton.visible) {
      return;
    }

    this.continueButton.setVisible(false);
    this.continueButton.setAlpha(0);

    if (this.controladorDeCenas?.proximaCena) {
      this.controladorDeCenas.proximaCena();
      return;
    }

    if (this.game?.controladorDeCenas?.proximaCena) {
      this.game.controladorDeCenas.proximaCena();
    }
  }

  showPostConfirmStep() {
    this.tradeTutorialStep = "postConfirm";
    this.stopTradeTutorialHand();
    this.pendingPlayerCardId = null;

    if (this.background && this.textures?.exists(this.endBgKey)) {
      this.background.setTexture(this.endBgKey);
    }

    if (this.stepperFeedback) {
      this.stepperFeedback.show(this.stepperFeedbackX, this.stepperFeedbackY);
    }

    if (this.dialogoComercianteFase1) {
      this.dialogoComercianteFase1.setVisible(false);
      this.dialogoComercianteFase1.setAlpha(0);
    }

    if (this.dialogoComercianteFase12) {
      this.dialogoComercianteFase12.setVisible(false);
      this.dialogoComercianteFase12.setAlpha(0);
    }

    if (this.dialogoFase1) {
      this.dialogoFase1.setVisible(false);
      this.dialogoFase1.setAlpha(0);
    }

    if (this.objectsTable) {
      this.objectsTable.setVisible(false);
      this.objectsTable.setAlpha(0);
    }

    if (this.merchantSalCard) {
      this.merchantSalCard.setVisible(false);
      this.merchantSalCard.setAlpha(0);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(false);
      this.cartasMContainer.setAlpha(0);
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

    if (this.continueButton) {
      this.continueButton.setPosition(buttonX - 400, buttonY);
      this.continueButton.setAlpha(0);
      this.continueButton.setVisible(true);
      this.tweens.add({
        targets: this.continueButton,
        alpha: 1,
        duration: this.uiFadeInDuration,
        ease: "Sine.Out"
      });
    }

    this.hideTradeOverlay();
    this.hideModalOverlay();
    this.hideSelectedTradeCardPreviews();
  }

  hideTradeOverlay() {
    if (!this.tradeOverlay) {
      return;
    }

    this.tweens.killTweensOf(this.tradeOverlay);
    this.tweens.add({
      targets: this.tradeOverlay,
      alpha: 0,
      duration: 180,
      ease: "Sine.Out",
      onComplete: () => {
        if (this.tradeOverlay) {
          this.tradeOverlay.setVisible(false);
        }
      }
    });
  }

  handlePlayerCardSelected(playerCardId) {
    if (this.tradeTutorialStep !== "awaitPlayerCardSelection") {
      return;
    }

    if (!this.modalInfo) {
      return;
    }

    this.pendingPlayerCardId = playerCardId;
    this.tradeTutorialStep = "awaitPlayerModalSelection";
    this.showModalOverlay();
    this.modalInfo.setModalKey(this.getModalKeyForCardId(playerCardId));
    this.modalInfo.open();
  }

  returnToBaseTradeStep() {
    this.tradeTutorialStep = "base";
    this.pendingPlayerCardId = null;
    this.selectedPlayerCardId = null;
    this.selectedMerchantCardId = null;

    if (this.dialogoComercianteFase1) {
      this.dialogoComercianteFase1.setVisible(false);
    }

    if (this.objectsTable) {
      this.objectsTable.setVisible(false);
    }

    if (this.merchantSalCard) {
      this.merchantSalCard.setVisible(false);
    }

    if (this.cartasMContainer) {
      this.cartasMContainer.setVisible(false);
    }

    if (this.dialogoComercianteFase12) {
      this.dialogoComercianteFase12.setVisible(false);
      this.dialogoComercianteFase12.setAlpha(0);
    }

    if (this.confirmTradeButton) {
      this.confirmTradeButton.setVisible(false);
      this.confirmTradeButton.setAlpha(0);
    }

    if (this.continueButton) {
      this.continueButton.setVisible(false);
      this.continueButton.setAlpha(0);
    }

    if (this.stepperFeedback) {
      this.stepperFeedback.hide();
    }

    if (this.tradeMenu) {
      this.tradeMenu.off("cardClick", this.handleTradeTutorialStepComplete, this);
      this.tradeMenu.showBaseCards();
      this.tradeMenu.setVisible(true);
      this.tradeMenu.setAlpha(1);
    }

    if (this.dialogoFase1) {
      this.dialogoFase1.setVisible(true);
      this.dialogoFase1.setAlpha(1);
    }

    this.hideSelectedTradeCardPreviews();
  }

  startTradeTutorialHand(targetType = "comerciante") {
    if (!this.tradeMenu || !this.textures?.exists("tutorialHand")) {
      return;
    }

    this.stopTradeTutorialHand();

    const buttonPosition = this.getTradeMenuButtonPosition(targetType);
    if (!buttonPosition) {
      return;
    }

    this.tutorialHand = new TutorialHand(this, {
      type: "click",
      x: buttonPosition.x + 50,
      y: buttonPosition.y + this.tutorialHandOffsetY,
      repeat: -1,
      depth: 10000
    });
  }

  stopTradeTutorialHand() {
    if (!this.tutorialHand) {
      return;
    }

    this.tutorialHand.stop();
    this.tutorialHand.destroy();
    this.tutorialHand = null;
  }

  getTradeMenuButtonPosition(targetType = null) {
    if (!this.tradeMenu) {
      return null;
    }

    let containers = [this.tradeMenu.comercianteContainer, this.tradeMenu.jogadorContainer];
    if (targetType === "comerciante") {
      containers = [this.tradeMenu.comercianteContainer];
    }
    if (targetType === "jogador") {
      containers = [this.tradeMenu.jogadorContainer];
    }

    for (const container of containers) {
      if (!container || !container.visible) {
        continue;
      }

      const clickableButton = container.clickableTarget || container.clickableCard || container?.list?.find((item) => item?.input);
      if (!clickableButton || clickableButton.input?.enabled === false) {
        continue;
      }

      const bounds = clickableButton.getBounds?.();
      if (bounds) {
        return { x: bounds.centerX, y: bounds.centerY };
      }

      const worldMatrix = clickableButton.getWorldTransformMatrix?.();
      if (worldMatrix) {
        return { x: worldMatrix.tx, y: worldMatrix.ty };
      }
    }

    return null;
  }

  layoutComponents() {
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();

    if (this.tradeOverlay) {
      this.tradeOverlay.setSize(viewportWidth, viewportHeight);
      this.tradeOverlay.setPosition(0, 0);
    }

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

    if (this.stepperFeedback) {
      this.stepperFeedback.setPosition(this.stepperFeedbackX, this.stepperFeedbackY);
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

    if (this.tutorialHand) {
      let targetType = null;
      if (this.tradeTutorialStep === "awaitMerchantClick") {
        targetType = "comerciante";
      } else if (this.tradeTutorialStep === "awaitJogadorClick") {
        targetType = "jogador";
      }

      const buttonPosition = this.getTradeMenuButtonPosition(targetType);
      if (buttonPosition) {
        this.tutorialHand.setPosition(buttonPosition.x, buttonPosition.y + this.tutorialHandOffsetY);
      }
    }

    if (this.dialogoFase1) {
      const dialogHeight = this.dialogoFase1.displayHeight || this.dialogoFase1.height || 0;
      const x = 60;
      const y = viewportHeight - dialogHeight - 280;
      this.dialogoFase1.setPosition(x, y);
    }

    if (this.dialogoComercianteFase12) {
      const dialogWidth = this.dialogoComercianteFase12.displayWidth || this.dialogoComercianteFase12.width || 0;
      const x = (viewportWidth - dialogWidth) / 2;
      const y = 40;
      this.dialogoComercianteFase12.setPosition(x, y);
    }

    if (this.dialogoComercianteFase1) {
      const dialogWidth = this.dialogoComercianteFase1.displayWidth || this.dialogoComercianteFase1.width || 0;
      const x = (viewportWidth - dialogWidth) / 2;
      const y = 40;
      this.dialogoComercianteFase1.setPosition(x, y);
    }

    if (this.objectsTable) {
      const tableWidth = this.objectsTable.displayWidth || this.objectsTable.width || 0;
      const tableHeight = this.objectsTable.displayHeight || this.objectsTable.height || 0;
      const x = (viewportWidth - tableWidth) / 2;
      const y = viewportHeight - tableHeight;
      this.objectsTable.setPosition(x, y);
    }

    if (this.merchantSalCard) {
      const cardWidth = this.merchantSalCard.displayWidth || this.merchantSalCard.width || 0;
      const cardHeight = this.merchantSalCard.displayHeight || this.merchantSalCard.height || 0;
      const x = (viewportWidth - cardWidth) / 2;
      const y = viewportHeight - cardHeight - 45;
      this.merchantSalCard.setPosition(x, y);
    }

    if (this.cartasMContainer) {
      const containerWidth = this.cartasMContainer.width || 0;
      const containerHeight = this.cartasMContainer.height || 0;
      const x = (viewportWidth - containerWidth) / 2;
      const y = viewportHeight - containerHeight - 45;
      this.cartasMContainer.setPosition(x, y);
    }

    if (this.startButton) {
      const buttonWidth = this.startButton.displayWidth || this.startButton.width || 0;
      const buttonHeight = this.startButton.displayHeight || this.startButton.height || 0;
      const x = (viewportWidth - buttonWidth) / 2;
      const y = viewportHeight - buttonHeight - 80;
      this.startButton.setPosition(x, y);
    }
  }

  getViewportWidth() {
    return this.scale?.width || this.cameras?.main?.width || Number(this.sys.game.config.width) || 1920;
  }

  getViewportHeight() {
    return this.scale?.height || this.cameras?.main?.height || Number(this.sys.game.config.height) || 1080;
  }
}

export default Game;

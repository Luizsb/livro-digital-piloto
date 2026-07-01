import { Button } from "./Button.js";
import SoundManager from "../managers/SoundManager.js";

export class FeedbackErro extends Phaser.GameObjects.Container {
  constructor(scene, config = {}) {
    super(scene, 0, 0);

    this.scene = scene;
    this.config = {
      backgroundKey: "feedbackErroFase2",
      buttonText: "VOLTAR",
      buttonOffsetBottom: 120,
      depth: 11000,
      overlayColor: 0x000000,
      overlayAlpha: 0.7,
      overlayDepth: 10999,
      onBack: null,
      onClose: null,
      ...config
    };

    this.create();
    this.scene.add.existing(this);
    this.setDepth(this.config.depth);
    this.hide();
  }

  create() {
    const viewportWidth = this.scene.scale?.width || Number(this.scene.sys.game.config.width) || 1920;
    const viewportHeight = this.scene.scale?.height || Number(this.scene.sys.game.config.height) || 1080;

    this.overlay = this.scene.add.rectangle(
      0,
      0,
      viewportWidth,
      viewportHeight,
      this.config.overlayColor,
      this.config.overlayAlpha
    )
      .setOrigin(0, 0)
      .setDepth(this.config.overlayDepth)
      .setVisible(false)
      .setInteractive();

    this.background = this.scene.add.image(0, 0, this.config.backgroundKey).setOrigin(0, 0);
    this.backButton = new Button(this.scene, { text: this.config.buttonText });
    this.backButton.on("buttonClick", () => {
      this.close("back");
    });

    this.add([this.background, this.backButton]);
    this.setSize(this.background.width, this.background.height);
    this.layoutContent();
  }

  layoutContent() {
    if (!this.background || !this.backButton) {
      return;
    }

    const x = (this.background.width - this.backButton.width) / 2;
    const y = this.background.height - this.config.buttonOffsetBottom - this.backButton.height;
    this.backButton.setPosition(x, y);
  }

  open(x = null, y = null) {
    const viewportWidth = this.scene.scale?.width || Number(this.scene.sys.game.config.width) || 1920;
    const viewportHeight = this.scene.scale?.height || Number(this.scene.sys.game.config.height) || 1080;

    if (this.overlay) {
      this.overlay.setSize(viewportWidth, viewportHeight);
      this.overlay.setPosition(0, 0);
      this.overlay.setVisible(true);
    }

    const targetX = x == null ? (viewportWidth - this.width) / 2 : x;
    const targetY = y == null ? (viewportHeight - this.height) / 2 : y;

    this.setPosition(targetX, targetY);
    this.setVisible(true);
    this.setAlpha(1);
    SoundManager.play("erro");
    return this;
  }

  close(trigger = "close") {
    this.hide();

    if (trigger === "back" && typeof this.config.onBack === "function") {
      this.config.onBack.call(this.scene, { trigger });
    }

    if (typeof this.config.onClose === "function") {
      this.config.onClose.call(this.scene, { trigger });
    }

    this.emit("close", { trigger });
    return this;
  }

  hide() {
    if (this.overlay) {
      this.overlay.setVisible(false);
    }
    this.setVisible(false);
    return this;
  }

  destroy(fromScene) {
    if (this.backButton) {
      this.backButton.off("buttonClick");
    }
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
    super.destroy(fromScene);
  }
}

export default FeedbackErro;

import SoundManager from "../managers/SoundManager.js";
import { Button } from "./Button.js";

export class ModalInfo extends Phaser.GameObjects.Container {
  constructor(scene, config = {}) {
    super(scene, 0, 0);

    this.scene = scene;
    this.allowedModalKeys = new Set([
      "modalColar",
      "modalFrutas",
      "modalSal",
      "modalTecido"
    ]);

    this.config = {
      modalKey: "modalColar",
      closeTexture: "btFechar_sae",
      closeOffsetTop: 20,
      closeOffsetRight: 20,
      selectOffsetBottom: 60,
      selectOffsetRight: 148,
      depth: 9999,
      startVisible: false,
      onSelect: null,
      onClose: null,
      ...config
    };

    this.create();
    this.scene.add.existing(this);
    this.setDepth(this.config.depth);

    if (this.config.startVisible) {
      this.open();
    } else {
      this.setVisible(false);
    }
  }

  create() {
    this.background = this.scene.add.image(0, 0, this.getValidModalKey(this.config.modalKey)).setOrigin(0, 0);

    this.btFechar = this.scene.add.image(0, 0, this.config.closeTexture)
      .setOrigin(0, 0)
      .setInteractive({ cursor: "pointer" });

    this.btSelecionar = new Button(this.scene, {
      text: "SELECIONAR"
    });

    this.btFechar.on("pointerdown", () => {
      SoundManager.play("click", 1, false, () => {
        this.close("close");
      });
    });

    this.btSelecionar.on("buttonClick", () => {
      this.close("select");
    });

    this.add([this.background, this.btSelecionar, this.btFechar]);
    this.setSize(this.background.width, this.background.height);
    this.layoutContent();
  }

  layoutContent() {
    if (!this.background) {
      return;
    }

    this.btFechar.setPosition(
      this.background.width - this.btFechar.width - this.config.closeOffsetRight,
      this.config.closeOffsetTop
    );

    this.btSelecionar.setPosition(
      this.background.width - this.config.selectOffsetRight - this.btSelecionar.width,
      this.background.height - this.config.selectOffsetBottom - this.btSelecionar.height
    );
  }

  getValidModalKey(modalKey) {
    if (this.allowedModalKeys.has(modalKey)) {
      return modalKey;
    }
    return "modalColar";
  }

  setModalKey(modalKey) {
    const validKey = this.getValidModalKey(modalKey);
    this.config.modalKey = validKey;
    this.background.setTexture(validKey);
    this.setSize(this.background.width, this.background.height);
    this.layoutContent();
    return this;
  }

  open(x = null, y = null) {
    const viewportWidth = this.scene.scale?.width || Number(this.scene.sys.game.config.width) || 1920;
    const viewportHeight = this.scene.scale?.height || Number(this.scene.sys.game.config.height) || 1080;

    const targetX = x == null ? (viewportWidth - this.width) / 2 : x;
    const targetY = y == null ? (viewportHeight - this.height) / 2 : y;

    this.setPosition(targetX, targetY);
    this.setVisible(true);
    this.setAlpha(1);
    return this;
  }

  close(trigger = "close") {
    this.setVisible(false);

    if (trigger === "select" && typeof this.config.onSelect === "function") {
      this.config.onSelect.call(this.scene, { trigger });
    }

    if (typeof this.config.onClose === "function") {
      this.config.onClose.call(this.scene, { trigger });
    }

    this.emit("close", { trigger });
    return this;
  }
}

export default ModalInfo;

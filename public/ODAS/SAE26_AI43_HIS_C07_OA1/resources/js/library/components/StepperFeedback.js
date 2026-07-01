import SoundManager from "../managers/SoundManager.js";

export class StepperFeedback extends Phaser.GameObjects.Container {
  constructor(scene, config = {}) {
    super(scene, config.x ?? 0, config.y ?? 0);

    this.scene = scene;
    this.config = {
      backgroundKey: "feedbackAcertoBg",
      nodeKey: "feedbackAcertoNode",
      secondaryNodeKey: null,
      tertiaryNodeKey: null,
      nodeOffsetLeft: 187,
      nodeOffsetBottom: 62,
      secondaryNodeOffsetX: 93,
      secondaryNodeOffsetY: 0,
      tertiaryNodeOffsetX: 186,
      tertiaryNodeOffsetY: 0,
      showPrimaryBeforeSecondary: false,
      showFirstTwoBeforeTertiary: false,
      bgFadeDuration: 280,
      nodeFadeDuration: 220,
      secondaryNodeFadeDuration: 220,
      tertiaryNodeFadeDuration: 220,
      depth: 2,
      startVisible: false,
      ...config
    };

    this.create();
    this.scene.add.existing(this);
    this.setDepth(this.config.depth);

    if (this.config.startVisible) {
      this.show();
    } else {
      this.hide();
    }
  }

  create() {
    this.background = this.scene.add.image(0, 0, this.config.backgroundKey).setOrigin(0, 0);
    this.node = this.scene.add.image(
      this.config.nodeOffsetLeft,
      this.background.height - this.config.nodeOffsetBottom,
      this.config.nodeKey
    ).setOrigin(0, 1);

    this.secondaryNode = null;
    const secondaryNodeKey = this.resolveTextureKey(this.config.secondaryNodeKey, this.config.nodeKey);
    if (secondaryNodeKey) {
      this.secondaryNode = this.scene.add.image(
        this.config.nodeOffsetLeft + this.config.secondaryNodeOffsetX,
        this.background.height - this.config.nodeOffsetBottom + this.config.secondaryNodeOffsetY,
        secondaryNodeKey
      ).setOrigin(0, 1);
    }

    this.tertiaryNode = null;
    const tertiaryFallbackKey = secondaryNodeKey || this.config.nodeKey;
    const tertiaryNodeKey = this.resolveTextureKey(this.config.tertiaryNodeKey, tertiaryFallbackKey);
    if (tertiaryNodeKey) {
      this.tertiaryNode = this.scene.add.image(
        this.config.nodeOffsetLeft + this.config.tertiaryNodeOffsetX,
        this.background.height - this.config.nodeOffsetBottom + this.config.tertiaryNodeOffsetY,
        tertiaryNodeKey
      ).setOrigin(0, 1);
    }

    const children = [this.background, this.node];
    if (this.secondaryNode) {
      children.push(this.secondaryNode);
    }
    if (this.tertiaryNode) {
      children.push(this.tertiaryNode);
    }

    this.add(children);
    this.setSize(this.background.width, this.background.height);
  }

  resolveTextureKey(preferredKey = null, fallbackKey = null) {
    if (preferredKey && this.scene.textures?.exists(preferredKey)) {
      return preferredKey;
    }

    if (preferredKey && fallbackKey && this.scene.textures?.exists(fallbackKey)) {
      return fallbackKey;
    }

    return null;
  }

  show(x = null, y = null) {
    if (x != null || y != null) {
      this.setPosition(x ?? this.x, y ?? this.y);
    }

    this.scene.tweens.killTweensOf(this.background);
    this.scene.tweens.killTweensOf(this.node);
    if (this.secondaryNode) {
      this.scene.tweens.killTweensOf(this.secondaryNode);
    }
    if (this.tertiaryNode) {
      this.scene.tweens.killTweensOf(this.tertiaryNode);
    }

    this.setVisible(true);
    this.setAlpha(1);
    this.background.setAlpha(0);
    this.node.setAlpha(0);
    if (this.secondaryNode) {
      this.secondaryNode.setAlpha(0);
    }
    if (this.tertiaryNode) {
      this.tertiaryNode.setAlpha(0);
    }

    SoundManager.play("acerto");

    this.scene.tweens.add({
      targets: this.background,
      alpha: 1,
      duration: this.config.bgFadeDuration,
      ease: "Sine.Out",
      onComplete: () => {
        if (this.tertiaryNode && this.config.showFirstTwoBeforeTertiary) {
          this.node.setAlpha(1);
          if (this.secondaryNode) {
            this.secondaryNode.setAlpha(1);
          }
          this.scene.tweens.add({
            targets: this.tertiaryNode,
            alpha: 1,
            duration: this.config.tertiaryNodeFadeDuration,
            ease: "Sine.Out"
          });
          return;
        }

        if (this.secondaryNode && this.config.showPrimaryBeforeSecondary) {
          this.node.setAlpha(1);
          this.scene.tweens.add({
            targets: this.secondaryNode,
            alpha: 1,
            duration: this.config.secondaryNodeFadeDuration,
            ease: "Sine.Out"
          });
          return;
        }

        this.scene.tweens.add({
          targets: this.node,
          alpha: 1,
          duration: this.config.nodeFadeDuration,
          ease: "Sine.Out"
        });
      }
    });

    return this;
  }

  hide() {
    this.scene.tweens.killTweensOf(this.background);
    this.scene.tweens.killTweensOf(this.node);
    if (this.secondaryNode) {
      this.scene.tweens.killTweensOf(this.secondaryNode);
    }
    if (this.tertiaryNode) {
      this.scene.tweens.killTweensOf(this.tertiaryNode);
    }
    this.setVisible(false);
    this.setAlpha(1);
    this.background.setAlpha(0);
    this.node.setAlpha(0);
    if (this.secondaryNode) {
      this.secondaryNode.setAlpha(0);
    }
    if (this.tertiaryNode) {
      this.tertiaryNode.setAlpha(0);
    }
    return this;
  }
}

export default StepperFeedback;

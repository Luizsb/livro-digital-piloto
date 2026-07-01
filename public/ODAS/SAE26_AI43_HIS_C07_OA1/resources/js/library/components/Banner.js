export class Banner extends Phaser.GameObjects.Container {
  constructor(scene, config = {}) {
    super(scene, 0, 0);

    this.scene = scene;
    this.config = {
      fase: 1,
      startOffsetY: -30,
      holdDuration: 2000,
      fadeInDuration: 450,
      fadeOutDuration: 450,
      depth: 9999,
      topShadowHeight: 28,
      overlayColor: 0x000000,
      overlayAlpha: 0.35,
      overlayDepth: 9998,
      overlayFadeDuration: 450,
      ...config
    };

    this.bannerKeys = {
      1: 'bannerRodada1',
      2: 'bannerRodada2',
      3: 'bannerRodada3',
      4: 'bannerRodada4'
    };

    this.currentFase = this.normalizeFase(this.config.fase);
    this.fadeInTween = null;
    this.fadeOutTween = null;
    this.fadeOutDelay = null;
    this.overlay = null;
    this.overlayFadeInTween = null;
    this.overlayFadeOutTween = null;

    this.create();
    this.scene.add.existing(this);
    this.setDepth(this.config.depth);

    this.scene.scale.on('resize', this.onResize, this);
    this.play(this.currentFase);
  }

  create() {
    this.overlay = this.scene.add.rectangle(0, 0, this.getSceneWidth(), this.getSceneHeight(), this.config.overlayColor, this.config.overlayAlpha)
      .setOrigin(0, 0)
      .setAlpha(0)
      .setScrollFactor(0, 0)
      .setDepth(this.config.overlayDepth)
      .setVisible(false);

    this.banner = this.scene.add.image(0, 0, this.getBannerKey(this.currentFase)).setOrigin(0, 0);
    this.fitToSceneWidth();

    this.topShadow = this.scene.add.graphics();
    this.drawTopShadow();

    this.add([this.banner, this.topShadow]);
    this.setSize(this.banner.displayWidth, this.banner.displayHeight);
  }

  normalizeFase(fase) {
    const parsed = Number(fase);
    if (Number.isNaN(parsed)) {
      return 1;
    }
    return Phaser.Math.Clamp(Math.round(parsed), 1, 4);
  }

  getBannerKey(fase) {
    return this.bannerKeys[this.normalizeFase(fase)];
  }

  getSceneWidth() {
    return this.scene.scale?.width || Number(this.scene.sys.game.config.width) || 1920;
  }

  getSceneHeight() {
    return this.scene.scale?.height || Number(this.scene.sys.game.config.height) || 1080;
  }

  fitToSceneWidth() {
    const sceneWidth = this.getSceneWidth();
    const scale = sceneWidth / this.banner.width;
    this.banner.setScale(scale);
  }

  drawTopShadow() {
    this.topShadow.clear();
    this.topShadow.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.28, 0.28, 0, 0);
    this.topShadow.fillRect(0, 0, this.banner.displayWidth, this.config.topShadowHeight);
  }

  showOverlay() {
    if (!this.overlay) {
      return;
    }

    if (this.overlayFadeOutTween) {
      this.overlayFadeOutTween.stop();
      this.overlayFadeOutTween = null;
    }

    this.overlay.setVisible(true);
    this.overlay.setAlpha(0);

    this.overlayFadeInTween = this.scene.tweens.add({
      targets: this.overlay,
      alpha: this.config.overlayAlpha,
      duration: this.config.overlayFadeDuration,
      ease: 'Sine.Out'
    });
  }

  hideOverlay() {
    if (!this.overlay) {
      return;
    }

    if (this.overlayFadeInTween) {
      this.overlayFadeInTween.stop();
      this.overlayFadeInTween = null;
    }

    this.overlayFadeOutTween = this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: this.config.overlayFadeDuration,
      ease: 'Sine.In',
      onComplete: () => {
        this.overlay.setVisible(false);
        this.overlayFadeOutTween = null;
      }
    });
  }

  resetAnimation() {
    if (this.fadeInTween) {
      this.fadeInTween.stop();
      this.fadeInTween = null;
    }

    if (this.fadeOutTween) {
      this.fadeOutTween.stop();
      this.fadeOutTween = null;
    }

    if (this.fadeOutDelay) {
      this.fadeOutDelay.remove(false);
      this.fadeOutDelay = null;
    }

    if (this.overlayFadeInTween) {
      this.overlayFadeInTween.stop();
      this.overlayFadeInTween = null;
    }

    if (this.overlayFadeOutTween) {
      this.overlayFadeOutTween.stop();
      this.overlayFadeOutTween = null;
    }
  }

  setFase(fase) {
    this.currentFase = this.normalizeFase(fase);
    this.banner.setTexture(this.getBannerKey(this.currentFase));
    this.fitToSceneWidth();
    this.drawTopShadow();
    this.setSize(this.banner.displayWidth, this.banner.displayHeight);
    return this;
  }

  play(fase = this.currentFase) {
    this.setFase(fase);
    this.resetAnimation();
    this.showOverlay();

    const targetY = this.y;
    this.visible = true;
    this.alpha = 0;
    this.y = targetY + this.config.startOffsetY;

    this.fadeInTween = this.scene.tweens.add({
      targets: this,
      alpha: 1,
      y: targetY,
      duration: this.config.fadeInDuration,
      ease: 'Sine.Out',
      onComplete: () => {
        this.fadeOutDelay = this.scene.time.delayedCall(this.config.holdDuration, () => {
          this.fadeOut();
        });
      }
    });

    return this;
  }

  fadeOut() {
    if (this.fadeOutTween) {
      this.fadeOutTween.stop();
      this.fadeOutTween = null;
    }

    this.fadeOutTween = this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: this.config.fadeOutDuration,
      ease: 'Sine.In',
      onComplete: () => {
        this.hideOverlay();
        this.visible = false;
        this.emit('bannerComplete', { fase: this.currentFase });
      }
    });

    return this;
  }

  onResize() {
    if (this.overlay) {
      this.overlay.setSize(this.getSceneWidth(), this.getSceneHeight());
      this.overlay.setPosition(0, 0);
    }

    this.fitToSceneWidth();
    this.drawTopShadow();
    this.setSize(this.banner.displayWidth, this.banner.displayHeight);
  }

  destroy(fromScene) {
    this.resetAnimation();
    if (this.overlayFadeInTween) {
      this.overlayFadeInTween.stop();
      this.overlayFadeInTween = null;
    }

    if (this.overlayFadeOutTween) {
      this.overlayFadeOutTween.stop();
      this.overlayFadeOutTween = null;
    }

    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }

    this.scene.scale.off('resize', this.onResize, this);
    super.destroy(fromScene);
  }
}

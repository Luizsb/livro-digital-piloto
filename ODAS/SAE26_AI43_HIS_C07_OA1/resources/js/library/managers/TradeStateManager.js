export class TradeStateManager {
  static REGISTRY_KEY = "tradeState";

  static CARD_IDS = {
    FRUTAS: "frutas",
    COLAR: "colar",
    SAL: "sal",
    TECIDO: "tecido"
  };

  static CARD_ASSETS_M = {
    frutas: "cartasFrutasM",
    colar: "cartasColarM",
    sal: "cartasSalM",
    tecido: "cartasTecidoM"
  };

  static DEFAULT_STATE = {
    playerCards: ["frutas", "colar", "tecido", "frutas"],
    targetSalCount: 3,
    salFromMerchants: 0,
    merchantOffers: ["sal", "sal", "sal"],
    currentMerchantIndex: 0
  };

  static init(game, overrideState = {}) {
    const existingState = game.registry.get(this.REGISTRY_KEY);
    if (existingState) {
      return existingState;
    }

    const state = this.buildState(overrideState);
    game.registry.set(this.REGISTRY_KEY, state);
    return state;
  }

  static reset(game, overrideState = {}) {
    const state = this.buildState(overrideState);
    game.registry.set(this.REGISTRY_KEY, state);
    return state;
  }

  static buildState(overrideState = {}) {
    const defaults = this.DEFAULT_STATE;
    return {
      ...defaults,
      ...overrideState,
      playerCards: [...(overrideState.playerCards || defaults.playerCards)],
      merchantOffers: [...(overrideState.merchantOffers || defaults.merchantOffers)]
    };
  }

  static getState(sceneOrGame) {
    const game = sceneOrGame?.game || sceneOrGame;
    return game?.registry?.get(this.REGISTRY_KEY) || null;
  }

  static getPlayerCards(sceneOrGame) {
    const state = this.getState(sceneOrGame);
    if (!state) {
      return [];
    }
    return [...state.playerCards];
  }

  static getPlayerCardAssets(sceneOrGame) {
    return this.getPlayerCards(sceneOrGame).map((cardId) => this.getAssetKeyForCardId(cardId));
  }

  static getAssetKeyForCardId(cardId) {
    return this.CARD_ASSETS_M[cardId] || this.CARD_ASSETS_M.frutas;
  }

  static getCurrentMerchantCardId(sceneOrGame) {
    const state = this.getState(sceneOrGame);
    if (!state) {
      return null;
    }

    return state.merchantOffers[state.currentMerchantIndex] || null;
  }

  static countCard(sceneOrGame, cardId) {
    return this.getPlayerCards(sceneOrGame).filter((id) => id === cardId).length;
  }

  static canApplyTrade(sceneOrGame, { playerCardId, merchantCardId }) {
    const state = this.getState(sceneOrGame);
    if (!state) {
      return { success: false, reason: "state_not_initialized" };
    }

    if (!playerCardId || !merchantCardId) {
      return { success: false, reason: "missing_card" };
    }

    const playerCardIndex = state.playerCards.indexOf(playerCardId);
    if (playerCardIndex < 0) {
      return { success: false, reason: "player_card_not_in_inventory" };
    }

    if (playerCardId === this.CARD_IDS.SAL) {
      return { success: false, reason: "player_selected_salt_card" };
    }

    if (merchantCardId !== this.CARD_IDS.SAL) {
      return { success: false, reason: "merchant_card_not_salt" };
    }

    return { success: true };
  }

  static applyTrade(sceneOrGame, { playerCardId, merchantCardId }) {
    const state = this.getState(sceneOrGame);
    const validation = this.canApplyTrade(sceneOrGame, { playerCardId, merchantCardId });
    if (!validation.success) {
      return validation;
    }

    const cardIndex = state.playerCards.indexOf(playerCardId);
    state.playerCards.splice(cardIndex, 1);
    state.playerCards.push(merchantCardId);

    state.salFromMerchants += 1;
    state.currentMerchantIndex += 1;

    const salInInventory = state.playerCards.filter((id) => id === this.CARD_IDS.SAL).length;
    const completed = state.salFromMerchants >= state.targetSalCount;

    return {
      success: true,
      playerCards: [...state.playerCards],
      salInInventory,
      salFromMerchants: state.salFromMerchants,
      targetSalCount: state.targetSalCount,
      completed
    };
  }
}

export default TradeStateManager;

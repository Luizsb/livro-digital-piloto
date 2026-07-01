import { TradeStateManager } from "../managers/TradeStateManager.js";

export class Boot extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }

    preload() {
        // Intro
        this.load.image('introCapa', './resources/images/intro/capa.png');
        this.load.image('intro1', './resources/images/intro/1.png');
        this.load.image('intro2', './resources/images/intro/2.png');
        this.load.image('intro3', './resources/images/intro/3.png');

        // JOGOS
        this.load.image('jogosBg', './resources/images/jogos/bg.png');
        this.load.image('jogosDialogoFase1', './resources/images/jogos/dialogo-fase-1.png');
        this.load.image('jogosDialogoFase1Fim', './resources/images/jogos/dialogo-fase-1-fim.png');
        this.load.image('jogosDialogoFase2', './resources/images/jogos/dialogo-fase-2.png');
        this.load.image('jogosDialogoFase3', './resources/images/jogos/dialogo-fase-3.png');
        this.load.image('jogosDialogosFase2Fim', './resources/images/jogos/dialogo-fase-2-fim.png');
        this.load.image('jogosComerciante', './resources/images/jogos/comerciante.png');
        this.load.image('jogosDialogoComercianteFase1', './resources/images/jogos/dialogo-comerciante-fase-1.png');
        this.load.image('jogosDialogoComercianteFase41', './resources/images/jogos/dialogo-comerciante-fase-4-1.png');
        this.load.image('jogosDialogosComercianteFase42', './resources/images/jogos/dialogo-comerciante-fase-4-2.png');
        this.load.image('jogosDialogoComercianteFase12', './resources/images/jogos/dialogo-comerciante-fase-1-2.png');
        this.load.image('jogosDialogoFase4', './resources/images/jogos/dialogo-fase-4.png');
        this.load.image('jogosDialogoFase3Acerto', './resources/images/jogos/dialogo-fase-3-acerto.png');
        this.load.image('jogosDialogoFase3Erro', './resources/images/jogos/dialogo-fase-3-erro.png');
        this.load.image('jogosIntroFase1', './resources/images/jogos/intro-fase-1.png');

        // BANNER
        this.load.image('bannerRodada1', './resources/images/banner/rodada-1.png');
        this.load.image('bannerRodada2', './resources/images/banner/rodada-2.png');
        this.load.image('bannerRodada3', './resources/images/banner/rodada-3.png');
        this.load.image('bannerRodada4', './resources/images/banner/rodada-4.png');

        // CARTAS
        this.load.image('cartasColarM', './resources/images/cartas/colar-m.png');
        this.load.image('cartasColarP', './resources/images/cartas/colar-p.png');
        this.load.image('cartasFrutasM', './resources/images/cartas/frutas-m.png');
        this.load.image('cartasFrutasP', './resources/images/cartas/frutas-p.png');
        this.load.image('cartasSalM', './resources/images/cartas/sal-m.png');
        this.load.image('cartasSalP', './resources/images/cartas/sal-p.png');
        this.load.image('cartasTecidoM', './resources/images/cartas/tecido-m.png');
        this.load.image('cartasTecidoP', './resources/images/cartas/tecido-p.png');

        // MODAL
        this.load.image('modalColar', './resources/images/modal/colar.png');
        this.load.image('modalFrutas', './resources/images/modal/frutas.png');
        this.load.image('modalSal', './resources/images/modal/sal.png');
        this.load.image('modalTecido', './resources/images/modal/tecido.png');

        // FEEDBACK
        this.load.image('feedbackAcertoBg', './resources/images/feedback/acerto-bg.png');
        this.load.image('feedbackAcertoNode', './resources/images/feedback/acerto-node.png');
        this.load.image('feedbackAcertoTroca', './resources/images/feedback/acerto-troca.png');
        this.load.image('feedbackErroFase2', './resources/images/feedback/erro-fase-2.png');
        this.load.image('feedbackErroFase3', './resources/images/feedback/erro-fase-3.png');
        this.load.image('feedbackErroFase4', './resources/images/feedback/erro-fase-4.png');

        // OBJECTS
        this.load.image('objectsCardClickable', './resources/images/objects/card-clickable.png');
        this.load.image('objectsCartasComerciante', './resources/images/objects/cartas-comerciante.png');
        this.load.image('objectsCartasJogador', './resources/images/objects/cartas-jogador.png');
        this.load.image('objectsContainerTrocas', './resources/images/objects/container-trocas.png');
        this.load.image('objectsEscolhaSeguro', './resources/images/objects/escolha-seguro.png');
        this.load.image('objectsEscolhaTempestade', './resources/images/objects/escolha-tempestade.png');
        this.load.image('objectsEnunciadoCartaMercador', './resources/images/objects/enunciado-carta-mercador.png');
        this.load.image('objectsEnunciadoCartaPlayer', './resources/images/objects/enunciado-carta-player.png');
        this.load.image('objectsEnunciadoDescarte', './resources/images/objects/enunciado-descarte.png');
        this.load.image('objectsIconeCentroCarta', './resources/images/objects/icone-centro-carta.png');
        this.load.image('objectsTable', './resources/images/objects/table.png');

        // TUTORIAL
        this.load.image('tutorialHand', './resources/images/tutorial/hand.png');
        
        
        
        
        // Hud
        this.load.plugin('rextagtextplugin', 'resources/js/library/plugins/rextagtextplugin.min.js', true);
        
        this.load.image('btSoundOn', './resources/images/hud/btSonsNormal.png'); // Botão de som ligado
        this.load.image('btSoundOff', './resources/images/hud/btSonsMutado.png'); //
        this.load.image('btEnunciado', './resources/images/hud/btEnunciado.png');
        this.load.image('btMusicasOn', './resources/images/hud/btMusicasNormal.png');
        this.load.image('btMusicasOff', './resources/images/hud/btMusicasMutado.png');
        this.load.image('btTelaCheia', './resources/images/hud/btTelaCheia.png');
        this.load.image('btOrientacao', './resources/images/hud/btOrientacao.png');
        this.load.svg('btOrientacao_sae', './resources/images/hud/btOrientacao_sae.svg');
        this.load.svg('btOrientacao_cqt', './resources/images/hud/btOrientacao_cqt.svg');
        this.load.svg('btOrientacao_spe', './resources/images/hud/btOrientacao_spe.svg');
        this.load.image('modalEnunciado', './resources/images/hud/modal1.png');
        this.load.image('modalFeedbackPositivo', './resources/images/hud/modal3.png');
        this.load.image('modalFeedbackNegativo', './resources/images/hud/modal2.png');
        this.load.image('btVamosLa', './resources/images/hud/btVamosLa.png');
        this.load.image('btVoltar', './resources/images/hud/btVoltar.png');
        this.load.image('btNarracao', '././resources/images/hud/btNarracao.png');
        this.load.image('btConfirmar', '././resources/images/hud/btConfirmar.png');
        this.load.image('btJogarNovamente', '././resources/images/hud/btJogarNovamente.png');
        this.load.image('digiPositivo', '././resources/images/hud/digi1.png');
        this.load.image('digiNegativo', '././resources/images/hud/digi2.png');
        this.load.image('boxCreditos', '././resources/images/hud/boxCreditos.png');
        this.load.image('btCreditos', '././resources/images/hud/btCreditos.png');
        this.load.image('Bg', './resources/images/hud/Bg.png');
        this.load.image('btMenu', './resources/images/hud/btMenu.png');
        this.load.image('btFechar', './resources/images/hud/btFechar.png');
        this.load.image('botaoIcone', './resources/images/hud/BotaoIcone.png');
        
        this.load.svg('btFechar_sae', './resources/images/hud/btFechar_sae.svg');
        this.load.svg('btFechar_cqt', './resources/images/hud/btFechar_cqt.svg');
        this.load.svg('btFechar_spe', './resources/images/hud/btFechar_spe.svg');
        this.load.svg('elipse', './resources/images/hud/elipse.svg');
        this.load.svg('iconPlayButton', './resources/images/hud/iconPlay.svg');
        this.load.svg('iconReload', './resources/images/hud/iconReload.svg');
        this.load.svg('iconSoundWhite', './resources/images/hud/iconSoundWhite.svg');
        this.load.svg('iconHomeWhite', './resources/images/hud/iconHomeWhite.svg');
        this.load.svg('iconUp', './resources/images/hud/iconUp.svg');
        this.load.svg('iconLeft', './resources/images/hud/iconLeft.svg');
        this.load.svg('iconRight', './resources/images/hud/iconRight.svg');
        this.load.svg('iconInstructions', './resources/images/hud/iconInstructions.svg');
        this.load.svg('iconSound', './resources/images/hud/iconSound.svg');
        this.load.svg('iconSoundMute', './resources/images/hud/iconSoundMute.svg');
        this.load.svg('iconMusic', './resources/images/hud/iconMusic.svg');
        this.load.svg('iconMusicMute', './resources/images/hud/iconMusicMute.svg');
        this.load.svg('iconCredits', './resources/images/hud/iconCredits.svg');
        this.load.svg('iconAudio', './resources/images/hud/iconAudio.svg');
        this.load.svg('iconConfig', './resources/images/hud/iconConfig.svg');
        this.load.svg('iconFullscreen', './resources/images/hud/iconFullscreen.svg');
        this.load.svg('iconGlossario', './resources/images/hud/iconGlossario.svg');
        this.load.svg('iconHome', './resources/images/hud/iconHome.svg');
        this.load.svg('iconVideo', './resources/images/hud/iconVideo.svg');
        this.load.svg('iconNoVideo', './resources/images/hud/iconNoVideo.svg');
        this.load.svg('iconUndo', './resources/images/hud/iconUndo.svg');
        this.load.svg('iconMinus', './resources/images/hud/iconMinus.svg');
        this.load.svg('iconPlus', './resources/images/hud/iconPlus.svg');
        this.load.svg('iconSearch', './resources/images/hud/iconSearch.svg');
        this.load.svg('iconLike', './resources/images/hud/iconLike.svg');
        
        this.load.json('gameData', './resources/game/data/oda.json');

        const loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Carregando...', {
            fontSize: '32px',
            color: '#ffffff',
        }).setOrigin(0.5, 0.5);
        
        this.load.on('progress', (value) => {
            loadingText.setText(`Carregando... ${Math.round(value * 100)}%`);
        });
    }

    create() {
        const gameData = this.cache.json.get('gameData');
        this.game.registry.set('gameData', gameData);
        TradeStateManager.init(this.game);

        this.scene.start('Preload');
    }
}


import { OdaEmbed } from './OdaEmbed';

/**
 * ODA SAE26_AI43_HIS_C07_OA1 — HTML público + Phaser em `public/ODAS/.../`.
 * Lógica do jogo: `public/ODAS/.../resources/` (JS, dados, assets).
 */
function OdaApp() {
  return (
    <div
      className="oda-sae26-ai43-his-c07-oa1 flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
      data-oda-id="SAE26_AI43_HIS_C07_OA1"
    >
      <OdaEmbed className="h-full min-h-0 flex-1" />
    </div>
  );
}

export default OdaApp;

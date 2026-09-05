// DOM参照集約（非純粋）。元: public/app.js の `$` + el* 定数群。
export function $(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`missing element: #${id}`);
    return el;
}
function req(id) {
    return $(id);
}
/** 旧実装で掴んでいた要素を遅延初期化で保持する。 */
export const els = {};
export function initDom() {
    els.score = req("score-text");
    els.timer = req("timer-text");
    els.comboContainer = req("combo-container");
    els.comboCount = req("combo-count");
    els.rushBadge = req("rush-badge");
    els.tutBadge = req("tut-badge");
    els.itemCard = req("item-card");
    els.itemEmoji = req("item-emoji");
    els.itemName = req("item-name");
    els.itemSub = req("item-sub");
    els.wokContainer = req("wok-container");
    els.wokEmoji = req("wok-emoji");
    els.wokStatusText = req("wok-status-text");
    els.wokBadge = req("wok-badge");
    els.cookProgress = req("cook-progress");
    els.steamEffect = req("steam-effect");
    els.pullBonusText = req("pull-bonus-text");
}

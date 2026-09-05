// チュートリアル進行判定（元: public/app.js actionSort / actionPullOut / applyTutStep）
export const TUTORIAL_TOTAL_STEPS = 4;
/** 各STEPの期待操作。0-pan / 1-trash / 2-dolphin。3は引き上げ側で判定。 */
export function shouldAdvanceTutorial(tutStep, chosenType) {
    if (tutStep === 0 && chosenType === "pan")
        return true;
    if (tutStep === 1 && chosenType === "trash")
        return true;
    if (tutStep === 2 && chosenType === "dolphin")
        return true;
    return false;
}
/** STEP4の引き上げ完了判定。旧実装: isTutorial && tutStep===3 で進行 */
export function shouldFinishTutorialOnPull(tutStep) {
    return tutStep === 3;
}
/** 全STEP消化で終了。旧実装: stepIdx >= tutSteps.length(4) */
export function isTutorialFinished(stepIdx) {
    return stepIdx >= TUTORIAL_TOTAL_STEPS;
}

/* The order of a chapter (a "case") is data: a list of step ids. A level may carry its own `steps`; most use this default.
     intro -> Words (clue 1) -> bridge -> Scent Trail (clue 2) -> Suspects (the notebook) -> outro
   A step id is either one of STEPS below (story parts and the notebook) or a puzzle kind registered in puzzles/registry.js.
   To add a puzzle: register it and put its id in a level's `steps`. */
export const DEFAULT_STEPS = ['intro', 'word', 'bridge', 'zip', 'case', 'outro'];

/* `label` is the text on the button that leads INTO the step (the victory card of the step before it).
   `run(g)` starts the step; g is the game-flow object, which calls g.advance() when the step is done. */
const story = (part, title, label, before) => ({ label, run: g => g.playStory(part, title(g.lv()), before && before(g.lv())) });

export const STEPS = {
  intro:  story('intro',  lv => 'Chapter ' + lv.n + ' · ' + lv.title, null, lv => lv.introScene),   // e.g. Evil Larry's cinematic opens the Midnight Market
  bridge: story('bridge', lv => 'Chapter ' + lv.n + ' · The Scent Trail', 'Follow the trail'),
  case:   { label: 'To the suspects', run: g => g.toCase() },
  outro:  story('outro',  lv => 'Chapter ' + lv.n + ' complete')
};

export const stepLabel = id => (STEPS[id] && STEPS[id].label) || 'Continue';

import { $ } from '../core/dom.ts';
import { Dialogue } from '../dialogue/dialogue.ts';
import { SPEAKERS } from '../dialogue/speakers.ts';
import { UI } from './ui.ts';

/* The story screen: Barnaby (or Evil Larry) talking in a scene. Tap anywhere to advance or finish typing; Skip ends the scene. */
export const StoryScreen = {
  dialogue: null,

  init(bear, larry) {
    this.dialogue = new Dialogue({ nameEl: $('#dlgName'), textEl: $('#dlgText'), choicesEl: $('#dlgChoices'), caret: $('#dlgCaret'), bear });
    this.dialogue.defaultSpeaker = (who, e, reset) => {          // swap the portrait when Evil Larry speaks
      const isLarry = !reset && !!(SPEAKERS[who] && SPEAKERS[who].ownPortrait);
      $('#storyLarry').classList.toggle('on', isLarry);
      $('#storyBear').classList.toggle('away', isLarry);
      if (isLarry) larry.react(e);
    };
    $('#screen-story').addEventListener('pointerdown', e => {   // respond on press, not release
      if (e.target.closest('#btnSkip') || e.target.closest('.dlg-choices')) return;
      this.dialogue.tap();
    });
    $('#btnSkip').addEventListener('click', () => this.dialogue.end());
  },

  /* switch to the story screen, tinted with the level's colours */
  show(lv, title) {
    $('#screen-story').style.setProperty('--scene-a', lv.scene[0]);
    $('#screen-story').style.setProperty('--scene-b', lv.scene[1]);
    $('#storyTitle').textContent = title;
    UI.show('story');
  },

  /* lines: STORY[n][part]; opts: { onChoice, onDone } */
  play(lines, opts) { this.dialogue.play(lines, opts); }
};
